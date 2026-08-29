const db = require("../config/db");

/**
 * Normalize phone numbers to clean canonical format (Indian standard 10-digits or clean string)
 */
function normalizePhone(rawPhone) {
  if (!rawPhone) return "";
  let clean = String(rawPhone).trim().replace(/[\s\-\(\)\+]/g, "");

  if (clean.length === 12 && clean.startsWith("91")) {
    clean = clean.slice(2);
  } else if (clean.length === 11 && clean.startsWith("0")) {
    clean = clean.slice(1);
  }
  return clean;
}

/**
 * Mask sensitive KYC fields
 */
function maskAadhaar(aadhaar) {
  if (!aadhaar) return null;
  const str = String(aadhaar).replace(/\s/g, "");
  if (str.length >= 4) {
    return `XXXX XXXX ${str.slice(-4)}`;
  }
  return str;
}

function maskPan(pan) {
  if (!pan) return null;
  const str = String(pan).trim();
  if (str.length === 10) {
    return `${str.slice(0, 2)}*****${str.slice(-2)}`;
  }
  return str;
}

/**
 * Log customer lifecycle and financial events to customer_audit_logs
 */
async function logCustomerAudit(customerId, action, performedBy = "System", details = "") {
  try {
    await db.query(
      `INSERT INTO customer_audit_logs (customer_id, action, performed_by, details)
       VALUES (?, ?, ?, ?)`,
      [customerId, action, performedBy, details]
    );
  } catch (err) {
    console.warn("Failed to write customer audit log:", err.message);
  }
}

