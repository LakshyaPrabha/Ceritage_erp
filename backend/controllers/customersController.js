const db = require("../config/db");

// ── Helper: generate unique customer code ──────────────────
async function generateCustomerCode() {
  const [[{ count }]] = await db.query(
    "SELECT COUNT(*) AS count FROM customers"
  );
  const num  = String(count + 1).padStart(5, "0");
  const year = new Date().getFullYear().toString().slice(-2);
  return `CUS${year}${num}`;
}

// ── Helper: auto-upgrade tier based on total spend ─────────
function calculateTier(totalPurchase) {
  if (totalPurchase >= 500000) return "Platinum"; // 5L+
  if (totalPurchase >= 100000) return "Gold";     // 1L+
  if (totalPurchase >= 25000)  return "Silver";   // 25K+
  return "Regular";
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers/kpis
// ─────────────────────────────────────────────────────────────
async function getKpis(req, res) {
  try {
    const [[totals]] = await db.query(`
      SELECT
        COUNT(*)                                                      AS total_customers,
        SUM(CASE WHEN tier = 'Platinum' THEN 1 ELSE 0 END)           AS platinum,
        SUM(CASE WHEN tier = 'Gold'     THEN 1 ELSE 0 END)           AS gold,
        SUM(CASE WHEN tier = 'Silver'   THEN 1 ELSE 0 END)           AS silver,
        SUM(CASE WHEN balance_due > 0   THEN 1 ELSE 0 END)           AS pending_dues,
        SUM(CASE WHEN kyc_status = 'Complete' THEN 1 ELSE 0 END)     AS kyc_complete,
        SUM(CASE WHEN date_of_birth IS NOT NULL
             AND MONTH(date_of_birth) = MONTH(NOW())
             AND DAY(date_of_birth)   >= DAY(NOW())
             THEN 1 ELSE 0 END)                                       AS birthdays_this_month,
        SUM(CASE WHEN anniversary IS NOT NULL
             AND MONTH(anniversary) = MONTH(NOW())
             THEN 1 ELSE 0 END)                                       AS anniversaries_this_month
      FROM customers
      WHERE status != 'Blocked'
    `);
    res.json({ success: true, data: totals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers  (with search, filter, pagination)
// ─────────────────────────────────────────────────────────────
async function getAll(req, res) {
  try {
    const {
      search, tier, city, kyc_status,
      page = 1, limit = 50,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where  = ["c.status != 'Blocked'"];
    const params = [];

    if (search) {
      where.push(
        "(c.full_name LIKE ? OR c.phone LIKE ? OR c.customer_code LIKE ? OR c.email LIKE ?)"
      );
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (tier)       { where.push("c.tier = ?");       params.push(tier); }
    if (city)       { where.push("c.city = ?");        params.push(city); }
    if (kyc_status) { where.push("c.kyc_status = ?");  params.push(kyc_status); }

    const whereClause = "WHERE " + where.join(" AND ");

    const [rows] = await db.query(
      `SELECT
         c.id, c.customer_code, c.full_name, c.phone, c.email,
         c.tier, c.city, c.state, c.kyc_status, c.balance_due,
         c.total_purchase, c.loyalty_points, c.wallet_balance,
         c.status, c.created_at,
         CASE
           WHEN c.date_of_birth IS NOT NULL
            AND MONTH(c.date_of_birth) = MONTH(NOW())
            AND DAY(c.date_of_birth)   = DAY(NOW())
           THEN 1 ELSE 0
         END AS birthday_today
       FROM customers c
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM customers c ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data:    rows,
      total,
      page:    parseInt(page),
      limit:   parseInt(limit),
      pages:   Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers/:id  (full profile)
// ─────────────────────────────────────────────────────────────
async function getById(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM customers WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/customers  (create)
// ─────────────────────────────────────────────────────────────
async function create(req, res) {
  const {
    full_name, phone, alt_phone, email,
    date_of_birth, anniversary, gender,
    tier = "Regular", address, city, state, pincode,
    pan, aadhaar, gst_number, credit_limit = 0, notes,
  } = req.body;

  if (!full_name?.trim()) {
    return res.status(400).json({ success: false, message: "Full name is required." });
  }
  if (!phone?.trim()) {
    return res.status(400).json({ success: false, message: "Phone number is required." });
  }

  // Phone validation — 10 digits starting with 6-9
  if (!/^[6-9]\d{9}$/.test(phone.trim())) {
    return res.status(400).json({ success: false, message: "Enter a valid 10-digit Indian mobile number." });
  }

  // Email validation
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Enter a valid email address." });
  }

  // PAN validation
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase())) {
    return res.status(400).json({ success: false, message: "PAN must be in format ABCDE1234F." });
  }

  // Aadhaar validation
  const aadhaarClean = (aadhaar || "").replace(/\s/g, "");
  if (aadhaar && !/^\d{12}$/.test(aadhaarClean)) {
    return res.status(400).json({ success: false, message: "Aadhaar must be exactly 12 digits." });
  }

  // GST validation
  if (gst_number && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst_number.trim().toUpperCase())) {
    return res.status(400).json({ success: false, message: "Enter a valid 15-character GST number." });
  }

  try {
    // Check duplicate phone
    const [existing] = await db.query(
      "SELECT id FROM customers WHERE phone = ?",
      [phone.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A customer with this phone number already exists",
      });
    }

    const customer_code = await generateCustomerCode();

    const [result] = await db.query(
      `INSERT INTO customers
         (customer_code, full_name, phone, alt_phone, email,
          date_of_birth, anniversary, gender, tier, address,
          city, state, pincode, pan, aadhaar, gst_number,
          credit_limit, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        customer_code,
        full_name.trim(),
        phone.trim(),
        alt_phone  || null,
        email      || null,
        date_of_birth || null,
        anniversary   || null,
        gender        || null,
        tier,
        address   || null,
        city      || null,
        state     || null,
        pincode   || null,
        pan       ? pan.toUpperCase().trim()   : null,
        aadhaar   || null,
        gst_number|| null,
        parseFloat(credit_limit) || 0,
        notes     || null,
        req.user?.id || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: { id: result.insertId, customer_code },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/customers/:id  (update)
// ─────────────────────────────────────────────────────────────
async function update(req, res) {
  const {
    full_name, phone, alt_phone, email,
    date_of_birth, anniversary, gender,
    tier, address, city, state, pincode,
    pan, aadhaar, gst_number, credit_limit, notes, status,
  } = req.body;

  try {
    // Check duplicate phone (exclude self)
    if (phone) {
      const [existing] = await db.query(
        "SELECT id FROM customers WHERE phone = ? AND id != ?",
        [phone.trim(), req.params.id]
      );
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Another customer with this phone number already exists",
        });
      }
    }

    await db.query(
      `UPDATE customers SET
         full_name=?, phone=?, alt_phone=?, email=?,
         date_of_birth=?, anniversary=?, gender=?,
         tier=?, address=?, city=?, state=?, pincode=?,
         pan=?, aadhaar=?, gst_number=?,
         credit_limit=?, notes=?, status=?
       WHERE id=?`,
      [
        full_name, phone, alt_phone || null, email || null,
        date_of_birth || null, anniversary || null, gender || null,
        tier, address || null, city || null, state || null, pincode || null,
        pan ? pan.toUpperCase().trim() : null,
        aadhaar || null, gst_number || null,
        parseFloat(credit_limit) || 0,
        notes || null,
        status || "Active",
        req.params.id,
      ]
    );

    res.json({ success: true, message: "Customer updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/customers/:id  — permanent hard delete
// ─────────────────────────────────────────────────────────────
async function remove(req, res) {
  try {
    const [result] = await db.query(
      "DELETE FROM customers WHERE id = ?",
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers/:id/ledger
// ─────────────────────────────────────────────────────────────
async function getLedger(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT * FROM customer_ledger
       WHERE customer_id = ?
       ORDER BY date ASC, created_at ASC`,
      [req.params.id]
    );

    // Running balance
    let balance = 0;
    const ledger = rows.map((row) => {
      balance = balance + (row.debit || 0) - (row.credit || 0);
      return { ...row, running_balance: balance };
    });

    res.json({ success: true, data: ledger });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers/:id/purchase-history
// ─────────────────────────────────────────────────────────────
async function getPurchaseHistory(req, res) {
  try {
    // invoices table exists check — graceful fallback
    const [tables] = await db.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoices'"
    );

    if (tables.length === 0) {
      return res.json({ success: true, data: [], message: "Invoices table not yet created" });
    }

    const [rows] = await db.query(
      `SELECT
         i.id, i.invoice_no, i.invoice_date,
         i.grand_total, i.payment_mode, i.status,
         GROUP_CONCAT(ii.item_description SEPARATOR ', ') AS items
       FROM invoices i
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
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

// ─────────────────────────────────────────────────────────────
// GET /api/customers/:id/wallet
// ─────────────────────────────────────────────────────────────
async function getWallet(req, res) {
  try {
    const [customer] = await db.query(
      "SELECT id, full_name, wallet_balance, loyalty_points, tier FROM customers WHERE id = ?",
      [req.params.id]
    );
    if (customer.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const [walletLog] = await db.query(
      "SELECT * FROM customer_wallet_log WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50",
      [req.params.id]
    );

    const [loyaltyLog] = await db.query(
      "SELECT * FROM customer_loyalty_log WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50",
      [req.params.id]
    );

    // Points redeemable value (1 point = ₹0.25 by default)
    const redeemable_value = (customer[0].loyalty_points || 0) * 0.25;

    res.json({
      success: true,
      data: {
        ...customer[0],
        redeemable_value,
        wallet_log:  walletLog,
        loyalty_log: loyaltyLog,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/customers/:id/wallet/credit
// ─────────────────────────────────────────────────────────────
async function walletCredit(req, res) {
  const { amount, description, reference } = req.body;
  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Valid amount required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "UPDATE customers SET wallet_balance = wallet_balance + ? WHERE id = ?",
      [parseFloat(amount), req.params.id]
    );

    await conn.query(
      `INSERT INTO customer_wallet_log (customer_id, type, amount, description, reference)
       VALUES (?, 'Credit', ?, ?, ?)`,
      [req.params.id, parseFloat(amount), description || "Wallet credit", reference || null]
    );

    await conn.commit();
    res.json({ success: true, message: `₹${amount} credited to wallet` });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/customers/:id/loyalty/redeem
// ─────────────────────────────────────────────────────────────
async function redeemPoints(req, res) {
  const { points, reference } = req.body;
  if (!points || parseInt(points) <= 0) {
    return res.status(400).json({ success: false, message: "Valid points required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[customer]] = await conn.query(
      "SELECT loyalty_points FROM customers WHERE id = ?",
      [req.params.id]
    );

    if (customer.loyalty_points < parseInt(points)) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient points. Available: ${customer.loyalty_points}`,
      });
    }

    const value = parseInt(points) * 0.25;

    await conn.query(
      "UPDATE customers SET loyalty_points = loyalty_points - ? WHERE id = ?",
      [parseInt(points), req.params.id]
    );

    await conn.query(
      `INSERT INTO customer_loyalty_log (customer_id, type, points, description, reference)
       VALUES (?, 'Redeemed', ?, ?, ?)`,
      [req.params.id, parseInt(points), `Redeemed for ₹${value}`, reference || null]
    );

    await conn.commit();
    res.json({
      success: true,
      message: `${points} points redeemed (value: ₹${value})`,
      data: { points_redeemed: parseInt(points), value },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/customers/:id/kyc
// ─────────────────────────────────────────────────────────────
async function updateKyc(req, res) {
  const { pan, aadhaar, gst_number, kyc_status } = req.body;
  try {
    await db.query(
      "UPDATE customers SET pan=?, aadhaar=?, gst_number=?, kyc_status=? WHERE id=?",
      [
        pan    ? pan.toUpperCase().trim() : null,
        aadhaar    || null,
        gst_number || null,
        kyc_status || "Pending",
        req.params.id,
      ]
    );
    res.json({ success: true, message: "KYC updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers/reminders  (birthdays & anniversaries)
// ─────────────────────────────────────────────────────────────
async function getReminders(req, res) {
  try {
    const { days = 7 } = req.query;

    const [rows] = await db.query(
      `SELECT
         id, customer_code, full_name, phone, email, tier,
         date_of_birth, anniversary,
         CASE
           WHEN date_of_birth IS NOT NULL
            AND DAYOFYEAR(DATE_FORMAT(date_of_birth, CONCAT(YEAR(NOW()), '-%m-%d')))
            BETWEEN DAYOFYEAR(NOW()) AND DAYOFYEAR(NOW()) + ?
           THEN 'Birthday'
           WHEN anniversary IS NOT NULL
            AND DAYOFYEAR(DATE_FORMAT(anniversary, CONCAT(YEAR(NOW()), '-%m-%d')))
            BETWEEN DAYOFYEAR(NOW()) AND DAYOFYEAR(NOW()) + ?
           THEN 'Anniversary'
           ELSE NULL
         END AS reminder_type,
         DATEDIFF(
           DATE_FORMAT(COALESCE(date_of_birth, anniversary), CONCAT(YEAR(NOW()), '-%m-%d')),
           NOW()
         ) AS days_left
       FROM customers
       WHERE status = 'Active'
         AND (
           (date_of_birth IS NOT NULL
            AND MONTH(date_of_birth) = MONTH(DATE_ADD(NOW(), INTERVAL ? DAY)))
           OR
           (anniversary IS NOT NULL
            AND MONTH(anniversary) = MONTH(DATE_ADD(NOW(), INTERVAL ? DAY)))
         )
       ORDER BY days_left ASC`,
      [parseInt(days), parseInt(days), parseInt(days), parseInt(days)]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers/due-tracking
// ─────────────────────────────────────────────────────────────
async function getDueTracking(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         id, customer_code, full_name, phone, tier,
         balance_due, credit_limit,
         total_purchase,
         (credit_limit - balance_due) AS available_credit
       FROM customers
       WHERE balance_due > 0 AND status = 'Active'
       ORDER BY balance_due DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers/credit-register
// ─────────────────────────────────────────────────────────────
async function getCreditRegister(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         id, customer_code, full_name, phone, tier,
         credit_limit, balance_due,
         (credit_limit - balance_due) AS available,
         total_purchase
       FROM customers
       WHERE credit_limit > 0 AND status = 'Active'
       ORDER BY balance_due DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers/search?q=  (quick search — for dropdowns)
// ─────────────────────────────────────────────────────────────
async function search(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    const s = `%${q}%`;
    const [rows] = await db.query(
      `SELECT id, customer_code, full_name, phone, tier, balance_due, wallet_balance, loyalty_points
       FROM customers
       WHERE status = 'Active'
         AND (full_name LIKE ? OR phone LIKE ? OR customer_code LIKE ?)
       LIMIT 10`,
      [s, s, s]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers/wallet-summary  (all customers wallet)
// ─────────────────────────────────────────────────────────────
async function getWalletSummary(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         id, customer_code, full_name, tier,
         loyalty_points,
         ROUND(loyalty_points * 0.25, 2) AS redeemable_value,
         wallet_balance
       FROM customers
       WHERE status = 'Active'
       ORDER BY loyalty_points DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/customers/:id/ledger  — add manual ledger entry
// ─────────────────────────────────────────────────────────────
async function addLedgerEntry(req, res) {
  const { date, particulars, debit = 0, credit = 0 } = req.body;

  if (!particulars?.trim()) {
    return res.status(400).json({ success: false, message: "Particulars are required." });
  }
  if (!date) {
    return res.status(400).json({ success: false, message: "Date is required." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insert ledger entry
    await conn.query(
      `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.id, date, particulars.trim(), parseFloat(debit) || 0, parseFloat(credit) || 0]
    );

    // Update customer balance_due
    const debitAmt  = parseFloat(debit)  || 0;
    const creditAmt = parseFloat(credit) || 0;
    if (debitAmt > 0 || creditAmt > 0) {
      await conn.query(
        `UPDATE customers
         SET balance_due = balance_due + ? - ?
         WHERE id = ?`,
        [debitAmt, creditAmt, req.params.id]
      );
    }

    await conn.commit();
    res.json({ success: true, message: "Ledger entry added successfully." });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

module.exports = {
  getKpis,
  getAll,
  getById,
  create,
  update,
  remove,
  getLedger,
  addLedgerEntry,
  getPurchaseHistory,
  getWallet,
  walletCredit,
  redeemPoints,
  updateKyc,
  getReminders,
  getDueTracking,
  getCreditRegister,
  getWalletSummary,
  search,
};
