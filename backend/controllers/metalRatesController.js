const metalRateService = require("../services/metalRateService");

// GET /api/metal-rates/current
async function getCurrent(req, res) {
  try {
    const data = await metalRateService.getCurrentRates();
    res.json(data);
  } catch (err) {
    console.error("Error fetching current metal rates:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/metal-rates/history
async function getHistory(req, res) {
  try {
    const { days = 30 } = req.query;
    const data = await metalRateService.getRateHistory({ days });
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error fetching rate history:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/metal-rates/refresh
async function refreshRates(req, res) {
  try {
    const updatedBy = req.user?.full_name || "Admin";

    try {
      const data = await metalRateService.refreshRates({ updatedBy });
      return res.json({
        success: true,
        message: "Rates successfully synchronized from Metals.Dev API",
        data,
      });
    } catch (apiErr) {
      console.warn("Metals.Dev sync failure, falling back to stored rates:", apiErr.message);
      const fallback = await metalRateService.getCurrentRates();

      return res.status(200).json({
        success: false,
        isFallback: true,
        message: `Could not reach Metals.Dev API (${apiErr.message}). Displaying last saved rate.`,
        data: fallback,
      });
    }
  } catch (err) {
    console.error("Error refreshing metal rates:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/metal-rates/adjustments
async function updateAdjustments(req, res) {
  try {
    const { adjustments } = req.body; // Array of { metal, purity, adjustmentPerGram }
    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return res.status(400).json({ success: false, message: "Array of adjustments is required" });
    }

    const updatedBy = req.user?.full_name || "Admin";
    for (const item of adjustments) {
      if (item.metal && item.purity) {
        await metalRateService.updateShopAdjustment({
          metal: item.metal,
          purity: item.purity,
          adjustmentPerGram: item.adjustmentPerGram || 0,
          updatedBy,
        });
      }
    }

    const updatedRates = await metalRateService.getCurrentRates();
    res.json({
      success: true,
      message: "Shop adjustments successfully saved",
      data: updatedRates,
    });
  } catch (err) {
    console.error("Error updating adjustments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getCurrent, getHistory, refreshRates, updateAdjustments };
