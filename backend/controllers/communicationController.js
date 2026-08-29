const db = require("../config/db");
const communicationService = require("../services/communication/communicationService");
const dispatcherService = require("../services/communication/dispatcherService");

// GET /api/communications/providers/status
function getProvidersStatus(req, res) {
  try {
    const status = communicationService.getProvidersStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/communications/templates
async function getTemplates(req, res) {
  try {
    const { channel, category } = req.query;
    let query = "SELECT * FROM message_templates WHERE 1=1";
    const params = [];

    if (channel) {
      query += " AND channel = ?";
      params.push(channel.toUpperCase());
    }
    if (category) {
      query += " AND category = ?";
      params.push(category.toUpperCase());
    }

    query += " ORDER BY category ASC, channel ASC, name ASC";
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/communications/templates
async function createTemplate(req, res) {
  const { template_code, name, channel, provider = "MSG91", provider_template_id, language = "en", category, content, variables = [] } = req.body;

  if (!template_code || !name || !channel || !category || !content) {
    return res.status(400).json({ success: false, message: "template_code, name, channel, category, and content are required" });
  }

  const performedBy = req.user?.full_name || req.user?.username || "Staff";

  try {
    const [resDb] = await db.query(
      `INSERT INTO message_templates
       (template_code, name, channel, provider, provider_template_id, language, category, content, variables, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [
        template_code.toUpperCase().trim(),
        name.trim(),
        channel.toUpperCase(),
        provider,
        provider_template_id || null,
        language,
        category.toUpperCase(),
        content.trim(),
        JSON.stringify(variables),
        performedBy
      ]
    );

    res.json({
      success: true,
      message: "Template created successfully",
      data: { id: resDb.insertId, template_code }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/communications/templates/:id
async function updateTemplate(req, res) {
  const { id } = req.params;
  const { name, provider_template_id, content, variables, is_active } = req.body;

  try {
    await db.query(
      `UPDATE message_templates SET
         name = COALESCE(?, name),
         provider_template_id = COALESCE(?, provider_template_id),
         content = COALESCE(?, content),
         variables = COALESCE(?, variables),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        name,
        provider_template_id,
        content,
        variables ? JSON.stringify(variables) : null,
        is_active,
        id
      ]
    );

    res.json({ success: true, message: "Template updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/communications/logs
async function getCommunicationLogs(req, res) {
  try {
    const { channel, status, customer_id, search, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT cl.*, c.full_name AS customer_name, c.customer_id AS cust_code
      FROM communication_logs cl
      JOIN customers c ON cl.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (channel) {
      query += " AND cl.channel = ?";
      params.push(channel.toUpperCase());
    }
    if (status) {
      query += " AND cl.status = ?";
      params.push(status.toUpperCase());
    }
    if (customer_id) {
      query += " AND cl.customer_id = ?";
      params.push(customer_id);
    }
    if (search) {
      query += " AND (c.full_name LIKE ? OR cl.recipient LIKE ? OR cl.message_preview LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += " ORDER BY cl.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);

    const [[countRow]] = await db.query(
      "SELECT COUNT(*) AS total_logs, SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS sent_today FROM communication_logs"
    );

    res.json({
      success: true,
      data: rows,
      meta: {
        total: countRow.total_logs,
        sentToday: countRow.sent_today
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/communications/logs/:id
async function getLogById(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT cl.*, c.full_name AS customer_name, c.customer_id AS cust_code
       FROM communication_logs cl
       JOIN customers c ON cl.customer_id = c.id
       WHERE cl.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: "Communication log not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/communications/send
async function sendDirectMessage(req, res) {
  const { customer_id, channel = "SMS", template_code, variables = {}, event_type = "GENERAL", event_reference = "MANUAL" } = req.body;

  if (!customer_id || !template_code) {
    return res.status(400).json({ success: false, message: "customer_id and template_code are required" });
  }

  const performedBy = req.user?.full_name || req.user?.username || "Staff";

  try {
    const result = await communicationService.sendMessage({
      customerId: customer_id,
      channel,
      templateCode: template_code,
      variables,
      eventType: event_type,
      eventReference: event_reference,
      performedBy
    });

    res.json({
      success: result.success,
      data: result,
      message: result.message
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/communications/dispatch/occasions
async function triggerOccasionsDispatch(req, res) {
  try {
    const results = await dispatcherService.dispatchDailyOccasionGreetings();
    res.json({ success: true, message: "Daily occasion greetings batch executed", data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/communications/dispatch/emi
async function triggerEmiDispatch(req, res) {
  try {
    const results = await dispatcherService.dispatchDailyEmiReminders();
    res.json({ success: true, message: "Daily EMI reminders batch executed", data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Webhook: MSG91 Delivery Callback
async function msg91Webhook(req, res) {
  try {
    const { requestId, status, deliveredAt } = req.body;
    if (requestId) {
      const normStatus = (status || "").toUpperCase() === "DELIVERED" ? "DELIVERED" : "SENT";
      await db.query(
        `UPDATE communication_logs SET status = ?, delivered_at = COALESCE(?, CURRENT_TIMESTAMP)
         WHERE provider_message_id = ?`,
        [normStatus, deliveredAt || null, requestId]
      );
    }
    res.json({ success: true, message: "MSG91 callback processed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Webhook: WhatsApp Delivery Callback
async function whatsappWebhook(req, res) {
  try {
    const body = req.body;
    if (body.entry && body.entry[0]?.changes && body.entry[0]?.changes[0]?.value?.statuses) {
      const waStatus = body.entry[0].changes[0].value.statuses[0];
      const messageId = waStatus.id;
      const statusStr = (waStatus.status || "").toUpperCase();

      let targetStatus = "SENT";
      if (statusStr === "DELIVERED" || statusStr === "READ") targetStatus = "DELIVERED";
      else if (statusStr === "FAILED") targetStatus = "FAILED";

      await db.query(
        `UPDATE communication_logs SET status = ?, delivered_at = CURRENT_TIMESTAMP
         WHERE provider_message_id = ?`,
        [targetStatus, messageId]
      );
    }
    res.json({ success: true, message: "WhatsApp callback processed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getProvidersStatus,
  getTemplates,
  createTemplate,
  updateTemplate,
  getCommunicationLogs,
  getLogById,
  sendDirectMessage,
  triggerOccasionsDispatch,
  triggerEmiDispatch,
  msg91Webhook,
  whatsappWebhook
};
