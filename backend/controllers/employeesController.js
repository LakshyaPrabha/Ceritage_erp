const db = require("../config/db");

async function getAll(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT e.*, b.name AS branch_name FROM employees e
       LEFT JOIN branches b ON e.branch_id = b.id ORDER BY e.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function create(req, res) {
  const { full_name, role, department, phone, email, dob, basic_salary, join_date, aadhaar, pan, bank_account, branch_id } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO employees (full_name, role, department, phone, email, dob, basic_salary, join_date, aadhaar, pan, bank_account, branch_id, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [full_name, role, department || null, phone || null, email || null, dob || null, basic_salary || 0, join_date || null, aadhaar || null, pan || null, bank_account || null, branch_id || null, "Active"]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function update(req, res) {
  const { full_name, role, department, phone, email, basic_salary, branch_id, status } = req.body;
  try {
    await db.query(
      "UPDATE employees SET full_name=?, role=?, department=?, phone=?, email=?, basic_salary=?, branch_id=?, status=? WHERE id=?",
      [full_name, role, department || null, phone || null, email || null, basic_salary || 0, branch_id || null, status, req.params.id]
    );
    res.json({ success: true, message: "Employee updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function markAttendance(req, res) {
  const { employee_id, date, status, remarks } = req.body;
  try {
    await db.query(
      `INSERT INTO attendance (employee_id, date, status, remarks)
       VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE status=?, remarks=?`,
      [employee_id, date, status, remarks || null, status, remarks || null]
    );
    res.json({ success: true, message: "Attendance marked" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function submitLeave(req, res) {
  const { employee_id, leave_type, from_date, to_date, reason } = req.body;
  try {
    const days = Math.ceil((new Date(to_date) - new Date(from_date)) / 86400000) + 1;
    const [result] = await db.query(
      `INSERT INTO leaves (employee_id, leave_type, from_date, to_date, days, reason, status)
       VALUES (?,?,?,?,?,?,?)`,
      [employee_id, leave_type, from_date, to_date, days, reason, "Pending"]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, days } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function approveLeave(req, res) {
  const { status } = req.body; // Approved / Rejected
  try {
    await db.query(
      "UPDATE leaves SET status=?, approved_by=? WHERE id=?",
      [status, req.user.full_name || "Admin", req.params.id]
    );
    res.json({ success: true, message: `Leave ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) AS active,
       SUM(basic_salary) AS monthly_payroll,
       SUM(CASE WHEN status='On Leave' THEN 1 ELSE 0 END) AS on_leave FROM employees`
    );
    res.json({ success: true, data: kpis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getAll, create, update, markAttendance, submitLeave, approveLeave, getKpis };
