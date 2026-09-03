const db = require("../config/db");
const MetalsDevProvider = require("./providers/MetalsDevProvider");

class MetalRateService {
  constructor() {
    this.provider = new MetalsDevProvider();
  }

  /**
   * Get daily API sync status and quota usage for today
   */
  async getDailySyncStatus() {
    try {
      const dailyLimit = parseInt(process.env.METALS_DEV_DAILY_REQUEST_LIMIT || "2", 10);
      const [rows] = await db.query(
        `SELECT slot, status, created_at
         FROM api_sync_logs
         WHERE DATE(created_at) = CURDATE() AND provider = 'Metals.Dev'`
      );

      const successfulCalls = rows.filter(r => r.status === "SUCCESS");
      const requestsToday = successfulCalls.length;
      const daySlotCompleted = rows.some(r => r.slot === "DAY" && r.status === "SUCCESS");
      const eveningSlotCompleted = rows.some(r => r.slot === "EVENING" && r.status === "SUCCESS");

      return {
        dailyLimit,
        requestsToday,
        remainingRequests: Math.max(0, dailyLimit - requestsToday),
        canRequest: requestsToday < dailyLimit,
        daySlotCompleted,
        eveningSlotCompleted,
        daySlotTime: process.env.METALS_DEV_DAY_TIME || "10:30",
        eveningSlotTime: process.env.METALS_DEV_EVENING_TIME || "18:30",
        lastSync: rows.length > 0 ? rows[rows.length - 1] : null,
      };
    } catch (err) {
      console.error("Error reading daily sync status:", err.message);
      return {
        dailyLimit: 2,
        requestsToday: 0,
        remainingRequests: 2,
        canRequest: true,
        daySlotCompleted: false,
        eveningSlotCompleted: false,
        daySlotTime: "10:30",
        eveningSlotTime: "18:30",
      };
    }
  }

  /**
   * Log an API sync attempt to the database
   */
  async logSyncAttempt({ slot = "MANUAL", status = "SUCCESS", message = "" } = {}) {
    try {
      await db.query(
        `INSERT INTO api_sync_logs (provider, slot, status, message)
         VALUES ('Metals.Dev', ?, ?, ?)`,
        [slot, status, message]
      );
    } catch (err) {
      console.warn("Could not log sync attempt:", err.message);
    }
  }

  /**
   * Fetch all shop adjustments map: key `${metal}_${purity}` -> number
   */
  async getShopAdjustments() {
    try {
      const [rows] = await db.query("SELECT metal, purity, adjustment_per_gram FROM shop_metal_adjustments");
      const map = {};
      for (const r of rows) {
        map[`${r.metal}_${r.purity}`] = Number(r.adjustment_per_gram || 0);
      }
      return map;
    } catch (err) {
      console.error("Error reading shop adjustments:", err.message);
      return {};
    }
  }

  /**
   * Update shop adjustment for a metal/purity
   */
  async updateShopAdjustment({ metal, purity, adjustmentPerGram, updatedBy = "Admin" }) {
    await db.query(
      `INSERT INTO shop_metal_adjustments (metal, purity, adjustment_per_gram, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE adjustment_per_gram = VALUES(adjustment_per_gram), updated_by = VALUES(updated_by)`,
      [metal.toUpperCase(), String(purity), Number(adjustmentPerGram || 0), updatedBy]
    );
  }

