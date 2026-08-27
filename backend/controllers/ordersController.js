const db = require("../config/db");

async function getAll(req, res) {
  try {
    const { filter, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (filter && filter !== "All Orders") { where += " AND o.order_type = ?"; params.push(filter); }
    if (status) { where += " AND o.status = ?"; params.push(status); }

    const [rows] = await db.query(
      `SELECT o.*, c.full_name AS customer_name, c.phone FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  const { customer_id, order_type, priority, item_description, purity, est_weight, estimated_amount, gold_rate_locked, advance_amount, payment_mode, delivery_date, karigar_id, instructions } = req.body;
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM orders");
    const order_id = `ORD${String(count + 1).padStart(3, "0")}`;
    const balance = (estimated_amount || 0) - (advance_amount || 0);

    const [result] = await db.query(
      `INSERT INTO orders (order_id, customer_id, order_type, priority, item_description, purity, est_weight, estimated_amount, gold_rate_locked, advance_amount, balance, payment_mode, delivery_date, karigar_id, instructions, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [order_id, customer_id, order_type || "Custom", priority || "Normal", item_description, purity || "22K", est_weight || 0, estimated_amount || 0, gold_rate_locked || 0, advance_amount || 0, balance, payment_mode || "Cash", delivery_date || null, karigar_id || null, instructions || null, "Pending"]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, order_id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateStatus(req, res) {
  const FLOW = ["Pending", "Confirmed", "In Design", "Manufacturing", "Ready", "Delivered"];
  try {
    const [rows] = await db.query("SELECT status FROM orders WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Order not found" });
    const currentIdx = FLOW.indexOf(rows[0].status);
    const nextStatus = FLOW[currentIdx + 1] || rows[0].status;
    await db.query("UPDATE orders SET status = ? WHERE id = ?", [nextStatus, req.params.id]);
    res.json({ success: true, message: `Status updated to ${nextStatus}`, data: { status: nextStatus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
      `SELECT
       SUM(CASE WHEN status NOT IN ('Delivered') THEN 1 ELSE 0 END) AS active_orders,
       SUM(advance_amount) AS advance_collected,
       SUM(CASE WHEN status = 'Ready' THEN 1 ELSE 0 END) AS ready_to_deliver,
       SUM(CASE WHEN delivery_date < CURDATE() AND status != 'Delivered' THEN 1 ELSE 0 END) AS overdue
       FROM orders`
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, create, updateStatus, getKpis };
