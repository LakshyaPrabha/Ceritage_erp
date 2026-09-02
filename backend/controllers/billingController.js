const db = require("../config/db");
const accounting = require("../services/accountingPostingService");

// GET /api/billing — all invoices
async function getAll(req, res) {
  const branch_id = req.branchId ?? req.user.branch_id;
  try {
    const { search, type, status, payment_mode, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (branch_id) {
      where += " AND i.branch_id = ?";
      params.push(branch_id);
    }

    if (search) {
      where += " AND (i.invoice_no LIKE ? OR c.full_name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (type)         { where += " AND i.invoice_type = ?";   params.push(type); }
    if (status)       { where += " AND i.status = ?";         params.push(status); }
    if (payment_mode) { where += " AND i.payment_mode = ?";   params.push(payment_mode); }

    const [rows] = await db.query(
      `SELECT i.*, c.full_name AS customer_name, c.phone AS customer_phone
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       ${where}
       ORDER BY i.invoice_date DESC
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
    const [tenders] = await db.query(
      `SELECT it.*, a.code AS account_code, a.name AS account_name
       FROM invoice_tenders it
       LEFT JOIN accounts a ON a.id = it.account_id
       WHERE it.invoice_id = ?
       ORDER BY it.id ASC`,
      [req.params.id]
    ).catch(() => [[]]);
    res.json({ success: true, data: { ...inv[0], items, tenders } });
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
    split_payments, tenders, payments, advance_lock_id, advance_amount, advance_applications,
  } = req.body;

  const requestedBranchId = Number(branch_id || req.user.branch_id || 1);
  if (req.user.role !== "admin" && requestedBranchId !== Number(req.user.branch_id || 1)) {
    return res.status(403).json({ success: false, message: "Cannot create invoice for another branch" });
  }
  const activeBranchId = Number(req.branchId || requestedBranchId || req.user.branch_id || 1);
  const invoiceGrandTotal = Number(grand_total || 0);
  const paymentModeText = String(payment_mode || "").trim().toLowerCase();
  const isCreditSale = paymentModeText === "credit" || paymentModeText === "credit sale";
  const usedWalletAmount = payment_mode === "Wallet" ? invoiceGrandTotal : Number(wallet_amount || 0);
  const pointsToRedeem = Number(redeem_points || 0);
  const tenderInput = split_payments || tenders || payments || [];
  const normalizedTenders = Array.isArray(tenderInput)
    ? tenderInput
        .map((t) => ({
          payment_mode: t.payment_mode || t.mode || "Cash",
          amount: accounting.money(t.amount),
          reference_no: t.reference_no || t.reference || null,
        }))
        .filter((t) => t.amount > 0)
    : [];
  const advanceRequests = Array.isArray(advance_applications)
    ? advance_applications
    : (advance_lock_id && Number(advance_amount || 0) > 0
        ? [{ rate_lock_id: advance_lock_id, amount: Number(advance_amount) }]
        : []);
  const requestedAdvanceTotal = accounting.money(
    advanceRequests.reduce((sum, row) => sum + Number(row.amount || 0), 0)
  );

  // Total paid calculation
  let actualPaidAmount = normalizedTenders.length > 0
    ? accounting.money(normalizedTenders.reduce((sum, tender) => sum + tender.amount, 0))
    : accounting.money(payment_mode === "Wallet"
        ? usedWalletAmount
        : (paid_amount !== undefined ? Number(paid_amount) : (isCreditSale ? 0 : invoiceGrandTotal - usedWalletAmount)) + usedWalletAmount);
  const unpaidAmount = accounting.money(invoiceGrandTotal - actualPaidAmount - requestedAdvanceTotal);
  if (unpaidAmount < -0.01) {
    return res.status(400).json({ success: false, message: "Payments and advances exceed invoice total" });
  }

  // Credit due date calculation for credit/partial invoices
  let numCreditDays = Number(credit_days || (isCreditSale || unpaidAmount > 0 ? 30 : 0));
  let creditDueDate = null;
  if (isCreditSale || unpaidAmount > 0) {
    if (!numCreditDays || numCreditDays <= 0) numCreditDays = 30;
    const baseDate = invoice_date ? new Date(invoice_date) : new Date();
    creditDueDate = new Date(baseDate.getTime() + numCreditDays * 86400000).toISOString().slice(0, 10);
  }

  // Status calculation
  let invoiceStatus = "Paid";
  if (unpaidAmount > 0 && actualPaidAmount === 0 && requestedAdvanceTotal === 0) {
    invoiceStatus = "Credit";
  } else if (unpaidAmount > 0) {
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
      [activeBranchId]
    );
    const invoice_no = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // 4. Insert invoice record (with frozen membership benefits snapshot)
    const [invResult] = await conn.query(
      `INSERT INTO invoices
       (invoice_no, invoice_type, customer_id, branch_id, invoice_date, salesperson_id,
        hsn_code, payment_mode, credit_days, credit_due_date, discount_pct, discount_amt,
        coupon_code, gift_voucher, old_gold_exchange, cgst, sgst, igst, tcs,
        grand_total, paid_amount, status, membership_tier, loyalty_multiplier,
        making_discount_pct, making_discount_amt, wallet_used, points_redeemed, points_earned, balance_due, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        invoice_no, invoice_type || "Retail Invoice", customer_id || null, activeBranchId,
        invoice_date || new Date().toISOString().slice(0, 10),
        salesperson_id || null, hsn_code || "7113", payment_mode,
        numCreditDays, creditDueDate,
        discount_pct || 0, discount_amt || 0, coupon_code || null,
        gift_voucher || null, old_gold_exchange || 0,
        cgst || 0, sgst || 0, igst || 0, tcs || 0,
        invoiceGrandTotal, actualPaidAmount, invoiceStatus,
        membershipTier, loyaltyMultiplier, makingDiscountPct, makingDiscountAmt,
        usedWalletAmount, pointsToRedeem, 0, Math.max(0, unpaidAmount),
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

    let appliedAdvanceTotal = 0;
    for (const app of advanceRequests) {
      const appAmount = accounting.money(app.amount);
      if (!app.rate_lock_id || appAmount <= 0) continue;

      const [lockRows] = await conn.query("SELECT * FROM rate_locks WHERE id = ? FOR UPDATE", [app.rate_lock_id]);
      if (lockRows.length === 0) throw new Error(`Advance rate lock ${app.rate_lock_id} not found`);
      const lock = lockRows[0];
      if (customer_id && lock.customer_id && Number(lock.customer_id) !== Number(customer_id)) {
        throw new Error(`Advance ${lock.lock_no || lock.id} belongs to another customer`);
      }

      const [[appliedRow]] = await conn.query(
        "SELECT COALESCE(SUM(amount),0) AS applied FROM customer_advance_applications WHERE rate_lock_id = ?",
        [app.rate_lock_id]
      );
      const available = accounting.money(Number(lock.advance_paid || 0) - Number(appliedRow.applied || 0));
      if (appAmount > available) {
        throw new Error(`Advance application ${appAmount} exceeds available advance ${available}`);
      }

      await conn.query(
        `INSERT INTO customer_advance_applications (rate_lock_id, invoice_id, branch_id, amount)
         VALUES (?, ?, ?, ?)`,
        [app.rate_lock_id, invoiceId, activeBranchId, appAmount]
      );
      if (accounting.money(available - appAmount) <= 0) {
        await conn.query(
          "UPDATE rate_locks SET status = 'Redeemed', invoice_ref = ?, redeemed_at = CURRENT_TIMESTAMP WHERE id = ?",
          [invoice_no, app.rate_lock_id]
        );
      }
      appliedAdvanceTotal = accounting.money(appliedAdvanceTotal + appAmount);
    }

    const journalTenders = normalizedTenders.length > 0
      ? normalizedTenders
      : (actualPaidAmount > 0 ? [{ payment_mode: payment_mode || "Cash", amount: actualPaidAmount, reference_no: null }] : []);
    const salePosting = await accounting.postInvoiceSale(conn, {
      branch_id: activeBranchId,
      invoice_id: invoiceId,
      invoice_no,
      entry_date: invoice_date || new Date().toISOString().slice(0, 10),
      grand_total: invoiceGrandTotal,
      cgst,
      sgst,
      igst,
      advance_applied: appliedAdvanceTotal,
      tenders: journalTenders,
      created_by: req.user?.full_name || req.user?.username || "Admin",
    });

    for (const tender of salePosting.tenders) {
      await conn.query(
        `INSERT INTO invoice_tenders (invoice_id, branch_id, payment_mode, amount, account_id, reference_no)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [invoiceId, activeBranchId, tender.payment_mode, tender.amount, tender.account_id, tender.reference_no]
      );
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
             VALUES (?, 'DEBIT_INVOICE', ?, ?, 'INVOICE', ?, ?, ?)`,
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
             VALUES (?, 'REDEEM_INVOICE', ?, ?, 'INVOICE', ?, ?, ?)`,
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
             VALUES (?, 'EARN_INVOICE', ?, ?, 'INVOICE', ?, ?, ?)`,
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
          if (journalTenders.length > 1) {
            paymentLabel = `Payment received via Split (${journalTenders.map(t => `${t.payment_mode}: ${t.amount}`).join(", ")}) against ${invoice_no}`;
          }
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

        if (appliedAdvanceTotal > 0) {
          runningBalance -= appliedAdvanceTotal;
          await conn.query(
            `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
             VALUES (?, ?, ?, 0, ?, ?, ?)`,
            [
              customer_id, entryDate,
              `Customer advance applied against ${invoice_no}`,
              appliedAdvanceTotal, Math.max(0, runningBalance), `ADV-${invoice_no}`
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
        paid_amount: actualPaidAmount,
        balance_due: Math.max(0, unpaidAmount),
        status: invoiceStatus,
        journal_voucher_no: salePosting.journal.voucher_no,
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
  const {
    customer_id, invoice_ref, item_description, reason, refund_amount, refund_mode, item_condition,
    cgst = 0, sgst = 0, igst = 0, taxable_amount
  } = req.body;
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

    if (refAmount > 0) {
      await accounting.postSalesRefund(conn, {
        branch_id,
        amount: refAmount,
        refund_mode: refund_mode || "Cash",
        reference_no: return_no,
        source_id: result.insertId,
        entry_date: new Date().toISOString().slice(0, 10),
        created_by: req.user?.full_name || req.user?.username || "Admin",
        narration: `Sales return refund ${return_no}${invoice_ref ? ` against ${invoice_ref}` : ""}`,
        cgst,
        sgst,
        igst,
        taxable_amount,
      });
    }

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
             VALUES (?, 'CREDIT_REFUND', ?, ?, 'RETURN', ?, ?, ?)`,
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
             VALUES (?, 'REVERSAL_RETURN', ?, ?, 'RETURN', ?, ?, ?)`,
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
