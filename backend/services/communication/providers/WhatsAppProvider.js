const BaseCommunicationProvider = require("./BaseCommunicationProvider");

class WhatsAppProvider extends BaseCommunicationProvider {
  constructor() {
    super("WhatsApp");
  }

  getStatus() {
    require("dotenv").config({ override: true });
    const enabled = process.env.WHATSAPP_ENABLED === "true";
    const providerName = process.env.WHATSAPP_PROVIDER || "Meta Cloud API";
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    const configured = Boolean(accessToken && accessToken.length > 10 && phoneId);

    return {
      provider: providerName,
      channel: "WHATSAPP",
      enabled,
      configured,
      phoneId: phoneId ? `${phoneId.slice(0, 4)}***` : "Not Set",
      testMode: process.env.COMMUNICATION_TEST_MODE !== "false"
    };
  }

  async sendTemplateMessage({ recipient, templateId, templateCode, variables = {}, language = "en" }) {
    const status = this.getStatus();
    const isTestMode = process.env.COMMUNICATION_TEST_MODE === "true";

    if (!status.enabled && !isTestMode) {
      return {
        success: false,
        status: "DISABLED",
        message: "WhatsApp provider is not configured or disabled in settings"
      };
    }

    const cleanedNumber = String(recipient).replace(/\D/g, "").slice(-10);
    if (cleanedNumber.length !== 10) {
      return {
        success: false,
        status: "FAILED",
        errorCode: "INVALID_NUMBER",
        message: `Invalid 10-digit mobile number for WhatsApp: ${recipient}`
      };
    }

    const fullMobile = `91${cleanedNumber}`;
    const tplName = templateId || templateCode || "ceritage_general_update";

    if (isTestMode) {
      const mockMsgId = `TEST-WA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      return {
        success: true,
        status: "SENT",
        isTest: true,
        providerMessageId: mockMsgId,
        recipient: fullMobile,
        message: `[TEST MODE] Mock WhatsApp message dispatched for template: ${tplName}`
      };
    }

    if (!status.configured) {
      return {
        success: false,
        status: "FAILED",
        errorCode: "NOT_CONFIGURED",
        message: "WhatsApp access token or phone number ID is missing"
      };
    }

    try {
      const apiUrl = process.env.WHATSAPP_API_URL || `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

      // Map template variables to WhatsApp parameter components
      const bodyParams = Object.values(variables).map(val => ({
        type: "text",
        text: String(val)
      }));

      const payload = {
        messaging_product: "whatsapp",
        to: fullMobile,
        type: "template",
        template: {
          name: tplName,
          language: { code: language || "en" },
          components: bodyParams.length > 0 ? [
            {
              type: "body",
              parameters: bodyParams
            }
          ] : []
        }
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.messages && data.messages.length > 0) {
        return {
          success: true,
          status: "SENT",
          isTest: false,
          providerMessageId: data.messages[0].id,
          recipient: fullMobile,
          response: data
        };
      } else {
        return {
          success: false,
          status: "FAILED",
          errorCode: data.error?.code || "WA_API_ERROR",
          message: data.error?.message || "Failed to dispatch WhatsApp message",
          response: data
        };
      }
    } catch (err) {
      return {
        success: false,
        status: "FAILED",
        errorCode: "NETWORK_ERROR",
        message: `WhatsApp request error: ${err.message}`
      };
    }
  }

  async sendTextMessage({ recipient, content }) {
    const status = this.getStatus();
    const isTestMode = process.env.COMMUNICATION_TEST_MODE === "true";

    if (!status.enabled && !isTestMode) {
      return {
        success: false,
        status: "DISABLED",
        message: "WhatsApp provider is disabled"
      };
    }

    const cleanedNumber = String(recipient).replace(/\D/g, "").slice(-10);
    const fullMobile = `91${cleanedNumber}`;

    if (isTestMode) {
      return {
        success: true,
        status: "SENT",
        isTest: true,
        providerMessageId: `TEST-WA-${Date.now()}`,
        recipient: fullMobile,
        message: `[TEST MODE] Mock WhatsApp text sent to ${fullMobile}`
      };
    }

    return this.sendTemplateMessage({
      recipient,
      templateId: "ceritage_general_update",
      variables: { message: content }
    });
  }

  async getDeliveryStatus(providerMessageId) {
    if (!providerMessageId || providerMessageId.startsWith("TEST-")) {
      return { status: "DELIVERED", raw: { mock: true } };
    }
    return { status: "SENT", raw: { messageId: providerMessageId } };
  }
}

module.exports = WhatsAppProvider;