// GET /api/customers/kpis
async function getKpis(req, res) {
  try {
    const [[totals]] = await db.query(
      `SELECT
         COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS total_customers,
         SUM(CASE WHEN status = 'ACTIVE' AND tier = 'Platinum' THEN 1 ELSE 0 END) AS platinum,
         SUM(CASE WHEN status = 'ACTIVE' AND tier = 'Gold' THEN 1 ELSE 0 END) AS gold,
         SUM(CASE WHEN status = 'ACTIVE' AND balance_due > 0 THEN 1 ELSE 0 END) AS pending_dues,
         SUM(CASE WHEN status = 'ARCHIVED' THEN 1 ELSE 0 END) AS archived_customers,
         SUM(CASE WHEN status = 'ACTIVE' AND (MONTH(date_of_birth) = MONTH(CURDATE()) OR MONTH(anniversary) = MONTH(CURDATE())) THEN 1 ELSE 0 END) AS birthdays_this_month
       FROM customers`
    );

    const [[emis]] = await db.query(
      `SELECT COUNT(*) AS active_emis
       FROM emi_plans ep
       INNER JOIN customers c ON c.id = ep.customer_id
       WHERE ep.status = 'Active' AND c.status = 'ACTIVE'`
    );

    res.json({
      success: true,
      data: {
        total_customers: Number(totals.total_customers || 0),
        platinum: Number(totals.platinum || 0),
        gold: Number(totals.gold || 0),
        pending_dues: Number(totals.pending_dues || 0),
        archived_customers: Number(totals.archived_customers || 0),
        active_emis: Number(emis.active_emis || 0),
        birthdays_this_month: Number(totals.birthdays_this_month || 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers
async function getAll(req, res) {
  try {
    const { search, tier, city, status = "active", page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];

    if (status === "active") {
      where += " AND c.status = 'ACTIVE'";
    } else if (status === "archived") {
      where += " AND c.status = 'ARCHIVED'";
    }

    if (search) {
      const cleanPhoneSearch = normalizePhone(search);
      where += " AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.customer_id LIKE ? OR c.city LIKE ? OR c.phone LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s, `%${cleanPhoneSearch}%`);
    }
    if (tier) { where += " AND c.tier = ?"; params.push(tier); }
    if (city) { where += " AND c.city = ?"; params.push(city); }

    const [rows] = await db.query(
      `SELECT c.*,
              COALESCE(SUM(i.grand_total), 0) AS total_purchase,
              COUNT(DISTINCT i.id) AS total_orders
       FROM customers c
       LEFT JOIN invoices i ON i.customer_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM customers c ${where}`, params
    );

    const sanitizedRows = rows.map(r => ({
      ...r,
      pan_masked: maskPan(r.pan),
      aadhaar_masked: maskAadhaar(r.aadhaar),
    }));

    res.json({ success: true, data: sanitizedRows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id
async function getById(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT c.*,
              COALESCE(SUM(i.grand_total), 0) AS total_purchase,
              COUNT(DISTINCT i.id) AS total_orders
       FROM customers c
       LEFT JOIN invoices i ON i.customer_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });

    const cust = rows[0];
    const canViewFullKyc = req.user?.role === "admin" || req.user?.permissions?.customers?.edit;

    const responseData = {
      ...cust,
      pan_masked: maskPan(cust.pan),
      aadhaar_masked: maskAadhaar(cust.aadhaar),
      pan: canViewFullKyc ? cust.pan : maskPan(cust.pan),
      aadhaar: canViewFullKyc ? cust.aadhaar : maskAadhaar(cust.aadhaar),
      wallet: {
        balance: Number(cust.wallet_balance || 0),
      },
      loyalty: {
        points: Number(cust.loyalty_points || 0),
        tier: cust.tier,
        redeemable_value: Number(cust.loyalty_points || 0) * 0.25,
      }
    };

    res.json({ success: true, data: responseData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers
async function create(req, res) {
  const {
    full_name, phone, email, date_of_birth, anniversary,
    tier = "Regular", city, state, pan, aadhaar, gst_number,
    credit_limit = 0, loyalty_points = 0, wallet_balance = 0,
    kyc_status
  } = req.body;

  if (!full_name || !phone) {
    return res.status(400).json({ success: false, message: "Full name and phone number are required" });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || normalizedPhone.length < 7) {
    return res.status(400).json({ success: false, message: "Please provide a valid phone number" });
  }

  try {
    const [existing] = await db.query(
      `SELECT id, customer_id, full_name, status FROM customers WHERE phone = ?`,
      [normalizedPhone]
    );

    if (existing.length > 0) {
      const found = existing[0];
      if (found.status === "ACTIVE") {
        return res.status(409).json({
          success: false,
          message: `A customer with phone number ${normalizedPhone} is already registered (${found.full_name}, ID: ${found.customer_id}).`,
          existingCustomer: { id: found.id, customer_id: found.customer_id, full_name: found.full_name }
        });
      } else {
        return res.status(409).json({
          success: false,
          message: `A customer with this phone number was previously archived (${found.full_name}, ID: ${found.customer_id}). Please restore the profile or use another number.`,
          archivedCustomer: { id: found.id, customer_id: found.customer_id, full_name: found.full_name }
        });
      }
    }

    const [[lastCust]] = await db.query("SELECT MAX(id) AS max_id FROM customers");
    const nextId = (lastCust.max_id || 0) + 1;
    const customer_id = `CUST-${String(nextId).padStart(4, "0")}`;

    const calculatedKyc = kyc_status || (pan || aadhaar ? "Complete" : "Pending");
    const initialWallet = Number(wallet_balance || 0);
    const initialLoyalty = Number(loyalty_points || 0);

    const {
      opt_in_whatsapp = true, opt_in_sms = true, opt_in_marketing = false,
      preferred_channel = "WHATSAPP"
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO customers
       (customer_id, full_name, phone, email, date_of_birth, anniversary, tier,
        city, state, pan, aadhaar, gst_number, credit_limit, loyalty_points,
        wallet_balance, kyc_status, opt_in_whatsapp, opt_in_sms, opt_in_marketing, preferred_channel, status, balance_due)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0)`,
      [
        customer_id, full_name.trim(), normalizedPhone, email ? email.trim() : null,
        date_of_birth || null, anniversary || null, tier,
        city ? city.trim() : null, state ? state.trim() : null,
        pan ? pan.trim().toUpperCase() : null,
        aadhaar ? aadhaar.trim() : null,
        gst_number ? gst_number.trim().toUpperCase() : null,
        Number(credit_limit || 0), initialLoyalty,
        initialWallet, calculatedKyc,
        Boolean(opt_in_whatsapp), Boolean(opt_in_sms), Boolean(opt_in_marketing),
        preferred_channel
      ]
    );

    const newId = result.insertId;
    const performedBy = req.user?.full_name || req.user?.username || "Admin";

    if (initialWallet > 0) {
      await db.query(
        `INSERT INTO customer_wallet_transactions
         (customer_id, transaction_type, amount, balance_after, reference_type, reference_id, description, performed_by)
         VALUES (?, 'OPENING_BALANCE', ?, ?, 'MANUAL', 'INIT', 'Initial wallet balance on registration', ?)`,
        [newId, initialWallet, initialWallet, performedBy]
      );
    }
    if (initialLoyalty > 0) {
      await db.query(
        `INSERT INTO customer_loyalty_transactions
         (customer_id, transaction_type, points, balance_after, reference_type, reference_id, description, performed_by)
         VALUES (?, 'OPENING_BALANCE', ?, ?, 'MANUAL', 'INIT', 'Initial loyalty points on registration', ?)`,
        [newId, initialLoyalty, initialLoyalty, performedBy]
      );
    }

    await logCustomerAudit(newId, "CREATED", performedBy, `Registered customer ${full_name} (${customer_id})`);

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: { id: newId, customer_id }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/customers/:id
async function update(req, res) {
  const {
    full_name, phone, email, date_of_birth, anniversary,
    tier, city, state, pan, aadhaar, gst_number, credit_limit,
    kyc_status, opt_in_whatsapp, opt_in_sms, opt_in_marketing, preferred_channel
  } = req.body;

  const custId = req.params.id;

  try {
    const [existingList] = await db.query("SELECT * FROM customers WHERE id = ?", [custId]);
    if (existingList.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const currentCust = existingList[0];

    let cleanPhone = currentCust.phone;
    if (phone) {
      cleanPhone = normalizePhone(phone);
      if (cleanPhone !== currentCust.phone) {
        const [conflict] = await db.query(
          "SELECT id, customer_id, full_name FROM customers WHERE phone = ? AND id != ? AND status = 'ACTIVE'",
          [cleanPhone, custId]
        );
        if (conflict.length > 0) {
          return res.status(409).json({
            success: false,
            message: `Another customer (${conflict[0].full_name}, ID: ${conflict[0].customer_id}) is already registered with phone ${cleanPhone}.`
          });
        }
      }
    }

    const updatedKyc = kyc_status || (pan || aadhaar ? "Complete" : currentCust.kyc_status);

    await db.query(
      `UPDATE customers SET
         full_name = COALESCE(?, full_name),
         phone = COALESCE(?, phone),
         email = ?,
         date_of_birth = ?,
         anniversary = ?,
         tier = COALESCE(?, tier),
         city = ?,
         state = ?,
         pan = ?,
         aadhaar = ?,
         gst_number = ?,
         credit_limit = COALESCE(?, credit_limit),
         kyc_status = COALESCE(?, kyc_status),
         opt_in_whatsapp = COALESCE(?, opt_in_whatsapp),
         opt_in_sms = COALESCE(?, opt_in_sms),
         opt_in_marketing = COALESCE(?, opt_in_marketing),
         preferred_channel = COALESCE(?, preferred_channel)
       WHERE id = ?`,
      [
        full_name ? full_name.trim() : currentCust.full_name,
        cleanPhone,
        email !== undefined ? (email ? email.trim() : null) : currentCust.email,
        date_of_birth !== undefined ? (date_of_birth || null) : currentCust.date_of_birth,
        anniversary !== undefined ? (anniversary || null) : currentCust.anniversary,
        tier || currentCust.tier,
        city !== undefined ? (city ? city.trim() : null) : currentCust.city,
        state !== undefined ? (state ? state.trim() : null) : currentCust.state,
        pan !== undefined ? (pan ? pan.trim().toUpperCase() : null) : currentCust.pan,
        aadhaar !== undefined ? (aadhaar ? aadhaar.trim() : null) : currentCust.aadhaar,
        gst_number !== undefined ? (gst_number ? gst_number.trim().toUpperCase() : null) : currentCust.gst_number,
        credit_limit !== undefined ? Number(credit_limit) : currentCust.credit_limit,
        updatedKyc,
        opt_in_whatsapp !== undefined ? Boolean(opt_in_whatsapp) : currentCust.opt_in_whatsapp,
        opt_in_sms !== undefined ? Boolean(opt_in_sms) : currentCust.opt_in_sms,
        opt_in_marketing !== undefined ? Boolean(opt_in_marketing) : currentCust.opt_in_marketing,
        preferred_channel || currentCust.preferred_channel,
        custId
      ]
    );

    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    await logCustomerAudit(custId, "UPDATED", performedBy, `Updated customer profile ${currentCust.customer_id}`);

    res.json({ success: true, message: "Customer updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/customers/:id -> Soft Delete (Archive)
async function remove(req, res) {
  const custId = req.params.id;
  try {
    const [rows] = await db.query("SELECT * FROM customers WHERE id = ?", [custId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const cust = rows[0];

    await db.query("UPDATE customers SET status = 'ARCHIVED' WHERE id = ?", [custId]);

    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    await logCustomerAudit(custId, "ARCHIVED", performedBy, `Archived customer ${cust.full_name} (${cust.customer_id}). All historical invoices and ledger records preserved.`);

    res.json({
      success: true,
      message: `Customer ${cust.full_name} (${cust.customer_id}) archived successfully. Historical records preserved.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers/:id/restore -> Restore Archived Customer
async function restore(req, res) {
  const custId = req.params.id;
  try {
    const [rows] = await db.query("SELECT * FROM customers WHERE id = ?", [custId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const cust = rows[0];

    const [conflict] = await db.query(
      "SELECT id, customer_id, full_name FROM customers WHERE phone = ? AND id != ? AND status = 'ACTIVE'",
      [cust.phone, custId]
    );
    if (conflict.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot restore customer. Phone number ${cust.phone} is already assigned to another active customer (${conflict[0].full_name}, ID: ${conflict[0].customer_id}).`
      });
    }

    await db.query("UPDATE customers SET status = 'ACTIVE' WHERE id = ?", [custId]);

    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    await logCustomerAudit(custId, "RESTORED", performedBy, `Restored customer ${cust.full_name} (${cust.customer_id}) to active directory.`);

    res.json({
      success: true,
      message: `Customer ${cust.full_name} (${cust.customer_id}) restored to active status.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers/:id/payments -> Record customer payment towards dues
async function recordPayment(req, res) {
  const customerId = req.params.id;
  const { amount, payment_mode = "Cash", invoice_no, notes, date } = req.body;

  const paymentAmount = Number(amount || 0);
  if (!paymentAmount || paymentAmount <= 0) {
    return res.status(400).json({ success: false, message: "Valid payment amount greater than 0 is required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [custRows] = await conn.query("SELECT id, customer_id, full_name, balance_due FROM customers WHERE id = ?", [customerId]);
    if (custRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const cust = custRows[0];

    if (invoice_no) {
      const [invRows] = await conn.query(
        "SELECT id, grand_total, paid_amount, status FROM invoices WHERE invoice_no = ?",
        [invoice_no]
      );
      if (invRows.length > 0) {
        const inv = invRows[0];
        const newPaid = Number(inv.paid_amount || 0) + paymentAmount;
        const newStatus = newPaid >= Number(inv.grand_total) ? "Paid" : (newPaid > 0 ? "Partial" : inv.status);
        await conn.query(
          "UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?",
          [newPaid, newStatus, inv.id]
        );
      }
    }

    const [[balanceRow]] = await conn.query(
      "SELECT (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)) AS current_balance FROM customer_ledger WHERE customer_id = ?",
      [customerId]
    );
    const currentBalance = Number(balanceRow.current_balance || 0);
    const newBalance = Math.max(0, currentBalance - paymentAmount);
    const paymentRef = `PAY-CUST-${customerId}-${Date.now().toString().slice(-6)}`;
    const paymentDate = date || new Date().toISOString().slice(0, 10);

    const particulars = `Payment received via ${payment_mode}${invoice_no ? ` against ${invoice_no}` : ''}${notes ? ` (${notes})` : ''}`;

    await conn.query(
      `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
      [customerId, paymentDate, particulars, paymentAmount, newBalance, paymentRef]
    );

    await conn.query("UPDATE customers SET balance_due = ? WHERE id = ?", [newBalance, customerId]);

    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    await logCustomerAudit(customerId, "PAYMENT_RECORDED", performedBy, `Recorded payment of ₹${paymentAmount.toLocaleString('en-IN')} via ${payment_mode} (Ref: ${paymentRef})`);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully.`,
      data: {
        paymentRef,
        amount: paymentAmount,
        newBalanceDue: newBalance,
      }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// GET /api/customers/:id/ledger -> Complete financial ledger audit trail
async function getLedger(req, res) {
  try {
    const customerId = req.params.id;
    const [custRows] = await db.query(
      "SELECT id, customer_id, full_name, phone, tier, balance_due FROM customers WHERE id = ?",
      [customerId]
    );
    if (custRows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const customer = custRows[0];

    const [entries] = await db.query(
      `SELECT id, customer_id, date, particulars, debit, credit, balance, reference, created_at
       FROM customer_ledger
       WHERE customer_id = ?
       ORDER BY date ASC, id ASC`,
      [customerId]
    );

    const totalDebit = entries.reduce((sum, r) => sum + Number(r.debit || 0), 0);
    const totalCredit = entries.reduce((sum, r) => sum + Number(r.credit || 0), 0);
    const calculatedDue = Math.max(0, totalDebit - totalCredit);

    if (Number(customer.balance_due) !== calculatedDue) {
      await db.query("UPDATE customers SET balance_due = ? WHERE id = ?", [calculatedDue, customerId]);
      customer.balance_due = calculatedDue;
    }

    res.json({
      success: true,
      data: {
        customer,
        openingBalance: 0,
        totalDebit,
        totalCredit,
        balanceDue: calculatedDue,
        entries
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── WALLET ENGINE ──

// GET /api/customers/:id/wallet
async function getWallet(req, res) {
  try {
    const customerId = req.params.id;
    const [custRows] = await db.query("SELECT id, customer_id, full_name, phone, wallet_balance FROM customers WHERE id = ?", [customerId]);
    if (custRows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });

    const [transactions] = await db.query(
      `SELECT * FROM customer_wallet_transactions WHERE customer_id = ? ORDER BY created_at DESC, id DESC`,
      [customerId]
    );

    res.json({
      success: true,
      data: {
        customer: custRows[0],
        balance: Number(custRows[0].wallet_balance || 0),
        transactions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers/:id/wallet/credit -> Top-up money in store wallet
async function addWalletCredit(req, res) {
  const customerId = req.params.id;
  const { amount, payment_mode = "Cash", notes } = req.body;
  const creditAmount = Number(amount || 0);

  if (!creditAmount || creditAmount <= 0) {
    return res.status(400).json({ success: false, message: "Valid credit amount greater than 0 is required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [custRows] = await conn.query("SELECT id, customer_id, full_name, wallet_balance FROM customers WHERE id = ?", [customerId]);
    if (custRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const cust = custRows[0];
    const currentBalance = Number(cust.wallet_balance || 0);
    const newBalance = currentBalance + creditAmount;
    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    const refId = `WAL-TOPUP-${Date.now().toString().slice(-6)}`;

    await conn.query(
      `INSERT INTO customer_wallet_transactions
       (customer_id, transaction_type, amount, balance_after, reference_type, reference_id, description, performed_by)
       VALUES (?, 'CREDIT', ?, ?, 'PAYMENT', ?, ?, ?)`,
      [
        customerId, creditAmount, newBalance, refId,
        `Wallet top-up via ${payment_mode}${notes ? ` (${notes})` : ''}`, performedBy
      ]
    );

    await conn.query("UPDATE customers SET wallet_balance = ? WHERE id = ?", [newBalance, customerId]);
    await logCustomerAudit(customerId, "WALLET_CREDIT", performedBy, `Added ₹${creditAmount.toLocaleString('en-IN')} to wallet via ${payment_mode}`);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `₹${creditAmount.toLocaleString('en-IN')} added to ${cust.full_name}'s wallet successfully.`,
      data: { amount: creditAmount, newBalance, reference_id: refId }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// POST /api/customers/:id/wallet/adjust -> Manual wallet balance adjustment
async function adjustWallet(req, res) {
  const customerId = req.params.id;
  const { amount, type = "CREDIT", reason } = req.body;
  const adjAmount = Number(amount || 0);

  if (!adjAmount || adjAmount <= 0) {
    return res.status(400).json({ success: false, message: "Valid adjustment amount is required" });
  }
  if (!reason) {
    return res.status(400).json({ success: false, message: "Reason for adjustment is required for audit trail" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [custRows] = await conn.query("SELECT id, customer_id, full_name, wallet_balance FROM customers WHERE id = ?", [customerId]);
    if (custRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const cust = custRows[0];
    const currentBalance = Number(cust.wallet_balance || 0);

    let newBalance = currentBalance;
    if (type === "CREDIT") {
      newBalance += adjAmount;
    } else {
      if (currentBalance < adjAmount) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Insufficient wallet balance for debit adjustment. Available: ₹${currentBalance}` });
      }
      newBalance -= adjAmount;
    }

    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    const refId = `WAL-ADJ-${Date.now().toString().slice(-6)}`;

    await conn.query(
      `INSERT INTO customer_wallet_transactions
       (customer_id, transaction_type, amount, balance_after, reference_type, reference_id, description, performed_by)
       VALUES (?, 'ADJUSTMENT', ?, ?, 'MANUAL', ?, ?, ?)`,
      [
        customerId, adjAmount, newBalance, refId,
        `Manual adjustment (${type}): ${reason}`, performedBy
      ]
    );

    await conn.query("UPDATE customers SET wallet_balance = ? WHERE id = ?", [newBalance, customerId]);
    await logCustomerAudit(customerId, "WALLET_ADJUSTMENT", performedBy, `Adjusted wallet by ${type === 'CREDIT' ? '+' : '-'}₹${adjAmount} (${reason})`);

    await conn.commit();

    res.json({
      success: true,
      message: `Wallet adjusted successfully. New balance: ₹${newBalance.toLocaleString('en-IN')}`,
      data: { newBalance }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ── LOYALTY POINTS ENGINE ──

// GET /api/customers/:id/loyalty
async function getLoyalty(req, res) {
  try {
    const customerId = req.params.id;
    const [custRows] = await db.query("SELECT id, customer_id, full_name, phone, tier, loyalty_points FROM customers WHERE id = ?", [customerId]);
    if (custRows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });

    const [transactions] = await db.query(
      `SELECT * FROM customer_loyalty_transactions WHERE customer_id = ? ORDER BY created_at DESC, id DESC`,
      [customerId]
    );

    const points = Number(custRows[0].loyalty_points || 0);

    res.json({
      success: true,
      data: {
        customer: custRows[0],
        points,
        tier: custRows[0].tier,
        redeemable_value: points * 0.25,
        transactions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers/:id/loyalty/adjust -> Manual loyalty points adjustment
async function adjustLoyalty(req, res) {
  const customerId = req.params.id;
  const { points, type = "EARN", reason } = req.body;
  const adjPoints = Number(points || 0);

  if (!adjPoints || adjPoints <= 0) {
    return res.status(400).json({ success: false, message: "Valid points value is required" });
  }
  if (!reason) {
    return res.status(400).json({ success: false, message: "Reason for adjustment is required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [custRows] = await conn.query("SELECT id, customer_id, full_name, loyalty_points FROM customers WHERE id = ?", [customerId]);
    if (custRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const cust = custRows[0];
    const currentPoints = Number(cust.loyalty_points || 0);

    let newPoints = currentPoints;
    if (type === "EARN" || type === "CREDIT") {
      newPoints += adjPoints;
    } else {
      if (currentPoints < adjPoints) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Insufficient loyalty points for deduction. Available: ${currentPoints} pts` });
      }
      newPoints -= adjPoints;
    }

    const performedBy = req.user?.full_name || req.user?.username || "Admin";
    const refId = `LOY-ADJ-${Date.now().toString().slice(-6)}`;

    await conn.query(
      `INSERT INTO customer_loyalty_transactions
       (customer_id, transaction_type, points, balance_after, reference_type, reference_id, description, performed_by)
       VALUES (?, 'ADJUSTMENT', ?, ?, 'MANUAL', ?, ?, ?)`,
      [
        customerId, adjPoints, newPoints, refId,
        `Manual points adjustment (${type}): ${reason}`, performedBy
      ]
    );

    await conn.query("UPDATE customers SET loyalty_points = ? WHERE id = ?", [newPoints, customerId]);
    await logCustomerAudit(customerId, "LOYALTY_ADJUSTMENT", performedBy, `Adjusted loyalty points by ${type === 'EARN' ? '+' : '-'}${adjPoints} pts (${reason})`);

    await conn.commit();

    res.json({
      success: true,
      message: `Loyalty points adjusted successfully. New balance: ${newPoints} pts`,
      data: { newPoints }
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ── CUSTOMER NOTES & CRM STREAM ──

// GET /api/customers/:id/notes
async function getNotes(req, res) {
  try {
    const customerId = req.params.id;
    const [rows] = await db.query(
      `SELECT * FROM customer_notes
       WHERE customer_id = ?
       ORDER BY is_pinned DESC, created_at DESC`,
      [customerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers/:id/notes
async function createNote(req, res) {
  const customerId = req.params.id;
  const { category = "General", note_text, is_pinned = false } = req.body;

  if (!note_text || !String(note_text).trim()) {
    return res.status(400).json({ success: false, message: "Note text is required" });
  }

  const validCategories = ["General", "Preference", "Follow-up", "Complaint", "Special Request", "VIP"];
  const noteCategory = validCategories.includes(category) ? category : "General";
  const author = req.user?.full_name || req.user?.username || "Staff";

  try {
    const [cust] = await db.query("SELECT id, full_name FROM customers WHERE id = ?", [customerId]);
    if (cust.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });

    const [result] = await db.query(
      `INSERT INTO customer_notes (customer_id, category, note_text, is_pinned, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [customerId, noteCategory, String(note_text).trim(), Boolean(is_pinned), author]
    );

    await logCustomerAudit(
      customerId,
      "NOTE_ADDED",
      author,
      `Added ${noteCategory} note: "${String(note_text).trim().slice(0, 80)}"`
    );

    res.status(201).json({
      success: true,
      message: "Note added successfully",
      data: { id: result.insertId, category: noteCategory, note_text, is_pinned: Boolean(is_pinned), created_by: author }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/customers/:id/notes/:noteId/pin -> Toggle pinned status
async function togglePinNote(req, res) {
  const { id: customerId, noteId } = req.params;
  const { is_pinned } = req.body;

  try {
    await db.query(
      "UPDATE customer_notes SET is_pinned = ? WHERE id = ? AND customer_id = ?",
      [Boolean(is_pinned), noteId, customerId]
    );

    const author = req.user?.full_name || req.user?.username || "Staff";
    await logCustomerAudit(customerId, "NOTE_PIN_TOGGLED", author, `${is_pinned ? 'Pinned' : 'Unpinned'} customer note #${noteId}`);

    res.json({ success: true, message: `Note ${is_pinned ? 'pinned' : 'unpinned'} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/customers/:id/notes/:noteId
async function deleteNote(req, res) {
  const { id: customerId, noteId } = req.params;

  try {
    const [existing] = await db.query("SELECT * FROM customer_notes WHERE id = ? AND customer_id = ?", [noteId, customerId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    await db.query("DELETE FROM customer_notes WHERE id = ? AND customer_id = ?", [noteId, customerId]);

    const author = req.user?.full_name || req.user?.username || "Staff";
    await logCustomerAudit(customerId, "NOTE_DELETED", author, `Removed note #${noteId} (${existing[0].category})`);

    res.json({ success: true, message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── CUSTOMER RETURNS & PURCHASE HISTORY ──

// GET /api/customers/:id/returns
async function getCustomerReturns(req, res) {
  try {
    const customerId = req.params.id;
    const [rows] = await db.query(
      `SELECT r.*, c.full_name AS customer_name
       FROM returns r
       JOIN customers c ON r.customer_id = c.id
       WHERE r.customer_id = ?
       ORDER BY r.return_date DESC, r.id DESC`,
      [customerId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id/purchases-and-returns
async function getPurchasesAndReturns(req, res) {
  try {
    const customerId = req.params.id;

    // 1. Fetch Invoices with Items
    const [invoices] = await db.query(
      `SELECT i.*,
              COALESCE(SUM(r.refund_amount), 0) AS total_returned_on_invoice,
              COUNT(DISTINCT r.id) AS returns_count,
              GROUP_CONCAT(COALESCE(ii.item_description, p.name) SEPARATOR ', ') AS items_summary
       FROM invoices i
       LEFT JOIN returns r ON r.invoice_ref = i.invoice_no
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       LEFT JOIN products p ON p.id = ii.product_id
       WHERE i.customer_id = ?
       GROUP BY i.id
       ORDER BY i.invoice_date DESC`,
      [customerId]
    );

    // 2. Fetch Returns
    const [returns] = await db.query(
      `SELECT * FROM returns WHERE customer_id = ? ORDER BY return_date DESC`,
      [customerId]
    );

    // 3. Compute Gross Purchases, Total Returned, Net Retained Spend
    const totalGross = invoices.reduce((sum, i) => sum + Number(i.grand_total || 0), 0);
    const totalReturns = returns.reduce((sum, r) => sum + Number(r.refund_amount || 0), 0);
    const netRetainedSpend = Math.max(0, totalGross - totalReturns);

    const enrichedInvoices = invoices.map(i => {
      const gross = Number(i.grand_total || 0);
      const ret = Number(i.total_returned_on_invoice || 0);
      return {
        ...i,
        net_retained_value: Math.max(0, gross - ret),
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalGrossPurchases: totalGross,
          totalRefundedReturns: totalReturns,
          netRetainedSpend,
          totalInvoices: invoices.length,
          totalReturnsCount: returns.length
        },
        invoices: enrichedInvoices,
        returns
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id/purchase-history (Backward-compatible)
async function getPurchaseHistory(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.invoice_no, i.invoice_date, i.grand_total, i.paid_amount,
              i.payment_mode, i.status,
              GROUP_CONCAT(COALESCE(ii.item_description, p.name) SEPARATOR ', ') AS items_summary
       FROM invoices i
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       LEFT JOIN products p ON p.id = ii.product_id
       WHERE i.customer_id = ?
       GROUP BY i.id
       ORDER BY i.invoice_date DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── CUSTOMER 360 UNIFIED ACTIVITY TIMELINE ──

// GET /api/customers/:id/activity
async function getActivityTimeline(req, res) {
  try {
    const customerId = req.params.id;
    const { type, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const events = [];

    // 1. Invoices
    const [invRows] = await db.query(
      `SELECT i.id, i.invoice_no, i.invoice_date, i.grand_total, i.payment_mode, i.status, i.created_at,
              GROUP_CONCAT(ii.item_description SEPARATOR ', ') AS items_summary
       FROM invoices i
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       WHERE i.customer_id = ?
       GROUP BY i.id`,
      [customerId]
    );
    invRows.forEach(i => {
      events.push({
        id: `INV-${i.id}`,
        type: "INVOICE_CREATED",
        title: `Invoice Generated (${i.invoice_no})`,
        description: `Purchased: ${i.items_summary || 'Jewellery Items'} · Status: ${i.status}`,
        amount: Number(i.grand_total),
        reference: i.invoice_no,
        date: i.created_at || i.invoice_date,
        performed_by: "Sales Staff",
        source: "invoices"
      });
    });

    // 2. Customer Ledger Payments
    const [ledgerRows] = await db.query(
      `SELECT * FROM customer_ledger WHERE customer_id = ? AND credit > 0`,
      [customerId]
    );
    ledgerRows.forEach(l => {
      events.push({
        id: `LED-${l.id}`,
        type: "PAYMENT_RECEIVED",
        title: "Payment Received",
        description: l.particulars || "Payment credited against dues",
        amount: Number(l.credit),
        reference: l.reference,
        date: l.created_at || l.date,
        performed_by: "Cashier",
        source: "customer_ledger"
      });
    });

    // 3. Returns
    const [retRows] = await db.query("SELECT * FROM returns WHERE customer_id = ?", [customerId]);
    retRows.forEach(r => {
      events.push({
        id: `RET-${r.id}`,
        type: "RETURN_PROCESSED",
        title: `Sales Return (${r.return_no})`,
        description: `Returned: ${r.item_description} · Reason: ${r.reason || 'Customer request'} · Refund: ${r.refund_mode}`,
        amount: Number(r.refund_amount),
        reference: r.return_no,
        date: r.created_at || r.return_date,
        performed_by: "Admin",
        source: "returns"
      });
    });

    // 4. Notes
    const [noteRows] = await db.query("SELECT * FROM customer_notes WHERE customer_id = ?", [customerId]);
    noteRows.forEach(n => {
      events.push({
        id: `NOTE-${n.id}`,
        type: "NOTE_ADDED",
        title: `Customer Note [${n.category}]`,
        description: n.note_text,
        reference: `NOTE-${n.id}`,
        date: n.created_at,
        performed_by: n.created_by || "Staff",
        source: "customer_notes"
      });
    });

    // 5. Wallet Transactions
    const [walletRows] = await db.query("SELECT * FROM customer_wallet_transactions WHERE customer_id = ?", [customerId]);
    walletRows.forEach(w => {
      events.push({
        id: `WAL-${w.id}`,
        type: `WALLET_${w.transaction_type}`,
        title: `Store Wallet ${w.transaction_type}`,
        description: `${w.description || 'Wallet transaction'} · Balance after: ₹${Number(w.balance_after).toLocaleString('en-IN')}`,
        amount: Number(w.amount),
        reference: w.reference_id,
        date: w.created_at,
        performed_by: w.performed_by,
        source: "customer_wallet_transactions"
      });
    });

    // 6. Loyalty Transactions
    const [loyaltyRows] = await db.query("SELECT * FROM customer_loyalty_transactions WHERE customer_id = ?", [customerId]);
    loyaltyRows.forEach(l => {
      events.push({
        id: `LOY-${l.id}`,
        type: `LOYALTY_${l.transaction_type}`,
        title: `Loyalty Points ${l.transaction_type}`,
        description: `${l.description || 'Loyalty points update'} · Points: ${l.points} pts (Balance: ${l.balance_after} pts)`,
        points: l.points,
        reference: l.reference_id,
        date: l.created_at,
        performed_by: l.performed_by,
        source: "customer_loyalty_transactions"
      });
    });

    // 7. EMI Payments
    const [emiPayRows] = await db.query("SELECT * FROM emi_payments WHERE customer_id = ?", [customerId]);
    emiPayRows.forEach(ep => {
      events.push({
        id: `EMI-PAY-${ep.id}`,
        type: "EMI_PAYMENT",
        title: `EMI Installment #${ep.installment_no} Paid`,
        description: `Installment payment of ₹${Number(ep.amount).toLocaleString('en-IN')} via ${ep.payment_mode}`,
        amount: Number(ep.amount),
        reference: ep.receipt_no,
        date: ep.created_at || ep.payment_date,
        performed_by: ep.performed_by,
        source: "emi_payments"
      });
    });

    // 8. Customer Audit Logs
    const [auditRows] = await db.query(
      "SELECT * FROM customer_audit_logs WHERE customer_id = ? AND action IN ('CREATED', 'UPDATED', 'ARCHIVED', 'RESTORED', 'KYC_UPDATED')",
      [customerId]
    );
    auditRows.forEach(a => {
      events.push({
        id: `AUD-${a.id}`,
        type: a.action,
        title: `Profile ${a.action.replace('_', ' ')}`,
        description: a.details,
        reference: `AUDIT-${a.id}`,
        date: a.created_at,
        performed_by: a.performed_by,
        source: "customer_audit_logs"
      });
    });

    // Filter by type if provided
    let filteredEvents = events;
    if (type && type !== "ALL") {
      filteredEvents = events.filter(e => e.type.startsWith(type) || e.source === type);
    }

    // Sort: Newest to Oldest
    filteredEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = filteredEvents.length;
    const paginated = filteredEvents.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginated,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id/360 — consolidated customer 360 profile
async function getCustomer360(req, res) {
  try {
    const customerId = req.params.id;

    // 1. Customer row
    const [custRows] = await db.query("SELECT * FROM customers WHERE id = ?", [customerId]);
    if (custRows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });
    const cust = custRows[0];

    const canViewFullKyc = req.user?.role === "admin" || req.user?.permissions?.customers?.edit;

    // 2. Financial Ledger summary
    const [[ledgerSummary]] = await db.query(
      `SELECT
         COALESCE(SUM(debit), 0) AS total_debit,
         COALESCE(SUM(credit), 0) AS total_credit,
         (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)) AS balance_due
       FROM customer_ledger WHERE customer_id = ?`,
      [customerId]
    );

    // 3. Purchases & Returns summary
    const [[invSummary]] = await db.query(
      `SELECT
         COALESCE(SUM(grand_total), 0) AS gross_purchases,
         COUNT(id) AS total_orders
       FROM invoices WHERE customer_id = ?`,
      [customerId]
    );

    const [[retSummary]] = await db.query(
      `SELECT
         COALESCE(SUM(refund_amount), 0) AS total_returns,
         COUNT(id) AS return_count
       FROM returns WHERE customer_id = ?`,
      [customerId]
    );

    const grossPurchases = Number(invSummary.gross_purchases || 0);
    const totalReturns = Number(retSummary.total_returns || 0);
    const netRetainedSpend = Math.max(0, grossPurchases - totalReturns);

    // 4. EMI summary
    const [emiPlans] = await db.query("SELECT * FROM emi_plans WHERE customer_id = ? ORDER BY created_at DESC", [customerId]);
    const activeEmiCount = emiPlans.filter(p => p.status === "Active").length;
    const emiOutstanding = emiPlans.filter(p => p.status === "Active").reduce((s, p) => s + Number(p.remaining_amount || 0), 0);

    // 5. Recent Notes (top 5)
    const [recentNotes] = await db.query(
      `SELECT * FROM customer_notes WHERE customer_id = ? ORDER BY is_pinned DESC, created_at DESC LIMIT 5`,
      [customerId]
    );

    // 6. Active Membership Plan Details
    const [activeMem] = await db.query(
      `SELECT cm.*, mp.loyalty_multiplier, mp.making_discount_pct, mp.perks_description, mp.badge_color,
              DATEDIFF(cm.expiry_date, CURDATE()) AS days_remaining
       FROM customer_memberships cm
       JOIN membership_plans mp ON cm.plan_id = mp.id
       WHERE cm.customer_id = ? AND cm.status = 'ACTIVE' AND cm.expiry_date >= CURDATE()
       ORDER BY cm.expiry_date DESC LIMIT 1`,
      [customerId]
    );

    const membershipInfo = activeMem.length > 0 ? activeMem[0] : {
      plan_name: cust.tier || "Regular",
      start_date: null,
      expiry_date: null,
      days_remaining: null,
      loyalty_multiplier: 1.0,
      making_discount_pct: 0.0,
      perks_description: "Standard Loyalty Points",
      status: "ACTIVE",
      badge_color: "#3498db"
    };

    // 7. Upcoming Occasions (Birthday & Anniversary)
    const occasionService = require("../services/occasionService");
    const istNow = occasionService.getIstNow();
    const occasions = [];

    if (cust.date_of_birth) {
      const bday = occasionService.calculateNextOccurrence(cust.date_of_birth, istNow);
      if (bday) {
        occasions.push({
          type: "BIRTHDAY",
          date: bday.nextDateStr,
          occurrenceYear: bday.occurrenceYear,
          daysUntil: bday.daysUntil,
          status: bday.daysUntil === 0 ? "TODAY" : "UPCOMING"
        });
      }
    }
    if (cust.anniversary) {
      const anniv = occasionService.calculateNextOccurrence(cust.anniversary, istNow);
      if (anniv) {
        occasions.push({
          type: "ANNIVERSARY",
          date: anniv.nextDateStr,
          occurrenceYear: anniv.occurrenceYear,
          daysUntil: anniv.daysUntil,
          status: anniv.daysUntil === 0 ? "TODAY" : "UPCOMING"
        });
      }
    }

    // 8. Communication History (SMS / WhatsApp logs)
    const [commLogs] = await db.query(
      `SELECT id, channel, provider, template_code, message_preview, status, error_message, is_test, sent_at, created_at
       FROM communication_logs
       WHERE customer_id = ?
       ORDER BY created_at DESC LIMIT 20`,
      [customerId]
    );

    res.json({
      success: true,
      data: {
        customer: {
          ...cust,
          pan: canViewFullKyc ? cust.pan : maskPan(cust.pan),
          aadhaar: canViewFullKyc ? cust.aadhaar : maskAadhaar(cust.aadhaar),
          pan_masked: maskPan(cust.pan),
          aadhaar_masked: maskAadhaar(cust.aadhaar),
        },
        membership: membershipInfo,
        occasions,
        communication_history: commLogs,
        financials: {
          balance_due: Number(ledgerSummary.balance_due || cust.balance_due || 0),
          total_debit: Number(ledgerSummary.total_debit || 0),
          total_credit: Number(ledgerSummary.total_credit || 0),
          credit_limit: Number(cust.credit_limit || 0),
          available_credit: Math.max(0, Number(cust.credit_limit || 0) - Number(ledgerSummary.balance_due || 0)),
        },
        wallet: {
          balance: Number(cust.wallet_balance || 0),
        },
        loyalty: {
          points: Number(cust.loyalty_points || 0),
          tier: membershipInfo.plan_name,
          redeemable_value: Number(cust.loyalty_points || 0) * 0.25,
        },
        purchases: {
          gross_purchases: grossPurchases,
          total_returns: totalReturns,
          net_retained_spend: netRetainedSpend,
          total_orders: Number(invSummary.total_orders || 0),
          return_count: Number(retSummary.return_count || 0),
        },
        emi: {
          active_plans_count: activeEmiCount,
          emi_outstanding: emiOutstanding,
          plans: emiPlans
        },
        recent_notes: recentNotes
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/reminders/upcoming
async function getUpcomingReminders(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, customer_id, full_name, phone, tier, date_of_birth, anniversary,
              CASE
                WHEN date_of_birth IS NOT NULL AND MONTH(date_of_birth) = MONTH(CURDATE()) THEN 'Birthday'
                WHEN anniversary IS NOT NULL AND MONTH(anniversary) = MONTH(CURDATE()) THEN 'Anniversary'
                ELSE 'Occasion'
              END AS event_type,
              COALESCE(date_of_birth, anniversary) AS event_date
       FROM customers
       WHERE status = 'ACTIVE'
         AND ((date_of_birth IS NOT NULL AND MONTH(date_of_birth) = MONTH(CURDATE()))
          OR (anniversary IS NOT NULL AND MONTH(anniversary) = MONTH(CURDATE())))
       ORDER BY DAY(event_date) ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/reports/dues
async function getDuesReport(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.customer_id, c.full_name, c.phone, c.tier, c.balance_due, c.credit_limit,
              COALESCE(SUM(i.grand_total), 0) AS total_purchase,
              COALESCE(SUM(i.paid_amount), 0) AS total_paid
       FROM customers c
       LEFT JOIN invoices i ON i.customer_id = c.id
       WHERE c.status = 'ACTIVE' AND c.balance_due > 0
       GROUP BY c.id
       ORDER BY c.balance_due DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/reports/wallet
async function getWalletReport(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, customer_id, full_name, phone, tier, loyalty_points,
              (loyalty_points * 0.25) AS redeemable_value,
              wallet_balance
       FROM customers
       WHERE status = 'ACTIVE'
       ORDER BY loyalty_points DESC, wallet_balance DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/reports/credit
async function getCreditReport(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.customer_id, c.full_name, c.phone, c.tier, c.credit_limit,
              c.balance_due AS used_credit,
              GREATEST(0, c.credit_limit - c.balance_due) AS available_credit,
              c.balance_due
       FROM customers c
       WHERE c.status = 'ACTIVE' AND (c.credit_limit > 0 OR c.balance_due > 0)
       ORDER BY c.credit_limit DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/reports/kyc
async function getKycReport(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, customer_id, full_name, phone, pan, aadhaar, gst_number, kyc_status
       FROM customers
       WHERE status = 'ACTIVE'
       ORDER BY kyc_status ASC, created_at DESC`
    );
    const sanitized = rows.map(r => ({
      ...r,
      pan: maskPan(r.pan),
      aadhaar: maskAadhaar(r.aadhaar),
    }));
    res.json({ success: true, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis,
  getAll,
  getById,
  create,
  update,
  remove,
  restore,
  recordPayment,
  getLedger,
  getWallet,
  addWalletCredit,
  adjustWallet,
  getLoyalty,
  adjustLoyalty,
  getNotes,
  createNote,
  togglePinNote,
  deleteNote,
  getCustomerReturns,
  getPurchasesAndReturns,
  getPurchaseHistory,
  getActivityTimeline,
  getCustomer360,
  getUpcomingReminders,
  getDuesReport,
  getWalletReport,
  getCreditReport,
  getKycReport,
};
