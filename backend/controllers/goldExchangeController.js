const db = require("../config/db");

async function getAll(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT xe.*, c.full_name AS customer_name FROM gold_exchanges xe
       LEFT JOIN customers c ON xe.customer_id = c.id ORDER BY xe.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  const { customer_id, metal_type, item_description, gross_weight, stone_weight, purity, rate, wastage_pct, exchange_for } = req.body;
  try {
    const net_weight   = (gross_weight || 0) - (stone_weight || 0);
    const fine_weight  = net_weight * (parseFloat(purity) || 0.9167);
    const base_value   = fine_weight * (rate || 0);
    const deduction    = base_value * ((wastage_pct || 0) / 100);
    const final_value  = base_value - deduction;

    const [result] = await db.query(
      `INSERT INTO gold_exchanges
       (customer_id, metal_type, item_description, gross_weight, stone_weight, net_weight, purity, fine_weight, rate, wastage_pct, base_value, deduction, final_value, exchange_for)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [customer_id || null, metal_type, item_description || null, gross_weight || 0, stone_weight || 0, net_weight, purity, fine_weight, rate || 0, wastage_pct || 0, base_value, deduction, final_value, exchange_for || "New Purchase"]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, final_value, fine_weight } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
      `SELECT COUNT(*) AS total_exchanges,
       SUM(CASE WHEN metal_type LIKE '%Gold%' THEN fine_weight ELSE 0 END) AS fine_gold_received,
       SUM(CASE WHEN metal_type LIKE '%Silver%' THEN fine_weight ELSE 0 END) AS fine_silver_received,
       SUM(final_value) AS total_value_given FROM gold_exchanges`
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, create, getKpis };
