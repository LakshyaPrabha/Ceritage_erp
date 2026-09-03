const BaseMetalProvider = require("./BaseMetalProvider");

/**
 * Official Metals.Dev Provider for Ceritage ERP.
 * Endpoint: https://api.metals.dev/v1/latest
 * Parameters: currency=INR, unit=g
 * 
 * Extracts:
 *  - Live Market: gold, silver, platinum, palladium
 *  - MCX Reference: mcx_gold, mcx_gold_am, mcx_gold_pm, mcx_silver, mcx_silver_am, mcx_silver_pm
 *  - LBMA Reference: lbma_gold_am/pm, lbma_silver, lbma_platinum_am/pm, lbma_palladium_am/pm
 * 
 * Explicitly ignores: ibja_gold, ibja_silver
 */
class MetalsDevProvider extends BaseMetalProvider {
  constructor(config = {}) {
    super("Metals.Dev", config);
    this.baseUrl = config.baseUrl || "https://api.metals.dev/v1/latest";
    this.apiKey = config.apiKey || process.env.METALS_DEV_API_KEY || "";
    this.timeoutMs = config.timeoutMs || 10000;
  }

  isRealtime() {
    return true;
  }

  /**
   * Fetch current metal rates from Metals.Dev
   */
  async fetchRates() {
    require("dotenv").config();
    require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
    require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

    const apiKey = this.apiKey || process.env.METALS_DEV_API_KEY || "";
    if (!apiKey) {
      throw new Error("METALS_DEV_API_KEY is not configured. Please paste your free key in .env");
    }

    const url = new URL(this.baseUrl);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("currency", "INR");
    url.searchParams.set("unit", "g");

    let response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "Ceritage-ERP/2.0",
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (netErr) {
      if (netErr.name === "TimeoutError" || netErr.name === "AbortError") {
        throw new Error(`Metals.Dev API connection timed out after ${this.timeoutMs}ms.`);
      }
      throw new Error(`Metals.Dev API network error: ${netErr.message}`);
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Metals.Dev API authentication failed: Invalid API key.");
      }
      if (response.status === 429) {
        throw new Error("Metals.Dev API rate limit exceeded. Please check your monthly quota.");
      }
      throw new Error(`Metals.Dev API responded with HTTP status ${response.status}.`);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error("Invalid JSON response received from Metals.Dev API.");
    }

    if (payload.status === "failure" || payload.error) {
      throw new Error(`Metals.Dev API error: ${payload.error?.message || payload.msg || "Unknown error"}`);
    }

    const metals = payload.metals || payload.data || {};
    const timestamp = payload.timestamps ? new Date(payload.timestamps.metal) : (payload.timestamp ? new Date(payload.timestamp * 1000) : new Date());

    return this._normalize(metals, timestamp);
  }

  /**
   * Normalize response into Live Market, MCX Reference, and LBMA Reference
   */
  _normalize(metals, timestamp) {
    // 1. Live Market base rates
    const gold24k = metals.gold ? Number(metals.gold) : 0;
    const gold22k = gold24k > 0 ? parseFloat(((gold24k * 22) / 24).toFixed(2)) : 0;
    const gold18k = gold24k > 0 ? parseFloat(((gold24k * 18) / 24).toFixed(2)) : 0;
    const gold14k = gold24k > 0 ? parseFloat(((gold24k * 14) / 24).toFixed(2)) : 0;

    const silver999 = metals.silver ? Number(metals.silver) : 0;
    const platinum999 = metals.platinum ? Number(metals.platinum) : 0;
    const palladium999 = metals.palladium ? Number(metals.palladium) : 0;

    // 2. MCX Reference rates (from Metals.Dev)
    const mcxGold = metals.mcx_gold ? Number(metals.mcx_gold) : null;
    const mcxGoldAm = metals.mcx_gold_am ? Number(metals.mcx_gold_am) : null;
    const mcxGoldPm = metals.mcx_gold_pm ? Number(metals.mcx_gold_pm) : null;
    const mcxSilver = metals.mcx_silver ? Number(metals.mcx_silver) : null;
    const mcxSilverAm = metals.mcx_silver_am ? Number(metals.mcx_silver_am) : null;
    const mcxSilverPm = metals.mcx_silver_pm ? Number(metals.mcx_silver_pm) : null;

    // 3. LBMA Reference rates (from Metals.Dev)
    const lbmaGoldAm = metals.lbma_gold_am ? Number(metals.lbma_gold_am) : null;
    const lbmaGoldPm = metals.lbma_gold_pm ? Number(metals.lbma_gold_pm) : null;
    const lbmaSilver = metals.lbma_silver ? Number(metals.lbma_silver) : null;
    const lbmaPlatinumAm = metals.lbma_platinum_am ? Number(metals.lbma_platinum_am) : null;
    const lbmaPlatinumPm = metals.lbma_platinum_pm ? Number(metals.lbma_platinum_pm) : null;
    const lbmaPalladiumAm = metals.lbma_palladium_am ? Number(metals.lbma_palladium_am) : null;
    const lbmaPalladiumPm = metals.lbma_palladium_pm ? Number(metals.lbma_palladium_pm) : null;

    // Notice: ibja_gold and ibja_silver are explicitly NOT read or returned.

    return {
      source: "Metals.Dev",
      currency: "INR",
      unit: "g",
      timestamp,
      liveMarket: {
        gold24K: gold24k,
        gold22K: gold22k,
        gold18K: gold18k,
        gold14K: gold14k,
        silver999: silver999,
        platinum999: platinum999,
        palladium999: palladium999,
      },
      mcxReference: {
        gold: mcxGold,
        goldAM: mcxGoldAm,
        goldPM: mcxGoldPm,
        silver: mcxSilver,
        silverAM: mcxSilverAm,
        silverPM: mcxSilverPm,
      },
      lbmaReference: {
        goldAM: lbmaGoldAm,
        goldPM: lbmaGoldPm,
        silver: lbmaSilver,
        platinumAM: lbmaPlatinumAm,
        platinumPM: lbmaPlatinumPm,
        palladiumAM: lbmaPalladiumAm,
        palladiumPM: lbmaPalladiumPm,
      },
    };
  }
}

module.exports = MetalsDevProvider;
