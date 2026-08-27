const db = require("../config/db");

async function getAll(req, res) {
  try {
    const { supplier_id, type, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (supplier_id) { where += " AND po.supplier_id = ?"; params.push(supplier_id); }
    if (type)        { where += " AND po.material_type = ?"; params.push(type); }
    if (status)      { where += " AND po.status = ?"; params.push(status); }

    const [rows] = await db.query(
      `SELECT po.*, s.company_name AS supplier_name FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       ${where} ORDER BY po.purchase_date DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT po.*, s.company_name AS supplier_name FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "PO not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  const { supplier_id, purchase_date, material_type, item_description, purity, weight_qty, rate, gst_pct, payment_mode, expected_delivery, remarks } = req.body;
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM purchase_orders");
    const po_no = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const amount = (weight_qty || 0) * (rate || 0);
    const gst_amount = amount * ((gst_pct || 3) / 100);
    const total = amount + gst_amount;

    const [result] = await db.query(
      `INSERT INTO purchase_orders (po_no, supplier_id, purchase_date, material_type, item_description, purity, weight_qty, rate, amount, gst_pct, gst_amount, total, payment_mode, expected_delivery, remarks)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [po_no, supplier_id, purchase_date, material_type, item_description, purity || null, weight_qty || 0, rate || 0, amount, gst_pct || 3, gst_amount, total, payment_mode, expected_delivery || null, remarks || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, po_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
      `SELECT SUM(total) AS total_purchase_value, SUM(total - COALESCE(paid_amount,0)) AS pending_payments,
       SUM(total) AS purchase_amount, COUNT(*) AS total_orders FROM purchase_orders`
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getGRNs(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT g.*, s.company_name AS supplier_name FROM grns g
       LEFT JOIN suppliers s ON g.supplier_id = s.id ORDER BY g.received_date DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createGRN(req, res) {
  const { po_id, supplier_id, received_date, item_description, weight_qty, received_by, condition, notes } = req.body;
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM grns");
    const grn_id = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const [result] = await db.query(
      `INSERT INTO grns (grn_id, po_id, supplier_id, received_date, item_description, weight_qty, received_by, condition_status, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [grn_id, po_id || null, supplier_id || null, received_date, item_description || null, weight_qty || 0, received_by || null, condition || "Good", notes || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, grn_id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getOldMetalPurchases(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT om.*, c.full_name AS customer_name FROM old_metal_purchases om
       LEFT JOIN customers c ON om.customer_id = c.id ORDER BY om.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createOldMetalPurchase(req, res) {
  const { customer_id, metal_type, gross_weight, stone_deduction, purity, rate, payment_mode } = req.body;
  try {
    const net_weight = (gross_weight || 0) - (stone_deduction || 0);
    const fine_weight = net_weight * (parseFloat(purity) || 0.9167);
    const amount_paid = fine_weight * (rate || 0);
    const [result] = await db.query(
      `INSERT INTO old_metal_purchases (customer_id, metal_type, gross_weight, stone_deduction, net_weight, purity, fine_weight, rate, amount_paid, payment_mode)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [customer_id || null, metal_type, gross_weight || 0, stone_deduction || 0, net_weight, purity, fine_weight, rate || 0, amount_paid, payment_mode]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, amount_paid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, getById, create, getKpis, getGRNs, createGRN, getOldMetalPurchases, createOldMetalPurchase };
