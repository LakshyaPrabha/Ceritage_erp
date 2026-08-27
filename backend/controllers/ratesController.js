const db = require("../config/db");

async function getCurrent(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM gold_rates ORDER BY effective_date DESC, created_at DESC LIMIT 1"
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getHistory(req, res) {
  try {
    const { days = 30 } = req.query;
    const [rows] = await db.query(
      `SELECT * FROM gold_rates WHERE effective_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY effective_date DESC`,
      [parseInt(days)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateRates(req, res) {
  const { rate_22k, rate_24k, rate_18k, rate_14k, silver_rate, platinum_rate, usd_inr, effective_date, remarks } = req.body;
  if (!rate_22k || !rate_24k) {
    return res.status(400).json({ success: false, message: "rate_22k and rate_24k required" });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO gold_rates (rate_22k, rate_24k, rate_18k, rate_14k, silver_rate, platinum_rate, usd_inr, effective_date, updated_by, remarks)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [rate_22k, rate_24k, rate_18k || null, rate_14k || null, silver_rate || null, platinum_rate || null, usd_inr || null, effective_date || new Date().toISOString().split("T")[0], req.user.full_name || "Admin", remarks || null]
    );
    res.json({ success: true, message: "Rates updated", data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getCurrent, getHistory, updateRates };
