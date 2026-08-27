const db = require("../config/db");

async function getAll(req, res) {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE i.invoice_type IN ('Retail Invoice','Wholesale Invoice','Tax Invoice','Exchange Billing')";
    const params = [];
    if (search) { where += " AND (i.invoice_no LIKE ? OR c.full_name LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (status) { where += " AND i.status = ?"; params.push(status); }

    const [rows] = await db.query(
      `SELECT i.*, c.full_name AS customer_name FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       ${where} ORDER BY i.invoice_date DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
      `SELECT
         SUM(grand_total) AS total_net_sales,
         COUNT(*) AS total_bills,
         AVG(grand_total) AS avg_bill_value
       FROM invoices
       WHERE invoice_type IN ('Retail Invoice','Wholesale Invoice','Tax Invoice')`
    );
    const [[returns]] = await db.query(
      "SELECT SUM(refund_amount) AS returns_value FROM returns"
    );
    res.json({ success: true, data: { ...kpis, returns_value: returns.returns_value || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getChallans(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM delivery_challans ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createChallan(req, res) {
  const { invoice_ref, customer_id, customer_name, phone, delivery_address, items_description, quantity, delivery_mode, delivered_by } = req.body;
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM delivery_challans");
    const dc_no = `DC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const [result] = await db.query(
      `INSERT INTO delivery_challans (dc_no, invoice_ref, customer_id, customer_name, phone, delivery_address, items_description, quantity, delivery_mode, delivered_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [dc_no, invoice_ref || null, customer_id || null, customer_name, phone || null, delivery_address, items_description, quantity || 1, delivery_mode, delivered_by || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, dc_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, getKpis, getChallans, createChallan };
