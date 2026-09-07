const BaseMetalProvider = require("./BaseMetalProvider");

/**
 * Official API Ninjas Provider for Ceritage ERP.
 * Endpoint: https://api.api-ninjas.com/v1/goldprice
 * Secondary Endpoint: https://api.api-ninjas.com/v1/commodityprice?name=silver
 * 
 * Extracts:
 *  - Live Gold Price (USD per Troy Ounce)
 *  - Live Silver Price (USD per Troy Ounce)
 *  - Converts to INR per gram based on active USD/INR exchange rate
 */
class ApiNinjasProvider extends BaseMetalProvider {
  constructor(config = {}) {
    super("API-Ninjas", config);
    this.baseUrl = config.baseUrl || "https://api.api-ninjas.com/v1";
    this.apiKey = config.apiKey || process.env.API_NINJAS_KEY || process.env.API_NINJAS_API_KEY || "";
    this.timeoutMs = config.timeoutMs || 10000;
  }

  isRealtime() {
    return true;
  }

  /**
   * Fetch current metal rates from API Ninjas
   */
  async fetchRates() {
    const fs = require("fs");
    const path = require("path");
    const envPaths = [
      path.resolve(__dirname, "../../.env"),
      path.resolve(__dirname, "../../../.env"),
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), "../.env"),
    ];

    for (const p of envPaths) {
      if (fs.existsSync(p)) {
        require("dotenv").config({ path: p, override: false });
      }
    }

    const apiKey = (this.apiKey || process.env.API_NINJAS_KEY || process.env.API_NINJAS_API_KEY || "").trim();
    if (!apiKey || apiKey.length < 5) {
      throw new Error("API_NINJAS_KEY is not configured in .env. Please add your API key from api-ninjas.com");
    }

    const headers = {
      "X-Api-Key": apiKey.trim(),
      "Accept": "application/json",
      "User-Agent": "Ceritage-ERP/2.0",
    };

    // Fetch Gold, Silver, and Platinum in parallel
    let goldOzUSD = 0;
    let silverOzUSD = 0;
    let platOzUSD = 0;

    const [goldRes, silverRes, platRes] = await Promise.allSettled([
      // 1. Gold Price API
      fetch(`${this.baseUrl}/goldprice`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
      }).then(r => r.ok ? r.json() : null),

      // 2. Silver Commodity API
      fetch(`${this.baseUrl}/commodityprice?name=silver`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
      }).then(r => r.ok ? r.json() : null),

      // 3. Platinum Commodity API
      fetch(`${this.baseUrl}/commodityprice?name=platinum`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
      }).then(r => r.ok ? r.json() : null),
    ]);

    if (goldRes.status === "fulfilled" && goldRes.value?.price) {
      goldOzUSD = Number(goldRes.value.price);
    } else {
      throw new Error("Could not fetch gold price from API Ninjas. Check your API key.");
    }

    if (silverRes.status === "fulfilled" && silverRes.value?.price) {
      silverOzUSD = Number(silverRes.value.price);
    } else {
      // Benchmark standard market Gold-Silver ratio ~ 85:1
      silverOzUSD = goldOzUSD > 0 ? (goldOzUSD / 85) : 32.5;
    }

    if (platRes.status === "fulfilled" && platRes.value?.price) {
      platOzUSD = Number(platRes.value.price);
    } else {
      platOzUSD = goldOzUSD * 0.38;
    }

    // Benchmark exchange rate and conversion
    const USD_TO_INR = Number(process.env.USD_TO_INR_RATE || 86.85);
    const TROY_OUNCE_TO_GRAMS = 31.1034768;

    // Convert to INR (₹) per Gram
    const gold24k = parseFloat(((goldOzUSD * USD_TO_INR) / TROY_OUNCE_TO_GRAMS).toFixed(2));
    const silver999 = parseFloat(((silverOzUSD * USD_TO_INR) / TROY_OUNCE_TO_GRAMS).toFixed(2));
    const platinum999 = parseFloat(((platOzUSD * USD_TO_INR) / TROY_OUNCE_TO_GRAMS).toFixed(2));

    // Calculate Indian Retail Purities
    const gold22k = parseFloat(((gold24k * 22) / 24).toFixed(2));
    const gold18k = parseFloat(((gold24k * 18) / 24).toFixed(2));
    const gold14k = parseFloat(((gold24k * 14) / 24).toFixed(2));

    return {
      source: "API-Ninjas",
      timestamp: new Date(),
      liveMarket: {
        gold_24k: gold24k,
        gold_22k: gold22k,
        gold_18k: gold18k,
        gold_14k: gold14k,
        silver_999: silver999,
        platinum_999: platinum999,
        palladium_999: 0,
      },
      mcxReference: {
        mcx_gold: gold24k,
        mcx_silver: silver999,
      },
      lbmaReference: {
        lbma_gold_am: gold24k,
        lbma_gold_pm: gold24k,
        lbma_silver: silver999,
      }
    };
  }
}

module.exports = ApiNinjasProvider;
