const db = require("../config/db");

// ── GET /api/rates/current ────────────────────────────────────────────────────
async function getCurrent(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [rows] = await db.query(
      `SELECT * FROM gold_rates
       WHERE branch_id = ?
       ORDER BY effective_date DESC, created_at DESC
       LIMIT 1`,
      [branch_id]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/rates/history ────────────────────────────────────────────────────
async function getHistory(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const { days = 30 } = req.query;
    const [rows] = await db.query(
      `SELECT * FROM gold_rates
       WHERE branch_id = ?
         AND effective_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY effective_date DESC`,
      [branch_id, parseInt(days)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/rates ───────────────────────────────────────────────────────────
async function updateRates(req, res) {
  const branch_id = req.user.branch_id;
  const {
    rate_22k, rate_24k, rate_18k, rate_14k,
    silver_rate, platinum_rate, usd_inr,
    effective_date, remarks,
  } = req.body;

  if (!rate_22k || !rate_24k) {
    return res.status(400).json({ success: false, message: "22K and 24K gold rates are required." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO gold_rates
         (branch_id, rate_22k, rate_24k, rate_18k, rate_14k,
          silver_rate, platinum_rate, usd_inr,
          effective_date, updated_by, remarks)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        branch_id,
        parseFloat(rate_22k),
        parseFloat(rate_24k),
        rate_18k     ? parseFloat(rate_18k)     : null,
        rate_14k     ? parseFloat(rate_14k)     : null,
        silver_rate  ? parseFloat(silver_rate)  : null,
        platinum_rate? parseFloat(platinum_rate): null,
        usd_inr      ? parseFloat(usd_inr)      : null,
        effective_date || new Date().toISOString().split("T")[0],
        req.user.full_name || req.user.username || "Admin",
        remarks || null,
      ]
    );
    res.json({ success: true, message: "Rates updated successfully.", data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getCurrent, getHistory, updateRates };
