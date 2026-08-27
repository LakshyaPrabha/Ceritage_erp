const db = require("../config/db");

async function getAll(req, res) {
  try {
    const { search, type } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    if (search) { where += " AND (s.company_name LIKE ? OR s.city LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (type)   { where += " AND s.supply_type = ?"; params.push(type); }
    const [rows] = await db.query(`SELECT * FROM suppliers ${where} ORDER BY created_at DESC`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  const { company_name, contact_person, phone, email, supply_type, city, gstin, pan, credit_limit, bank_account, ifsc } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO suppliers (company_name, contact_person, phone, email, supply_type, city, gstin, pan, credit_limit, bank_account, ifsc, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [company_name, contact_person || null, phone || null, email || null, supply_type, city || null, gstin || null, pan || null, credit_limit || 0, bank_account || null, ifsc || null, "Active"]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getLedger(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM supplier_ledger WHERE supplier_id = ? ORDER BY created_at ASC",
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function makePayment(req, res) {
  const { supplier_id, amount, payment_mode, reference, po_ref, remark } = req.body;
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM supplier_payments");
    const pay_id = `SP${String(count + 1).padStart(4, "0")}`;
    const [result] = await db.query(
      `INSERT INTO supplier_payments (pay_id, supplier_id, amount, payment_mode, reference, po_ref, remark)
       VALUES (?,?,?,?,?,?,?)`,
      [pay_id, supplier_id, amount, payment_mode, reference || null, po_ref || null, remark || null]
    );
    await db.query(
      "UPDATE suppliers SET outstanding = GREATEST(0, outstanding - ?) WHERE id = ?",
      [amount, supplier_id]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, pay_id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) AS active,
       SUM(outstanding) AS total_outstanding, SUM(total_purchased) AS total_purchases FROM suppliers`
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, create, getLedger, makePayment, getKpis };
