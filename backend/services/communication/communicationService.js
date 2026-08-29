const db = require("../../config/db");
const templateService = require("./templateService");
const Msg91SmsProvider = require("./providers/Msg91SmsProvider");
const WhatsAppProvider = require("./providers/WhatsAppProvider");

const smsProvider = new Msg91SmsProvider();
const waProvider = new WhatsAppProvider();

/**
 * Get configured status for all providers
 */
function getProvidersStatus() {
  return {
    testMode: process.env.COMMUNICATION_TEST_MODE === "true",
    sms: smsProvider.getStatus(),
    whatsapp: waProvider.getStatus()
  };
}

/**
 * Core sendMessage orchestrator
 */
async function sendMessage(params) {
  const {
    customerId,
    channel = "SMS", // 'SMS' | 'WHATSAPP'
    templateCode,
    variables = {},
    eventType = "GENERAL",
    eventReference = "MANUAL",
    scheduledFor = null,
    isMarketing = false,
    performedBy = "System"
  } = params;

  const normChannel = channel.toUpperCase();

  // 1. Fetch Customer and verify consent
  const [custRows] = await db.query(
    `SELECT id, customer_id, full_name, phone, opt_in_whatsapp, opt_in_sms, opt_in_marketing, preferred_channel, status
     FROM customers WHERE id = ?`,
    [customerId]
  );

  if (custRows.length === 0) {
    return { success: false, status: "FAILED", message: "Customer not found" };
  }

  const cust = custRows[0];
  if (cust.status !== "ACTIVE") {
    return { success: false, status: "SKIPPED", message: "Customer is archived" };
  }

  // Check Channel-specific Consent
  if (normChannel === "SMS" && !cust.opt_in_sms) {
    return logAndReturnSkipped(cust.id, normChannel, "SMS", templateCode, cust.phone, "CONSENT_NOT_GRANTED_SMS", performedBy);
  }
  if (normChannel === "WHATSAPP" && !cust.opt_in_whatsapp) {
    return logAndReturnSkipped(cust.id, normChannel, "WhatsApp", templateCode, cust.phone, "CONSENT_NOT_GRANTED_WHATSAPP", performedBy);
  }
  if (isMarketing && !cust.opt_in_marketing) {
    return logAndReturnSkipped(cust.id, normChannel, normChannel === "SMS" ? "SMS" : "WhatsApp", templateCode, cust.phone, "CONSENT_NOT_GRANTED_MARKETING", performedBy);
  }
  if (cust.preferred_channel === "NONE") {
    return logAndReturnSkipped(cust.id, normChannel, normChannel === "SMS" ? "SMS" : "WhatsApp", templateCode, cust.phone, "CUSTOMER_REQUESTED_NO_CONTACT", performedBy);
  }

  // 2. Fetch Template
  const template = await templateService.getTemplateByCode(templateCode, normChannel);
  if (!template) {
    return {
      success: false,
      status: "FAILED",
      message: `Active message template '${templateCode}' not found for channel ${normChannel}`
    };
  }

  // 3. Resolve Content Preview & Variables
  const mergedVariables = {
    customer_name: cust.full_name,
    ...variables
  };
  const messagePreview = templateService.resolveTemplateContent(template.content, mergedVariables);

  // 4. Duplicate Dispatch Check
  const [dupDispatches] = await db.query(
    `SELECT id, status FROM message_dispatches
     WHERE customer_id = ? AND event_type = ? AND event_reference = ? AND channel = ? AND template_code = ?`,
    [cust.id, eventType, String(eventReference), normChannel, templateCode]
  );

  if (dupDispatches.length > 0 && dupDispatches[0].status === "SENT") {
    return {
      success: true,
      status: "SKIPPED",
      duplicate: true,
      message: `Message already sent for ${eventType} (ref: ${eventReference}) via ${normChannel}`
    };
  }

  // 5. Select Provider & Send
  const provider = normChannel === "SMS" ? smsProvider : waProvider;
  const providerName = normChannel === "SMS" ? "MSG91" : "WhatsApp";

  const result = await provider.sendTemplateMessage({
    recipient: cust.phone,
    templateId: template.provider_template_id,
    templateCode: template.template_code,
    variables: mergedVariables,
    language: template.language
  });

  const finalStatus = result.success ? "SENT" : "FAILED";

  // 6. Insert communication_logs
  const [logRes] = await db.query(
    `INSERT INTO communication_logs
     (customer_id, channel, provider, template_id, template_code, recipient, message_preview,
      provider_message_id, status, error_code, error_message, is_test, sent_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cust.id,
      normChannel,
      providerName,
      template.id,
      template.template_code,
      cust.phone,
      messagePreview,
      result.providerMessageId || null,
      finalStatus,
      result.errorCode || null,
      result.message || null,
      Boolean(result.isTest),
      result.success ? new Date() : null,
      performedBy
    ]
  );

  const logId = logRes.insertId;

  // 7. Insert or update message_dispatches for deduplication
  await db.query(
    `INSERT INTO message_dispatches
     (customer_id, event_type, event_reference, channel, template_code, scheduled_for, status, communication_log_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), communication_log_id = VALUES(communication_log_id)`,
    [
      cust.id,
      eventType,
      String(eventReference),
      normChannel,
      templateCode,
      scheduledFor || new Date().toISOString().slice(0, 10),
      finalStatus,
      logId
    ]
  );

  // 8. Audit Log
  await db.query(
    `INSERT INTO customer_audit_logs (customer_id, action, performed_by, details)
     VALUES (?, ?, ?, ?)`,
    [
      cust.id,
      result.success ? "COMMUNICATION_SENT" : "COMMUNICATION_FAILED",
      performedBy,
      `Dispatched ${normChannel} (${templateCode}) for ${eventType}: ${result.message || 'Success'}`
    ]
  );

  return {
    success: result.success,
    status: finalStatus,
    logId,
    providerMessageId: result.providerMessageId,
    messagePreview,
    isTest: Boolean(result.isTest),
    message: result.message || "Message dispatched"
  };
}

/**
 * Helper to log a skipped communication without duplicate error
 */
async function logAndReturnSkipped(customerId, channel, provider, templateCode, recipient, reason, performedBy) {
  const [logRes] = await db.query(
    `INSERT INTO communication_logs
     (customer_id, channel, provider, template_code, recipient, status, error_code, error_message, created_by)
     VALUES (?, ?, ?, ?, ?, 'SKIPPED', ?, ?, ?)`,
    [customerId, channel, provider, templateCode || 'N/A', recipient, reason, `Skipped due to consent/preference: ${reason}`, performedBy]
  );

  return {
    success: false,
    status: "SKIPPED",
    logId: logRes.insertId,
    reason,
    message: `Communication skipped for customer (${reason})`
  };
}

/**
 * Helper for Birthday Greetings
 */
async function sendBirthdayGreeting(customerId, occasionYear, options = {}) {
  const { channel = "SMS", couponCode = "", performedBy = "Staff" } = options;
  const tplCode = channel.toUpperCase() === "WHATSAPP" ? "BDAY_WA" : "BDAY_SMS";

  return sendMessage({
    customerId,
    channel,
    templateCode: tplCode,
    variables: { coupon_code: couponCode },
    eventType: "BIRTHDAY",
    eventReference: String(occasionYear || new Date().getFullYear()),
    performedBy
  });
}

/**
 * Helper for Anniversary Greetings
 */
async function sendAnniversaryGreeting(customerId, occasionYear, options = {}) {
  const { channel = "SMS", couponCode = "", performedBy = "Staff" } = options;
  const tplCode = channel.toUpperCase() === "WHATSAPP" ? "ANNIV_WA" : "ANNIV_SMS";

  return sendMessage({
    customerId,
    channel,
    templateCode: tplCode,
    variables: { coupon_code: couponCode },
    eventType: "ANNIVERSARY",
    eventReference: String(occasionYear || new Date().getFullYear()),
    performedBy
  });
}

/**
 * Helper for EMI Installment Reminders
 */
async function sendEmiReminder(customerId, installmentId, options = {}) {
  const { channel = "SMS", dueAmount, dueDate, performedBy = "System" } = options;
  return sendMessage({
    customerId,
    channel,
    templateCode: "EMI_DUE_SMS",
    variables: {
      due_amount: dueAmount,
      due_date: dueDate
    },
    eventType: "EMI_REMINDER",
    eventReference: String(installmentId),
    performedBy
  });
}

/**
 * Helper for Outstanding Balance Payment Reminders
 */
async function sendPaymentReminder(customerId, options = {}) {
  const { channel = "SMS", dueAmount, performedBy = "Staff" } = options;
  return sendMessage({
    customerId,
    channel,
    templateCode: "DUE_REMINDER_SMS",
    variables: {
      due_amount: dueAmount
    },
    eventType: "PAYMENT_REMINDER",
    eventReference: new Date().toISOString().slice(0, 7), // Once per month reference
    performedBy
  });
}

module.exports = {
  getProvidersStatus,
  sendMessage,
  sendBirthdayGreeting,
  sendAnniversaryGreeting,
  sendEmiReminder,
  sendPaymentReminder,
  smsProvider,
  waProvider
};
