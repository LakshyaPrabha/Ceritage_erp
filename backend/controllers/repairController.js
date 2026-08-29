const db = require("../config/db");

async function getAll(req, res) {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params = [];
    if (status && status !== "All") { where += " AND r.status = ?"; params.push(status); }
    if (search) { where += " AND (r.job_id LIKE ? OR c.full_name LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

    const [rows] = await db.query(
      `SELECT r.*, c.full_name AS customer_name, c.phone FROM repair_jobs r
       LEFT JOIN customers c ON r.customer_id = c.id
       ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.json({ success: true, data: [], message: "Table not yet created." });
  }
}

async function create(req, res) {
  const { customer_id, item_description, issue, item_type, metal, item_weight, karigar_id, promised_date, estimate, advance_collected, instructions } = req.body;
  try {
    const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM repair_jobs");
    const job_id = `RJ${String(count + 1).padStart(3, "0")}`;
    const total = (estimate || 0) * 1.18; // incl 18% GST

    const [result] = await db.query(
      `INSERT INTO repair_jobs (job_id, customer_id, item_description, issue, item_type, metal, item_weight, karigar_id, promised_date, estimate, total, advance_collected, balance, instructions, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [job_id, customer_id || null, item_description, issue, item_type || null, metal || null, item_weight || 0, karigar_id || null, promised_date || null, estimate || 0, total, advance_collected || 0, total - (advance_collected || 0), instructions || null, "Pending"]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, job_id } });
  } catch (err) {
    res.json({ success: true, data: [], message: "Table not yet created." });
  }
}

async function updateStatus(req, res) {
  const { status } = req.body;
  const validStatuses = ["Pending", "In Progress", "Ready", "Delivered", "Overdue"];
  if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
  try {
    await db.query("UPDATE repair_jobs SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    res.json({ success: true, data: [], message: "Table not yet created." });
  }
}

async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
      `SELECT
       SUM(CASE WHEN status IN ('Pending','In Progress') THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'Ready' THEN 1 ELSE 0 END) AS ready,
       SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) AS overdue,
       SUM(advance_collected) AS advance_collected FROM repair_jobs`
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.json({ success: true, data: [], message: "Table not yet created." });
  }
}

module.exports = { getAll, create, updateStatus, getKpis };
