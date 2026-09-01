const db = require("../config/db");

// GET /api/employees/kpis
async function getKpis(req, res) {
  try {
    const [[kpis]] = await db.query(`
      SELECT
        COUNT(*) AS total_employees,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_employees,
        COALESCE(SUM(salary), 0) AS monthly_payroll
      FROM employees
    `);

    const [[attKpis]] = await db.query(`
      SELECT
        COUNT(CASE WHEN status = 'Present' THEN 1 END) AS present_today,
        COUNT(CASE WHEN status = 'On Leave' THEN 1 END) AS on_leave_today
      FROM attendance
      WHERE attendance_date = CURDATE()
    `);

    res.json({
      success: true,
      data: {
        total_employees: kpis.total_employees || 0,
        active_employees: kpis.active_employees || 0,
        monthly_payroll: parseFloat(kpis.monthly_payroll || 0),
        present_today: attKpis.present_today || 0,
        on_leave_today: attKpis.on_leave_today || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/employees
async function getAll(req, res) {
  try {
    const { status, search } = req.query;
    let where = "WHERE 1=1";
    const params = [];

    if (status && status !== "ALL") {
      where += " AND e.status = ?";
      params.push(status);
    }
    if (search) {
      where += " AND (e.name LIKE ? OR e.phone LIKE ? OR e.emp_code LIKE ? OR e.role LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const [rows] = await db.query(
      `SELECT e.id, e.emp_code, e.name, e.name AS full_name, e.phone, e.email,
              e.role, e.salary, e.salary AS basic_salary, e.branch_id, e.status, e.created_at,
              b.name AS branch_name
       FROM employees e
       LEFT JOIN branches b ON e.branch_id = b.id
       ${where}
       ORDER BY e.created_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/employees
async function create(req, res) {
  const { name, full_name, phone, email, role, salary, basic_salary, branch_id = 1 } = req.body;
  const empName = name || full_name;
  const empSalary = Number(salary || basic_salary || 0);

  if (!empName || !phone) {
    return res.status(400).json({ success: false, message: "Employee name and phone are required" });
  }

  try {
    const [[{ maxId }]] = await db.query("SELECT COALESCE(MAX(id), 0) + 1 AS maxId FROM employees");
    const empCode = `EMP-${new Date().getFullYear()}-${String(maxId).padStart(4, "0")}`;

    const [result] = await db.query(
      `INSERT INTO employees (emp_code, name, phone, email, role, salary, branch_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [empCode, empName.trim(), phone.trim(), email || null, role || "Sales Associate", empSalary, branch_id]
    );

    res.status(201).json({
      success: true,
      message: `Employee ${empName} registered (${empCode})`,
      data: { id: result.insertId, emp_code: empCode }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/employees/:id
async function update(req, res) {
  const { name, full_name, phone, email, role, salary, basic_salary, branch_id, status } = req.body;
  const empName = name || full_name;
  const empSalary = Number(salary || basic_salary || 0);

  try {
    await db.query(
      `UPDATE employees
       SET name=?, phone=?, email=?, role=?, salary=?, branch_id=?, status=?
       WHERE id=?`,
      [empName, phone, email || null, role, empSalary, branch_id || 1, status || "Active", req.params.id]
    );
    res.json({ success: true, message: "Employee details updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/employees/attendance
async function getAttendance(req, res) {
  try {
    const { date } = req.query;
    let where = "WHERE 1=1";
    const params = [];

    if (date) {
      where += " AND a.attendance_date = ?";
      params.push(date);
    }

    const [rows] = await db.query(
      `SELECT a.*, e.name AS employee_name, e.emp_code, e.role
       FROM attendance a
       LEFT JOIN employees e ON a.employee_id = e.id
       ${where}
       ORDER BY a.attendance_date DESC, a.id DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/employees/attendance
async function markAttendance(req, res) {
  const { employee_id, attendance_date, status = "Present", check_in, check_out } = req.body;

  if (!employee_id) {
    return res.status(400).json({ success: false, message: "Employee ID is required" });
  }

  const date = attendance_date || new Date().toISOString().split("T")[0];

  try {
    const [result] = await db.query(
      `INSERT INTO attendance (employee_id, attendance_date, status, check_in, check_out)
       VALUES (?, ?, ?, ?, ?)`,
      [employee_id, date, status, check_in || null, check_out || null]
    );

    res.status(201).json({ success: true, message: `Attendance marked as ${status}`, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/employees/leaves
async function getLeaves(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT l.*, e.name AS employee_name, e.emp_code, e.role
       FROM leaves l
       LEFT JOIN employees e ON l.employee_id = e.id
       ORDER BY l.created_at DESC`
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/employees/leaves
async function submitLeave(req, res) {
  const { employee_id, leave_type = "Casual Leave", from_date, to_date, reason } = req.body;

  if (!employee_id || !from_date || !to_date) {
    return res.status(400).json({ success: false, message: "Employee and date range are required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO leaves (employee_id, leave_type, from_date, to_date, reason, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [employee_id, leave_type, from_date, to_date, reason || null]
    );

    res.status(201).json({ success: true, message: "Leave application submitted", data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/employees/leaves/:id
async function approveLeave(req, res) {
  const { status } = req.body; // APPROVED / REJECTED

  try {
    await db.query("UPDATE leaves SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true, message: `Leave status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getKpis,
  getAll,
  create,
  update,
  getAttendance,
  markAttendance,
  getLeaves,
  submitLeave,
  approveLeave,
};
