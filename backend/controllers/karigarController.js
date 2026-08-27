const db = require("../config/db");

async function getAll(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM karigars ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  const { full_name, phone, email, aadhaar, pan, address, specialization, experience_years, labour_rate, rate_unit, bank_account, ifsc, bank_name } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO karigars (full_name, phone, email, aadhaar, pan, address, specialization, experience_years, labour_rate, rate_unit, bank_account, ifsc, bank_name)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [full_name, phone, email || null, aadhaar || null, pan || null, address || null, specialization, experience_years || 0, labour_rate || 0, rate_unit || "per gram", bank_account || null, ifsc || null, bank_name || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getWorkOrders(req, res) {
  try {
    const { karigar_id, status } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    if (karigar_id) { where += " AND wo.karigar_id = ?"; params.push(karigar_id); }
    if (status)     { where += " AND wo.status = ?"; params.push(status); }
    const [rows] = await db.query(
      `SELECT wo.*, k.full_name AS karigar_name FROM work_orders wo
       LEFT JOIN karigars k ON wo.karigar_id = k.id
       ${where} ORDER BY wo.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createWorkOrder(req, res) {
  const { karigar_id, job_ref, item_description, quantity, priority, due_date, est_labour, advance } = req.body;
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM work_orders");
    const wo_id = `WO${String(count + 1).padStart(3, "0")}`;
    const [result] = await db.query(
      `INSERT INTO work_orders (wo_id, karigar_id, job_ref, item_description, quantity, priority, due_date, est_labour, advance, balance, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [wo_id, karigar_id, job_ref || null, item_description, quantity || 1, priority || "Normal", due_date || null, est_labour || 0, advance || 0, (est_labour || 0) - (advance || 0), "Pending"]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, wo_id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function issueGold(req, res) {
  const { karigar_id, work_order_id, metal_type, gross_weight, stone_weight } = req.body;
  try {
    const net_weight = (gross_weight || 0) - (stone_weight || 0);
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM gold_issues");
    const issue_id = `GI${String(count + 1).padStart(4, "0")}`;
    const [result] = await db.query(
      `INSERT INTO gold_issues (issue_id, karigar_id, work_order_id, metal_type, gross_weight, stone_weight, net_weight, issued_by, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [issue_id, karigar_id, work_order_id || null, metal_type, gross_weight || 0, stone_weight || 0, net_weight, req.user.full_name || "Admin", "Issued"]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, issue_id, net_weight } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function receiveGold(req, res) {
  const { karigar_id, work_order_ref, metal_type, issued_weight, received_weight, remarks } = req.body;
  try {
    const wastage = (issued_weight || 0) - (received_weight || 0);
    const wastage_pct = issued_weight > 0 ? (wastage / issued_weight * 100).toFixed(2) : 0;
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM gold_receives");
    const receive_id = `GR${String(count + 1).padStart(4, "0")}`;
    const [result] = await db.query(
      `INSERT INTO gold_receives (receive_id, karigar_id, work_order_ref, metal_type, issued_weight, received_weight, wastage, wastage_pct, received_by, remarks)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [receive_id, karigar_id, work_order_ref || null, metal_type, issued_weight || 0, received_weight || 0, wastage, wastage_pct, req.user.full_name || "Admin", remarks || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, receive_id, wastage, wastage_pct } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function makePayment(req, res) {
  const { karigar_id, amount, payment_mode, reference, work_order_id, remark } = req.body;
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM karigar_payments");
    const pay_id = `KP${String(count + 1).padStart(4, "0")}`;
    const [result] = await db.query(
      `INSERT INTO karigar_payments (pay_id, karigar_id, amount, payment_mode, reference, work_order_id, remark)
       VALUES (?,?,?,?,?,?,?)`,
      [pay_id, karigar_id, amount, payment_mode, reference || null, work_order_id || null, remark || null]
    );
    await db.query("UPDATE karigars SET pending_payment = GREATEST(0, pending_payment - ?) WHERE id = ?", [amount, karigar_id]);
    res.status(201).json({ success: true, data: { id: result.insertId, pay_id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) AS active,
       SUM(gold_at_hand) AS gold_at_karigar, SUM(pending_jobs) AS pending_jobs,
       SUM(pending_payment) AS pending_payments FROM karigars`
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, create, getWorkOrders, createWorkOrder, issueGold, receiveGold, makePayment, getKpis };
