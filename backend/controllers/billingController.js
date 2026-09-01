const db = require("../config/db");

// GET /api/billing — all invoices
async function getAll(req, res) {
  const userBranchId = req.user?.branch_id || 1;
  const userId = req.user?.id || 1;
  try {
    const { search, type, status, payment_mode, branch, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let where = "WHERE (i.branch_id IN (SELECT id FROM branches WHERE id = ? OR parent_branch_id = ? OR created_by = ?) OR i.branch_id = ?)";
    const params = [userBranchId, userBranchId, userId, userBranchId];

    if (branch && branch !== "all") {
      where += " AND i.branch_id = ?";
      params.push(branch);
    }

    if (search) {
      where += " AND (i.invoice_no LIKE ? OR c.full_name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (type)         { where += " AND i.invoice_type = ?";   params.push(type); }
    if (status)       { where += " AND i.status = ?";         params.push(status); }
    if (payment_mode) { where += " AND i.payment_mode = ?";   params.push(payment_mode); }

    const [rows] = await db.query(
      `SELECT i.*, 
              c.full_name AS customer_name, 
              c.phone AS customer_phone,
              COALESCE(b.name, 'Main Showroom') AS branch_name,
              COALESCE(b.city, '') AS branch_city
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       LEFT JOIN branches b ON i.branch_id = b.id
       ${where}
       ORDER BY i.invoice_date DESC, i.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id ${where}`, params
    );
    res.json({ success: true, data: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/billing/:id — single invoice with items
async function getById(req, res) {
  try {
    const [inv] = await db.query(
      `SELECT i.*, c.full_name AS customer_name, c.phone, c.pan, c.gst_number
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = ?`,
      [req.params.id]
    );
    if (inv.length === 0) return res.status(404).json({ success: false, message: "Invoice not found" });

    const [items] = await db.query(
      "SELECT * FROM invoice_items WHERE invoice_id = ?", [req.params.id]
    );
    res.json({ success: true, data: { ...inv[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/billing — create invoice (with atomic Customer Ledger, Credit-Limit Enforcement, Membership Benefits, Wallet & Loyalty posting)
async function create(req, res) {
  const {
    invoice_type, customer_id, invoice_date, salesperson_id, branch_id = 1,
    hsn_code, payment_mode, discount_pct, discount_amt,
    coupon_code, gift_voucher, old_gold_exchange,
    cgst, sgst, igst, tcs, grand_total, paid_amount,
    wallet_amount, redeem_points, notes, credit_days, items = [],
  } = req.body;

  const invoiceGrandTotal = Number(grand_total || 0);
  const isCreditSale = payment_mode === "Credit";
  const usedWalletAmount = payment_mode === "Wallet" ? invoiceGrandTotal : Number(wallet_amount || 0);
  const pointsToRedeem = Number(redeem_points || 0);

  // Total paid calculation
  let actualPaidAmount = 0;
  if (isCreditSale) {
    actualPaidAmount = 0;
  } else if (payment_mode === "Wallet") {
    actualPaidAmount = usedWalletAmount;
  } else {
    actualPaidAmount = (paid_amount !== undefined ? Number(paid_amount) : (invoiceGrandTotal - usedWalletAmount)) + usedWalletAmount;
  }

  // Credit due date calculation for credit/partial invoices
  let numCreditDays = Number(credit_days || (isCreditSale ? 30 : 0));
  let creditDueDate = null;
  if (isCreditSale || actualPaidAmount < invoiceGrandTotal) {
    if (!numCreditDays || numCreditDays <= 0) numCreditDays = 30;
    const baseDate = invoice_date ? new Date(invoice_date) : new Date();
    creditDueDate = new Date(baseDate.getTime() + numCreditDays * 86400000).toISOString().slice(0, 10);
  }

  // Status calculation
  let invoiceStatus = "Paid";
  if (isCreditSale || actualPaidAmount === 0) {
    invoiceStatus = "Credit";
  } else if (actualPaidAmount < invoiceGrandTotal) {
    invoiceStatus = "Partial";
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. LOOKUP ACTIVE MEMBERSHIP BENEFITS (TIER, MULTIPLIER, MAKING DISCOUNT)
    let membershipTier = "Regular";
    let loyaltyMultiplier = 1.00;
    let makingDiscountPct = 0.00;

    if (customer_id) {
      const [memRows] = await conn.query(
        `SELECT cm.plan_name, mp.loyalty_multiplier, mp.making_discount_pct
         FROM customer_memberships cm
         JOIN membership_plans mp ON cm.plan_id = mp.id
         WHERE cm.customer_id = ? AND cm.status = 'ACTIVE' AND cm.expiry_date >= CURDATE()
         ORDER BY cm.expiry_date DESC LIMIT 1`,
        [customer_id]
      );
      if (memRows.length > 0) {
        membershipTier = memRows[0].plan_name;
        loyaltyMultiplier = Number(memRows[0].loyalty_multiplier || 1.0);
        makingDiscountPct = Number(memRows[0].making_discount_pct || 0);
      } else {
        const [custTierRow] = await conn.query("SELECT tier FROM customers WHERE id = ?", [customer_id]);
        if (custTierRow.length > 0 && custTierRow[0].tier && custTierRow[0].tier !== 'Regular') {
          const [planByTier] = await conn.query("SELECT loyalty_multiplier, making_discount_pct FROM membership_plans WHERE name = ?", [custTierRow[0].tier]);
          if (planByTier.length > 0) {
            membershipTier = custTierRow[0].tier;
            loyaltyMultiplier = Number(planByTier[0].loyalty_multiplier || 1.0);
            makingDiscountPct = Number(planByTier[0].making_discount_pct || 0);
          }
        }
      }
    }

    // Calculate Making Charge Discount Amount
    let totalMakingCharges = 0;
    items.forEach(item => {
      totalMakingCharges += Number(item.making || item.making_charges || 0);
    });
    const makingDiscountAmt = (totalMakingCharges * makingDiscountPct) / 100;

    // 2. CREDIT LIMIT ENFORCEMENT (with row-level lock)
    const unpaidAmount = invoiceGrandTotal - actualPaidAmount;
    if (customer_id && unpaidAmount > 0) {
      const [custLockRows] = await conn.query(
        "SELECT id, full_name, credit_limit, balance_due FROM customers WHERE id = ? FOR UPDATE",
        [customer_id]
      );
      if (custLockRows.length > 0) {
        const cust = custLockRows[0];
        const creditLimit = Number(cust.credit_limit || 0);
        const currentDue = Number(cust.balance_due || 0);
        const projectedDue = currentDue + unpaidAmount;
        const availableCredit = Math.max(0, creditLimit - currentDue);

        if (creditLimit <= 0) {
          throw new Error(`Credit sale rejected: Customer ${cust.full_name} does not have an active credit limit (Credit Limit: ₹0.00).`);
        }
        if (projectedDue > creditLimit) {
          throw new Error(`Credit Limit Exceeded for ${cust.full_name}. Credit Limit: ₹${creditLimit.toLocaleString('en-IN')}, Current Due: ₹${currentDue.toLocaleString('en-IN')}, New Credit Amount: ₹${unpaidAmount.toLocaleString('en-IN')}, Projected Due: ₹${projectedDue.toLocaleString('en-IN')}, Available Credit: ₹${availableCredit.toLocaleString('en-IN')}.`);
        }
      }
    }

    // 3. Generate invoice number
    const [[{ count }]] = await conn.query(
      "SELECT COUNT(*) AS count FROM invoices WHERE branch_id = ? AND YEAR(invoice_date) = YEAR(NOW())",
      [req.user.branch_id]
    );
    const invoice_no = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // 4. Insert invoice record (with frozen membership benefits snapshot)
    const [invResult] = await conn.query(
      `INSERT INTO invoices
       (invoice_no, invoice_type, customer_id, branch_id, invoice_date, salesperson_id,
        hsn_code, payment_mode, credit_days, credit_due_date, discount_pct, discount_amt,
        coupon_code, gift_voucher, old_gold_exchange, cgst, sgst, igst, tcs,
        grand_total, paid_amount, status, membership_tier, loyalty_multiplier,
        making_discount_pct, making_discount_amt, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        invoice_no, invoice_type || "Retail Invoice", customer_id || null, branch_id,
        invoice_date || new Date().toISOString().slice(0, 10),
        salesperson_id || null, hsn_code || "7113", payment_mode,
        numCreditDays, creditDueDate,
        discount_pct || 0, discount_amt || 0, coupon_code || null,
        gift_voucher || null, old_gold_exchange || 0,
        cgst || 0, sgst || 0, igst || 0, tcs || 0,
        invoiceGrandTotal, actualPaidAmount, invoiceStatus,
        membershipTier, loyaltyMultiplier, makingDiscountPct, makingDiscountAmt,
        notes || null
      ]
    );

    const invoiceId = invResult.insertId;

    // 5. Insert invoice items & update stock
    for (const item of items) {
      await conn.query(
        `INSERT INTO invoice_items
         (invoice_id, product_id, item_description, hsn_code, purity, weight_g,
          rate_per_gram, making_charges, stone_charges, gst_pct,
          discount_pct, amount)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          invoiceId, item.product_id || null, item.description || item.item_description || "Jewellery Item",
          item.hsn || "7113", item.purity || null,
          item.weight || item.weight_g || 0, item.rate || item.rate_per_gram || 0,
          item.making || item.making_charges || 0, item.stone || item.stone_charges || 0,
          item.gst_pct || 3, item.discount_pct || 0, Number(item.amount || 0)
        ]
      );

      if (item.product_id) {
        await conn.query(
          "UPDATE products SET stock_qty = GREATEST(0, stock_qty - 1) WHERE id = ?",
          [item.product_id]
        );
      }
    }

    // 6. ATOMIC CUSTOMER PROCESSING (Ledger, Wallet, Loyalty Multiplier)
    if (customer_id) {
      const [custRows] = await conn.query(
        "SELECT id, full_name, customer_id, balance_due, wallet_balance, loyalty_points FROM customers WHERE id = ?",
        [customer_id]
      );

      if (custRows.length > 0) {
        const cust = custRows[0];
        const entryDate = invoice_date || new Date().toISOString().slice(0, 10);
        const performedBy = req.user?.full_name || req.user?.username || "Admin";

        // A. WALLET PAYMENT PROCESSING
        if (usedWalletAmount > 0) {
          const currentWallet = Number(cust.wallet_balance || 0);
          if (currentWallet < usedWalletAmount) {
            throw new Error(`Insufficient wallet balance. Available: ₹${currentWallet.toLocaleString('en-IN')}, Requested: ₹${usedWalletAmount.toLocaleString('en-IN')}`);
          }
          const newWalletBalance = currentWallet - usedWalletAmount;
          await conn.query(
            `INSERT INTO customer_wallet_transactions
             (customer_id, transaction_type, amount, balance_after, reference_type, reference_id, description, performed_by)
             VALUES (?, 'DEBIT', ?, ?, 'INVOICE', ?, ?, ?)`,
            [
              customer_id, usedWalletAmount, newWalletBalance, invoice_no,
              `Wallet payment towards invoice ${invoice_no}`, performedBy
            ]
          );
          await conn.query(
            "UPDATE customers SET wallet_balance = ? WHERE id = ?",
            [newWalletBalance, customer_id]
          );
          cust.wallet_balance = newWalletBalance;
        }

        // B. LOYALTY REDEMPTION PROCESSING
        if (pointsToRedeem > 0) {
          const currentPoints = Number(cust.loyalty_points || 0);
          if (currentPoints < pointsToRedeem) {
            throw new Error(`Insufficient loyalty points. Available: ${currentPoints} pts, Requested: ${pointsToRedeem} pts`);
          }
          const newPointsBalance = currentPoints - pointsToRedeem;
          await conn.query(
            `INSERT INTO customer_loyalty_transactions
             (customer_id, transaction_type, points, balance_after, reference_type, reference_id, description, performed_by)
             VALUES (?, 'REDEEM', ?, ?, 'INVOICE', ?, ?, ?)`,
            [
              customer_id, pointsToRedeem, newPointsBalance, invoice_no,
              `Redeemed ${pointsToRedeem} loyalty points on invoice ${invoice_no}`, performedBy
            ]
          );
          await conn.query(
            "UPDATE customers SET loyalty_points = ? WHERE id = ?",
            [newPointsBalance, customer_id]
          );
          cust.loyalty_points = newPointsBalance;
        }

        // C. AUTO-EARN LOYALTY POINTS (WITH TIER MULTIPLIER APPLIED)
        const basePoints = Math.floor(invoiceGrandTotal / 100);
        const earnedPoints = Math.floor(basePoints * loyaltyMultiplier);

        if (earnedPoints > 0) {
          const currentPoints = Number(cust.loyalty_points || 0);
          const newPointsBalance = currentPoints + earnedPoints;
          await conn.query(
            `INSERT INTO customer_loyalty_transactions
             (customer_id, transaction_type, points, balance_after, reference_type, reference_id, description, performed_by)
             VALUES (?, 'EARN', ?, ?, 'INVOICE', ?, ?, ?)`,
            [
              customer_id, earnedPoints, newPointsBalance, invoice_no,
              `Earned ${earnedPoints} loyalty points (${loyaltyMultiplier}X for ${membershipTier}) on ${invoice_no}`,
              performedBy
            ]
          );
          await conn.query(
            "UPDATE customers SET loyalty_points = ? WHERE id = ?",
            [newPointsBalance, customer_id]
          );
        }

        // D. CUSTOMER LEDGER AUTO-POSTING
        const [[balanceRow]] = await conn.query(
          "SELECT (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)) AS current_balance FROM customer_ledger WHERE customer_id = ?",
          [customer_id]
        );
        let runningBalance = Number(balanceRow.current_balance || 0);
        const itemsSummary = items.map(i => i.description || i.item_description).filter(Boolean).join(", ") || invoice_type || "Jewellery Sale";

        // Debit Entry (Total invoice cost)
        runningBalance += invoiceGrandTotal;
        await conn.query(
          `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
           VALUES (?, ?, ?, ?, 0, ?, ?)`,
          [
            customer_id, entryDate,
            `Invoice ${invoice_no} (${itemsSummary})${creditDueDate ? ` [Due: ${creditDueDate}]` : ''}`,
            invoiceGrandTotal, runningBalance, invoice_no
          ]
        );

        // Credit Entry (Payments made)
        if (actualPaidAmount > 0) {
          runningBalance -= actualPaidAmount;
          let paymentLabel = `Payment received via ${payment_mode || 'Cash'} against ${invoice_no}`;
          if (usedWalletAmount > 0 && actualPaidAmount > usedWalletAmount) {
            paymentLabel = `Payment received via Split (Wallet: ₹${usedWalletAmount}, ${payment_mode}: ₹${actualPaidAmount - usedWalletAmount}) against ${invoice_no}`;
          } else if (usedWalletAmount > 0) {
            paymentLabel = `Payment received via Store Wallet against ${invoice_no}`;
          }

          await conn.query(
            `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
             VALUES (?, ?, ?, 0, ?, ?, ?)`,
            [
              customer_id, entryDate,
              paymentLabel, actualPaidAmount, runningBalance, `PAY-${invoice_no}`
            ]
          );
        }

        // Update customer cached balance_due
        await conn.query(
          "UPDATE customers SET balance_due = ? WHERE id = ?",
          [Math.max(0, runningBalance), customer_id]
        );
      }
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: {
        id: invoiceId,
        invoice_no,
        grand_total: invoiceGrandTotal,
        status: invoiceStatus,
        membership_tier: membershipTier,
        loyalty_multiplier: loyaltyMultiplier,
        making_discount_pct: makingDiscountPct,
        making_discount_amt: makingDiscountAmt
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// GET /api/billing/kpis
async function getKpis(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const today = new Date().toISOString().split("T")[0];
    const [[kpis]] = await db.query(
      `SELECT
         SUM(CASE WHEN DATE(invoice_date) = ? THEN grand_total ELSE 0 END) AS today_billing,
         SUM(CASE WHEN DATE(invoice_date) = ? THEN 1 ELSE 0 END) AS bills_today,
         SUM(CASE WHEN status='Partial' OR status='Credit' THEN grand_total - COALESCE(paid_amount,0) ELSE 0 END) AS pending_payments,
         SUM(CASE WHEN invoice_type='Return Invoice' AND DATE(invoice_date) = ? THEN 1 ELSE 0 END) AS returns_today
       FROM invoices
       WHERE branch_id = ?`,
      [today, today, today, branch_id]
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/billing/credit-debit-notes
async function getCreditDebitNotes(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [rows] = await db.query(
      `SELECT n.*, c.full_name AS customer_name FROM credit_debit_notes n
       LEFT JOIN customers c ON n.customer_id = c.id
       WHERE n.branch_id = ?
       ORDER BY n.created_at DESC`,
      [branch_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/billing/credit-debit-notes
async function createCreditDebitNote(req, res) {
  const branch_id = req.user.branch_id;
  const { note_type, customer_id, against_invoice, reason, amount, description } = req.body;
  const noteAmount = Number(amount || 0);

  if (!noteAmount || noteAmount <= 0) {
    return res.status(400).json({ success: false, message: "Valid amount is required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const prefix = note_type === "Credit" ? "CN" : "DN";
    const [[{ count }]] = await conn.query(
      "SELECT COUNT(*) AS count FROM credit_debit_notes WHERE note_type = ?", [note_type]
    );
    const note_no = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [result] = await conn.query(
      `INSERT INTO credit_debit_notes (note_no, note_type, customer_id, against_invoice, reason, amount, description)
       VALUES (?,?,?,?,?,?,?)`,
      [note_no, note_type, customer_id || null, against_invoice || null, reason, noteAmount, description || null]
    );

    if (customer_id) {
      const [[balanceRow]] = await conn.query(
        "SELECT (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)) AS current_balance FROM customer_ledger WHERE customer_id = ?",
        [customer_id]
      );
      let runningBalance = Number(balanceRow.current_balance || 0);

      if (note_type === "Credit") {
        runningBalance = Math.max(0, runningBalance - noteAmount);
        await conn.query(
          `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
           VALUES (?, CURDATE(), ?, 0, ?, ?, ?)`,
          [
            customer_id,
            `Credit Note ${note_no}: ${reason || 'Adjustment'}${against_invoice ? ` (against ${against_invoice})` : ''}`,
            noteAmount, runningBalance, note_no
          ]
        );
      } else {
        runningBalance += noteAmount;
        await conn.query(
          `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
           VALUES (?, CURDATE(), ?, ?, 0, ?, ?)`,
          [
            customer_id,
            `Debit Note ${note_no}: ${reason || 'Adjustment'}${against_invoice ? ` (against ${against_invoice})` : ''}`,
            noteAmount, runningBalance, note_no
          ]
        );
      }

      await conn.query(
        "UPDATE customers SET balance_due = ? WHERE id = ?",
        [runningBalance, customer_id]
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, data: { id: result.insertId, note_no } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// GET /api/billing/returns
async function getReturns(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [rows] = await db.query(
      `SELECT r.*, c.full_name AS customer_name FROM returns r
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.branch_id = ?
       ORDER BY r.return_date DESC`,
      [branch_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/billing/returns
async function createReturn(req, res) {
  const branch_id = req.user.branch_id;
  const { customer_id, invoice_ref, item_description, reason, refund_amount, refund_mode, item_condition } = req.body;
  const refAmount = Number(refund_amount || 0);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM returns");
    const return_no = `RET-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [result] = await conn.query(
      `INSERT INTO returns (return_no, customer_id, invoice_ref, item_description, reason, refund_amount, refund_mode, item_condition)
       VALUES (?,?,?,?,?,?,?,?)`,
      [return_no, customer_id || null, invoice_ref || null, item_description, reason, refAmount, refund_mode, item_condition || null]
    );

    if (customer_id && refAmount > 0) {
      const [custRows] = await conn.query("SELECT id, wallet_balance, loyalty_points FROM customers WHERE id = ?", [customer_id]);
      const cust = custRows[0];
      const performedBy = req.user?.full_name || req.user?.username || "Admin";

      if (refund_mode === "Wallet" || refund_mode === "Store Credit") {
        const [existingWallet] = await conn.query(
          "SELECT id FROM customer_wallet_transactions WHERE reference_type = 'RETURN' AND reference_id = ?",
          [return_no]
        );
        if (existingWallet.length === 0) {
          const currentWallet = Number(cust.wallet_balance || 0);
          const newWalletBalance = currentWallet + refAmount;
          await conn.query(
            `INSERT INTO customer_wallet_transactions
             (customer_id, transaction_type, amount, balance_after, reference_type, reference_id, description, performed_by)
             VALUES (?, 'REFUND', ?, ?, 'RETURN', ?, ?, ?)`,
            [
              customer_id, refAmount, newWalletBalance, return_no,
              `Refund to store wallet for return ${return_no}${invoice_ref ? ` (Invoice ${invoice_ref})` : ''}`,
              performedBy
            ]
          );
          await conn.query("UPDATE customers SET wallet_balance = ? WHERE id = ?", [newWalletBalance, customer_id]);
        }
      }

      const pointsToReverse = Math.floor(refAmount / 100);
      if (pointsToReverse > 0) {
        const [existingLoyalty] = await conn.query(
          "SELECT id FROM customer_loyalty_transactions WHERE reference_type = 'RETURN' AND reference_id = ?",
          [return_no]
        );
        if (existingLoyalty.length === 0) {
          const currentPoints = Number(cust.loyalty_points || 0);
          const newPointsBalance = Math.max(0, currentPoints - pointsToReverse);
          await conn.query(
            `INSERT INTO customer_loyalty_transactions
             (customer_id, transaction_type, points, balance_after, reference_type, reference_id, description, performed_by)
             VALUES (?, 'REVERSAL', ?, ?, 'RETURN', ?, ?, ?)`,
            [
              customer_id, pointsToReverse, newPointsBalance, return_no,
              `Reversal of ${pointsToReverse} loyalty points for return ${return_no}`, performedBy
            ]
          );
          await conn.query("UPDATE customers SET loyalty_points = ? WHERE id = ?", [newPointsBalance, customer_id]);
        }
      }

      if (refund_mode === "Credit Adjustment" || refund_mode === "Adjustment" || !refund_mode) {
        const [[balanceRow]] = await conn.query(
          "SELECT (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)) AS current_balance FROM customer_ledger WHERE customer_id = ?",
          [customer_id]
        );
        let runningBalance = Number(balanceRow.current_balance || 0);
        runningBalance = Math.max(0, runningBalance - refAmount);

        await conn.query(
          `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
           VALUES (?, CURDATE(), ?, 0, ?, ?, ?)`,
          [
            customer_id,
            `Sales Return ${return_no}: ${item_description || reason || 'Returned Item'}${invoice_ref ? ` (Ref: ${invoice_ref})` : ''}`,
            refAmount, runningBalance, return_no
          ]
        );

        await conn.query(
          "UPDATE customers SET balance_due = ? WHERE id = ?",
          [runningBalance, customer_id]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ success: true, data: { id: result.insertId, return_no } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

module.exports = {
  getAll,
  getById,
  create,
  getKpis,
  getCreditDebitNotes,
  createCreditDebitNote,
  getReturns,
  createReturn
};
