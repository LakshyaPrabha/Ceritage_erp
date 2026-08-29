/**
 * BaseCommunicationProvider
 * Abstract interface for all communication providers (SMS, WhatsApp, etc.)
 */
class BaseCommunicationProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Check if provider is enabled and configured with necessary credentials
   * @returns {{ enabled: boolean, configured: boolean, provider: string }}
   */
  getStatus() {
    throw new Error("getStatus() must be implemented by subclass");
  }

  /**
   * Send a template-based message
   * @param {Object} params - { recipient, templateId, templateCode, variables, language }
   * @returns {Promise<{ success: boolean, providerMessageId: string, status: string, response: any }>}
   */
  async sendTemplateMessage(params) {
    throw new Error("sendTemplateMessage() must be implemented by subclass");
  }

  /**
   * Send a plain text message (if supported)
   * @param {Object} params - { recipient, content }
   * @returns {Promise<{ success: boolean, providerMessageId: string, status: string, response: any }>}
   */
  async sendTextMessage(params) {
    throw new Error("sendTextMessage() must be implemented by subclass");
  }

  /**
   * Query delivery status for a message
   * @param {string} providerMessageId
   * @returns {Promise<{ status: string, raw: any }>}
   */
  async getDeliveryStatus(providerMessageId) {
    throw new Error("getDeliveryStatus() must be implemented by subclass");
  }
}

module.exports = BaseCommunicationProvider;
