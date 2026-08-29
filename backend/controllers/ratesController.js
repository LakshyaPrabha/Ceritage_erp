const db = require("../config/db");
const metalRateService = require("../services/metalRateService");

// Legacy support: GET /api/rates/current
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

// Legacy support: GET /api/rates/history
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

// POST /api/rates (Manual update)
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
    const updatedBy = req.user?.full_name || "Admin";
    const [result] = await db.query(
      `INSERT INTO gold_rates (rate_22k, rate_24k, rate_18k, rate_14k, silver_rate, platinum_rate, usd_inr, effective_date, updated_by, remarks)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [rate_22k, rate_24k, rate_18k || null, rate_14k || null, silver_rate || null, platinum_rate || null, usd_inr || null, effective_date || new Date().toISOString().split("T")[0], updatedBy, remarks || "Manual Market Update"]
    );

    // Also update current live market records
    const r24 = Number(rate_24k);
    const r22 = Number(rate_22k);
    const r18 = rate_18k ? Number(rate_18k) : parseFloat(((r24 * 18) / 24).toFixed(2));
    const r14 = rate_14k ? Number(rate_14k) : parseFloat(((r24 * 14) / 24).toFixed(2));
    const rSil = silver_rate ? Number(silver_rate) : 0;
    const rPlat = platinum_rate ? Number(platinum_rate) : 0;

    await metalRateService.saveRates({
      source: "Manual",
      liveMarket: {
        gold24K: r24,
        gold22K: r22,
        gold18K: r18,
        gold14K: r14,
        silver999: rSil,
        platinum999: rPlat,
        palladium999: 0,
      },
    }, updatedBy);

    res.json({ success: true, message: "Metal rates updated", data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/rates/sync (Delegated to Metals.Dev refresh)
async function syncMarketRates(req, res) {
  try {
    const updatedBy = req.user?.full_name || "Admin";
    const data = await metalRateService.refreshRates({ updatedBy });
    res.json({
      success: true,
      message: "Rates successfully synchronized from Metals.Dev API",
      data,
    });
  } catch (err) {
    console.error("Metals.Dev sync error:", err.message);
    const fallback = await metalRateService.getCurrentRates();
    res.status(200).json({
      success: false,
      isFallback: true,
      message: `Could not reach Metals.Dev API (${err.message}). Displaying last saved rate.`,
      data: fallback,
    });
  }
}

module.exports = { getCurrent, getHistory, updateRates, syncMarketRates };
