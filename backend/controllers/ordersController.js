const db = require("../config/db");

// GET /api/orders/kpis
async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(`
      SELECT
        COUNT(CASE WHEN status NOT IN ('Delivered', 'Cancelled') THEN 1 END) AS active_orders,
        COALESCE(SUM(advance_paid), 0) AS advance_collected,
        COUNT(CASE WHEN status = 'Ready' THEN 1 END) AS ready_to_deliver,
        COUNT(CASE WHEN due_date < CURDATE() AND status NOT IN ('Delivered', 'Cancelled') THEN 1 END) AS overdue
      FROM orders
    `);

    res.json({
      success: true,
      data: {
        active_orders: kpis.active_orders || 0,
        advance_collected: parseFloat(kpis.advance_collected || 0),
        ready_to_deliver: kpis.ready_to_deliver || 0,
        overdue: kpis.overdue || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/orders
async function getAll(req, res) {
  try {
    const { status, search } = req.query;
    let where = "WHERE 1=1";
    const params = [];

    if (status && status !== "ALL" && status !== "All Status") {
      where += " AND o.status = ?";
      params.push(status);
    }
    if (search) {
      where += " AND (o.order_no LIKE ? OR o.item_name LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const [rows] = await db.query(
      `SELECT o.*,
              (COALESCE(o.estimated_total, 0) - COALESCE(o.advance_paid, 0)) AS balance_amount,
              c.full_name AS customer_name, c.phone AS customer_phone
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       ${where}
       ORDER BY o.created_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/orders
async function create(req, res) {
  const {
    customer_id, item_name, item_description, metal_type = "Gold",
    purity = "22K", approx_weight, est_weight, estimated_total,
    estimated_amount, advance_paid, advance_amount, due_date, delivery_date
  } = req.body;

  const itemName = item_name || item_description;
  const weight = Number(approx_weight || est_weight || 0);
  const total = Number(estimated_total || estimated_amount || 0);
  const advance = Number(advance_paid || advance_amount || 0);
  const targetDate = due_date || delivery_date || null;

  if (!customer_id || !itemName) {
    return res.status(400).json({ success: false, message: "Customer and item description are required" });
  }

  try {
    const [[{ maxId }]] = await db.query("SELECT COALESCE(MAX(id), 0) + 1 AS maxId FROM orders");
    const orderNo = `ORD-${new Date().getFullYear()}-${String(maxId).padStart(4, "0")}`;

    const [result] = await db.query(
      `INSERT INTO orders
         (order_no, customer_id, item_name, metal_type, purity, approx_weight, advance_paid, estimated_total, due_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [orderNo, customer_id, itemName, metal_type, purity, weight, advance, total, targetDate]
    );

    res.status(201).json({
      success: true,
      message: `Custom order ${orderNo} booked successfully`,
      data: { id: result.insertId, order_no: orderNo }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/orders/:id/status
async function updateStatus(req, res) {
  const { status } = req.body;
  const validStatuses = ["Pending", "In Karigar", "Ready", "Delivered", "Cancelled"];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const [result] = await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getKpis, getAll, create, updateStatus };