  /**
   * Save a set of normalized Metals.Dev rates into database
   */
  async saveRates(normalizedData, updatedBy = "Metals.Dev Sync") {
    if (!normalizedData || !normalizedData.liveMarket) return;

    const { liveMarket, mcxReference, lbmaReference, timestamp } = normalizedData;
    const sourceTimestamp = timestamp || new Date();

    const insertRecord = async (metal, purity, pricePerGram, rateType, sourceUnit = "1G", sourcePrice = null) => {
      if (pricePerGram === null || pricePerGram === undefined || isNaN(pricePerGram) || pricePerGram <= 0) return;
      await db.query(
        `INSERT INTO metal_benchmark_rates
         (metal, purity, source, source_price, source_unit, price_per_gram, rate_type, source_timestamp, fetched_at)
         VALUES (?, ?, 'Metals.Dev', ?, ?, ?, ?, ?, NOW())`,
        [
          metal,
          String(purity),
          sourcePrice !== null ? sourcePrice : pricePerGram,
          sourceUnit,
          pricePerGram,
          rateType,
          sourceTimestamp,
        ]
      );
    };

    // 1. Save Live Market Rates
    await insertRecord("GOLD", "999", liveMarket.gold24K, "LIVE_MARKET");
    await insertRecord("GOLD", "916", liveMarket.gold22K, "LIVE_MARKET");
    await insertRecord("GOLD", "750", liveMarket.gold18K, "LIVE_MARKET");
    await insertRecord("GOLD", "585", liveMarket.gold14K, "LIVE_MARKET");
    await insertRecord("SILVER", "999", liveMarket.silver999, "LIVE_MARKET");
    await insertRecord("PLATINUM", "999", liveMarket.platinum999, "LIVE_MARKET");
    await insertRecord("PALLADIUM", "999", liveMarket.palladium999, "LIVE_MARKET");

    // 2. Save MCX Reference Rates (if present)
    if (mcxReference) {
      if (mcxReference.gold) await insertRecord("GOLD", "MCX", mcxReference.gold, "MCX_REFERENCE");
      if (mcxReference.silver) await insertRecord("SILVER", "MCX", mcxReference.silver, "MCX_REFERENCE");
    }

    // 3. Save LBMA Reference Rates (if present)
    if (lbmaReference) {
      if (lbmaReference.goldPM || lbmaReference.goldAM) {
        await insertRecord("GOLD", "LBMA_PM", lbmaReference.goldPM || lbmaReference.goldAM, "LBMA_REFERENCE");
      }
      if (lbmaReference.silver) {
        await insertRecord("SILVER", "LBMA", lbmaReference.silver, "LBMA_REFERENCE");
      }
    }

    // 4. Keep legacy gold_rates table in sync for backward compatibility
    try {
      if (liveMarket.gold24K > 0 && liveMarket.gold22K > 0) {
        await db.query(
          `INSERT INTO gold_rates
           (rate_22k, rate_24k, rate_18k, rate_14k, silver_rate, platinum_rate, usd_inr, effective_date, updated_by, remarks)
           VALUES (?, ?, ?, ?, ?, ?, 86.80, CURDATE(), ?, ?)`,
          [
            liveMarket.gold22K,
            liveMarket.gold24K,
            liveMarket.gold18K || null,
            liveMarket.gold14K || null,
            liveMarket.silver999 || null,
            liveMarket.platinum999 || null,
            updatedBy,
            "Metals.Dev Live Market Feed"
          ]
        );
      }
    } catch (legacyErr) {
      console.warn("Legacy gold_rates sync notice:", legacyErr.message);
    }
  }

  /**
   * Get the latest rates stored in database
   */
  async getLatestStoredRates() {
    const [rows] = await db.query(
      `SELECT r.*
       FROM metal_benchmark_rates r
       INNER JOIN (
         SELECT metal, purity, rate_type, MAX(id) AS max_id
         FROM metal_benchmark_rates
         GROUP BY metal, purity, rate_type
       ) latest ON r.id = latest.max_id
       ORDER BY r.created_at DESC`
    );
    return rows;
  }

  /**
   * Refresh rates by fetching from Metals.Dev with strict 2 requests/day limit
   * @param {Object} opts - { slot: 'DAY' | 'EVENING' | 'MANUAL', updatedBy, force }
   */
  async refreshRates({ slot = "MANUAL", updatedBy = "Admin", force = false } = {}) {
    const quota = await this.getDailySyncStatus();

    // Check if slot was already executed today
    if (slot === "DAY" && quota.daySlotCompleted && !force) {
      console.log("[Metals.Dev Sync] Day slot rate was already fetched today. Skipping external API call.");
      return this.getCurrentRates();
    }
    if (slot === "EVENING" && quota.eveningSlotCompleted && !force) {
      console.log("[Metals.Dev Sync] Evening slot rate was already fetched today. Skipping external API call.");
      return this.getCurrentRates();
    }

    // Check daily limit (2 requests/day)
    if (!quota.canRequest && !force) {
      throw new Error(
        `Daily request limit (${quota.dailyLimit} requests/day) reached for today. Market rates for today are already saved in the database.`
      );
    }

    try {
      const normalizedData = await this.provider.fetchRates();
      await this.saveRates(normalizedData, `${updatedBy} (${slot})`);
      await this.logSyncAttempt({ slot, status: "SUCCESS", message: "Rates fetched successfully" });
      return this.getCurrentRates();
    } catch (err) {
      await this.logSyncAttempt({ slot, status: "FAILED", message: err.message });
      throw err;
    }
  }

