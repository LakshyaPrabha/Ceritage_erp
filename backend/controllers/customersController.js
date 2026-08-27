const db = require("../config/db");

// GET /api/customers
async function getAll(req, res) {
  try {
    const { search, tier, city, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      where += " AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.customer_id LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (tier) { where += " AND c.tier = ?"; params.push(tier); }
    if (city) { where += " AND c.city = ?"; params.push(city); }

    const [rows] = await db.query(
      `SELECT c.*, COALESCE(SUM(t.amount), 0) AS total_purchase
       FROM customers c
       LEFT JOIN transactions t ON t.customer_id = c.id AND t.type = 'sale'
       ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM customers c ${where}`, params
    );

    res.json({ success: true, data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id
async function getById(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM customers WHERE id = ?", [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/customers
async function create(req, res) {
  const {
    full_name, phone, email, date_of_birth, anniversary,
    tier = "Regular", city, state, pan, aadhaar, gst_number,
    credit_limit = 0,
  } = req.body;

  if (!full_name || !phone) {
    return res.status(400).json({ success: false, message: "full_name and phone required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO customers
       (full_name, phone, email, date_of_birth, anniversary, tier,
        city, state, pan, aadhaar, gst_number, credit_limit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, phone, email || null, date_of_birth || null, anniversary || null,
       tier, city || null, state || null, pan || null, aadhaar || null,
       gst_number || null, credit_limit]
    );
    res.status(201).json({ success: true, message: "Customer created", data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/customers/:id
async function update(req, res) {
  const {
    full_name, phone, email, date_of_birth, anniversary,
    tier, city, state, pan, aadhaar, gst_number, credit_limit,
  } = req.body;
  try {
    await db.query(
      `UPDATE customers SET full_name=?, phone=?, email=?, date_of_birth=?,
       anniversary=?, tier=?, city=?, state=?, pan=?, aadhaar=?, gst_number=?, credit_limit=?
       WHERE id=?`,
      [full_name, phone, email || null, date_of_birth || null, anniversary || null,
       tier, city || null, state || null, pan || null, aadhaar || null,
       gst_number || null, credit_limit, req.params.id]
    );
    res.json({ success: true, message: "Customer updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/customers/:id
async function remove(req, res) {
  try {
    await db.query("DELETE FROM customers WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id/ledger
async function getLedger(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT * FROM customer_ledger WHERE customer_id = ? ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/:id/purchase-history
async function getPurchaseHistory(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT i.*, ip.item_description, ip.amount AS item_amount
       FROM invoices i
       LEFT JOIN invoice_items ip ON ip.invoice_id = i.id
       WHERE i.customer_id = ?
       ORDER BY i.invoice_date DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/customers/kpis — dashboard numbers
async function getKpis(req, res) {
  try {
    const [[totals]] = await db.query(
      `SELECT
         COUNT(*) AS total_customers,
         SUM(CASE WHEN tier='Platinum' THEN 1 ELSE 0 END) AS platinum,
         SUM(CASE WHEN tier='Gold'     THEN 1 ELSE 0 END) AS gold,
         SUM(CASE WHEN balance_due > 0 THEN 1 ELSE 0 END) AS pending_dues
       FROM customers`
    );
    res.json({ success: true, data: totals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, getById, create, update, remove, getLedger, getPurchaseHistory, getKpis };
