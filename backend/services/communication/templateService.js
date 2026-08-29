const db = require("../../config/db");

const STORE_NAME = "Ceritage Jewellery";

/**
 * Resolve variables into a human-readable message preview
 */
function resolveTemplateContent(templateContent, variables = {}) {
  let resolved = templateContent;
  const mergedVars = {
    store_name: STORE_NAME,
    ...variables
  };

  for (const [key, val] of Object.entries(mergedVars)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    resolved = resolved.replace(regex, val !== undefined && val !== null ? String(val) : "");
  }

  return resolved;
}

/**
 * Fetch active template by template_code and channel
 */
async function getTemplateByCode(templateCode, channel = null) {
  let query = "SELECT * FROM message_templates WHERE template_code = ? AND is_active = TRUE";
  const params = [templateCode];

  if (channel) {
    query += " AND channel = ?";
    params.push(channel);
  }

  const [rows] = await db.query(query, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Fetch all active templates for a given category and channel
 */
async function getTemplatesByCategory(category, channel = null) {
  let query = "SELECT * FROM message_templates WHERE category = ? AND is_active = TRUE";
  const params = [category];

  if (channel) {
    query += " AND channel = ?";
    params.push(channel);
  }

  const [rows] = await db.query(query, params);
  return rows;
}

module.exports = {
  resolveTemplateContent,
  getTemplateByCode,
  getTemplatesByCategory,
  STORE_NAME
};