  /**
   * Get current structured rates response combining Metals.Dev live market,
   * MCX reference, LBMA reference, shop adjustments, and daily quota status.
   */
  async getCurrentRates() {
    let stored = await this.getLatestStoredRates();
    const adjustments = await this.getShopAdjustments();
    const quotaStatus = await this.getDailySyncStatus();

    let updatedAt = null;
    let isStale = false;
    let source = "Metals.Dev";

    // If metal_benchmark_rates is empty, check legacy gold_rates table
    if (stored.length === 0) {
      try {
        const [legacyRows] = await db.query("SELECT * FROM gold_rates ORDER BY effective_date DESC, id DESC LIMIT 1");
        if (legacyRows.length > 0) {
          const lr = legacyRows[0];
          stored = [
            { metal: "GOLD", purity: "999", rate_type: "LIVE_MARKET", price_per_gram: Number(lr.rate_24k || 0), created_at: lr.effective_date },
            { metal: "GOLD", purity: "916", rate_type: "LIVE_MARKET", price_per_gram: Number(lr.rate_22k || 0), created_at: lr.effective_date },
            { metal: "GOLD", purity: "750", rate_type: "LIVE_MARKET", price_per_gram: Number(lr.rate_18k || 0), created_at: lr.effective_date },
            { metal: "GOLD", purity: "585", rate_type: "LIVE_MARKET", price_per_gram: Number(lr.rate_14k || 0), created_at: lr.effective_date },
            { metal: "SILVER", purity: "999", rate_type: "LIVE_MARKET", price_per_gram: Number(lr.silver_rate || 0), created_at: lr.effective_date },
            { metal: "PLATINUM", purity: "999", rate_type: "LIVE_MARKET", price_per_gram: Number(lr.platinum_rate || 0), created_at: lr.effective_date },
            { metal: "PALLADIUM", purity: "999", rate_type: "LIVE_MARKET", price_per_gram: 0, created_at: lr.effective_date },
          ];
          updatedAt = lr.effective_date || lr.created_at;
        }
      } catch (err) {
        console.warn("Legacy rates fallback check:", err.message);
      }
    }

    if (stored.length > 0 && !updatedAt) {
      updatedAt = stored[0].fetched_at || stored[0].created_at;
      if (updatedAt && (new Date() - new Date(updatedAt) > 16 * 60 * 60 * 1000)) {
        isStale = true;
      }
    }

    const getRateData = (metal, purity, rateType = "LIVE_MARKET") => {
      const row = stored.find(
        r => r.metal === metal && String(r.purity) === String(purity) && r.rate_type === rateType
      );
      const marketPrice = row ? Number(row.price_per_gram) : 0;
      const adjKey = `${metal}_${purity}`;
      const adjustment = adjustments[adjKey] !== undefined ? adjustments[adjKey] : 0;
      const sellingPrice = marketPrice > 0 ? parseFloat((marketPrice + adjustment).toFixed(2)) : 0;

      return {
        purity: String(purity),
        marketPricePerGram: marketPrice,
        shopAdjustmentPerGram: adjustment,
        sellingPricePerGram: sellingPrice,
      };
    };

    const getRawReference = (metal, purity, rateType) => {
      const row = stored.find(
        r => r.metal === metal && String(r.purity) === String(purity) && r.rate_type === rateType
      );
      return row ? Number(row.price_per_gram) : 0;
    };

    const g24 = getRateData("GOLD", "999");
    const g22 = getRateData("GOLD", "916");
    const g18 = getRateData("GOLD", "750");
    const g14 = getRateData("GOLD", "585");
    const sil = getRateData("SILVER", "999");
    const plat = getRateData("PLATINUM", "999");
    const pal = getRateData("PALLADIUM", "999");

    const isAvailable = g24.marketPricePerGram > 0 || sil.marketPricePerGram > 0;

    return {
      success: true,
      source: "Metals.Dev",
      currency: "INR",
      unit: "g",
      updatedAt,
      isStale,
      isAvailable,
      quotaStatus,

      liveMarket: {
        gold24K: g24.marketPricePerGram,
        gold22K: g22.marketPricePerGram,
        gold18K: g18.marketPricePerGram,
        gold14K: g14.marketPricePerGram,
        silver999: sil.marketPricePerGram,
        platinum999: plat.marketPricePerGram,
        palladium999: pal.marketPricePerGram,
      },

      shopSellingRates: {
        gold24K: g24,
        gold22K: g22,
        gold18K: g18,
        gold14K: g14,
        silver999: sil,
        platinum999: plat,
        palladium999: pal,
      },

      mcxReference: {
        gold: getRawReference("GOLD", "MCX", "MCX_REFERENCE"),
        silver: getRawReference("SILVER", "MCX", "MCX_REFERENCE"),
      },

      lbmaReference: {
        goldAM: getRawReference("GOLD", "LBMA_AM", "LBMA_REFERENCE"),
        goldPM: getRawReference("GOLD", "LBMA_PM", "LBMA_REFERENCE"),
        silver: getRawReference("SILVER", "LBMA", "LBMA_REFERENCE"),
        platinumAM: getRawReference("PLATINUM", "LBMA_AM", "LBMA_REFERENCE"),
        platinumPM: getRawReference("PLATINUM", "LBMA_PM", "LBMA_REFERENCE"),
        palladiumAM: getRawReference("PALLADIUM", "LBMA_AM", "LBMA_REFERENCE"),
        palladiumPM: getRawReference("PALLADIUM", "LBMA_PM", "LBMA_REFERENCE"),
      },
    };
  }

  /**
   * Get historical audit rate records
   */
  async getRateHistory({ days = 30 } = {}) {
    const [rows] = await db.query(
      `SELECT * FROM metal_benchmark_rates
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY created_at DESC, id DESC`,
      [parseInt(days) || 30]
    );
    return rows;
  }
}

module.exports = new MetalRateService();
