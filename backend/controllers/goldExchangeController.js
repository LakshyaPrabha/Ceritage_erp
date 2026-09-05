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
  const { customer_id, metal_type = "Gold", item_description, gross_weight, stone_weight, purity, rate, wastage_pct, exchange_for } = req.body;
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM gold_exchanges");
    const year = new Date().getFullYear();
    const exchange_no = `EXCH-${year}-${String(count + 1).padStart(4, "0")}`;
    const exchange_date = new Date().toISOString().slice(0, 10);

    let effectiveCustId = customer_id;
    if (!effectiveCustId) {
      const [cRows] = await db.query("SELECT id FROM customers LIMIT 1");
      effectiveCustId = cRows.length ? cRows[0].id : 1;
    }

    const net_weight   = Math.max(0, (parseFloat(gross_weight) || 0) - (parseFloat(stone_weight) || 0));
    const pVal         = parseFloat(purity) || 0.9167;
    const fine_weight  = net_weight * pVal;
    const base_value   = fine_weight * (parseFloat(rate) || 0);
    const deduction    = base_value * ((parseFloat(wastage_pct) || 0) / 100);
    const final_value  = Math.max(0, base_value - deduction);
    const tested_purity = `${(pVal * 100).toFixed(1)}%`;
    const desc = item_description || `${metal_type} Exchange (${tested_purity})`;

    const [result] = await db.query(
      `INSERT INTO gold_exchanges
       (exchange_no, customer_id, exchange_date, item_description, gross_weight, dust_stone_weight,
        stone_weight, net_weight, tested_purity, purity, fine_weight, rate, wastage_pct,
        base_value, deduction, final_value, valuation_amount, metal_type, exchange_for)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        exchange_no, effectiveCustId, exchange_date, desc, parseFloat(gross_weight) || 0,
        parseFloat(stone_weight) || 0, parseFloat(stone_weight) || 0, net_weight, tested_purity,
        String(purity || "0.9167"), fine_weight, parseFloat(rate) || 0, parseFloat(wastage_pct) || 0,
        base_value, deduction, final_value, final_value, metal_type, exchange_for || "New Purchase"
      ]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, exchange_no, final_value, fine_weight } });
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
