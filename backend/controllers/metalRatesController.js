// metalRatesController.js — uses our gold_rates table directly
const db = require("../config/db");

// GET /api/metal-rates/current
async function getCurrent(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const [rows] = await db.query(
      `SELECT * FROM gold_rates WHERE branch_id = ?
       ORDER BY effective_date DESC, created_at DESC LIMIT 1`,
      [branch_id]
    );

    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        isAvailable: false,
        liveMarket: null,
        message: "No rates entered yet. Please update rates from Gold & Silver Rates module.",
      });
    }

    const r = rows[0];
    return res.json({
      success:     true,
      isAvailable: true,
      updatedAt:   r.effective_date,
      updatedBy:   r.updated_by,
      liveMarket: {
        gold24K:      parseFloat(r.rate_24k     || 0),
        gold22K:      parseFloat(r.rate_22k     || 0),
        gold18K:      parseFloat(r.rate_18k     || 0),
        gold14K:      parseFloat(r.rate_14k     || 0),
        silver999:    parseFloat(r.silver_rate  || 0),
        platinum999:  parseFloat(r.platinum_rate|| 0),
        usdInr:       parseFloat(r.usd_inr      || 0),
      },
      selling: {
        rate_22k:      parseFloat(r.rate_22k     || 0),
        rate_24k:      parseFloat(r.rate_24k     || 0),
        rate_18k:      parseFloat(r.rate_18k     || 0),
        rate_14k:      parseFloat(r.rate_14k     || 0),
        silver_rate:   parseFloat(r.silver_rate  || 0),
        platinum_rate: parseFloat(r.platinum_rate|| 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/metal-rates/history
async function getHistory(req, res) {
  const branch_id = req.user.branch_id;
  try {
    const { days = 30 } = req.query;
    const [rows] = await db.query(
      `SELECT * FROM gold_rates
       WHERE branch_id = ? AND effective_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY effective_date DESC`,
      [branch_id, parseInt(days)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/metal-rates/refresh — just returns current rates
async function refreshRates(req, res) {
  return getCurrent(req, res);
}

// POST /api/metal-rates/adjustments — no-op for now
async function updateAdjustments(req, res) {
  res.json({ success: true, message: "Adjustments noted." });
}

module.exports = { getCurrent, getHistory, refreshRates, updateAdjustments };
