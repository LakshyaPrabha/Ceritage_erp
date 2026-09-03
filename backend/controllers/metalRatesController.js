const metalRateService = require("../services/metalRateService");
const db = require("../config/db");

// ── GET /api/metal-rates/current ─────────────────────────────────────────────
async function getCurrent(req, res) {
  try {
    const data = await metalRateService.getCurrentRates();
    return res.json({
      success: true,
      ...data,
    });
  } catch (err) {
    console.error("metalRatesController.getCurrent error:", err.message);

    // Fallback query from gold_rates table
    try {
      const branchId = req.user?.branch_id || 1;
      const [rows] = await db.query(
        "SELECT * FROM gold_rates WHERE branch_id = ? OR branch_id IS NULL ORDER BY effective_date DESC, id DESC LIMIT 1",
        [branchId]
      );
      if (rows.length > 0) {
        const r = rows[0];
        return res.json({
          success: true,
          isAvailable: true,
          updatedAt: r.effective_date || r.created_at,
          updatedBy: r.updated_by || "Admin",
          liveMarket: {
            gold24K: parseFloat(r.rate_24k || 0),
            gold22K: parseFloat(r.rate_22k || 0),
            gold18K: parseFloat(r.rate_18k || 0),
            gold14K: parseFloat(r.rate_14k || 0),
            silver999: parseFloat(r.silver_rate || 0),
            platinum999: parseFloat(r.platinum_rate || 0),
            usdInr: parseFloat(r.usd_inr || 86.80),
          },
          shopSellingRates: {
            gold24K: { marketRatePerGram: parseFloat(r.rate_24k || 0), finalSellingRatePerGram: parseFloat(r.rate_24k || 0), shopAdjustmentPerGram: 0 },
            gold22K: { marketRatePerGram: parseFloat(r.rate_22k || 0), finalSellingRatePerGram: parseFloat(r.rate_22k || 0), shopAdjustmentPerGram: 0 },
            gold18K: { marketRatePerGram: parseFloat(r.rate_18k || 0), finalSellingRatePerGram: parseFloat(r.rate_18k || 0), shopAdjustmentPerGram: 0 },
            gold14K: { marketRatePerGram: parseFloat(r.rate_14k || 0), finalSellingRatePerGram: parseFloat(r.rate_14k || 0), shopAdjustmentPerGram: 0 },
            silver999: { marketRatePerGram: parseFloat(r.silver_rate || 0), finalSellingRatePerGram: parseFloat(r.silver_rate || 0), shopAdjustmentPerGram: 0 },
            platinum999: { marketRatePerGram: parseFloat(r.platinum_rate || 0), finalSellingRatePerGram: parseFloat(r.platinum_rate || 0), shopAdjustmentPerGram: 0 },
            palladium999: { marketRatePerGram: 0, finalSellingRatePerGram: 0, shopAdjustmentPerGram: 0 },
          },
        });
      }
    } catch { /* silent */ }

    return res.json({
      success: true,
      isAvailable: false,
      liveMarket: null,
      message: "Rates are loading or need sync. Click 'Refresh Market Rates' or enter today's rates in Manual Update tab.",
    });
  }
}

// ── GET /api/metal-rates/history ─────────────────────────────────────────────
async function getHistory(req, res) {
  try {
    const { days = 30 } = req.query;
    const branchId = req.user?.branch_id || 1;

    const [rows] = await db.query(
      `SELECT * FROM gold_rates
       WHERE (branch_id = ? OR branch_id IS NULL)
         AND effective_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY effective_date DESC, id DESC`,
      [branchId, parseInt(days, 10)]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/metal-rates/refresh ───────────────────────────────────────────
async function refreshRates(req, res) {
  try {
    const updatedBy = req.user?.username || req.user?.full_name || "Admin (Manual Sync)";
    const data = await metalRateService.refreshRates({ slot: "MANUAL", updatedBy, force: true });
    return res.json({
      success: true,
      message: "Market rates successfully refreshed from Metals.Dev!",
      data,
    });
  } catch (err) {
    console.error("refreshRates error:", err.message);
    const data = await metalRateService.getCurrentRates();
    return res.json({
      success: false,
      message: err.message,
      data,
    });
  }
}

// ── POST /api/metal-rates/adjustments ────────────────────────────────────────
async function updateAdjustments(req, res) {
  try {
    const { metal, purity, adjustmentPerGram } = req.body;
    const updatedBy = req.user?.username || "Admin";

    if (!metal || !purity) {
      return res.status(400).json({ success: false, message: "Metal and Purity are required." });
    }

    await metalRateService.updateShopAdjustment({ metal, purity, adjustmentPerGram, updatedBy });
    return res.json({ success: true, message: `Shop adjustment for ${metal} (${purity}) updated.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getCurrent, getHistory, refreshRates, updateAdjustments };
