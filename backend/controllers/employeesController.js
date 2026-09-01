const db = require("../config/db");

let tablesReady = false;



// ── GET /api/employees/kpis ───────────────────────────────────────────────────
exports.getKpis = async (req, res) => {
  try {
    await ensureTables();

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
        COUNT(CASE WHEN status = 'On Leave' THEN 1 END) AS on_leave_today,
        COUNT(CASE WHEN status = 'Absent' THEN 1 END) AS absent_today
      FROM attendance
      WHERE attendance_date = CURDATE()
    `);

    const [[leaveKpis]] = await db.query(`
      SELECT COUNT(*) AS pending_leaves FROM leaves WHERE status = 'PENDING'
    `);

    return res.json({
      success: true,
      data: {
        total_employees: kpis.total_employees || 0,
        active_employees: kpis.active_employees || 0,
        monthly_payroll: parseFloat(kpis.monthly_payroll || 0),
        present_today: attKpis.present_today || 0,
        on_leave_today: attKpis.on_leave_today || 0,
        absent_today: attKpis.absent_today || 0,
        pending_leaves: leaveKpis.pending_leaves || 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/employees ────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    await ensureTables();
    const { status, role, search } = req.query;

    let where = "WHERE 1=1";
    const params = [];

    if (status && status !== "ALL") {
      where += " AND e.status = ?";
      params.push(status);
    }
    if (role && role !== "ALL") {
      where += " AND e.role = ?";
      params.push(role);
    }
    if (search) {
      where += " AND (e.name LIKE ? OR e.phone LIKE ? OR e.emp_code LIKE ? OR e.role LIKE ? OR e.email LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    const [rows] = await db.query(`
      SELECT 
        e.*,
        b.name AS branch_name,
        (SELECT status FROM attendance a WHERE a.employee_id = e.id AND a.attendance_date = CURDATE() LIMIT 1) AS today_attendance
      FROM employees e
      LEFT JOIN branches b ON e.branch_id = b.id
      ${where}
      ORDER BY e.id ASC
    `, params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/employees/:id ────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;

    const [rows] = await db.query("SELECT * FROM employees WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const [recentAttendance] = await db.query(`
      SELECT * FROM attendance WHERE employee_id = ? ORDER BY attendance_date DESC LIMIT 15
    `, [id]);

    const [recentLeaves] = await db.query(`
      SELECT * FROM leaves WHERE employee_id = ? ORDER BY created_at DESC LIMIT 5
    `, [id]);

    return res.json({
      success: true,
      data: {
        ...rows[0],
        attendance: recentAttendance,
        leaves: recentLeaves,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/employees ───────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    await ensureTables();
    const {
      name,
      phone,
      email,
      role,
      department,
      salary,
      joining_date,
      pan,
      aadhaar,
      bank_account,
      ifsc,
      notes,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "Employee name and phone are required" });
    }

    const [[{ maxId }]] = await db.query("SELECT COALESCE(MAX(id), 0) + 1 AS maxId FROM employees");
    const empCode = `EMP-${new Date().getFullYear()}-${String(maxId).padStart(4, "0")}`;

    const [result] = await db.query(`
      INSERT INTO employees 
        (emp_code, name, phone, email, role, department, salary, branch_id, status, joining_date, pan, aadhaar, bank_account, ifsc, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?)
    `, [
      empCode,
      name,
      phone,
      email || null,
      role || null,
      department || null,
      salary ? parseFloat(salary) : 0,
      req.user?.branch_id || 1,
      joining_date || new Date().toISOString().split("T")[0],
      pan || null,
      aadhaar || null,
      bank_account || null,
      ifsc || null,
      notes || null,
    ]);

    return res.status(201).json({
      success: true,
      message: `Employee ${name} registered successfully (${empCode})`,
      data: { id: result.insertId, emp_code: empCode },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/employees/:id ────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      role,
      department,
      salary,
      status,
      joining_date,
      pan,
      aadhaar,
      bank_account,
      ifsc,
      notes,
    } = req.body;

    await db.query(`
      UPDATE employees 
      SET name=?, phone=?, email=?, role=?, department=?, salary=?, status=?, joining_date=?, pan=?, aadhaar=?, bank_account=?, ifsc=?, notes=?
      WHERE id=?
    `, [
      name,
      phone,
      email || null,
      role,
      department,
      parseFloat(salary) || 0,
      status || "Active",
      joining_date,
      pan || null,
      aadhaar || null,
      bank_account || null,
      ifsc || null,
      notes || null,
      id,
    ]);

    return res.json({ success: true, message: "Employee profile updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/employees/:id ─────────────────────────────────────────────────
exports.delete = async (req, res) => {
  try {
    await ensureTables();
    const { id } = req.params;

    await db.query("UPDATE employees SET status='Inactive' WHERE id=?", [id]);
    return res.json({ success: true, message: "Employee marked as Inactive" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/employees/attendance ─────────────────────────────────────────────
exports.getAttendance = async (req, res) => {
  try {
    await ensureTables();
    const { date, employee_id } = req.query;

    let where = "WHERE 1=1";
    const params = [];

    if (date) {
      where += " AND a.attendance_date = ?";
      params.push(date);
    }
    if (employee_id) {
      where += " AND a.employee_id = ?";
      params.push(employee_id);
    }

    const [rows] = await db.query(`
      SELECT 
        a.*,
        e.name AS employee_name,
        e.emp_code,
        e.role,
        e.department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      ${where}
      ORDER BY a.attendance_date DESC, a.id DESC
    `, params);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/employees/attendance ────────────────────────────────────────────
exports.markAttendance = async (req, res) => {
  try {
    await ensureTables();
    const {
      employee_id,
      attendance_date,
      status = "Present",
      check_in = "10:00:00",
      check_out = "19:30:00",
      notes = "",
    } = req.body;

    if (!employee_id) {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    const date = attendance_date || new Date().toISOString().split("T")[0];

    await db.query(`
      INSERT INTO attendance (employee_id, attendance_date, status, check_in, check_out, hours_worked, notes)
      VALUES (?, ?, ?, ?, ?, 9.5, ?)
      ON DUPLICATE KEY UPDATE status=VALUES(status), check_in=VALUES(check_in), check_out=VALUES(check_out), notes=VALUES(notes)
    `, [employee_id, date, status, check_in, check_out, notes]);

    return res.json({ success: true, message: `Attendance recorded as "${status}" for ${date}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/employees/attendance/mark-all-present ───────────────────────────
exports.markAllPresent = async (req, res) => {
  try {
    await ensureTables();
    const date = req.body.date || new Date().toISOString().split("T")[0];

    const [activeEmployees] = await db.query("SELECT id FROM employees WHERE status = 'Active'");

    for (const emp of activeEmployees) {
      await db.query(`
        INSERT INTO attendance (employee_id, attendance_date, status, check_in, check_out, hours_worked)
        VALUES (?, ?, 'Present', '10:00:00', '19:30:00', 9.5)
        ON DUPLICATE KEY UPDATE status='Present'
      `, [emp.id, date]);
    }

    return res.json({
      success: true,
      message: `Marked all ${activeEmployees.length} active staff as Present for ${date}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/employees/leaves ─────────────────────────────────────────────────
exports.getLeaves = async (req, res) => {
  try {
    await ensureTables();
    const [rows] = await db.query(`
      SELECT 
        l.*,
        e.name AS employee_name,
        e.emp_code,
        e.role,
        e.department
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      ORDER BY l.created_at DESC
    `);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/employees/leaves ────────────────────────────────────────────────
exports.submitLeave = async (req, res) => {
  try {
    await ensureTables();
    const { employee_id, leave_type = "Casual Leave", from_date, to_date, reason } = req.body;

    if (!employee_id || !from_date || !to_date) {
      return res.status(400).json({ success: false, message: "Employee and date range are required" });
    }

    const d1 = new Date(from_date);
    const d2 = new Date(to_date);
    const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

    const [result] = await db.query(`
      INSERT INTO leaves (employee_id, leave_type, from_date, to_date, days_count, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `, [employee_id, leave_type, from_date, to_date, diffDays, reason || null]);

    return res.status(201).json({
      success: true,
      message: "Leave application submitted successfully",
      data: { id: result.insertId },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/employees/leaves/:id ───────────────────────────────────────────
exports.approveLeave = async (req, res) => {
  try {
    await ensureTables();
    const { status } = req.body; // APPROVED or REJECTED

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be APPROVED or REJECTED" });
    }

    await db.query(`
      UPDATE leaves SET status = ?, approved_by = ? WHERE id = ?
    `, [status, req.user?.username || "Store Manager", req.params.id]);

    return res.json({ success: true, message: `Leave application marked as ${status}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/employees/payroll ────────────────────────────────────────────────
exports.getPayroll = async (req, res) => {
  try {
    await ensureTables();
    const month = req.query.month || new Date().toISOString().slice(0, 7); // e.g. "2026-08"

    const [employees] = await db.query("SELECT * FROM employees WHERE status = 'Active'");

    const payrollSummary = [];

    for (const emp of employees) {
      // Check existing payroll record
      const [existing] = await db.query(
        "SELECT * FROM payroll_records WHERE employee_id = ? AND payroll_month = ?",
        [emp.id, month]
      );

      if (existing.length > 0) {
        payrollSummary.push({
          ...existing[0],
          employee_name: emp.name,
          emp_code: emp.emp_code,
          role: emp.role,
          department: emp.department,
        });
      } else {
        // Auto-compute based on attendance
        const [[attStats]] = await db.query(`
          SELECT 
            COUNT(CASE WHEN status='Present' THEN 1 END) AS present_days,
            COUNT(CASE WHEN status='Absent' THEN 1 END) AS absent_days
          FROM attendance
          WHERE employee_id = ? AND DATE_FORMAT(attendance_date, '%Y-%m') = ?
        `, [emp.id, month]);

        const basic = parseFloat(emp.salary) || 0;
        const absent = attStats.absent_days || 0;
        const perDayRate = basic / 30;
        const deduction = Math.round(absent * perDayRate);
        const net = Math.max(0, basic - deduction);

        payrollSummary.push({
          id: null,
          payslip_no: `SLIP-${month.replace("-", "")}-${emp.id}`,
          payroll_month: month,
          employee_id: emp.id,
          employee_name: emp.name,
          emp_code: emp.emp_code,
          role: emp.role,
          department: emp.department,
          basic_salary: basic,
          days_present: attStats.present_days || 30,
          days_absent: absent,
          incentives_commission: 0.00,
          deductions: deduction,
          net_salary: net,
          payment_status: "PENDING",
          payment_mode: "RTGS",
        });
      }
    }

    return res.json({ success: true, data: payrollSummary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/employees/payroll/pay ───────────────────────────────────────────
exports.paySalary = async (req, res) => {
  try {
    await ensureTables();
    const {
      employee_id,
      payroll_month,
      basic_salary,
      incentives_commission = 0,
      deductions = 0,
      payment_mode = "RTGS",
    } = req.body;

    if (!employee_id || !payroll_month) {
      return res.status(400).json({ success: false, message: "Employee and payroll month are required" });
    }

    const basic = parseFloat(basic_salary) || 0;
    const inc = parseFloat(incentives_commission) || 0;
    const ded = parseFloat(deductions) || 0;
    const net = basic + inc - ded;

    const payslipNo = `SLIP-${payroll_month.replace("-", "")}-${String(employee_id).padStart(3, "0")}`;
    const today = new Date().toISOString().split("T")[0];

    await db.query(`
      INSERT INTO payroll_records 
        (payslip_no, payroll_month, employee_id, basic_salary, incentives_commission, deductions, net_salary, payment_status, payment_mode, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PAID', ?, ?)
      ON DUPLICATE KEY UPDATE payment_status='PAID', payment_mode=VALUES(payment_mode), payment_date=VALUES(payment_date), net_salary=VALUES(net_salary)
    `, [payslipNo, payroll_month, employee_id, basic, inc, ded, net, payment_mode, today]);

    return res.json({
      success: true,
      message: `Salary of ₹${net.toLocaleString("en-IN")} paid successfully (Payslip #${payslipNo})`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
