/**
 * Abstract Base Class for Metal Price Providers.
 * Ensures consistent interface across market providers (Metals.Dev).
 */
class BaseMetalProvider {
  constructor(name, options = {}) {
    if (new.target === BaseMetalProvider) {
      throw new TypeError("Cannot construct BaseMetalProvider instances directly");
    }
    this.name = name;
    this.options = options;
  }

  /**
   * Fetch market rates
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async fetchRates(params = {}) {
    throw new Error(`fetchRates() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Returns whether this provider offers real-time/latest data
   * @returns {boolean}
   */
  isRealtime() {
    return true;
  }
}

module.exports = BaseMetalProvider;
