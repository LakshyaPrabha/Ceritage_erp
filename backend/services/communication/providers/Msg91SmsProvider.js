const BaseCommunicationProvider = require("./BaseCommunicationProvider");

class Msg91SmsProvider extends BaseCommunicationProvider {
  constructor() {
    super("MSG91");
  }

  getStatus() {
    require("dotenv").config({ override: true });
    const enabled = process.env.MSG91_ENABLED === "true";
    const authKey = process.env.MSG91_AUTH_KEY || "";
    const senderId = process.env.MSG91_SENDER_ID || "";
    const configured = Boolean(authKey && authKey.length > 5);

    return {
      provider: "MSG91",
      channel: "SMS",
      enabled,
      configured,
      senderId: senderId ? `${senderId.slice(0, 2)}***` : "Not Set",
      testMode: process.env.COMMUNICATION_TEST_MODE !== "false"
    };
  }

  /**
   * Send SMS using MSG91 Flow / Template API
   */
  async sendTemplateMessage({ recipient, templateId, templateCode, variables = {}, language = "en" }) {
    const status = this.getStatus();
    const isTestMode = process.env.COMMUNICATION_TEST_MODE === "true";

    if (!status.enabled && !isTestMode) {
      return {
        success: false,
        status: "DISABLED",
        message: "MSG91 SMS provider is disabled in configuration"
      };
    }

    // Clean phone number (strip +91, non-digits, ensure 10 digits for India)
    const cleanedNumber = String(recipient).replace(/\D/g, "").slice(-10);
    if (cleanedNumber.length !== 10) {
      return {
        success: false,
        status: "FAILED",
        errorCode: "INVALID_NUMBER",
        message: `Invalid 10-digit mobile number: ${recipient}`
      };
    }

    const countryCode = process.env.MSG91_COUNTRY_CODE || "91";
    const fullMobile = `${countryCode}${cleanedNumber}`;
    const flowTemplateId = templateId || templateCode;

    // Test Mode Emulation
    if (isTestMode) {
      const mockMsgId = `TEST-MSG91-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      return {
        success: true,
        status: "SENT",
        isTest: true,
        providerMessageId: mockMsgId,
        recipient: fullMobile,
        message: `[TEST MODE] Mock MSG91 SMS dispatched successfully for flow: ${flowTemplateId}`
      };
    }

    if (!status.configured) {
      return {
        success: false,
        status: "FAILED",
        errorCode: "NOT_CONFIGURED",
        message: "MSG91 auth key is missing from environment"
      };
    }

    try {
      const payload = {
        template_id: flowTemplateId,
        short_url: "0",
        recipients: [
          {
            mobiles: fullMobile,
            ...variables
          }
        ]
      };

      const response = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          "authkey": process.env.MSG91_AUTH_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.type === "success") {
        return {
          success: true,
          status: "SENT",
          isTest: false,
          providerMessageId: data.message || `MSG91-${Date.now()}`,
          recipient: fullMobile,
          response: data
        };
      } else {
        return {
          success: false,
          status: "FAILED",
          errorCode: data.code || "MSG91_API_ERROR",
          message: data.message || "Failed to dispatch SMS via MSG91 flow API",
          response: data
        };
      }
    } catch (err) {
      return {
        success: false,
        status: "FAILED",
        errorCode: "NETWORK_ERROR",
        message: `MSG91 request error: ${err.message}`
      };
    }
  }

  async sendTextMessage({ recipient, content }) {
    // MSG91 in India mandates DLT templates. Fallback to generic message template if called.
    return this.sendTemplateMessage({
      recipient,
      templateId: process.env.MSG91_GENERAL_TEMPLATE_ID || "GENERIC_DLT",
      variables: { message: content }
    });
  }

  async getDeliveryStatus(providerMessageId) {
    if (!providerMessageId || providerMessageId.startsWith("TEST-")) {
      return { status: "DELIVERED", raw: { mock: true } };
    }
    // Webhook delivers asynchronous status updates
    return { status: "SENT", raw: { messageId: providerMessageId } };
  }
}

module.exports = Msg91SmsProvider;
