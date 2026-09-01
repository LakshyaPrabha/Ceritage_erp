const db = require("../config/db");

async function getKpis(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [[kpis]] = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status='Received' THEN 1 ELSE 0 END) AS received,
         SUM(CASE WHEN status='In Progress' THEN 1 ELSE 0 END) AS in_progress,
         SUM(CASE WHEN status='Ready' THEN 1 ELSE 0 END) AS ready,
         SUM(CASE WHEN status='Delivered' THEN 1 ELSE 0 END) AS delivered,
         SUM(CASE WHEN promised_date < CURDATE() AND status NOT IN ('Delivered','Cancelled') THEN 1 ELSE 0 END) AS overdue,
         COALESCE(SUM(estimated_cost),0) AS total_estimated,
         COALESCE(SUM(actual_cost),0) AS total_actual,
         COALESCE(SUM(advance_paid),0) AS total_advance
       FROM repair_jobs WHERE branch_id = ?`,
      [branch_id]
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAll(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const { search, status, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = "WHERE r.branch_id = ?";
    const params = [branch_id];

    if (status)  { where += " AND r.status = ?"; params.push(status); }
    if (search)  {
      where += " AND (r.job_no LIKE ? OR c.full_name LIKE ? OR r.item_name LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const [rows] = await db.query(
      `SELECT r.*, c.full_name AS customer_name, c.phone AS customer_phone
       FROM repair_jobs r
       LEFT JOIN customers c ON r.customer_id = c.id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [rows] = await db.query(
      `SELECT r.*, c.full_name AS customer_name, c.phone AS customer_phone
       FROM repair_jobs r
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.id = ? AND r.branch_id = ?`,
      [req.params.id, branch_id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  const branch_id = req.user?.branch_id || 1;
  const {
    customer_id, item_name, item_type, metal, purity, weight_g,
    issue_desc, work_to_do, received_date, promised_date,
    estimated_cost, advance_paid, assigned_to, notes,
  } = req.body;

  if (!item_name?.trim()) return res.status(400).json({ success: false, message: "Item name is required." });
  if (!issue_desc?.trim()) return res.status(400).json({ success: false, message: "Issue description is required." });

  try {
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) AS count FROM repair_jobs WHERE branch_id = ?", [branch_id]
    );
    const year = new Date().getFullYear().toString().slice(-2);
    const job_no = `REP${year}${String(count + 1).padStart(4, "0")}`;

    const [result] = await db.query(
      `INSERT INTO repair_jobs
         (branch_id, job_no, customer_id, item_name, item_type, metal, purity,
          weight_g, issue_desc, work_to_do, received_date, promised_date,
          estimated_cost, advance_paid, assigned_to, notes, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Received')`,
      [
        branch_id, job_no, customer_id || null,
        item_name.trim(), item_type || null, metal || null, purity || null,
        parseFloat(weight_g) || 0, issue_desc.trim(), work_to_do || null,
        received_date || new Date().toISOString().split("T")[0],
        promised_date || null,
        parseFloat(estimated_cost) || 0,
        parseFloat(advance_paid) || 0,
        assigned_to || null, notes || null,
      ]
    );
    res.status(201).json({ success: true, message: "Repair job created.", data: { id: result.insertId, job_no } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  const branch_id = req.user?.branch_id || 1;
  const {
    customer_id, item_name, item_type, metal, purity, weight_g,
    issue_desc, work_to_do, received_date, promised_date,
    estimated_cost, actual_cost, advance_paid, assigned_to,
    status, delivery_date, notes,
  } = req.body;

  try {
    await db.query(
      `UPDATE repair_jobs SET
         customer_id=?, item_name=?, item_type=?, metal=?, purity=?, weight_g=?,
         issue_desc=?, work_to_do=?, received_date=?, promised_date=?,
         estimated_cost=?, actual_cost=?, advance_paid=?,
         assigned_to=?, status=?, delivery_date=?, notes=?
       WHERE id=? AND branch_id=?`,
      [
        customer_id || null, item_name, item_type || null, metal || null,
        purity || null, parseFloat(weight_g) || 0,
        issue_desc, work_to_do || null,
        received_date, promised_date || null,
        parseFloat(estimated_cost) || 0, parseFloat(actual_cost) || 0,
        parseFloat(advance_paid) || 0, assigned_to || null,
        status || "Received",
        delivery_date || null, notes || null,
        req.params.id, branch_id,
      ]
    );
    res.json({ success: true, message: "Job updated." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateStatus(req, res) {
  const branch_id = req.user?.branch_id || 1;
  const { status, actual_cost, delivery_date } = req.body;
  try {
    await db.query(
      `UPDATE repair_jobs SET status=?,
         actual_cost=COALESCE(?,actual_cost),
         delivery_date=COALESCE(?,delivery_date)
       WHERE id=? AND branch_id=?`,
      [status, actual_cost || null, delivery_date || null, req.params.id, branch_id]
    );
    res.json({ success: true, message: `Status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function remove(req, res) {
  const branch_id = req.user?.branch_id || 1;
  try {
    const [r] = await db.query(
      "DELETE FROM repair_jobs WHERE id=? AND branch_id=?",
      [req.params.id, branch_id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ success: false, message: "Job not found." });
    res.json({ success: true, message: "Job deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getKpis, getAll, getById, create, update, updateStatus, remove };
