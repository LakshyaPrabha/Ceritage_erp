import { useState, useEffect, useCallback, useMemo } from "react";
import { BRAND } from "../../theme.js";
import { apiRequest } from "../../lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  StatCard,
  Tabs,
  BtnPrimary,
  BtnOutline,
  BtnSm,
  Modal,
  FormGroup,
  FormGrid,
  Input,
  Select,
} from "../../components/ui";

function fmt(n) {
  return n != null
    ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "₹0";
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const TABS = [
  { id: "staff",      label: "Staff Directory" },
  { id: "attendance", label: "Daily Attendance" },
  { id: "leaves",     label: "Leave Applications" },
  { id: "payroll",    label: "Monthly Payroll" },
];

const ROLES = [
  "All",
  "Store Manager",
  "Sales Associate",
  "Senior Goldsmith",
  "Accountant",
  "Cashier",
  "Inventory Specialist",
  "Security Officer",
];

const DEPARTMENTS = [
  "Management",
  "Showroom Sales",
  "Bridal Counter",
  "Workshop / Karigar",
  "Accounts & Billing",
  "Vault & RFID",
  "Security & Logistics",
];

export default function Employees({ t }) {
  const [tab, setTab] = useState("staff");
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState({});
  const [employees, setEmployees] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [payrollList, setPayrollList] = useState([]);

  // Filters
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [attModal, setAttModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [slipModal, setSlipModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Forms
  const [empForm, setEmpForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "",
    department: "",
    salary: "",
    joining_date: new Date().toISOString().split("T")[0],
    pan: "",
    aadhaar: "",
    bank_account: "",
    ifsc: "",
    notes: "",
  });

  const [attForm, setAttForm] = useState({
    employee_id: "",
    attendance_date: new Date().toISOString().split("T")[0],
    status: "Present",
    check_in: "10:00:00",
    check_out: "19:30:00",
    notes: "",
  });

  const [leaveForm, setLeaveForm] = useState({
    employee_id: "",
    leave_type: "Casual Leave",
    from_date: new Date().toISOString().split("T")[0],
    to_date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const [payForm, setPayForm] = useState({
    employee_id: "",
    payroll_month: new Date().toISOString().slice(0, 7),
    basic_salary: 0,
    incentives_commission: 0,
    deductions: 0,
    payment_mode: "RTGS",
  });

  // ── 1. LOAD DATA ────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const d = await apiRequest("/employees/kpis");
      if (d.success) setKpis(d.data);
    } catch { /* silent */ }
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (roleFilter !== "All") q.append("role", roleFilter);
      if (statusFilter !== "ALL") q.append("status", statusFilter);
      if (search) q.append("search", search);

      const d = await apiRequest(`/employees?${q.toString()}`);
      if (d.success) setEmployees(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search]);

  const loadAttendance = useCallback(async () => {
    try {
      const d = await apiRequest(`/employees/attendance?date=${selectedDate}`);
      if (d.success) setAttendanceList(d.data || []);
    } catch { /* silent */ }
  }, [selectedDate]);

  const loadLeaves = useCallback(async () => {
    try {
      const d = await apiRequest("/employees/leaves");
      if (d.success) setLeavesList(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadPayroll = useCallback(async () => {
    try {
      const d = await apiRequest(`/employees/payroll?month=${selectedMonth}`);
      if (d.success) setPayrollList(d.data || []);
    } catch { /* silent */ }
  }, [selectedMonth]);

  useEffect(() => {
    loadKpis();
    loadEmployees();
  }, [loadKpis, loadEmployees]);

  useEffect(() => {
    if (tab === "attendance") loadAttendance();
    if (tab === "leaves") loadLeaves();
    if (tab === "payroll") loadPayroll();
  }, [tab, loadAttendance, loadLeaves, loadPayroll]);

  // ── 2. ACTIONS ──────────────────────────────────────────────────────────────

  // Save / Register Employee
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!empForm.name || !empForm.phone) {
      alert("Name and Phone number are required.");
      return;
    }

    try {
      const isEdit = !!selectedEmp;
      const url = isEdit ? `/employees/${selectedEmp.id}` : `/employees`;
      const method = isEdit ? "PUT" : "POST";

      const d = await apiRequest(url, {
        method,
        body: JSON.stringify(empForm),
      });

      if (d.success) {
        setAddModal(false);
        setEditModal(false);
        setSelectedEmp(null);
        setEmpForm({
          name: "",
          phone: "",
          email: "",
          role: "Sales Associate",
          department: "Showroom Sales",
          salary: "35000",
          joining_date: new Date().toISOString().split("T")[0],
          pan: "",
          aadhaar: "",
          bank_account: "",
          ifsc: "",
          notes: "",
        });
        loadEmployees();
        loadKpis();
        alert(`✓ ${d.message}`);
      } else {
        alert(d.message || "Failed to save employee");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // 1-Click Mark All Present
  const handleMarkAllPresent = async () => {
    try {
      const d = await apiRequest("/employees/attendance/mark-all-present", {
        method: "POST",
        body: JSON.stringify({ date: selectedDate }),
      });
      if (d.success) {
        alert(`✓ ${d.message}`);
        loadAttendance();
        loadKpis();
      }
    } catch { /* silent */ }
  };

  // Submit Single Attendance
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!attForm.employee_id) return;
    try {
      const d = await apiRequest("/employees/attendance", {
        method: "POST",
        body: JSON.stringify(attForm),
      });
      if (d.success) {
        setAttModal(false);
        loadAttendance();
        loadKpis();
        alert(`✓ ${d.message}`);
      }
    } catch { /* silent */ }
  };

  // Submit Leave Application
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.employee_id) return;
    try {
      const d = await apiRequest("/employees/leaves", {
        method: "POST",
        body: JSON.stringify(leaveForm),
      });
      if (d.success) {
        setLeaveModal(false);
        setLeaveForm({
          employee_id: "",
          leave_type: "Casual Leave",
          from_date: new Date().toISOString().split("T")[0],
          to_date: new Date().toISOString().split("T")[0],
          reason: "",
        });
        loadLeaves();
        loadKpis();
        alert(`✓ ${d.message}`);
      }
    } catch { /* silent */ }
  };

  // 1-Click Approve / Reject Leave
  const handleLeaveDecision = async (leaveId, status) => {
    try {
      const d = await apiRequest(`/employees/leaves/${leaveId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (d.success) {
        loadLeaves();
        loadKpis();
      }
    } catch { /* silent */ }
  };

  // Process Salary Payment
  const handlePaySalary = async (e) => {
    e.preventDefault();
    try {
      const d = await apiRequest("/employees/payroll/pay", {
        method: "POST",
        body: JSON.stringify(payForm),
      });
      if (d.success) {
        setPayModal(false);
        loadPayroll();
        loadKpis();
        alert(`✓ ${d.message}`);
      }
    } catch { /* silent */ }
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="Employees & Human Resource Management"
        subtitle="Staff Directory · Biometric Attendance Logs · Leave Approvals · Monthly Payroll & Salary Slips"
        t={t}
        actions={
          <>
            <BtnOutline t={t} onClick={handleMarkAllPresent}>
              ⚡ Quick Check-in (Mark All Present)
            </BtnOutline>
            <BtnOutline t={t} onClick={() => setLeaveModal(true)}>
              + Apply Leave
            </BtnOutline>
            <BtnOutline t={t} onClick={() => setAttModal(true)}>
              + Record Attendance
            </BtnOutline>
            <BtnPrimary
              onClick={() => {
                setSelectedEmp(null);
                setEmpForm({
                  name: "",
                  phone: "",
                  email: "",
                  role: "",
                  department: "",
                  salary: "",
                  joining_date: new Date().toISOString().split("T")[0],
                  pan: "",
                  aadhaar: "",
                  bank_account: "",
                  ifsc: "",
                  notes: "",
                });
                setAddModal(true);
              }}
            >
              + Add Employee
            </BtnPrimary>
          </>
        }
      />

      {/* ── Top KPI Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <StatCard label="Total Staff" value={kpis.total_employees || 0} color={BRAND.blue} t={t} />
        <StatCard label="Active Staff" value={kpis.active_employees || 0} color="#2ecc71" t={t} />
        <StatCard label="Present Today" value={kpis.present_today || 0} color="#3498db" t={t} />
        <StatCard label="On Leave Today" value={kpis.on_leave_today || 0} color="#9b59b6" t={t} />
        <StatCard label="Monthly Payroll" value={fmt(kpis.monthly_payroll)} color="#f0c040" t={t} />
        <StatCard
          label="Pending Leaves"
          value={kpis.pending_leaves || 0}
          color={kpis.pending_leaves > 0 ? BRAND.pink : t.textMuted}
          t={t}
        />
      </div>

      {/* ── Tabs Navigation ── */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: STAFF DIRECTORY                                                      */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "staff" && (
        <div>
          {/* Filters Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    background: roleFilter === r ? BRAND.gradBtn : t.card,
                    color: roleFilter === r ? "#fff" : t.textSub,
                    border: roleFilter === r ? "none" : `1px solid ${t.borderDash}`,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Search Staff Name, Phone, Code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  borderRadius: 9,
                  padding: "7px 12px",
                  fontSize: 13,
                  color: t.inputColor,
                  outline: "none",
                  width: 240,
                  fontFamily: "inherit",
                }}
              />
              <BtnSm t={t} onClick={loadEmployees}>
                ↻ Refresh
              </BtnSm>
            </div>
          </div>

          {/* Employee Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {employees.map((emp) => {
              const isPresent = emp.today_attendance === "Present";
              const isOnLeave = emp.today_attendance === "On Leave";

              return (
                <div
                  key={emp.id}
                  style={{
                    background: t.card,
                    border: `1px solid ${t.border}`,
                    borderRadius: 14,
                    padding: 18,
                    boxShadow: t.cardShadow,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.purple})`,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          fontWeight: 800,
                        }}
                      >
                        {emp.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{emp.name}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.blue }}>
                          {emp.emp_code} · {emp.role}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        background:
                          emp.status === "Active"
                            ? "rgba(46,204,113,0.12)"
                            : "rgba(230,59,138,0.12)",
                        color: emp.status === "Active" ? "#2ecc71" : BRAND.pink,
                        border: `1px solid ${emp.status === "Active" ? "rgba(46,204,113,0.3)" : "rgba(230,59,138,0.3)"}`,
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {emp.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div style={{ fontSize: 12, color: t.textSub, marginBottom: 12 }}>
                    <div> {emp.phone}</div>
                    <div> {emp.department}</div>
                  </div>

                  {/* Attendance & Salary Info */}
                  <div
                    style={{
                      background: t.card2 || t.card,
                      border: `1px solid ${t.borderDash}`,
                      borderRadius: 9,
                      padding: "10px 12px",
                      marginBottom: 14,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase" }}>Monthly Salary</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#2ecc71" }}>
                        {fmt(emp.salary)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase" }}>Today Attendance</div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isPresent ? "#2ecc71" : isOnLeave ? "#9b59b6" : BRAND.pink,
                        }}
                      >
                        {isPresent ? "✓ Present" : isOnLeave ? "● On Leave" : "● Absent / Unmarked"}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                    <BtnOutline
                      t={t}
                      style={{ flex: 1, padding: "6px 10px", fontSize: 11 }}
                      onClick={() => {
                        setSelectedEmp(emp);
                        setEmpForm({
                          name: emp.name,
                          phone: emp.phone,
                          email: emp.email || "",
                          role: emp.role,
                          department: emp.department || "Showroom Sales",
                          salary: String(emp.salary || 0),
                          joining_date: emp.joining_date ? emp.joining_date.split("T")[0] : "",
                          pan: emp.pan || "",
                          aadhaar: emp.aadhaar || "",
                          bank_account: emp.bank_account || "",
                          ifsc: emp.ifsc || "",
                          notes: emp.notes || "",
                        });
                        setEditModal(true);
                      }}
                    >
                      Edit Profile
                    </BtnOutline>
                    <BtnPrimary
                      style={{ padding: "6px 12px", fontSize: 11 }}
                      onClick={() => {
                        setAttForm((prev) => ({ ...prev, employee_id: String(emp.id) }));
                        setAttModal(true);
                      }}
                    >
                      Check-in
                    </BtnPrimary>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: DAILY ATTENDANCE LOGS                                                */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "attendance" && (
        <Card t={t}>
          <CardHeader
            title="Daily Staff Attendance Register"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: t.textSub }}>Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    background: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 12,
                    color: t.inputColor,
                    outline: "none",
                  }}
                />
                <BtnSm t={t} primary onClick={handleMarkAllPresent}>
                  ⚡ Mark All Present
                </BtnSm>
              </div>
            }
          />

          {attendanceList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: t.textMuted, fontSize: 13 }}>
              No attendance records logged for {fmtDate(selectedDate)}. Click <strong>Mark All Present</strong> or <strong>+ Record Attendance</strong>.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Emp Code</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Staff Name</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Role & Department</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Check In</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Check Out</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Hours</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.map((a) => (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{a.emp_code}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>{a.employee_name}</td>
                      <td style={{ padding: "10px 12px", color: t.textSub }}>{a.role} ({a.department})</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: t.text }}>{a.check_in || "10:00"}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: t.text }}>{a.check_out || "19:30"}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: t.text }}>
                        {a.hours_worked || 9.5}h
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            background:
                              a.status === "Present"
                                ? "rgba(46,204,113,0.12)"
                                : a.status === "On Leave"
                                ? "rgba(155,89,182,0.12)"
                                : "rgba(230,59,138,0.12)",
                            color:
                              a.status === "Present"
                                ? "#2ecc71"
                                : a.status === "On Leave"
                                ? "#9b59b6"
                                : BRAND.pink,
                            borderRadius: 12,
                            padding: "3px 10px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: LEAVE APPLICATIONS                                                   */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "leaves" && (
        <Card t={t}>
          <CardHeader
            title="Leave Applications & Approvals"
            t={t}
            actions={
              <BtnSm t={t} primary onClick={() => setLeaveModal(true)}>
                + Apply for Leave
              </BtnSm>
            }
          />
          {leavesList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: t.textMuted, fontSize: 13 }}>
              No leave applications submitted yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Employee</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Leave Type</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Duration</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Days</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Reason</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Status</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Manager Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {leavesList.map((l) => (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, color: t.text }}>{l.employee_name}</div>
                        <div style={{ fontSize: 11, color: BRAND.blue }}>{l.emp_code} · {l.role}</div>
                      </td>
                      <td style={{ padding: "10px 12px", color: t.textSub }}>{l.leave_type}</td>
                      <td style={{ padding: "10px 12px", color: t.text }}>
                        {fmtDate(l.from_date)} ➜ {fmtDate(l.to_date)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: t.text }}>
                        {l.days_count} Days
                      </td>
                      <td style={{ padding: "10px 12px", color: t.textSub, maxWidth: 220 }}>
                        {l.reason || "Personal / Family reason"}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            background:
                              l.status === "APPROVED"
                                ? "rgba(46,204,113,0.12)"
                                : l.status === "PENDING"
                                ? "rgba(243,156,18,0.12)"
                                : "rgba(230,59,138,0.12)",
                            color:
                              l.status === "APPROVED"
                                ? "#2ecc71"
                                : l.status === "PENDING"
                                ? "#f39c12"
                                : BRAND.pink,
                            borderRadius: 12,
                            padding: "3px 10px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        {l.status === "PENDING" ? (
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => handleLeaveDecision(l.id, "APPROVED")}
                              style={{
                                background: "rgba(46,204,113,0.15)",
                                border: "1px solid #2ecc71",
                                color: "#2ecc71",
                                borderRadius: 6,
                                padding: "4px 10px",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleLeaveDecision(l.id, "REJECTED")}
                              style={{
                                background: "rgba(230,59,138,0.15)",
                                border: `1px solid ${BRAND.pink}`,
                                color: BRAND.pink,
                                borderRadius: 6,
                                padding: "4px 10px",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                               Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: t.textMuted }}>
                            Decided by {l.approved_by || "Manager"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: MONTHLY PAYROLL & SALARY SLIPS                                      */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "payroll" && (
        <Card t={t}>
          <CardHeader
            title="Showroom Staff Monthly Payroll"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: t.textSub }}>Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    background: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 12,
                    color: t.inputColor,
                    outline: "none",
                  }}
                />
              </div>
            }
          />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Staff Code</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Name & Role</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Basic Pay</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Present / Absent</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Deductions</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Net Salary</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollList.map((p) => (
                  <tr key={p.employee_id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{p.emp_code}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 700, color: t.text }}>{p.employee_name}</div>
                      <div style={{ fontSize: 11, color: t.textMuted }}>{p.role}</div>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: t.text }}>{fmt(p.basic_salary)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: t.textSub }}>
                      {p.days_present || 30}P / {p.days_absent || 0}A
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: BRAND.pink }}>
                      {p.deductions > 0 ? `- ${fmt(p.deductions)}` : "₹0"}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#2ecc71" }}>
                      {fmt(p.net_salary)}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span
                        style={{
                          background:
                            p.payment_status === "PAID"
                              ? "rgba(46,204,113,0.12)"
                              : "rgba(243,156,18,0.12)",
                          color: p.payment_status === "PAID" ? "#2ecc71" : "#f39c12",
                          borderRadius: 12,
                          padding: "3px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {p.payment_status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {p.payment_status !== "PAID" && (
                          <BtnSm
                            t={t}
                            primary
                            onClick={() => {
                              setPayForm({
                                employee_id: p.employee_id,
                                payroll_month: selectedMonth,
                                basic_salary: p.basic_salary,
                                incentives_commission: 0,
                                deductions: p.deductions || 0,
                                payment_mode: "RTGS",
                              });
                              setPayModal(true);
                            }}
                          >
                            Pay Salary
                          </BtnSm>
                        )}
                        <BtnSm
                          t={t}
                          onClick={() => {
                            setSelectedPayslip(p);
                            setSlipModal(true);
                          }}
                        >
                           Slip
                        </BtnSm>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD / REGISTER EMPLOYEE                                              */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={addModal || editModal}
        onClose={() => {
          setAddModal(false);
          setEditModal(false);
        }}
        title={editModal ? `Edit Staff Profile — ${selectedEmp?.emp_code}` : "Register New Employee"}
        t={t}
        wide
        footer={
          <>
            <BtnOutline
              t={t}
              onClick={() => {
                setAddModal(false);
                setEditModal(false);
              }}
            >
              Cancel
            </BtnOutline>
            <BtnPrimary onClick={handleSaveEmployee}>Save Employee Profile</BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Full Name *" t={t} half>
            <Input
              t={t}
              placeholder="Full Name"
              value={empForm.name}
              onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Phone Number *" t={t} half>
            <Input
              t={t}
              placeholder="Phone Number"
              value={empForm.phone}
              onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
            />
          </FormGroup>
        </FormGrid>

        <FormGrid>
          <FormGroup label="Staff Role *" t={t} half>
            <Select
              t={t}
              value={empForm.role}
              onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
            >
              {ROLES.filter((r) => r !== "All").map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Department" t={t} half>
            <Select
              t={t}
              value={empForm.department}
              onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </FormGroup>
        </FormGrid>

        <FormGrid>
          <FormGroup label="Monthly Basic Salary (₹) *" t={t} half>
            <Input
              t={t}
              type="number"
              placeholder="Monthly Basic Salary"
              value={empForm.salary}
              onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Joining Date" t={t} half>
            <Input
              t={t}
              type="date"
              value={empForm.joining_date}
              onChange={(e) => setEmpForm({ ...empForm, joining_date: e.target.value })}
            />
          </FormGroup>
        </FormGrid>

        <FormGrid>
          <FormGroup label="PAN Card No" t={t} half>
            <Input
              t={t}
              placeholder="PAN Card No"
              value={empForm.pan}
              onChange={(e) => setEmpForm({ ...empForm, pan: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Aadhaar Card No" t={t} half>
            <Input
              t={t}
              placeholder="Aadhaar Card No"
              value={empForm.aadhaar}
              onChange={(e) => setEmpForm({ ...empForm, aadhaar: e.target.value })}
            />
          </FormGroup>
        </FormGrid>

        <FormGrid>
          <FormGroup label="Bank Account No" t={t} half>
            <Input
              t={t}
              placeholder="Bank Account No"
              value={empForm.bank_account}
              onChange={(e) => setEmpForm({ ...empForm, bank_account: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Bank IFSC Code" t={t} half>
            <Input
              t={t}
              placeholder="Bank IFSC Code"
              value={empForm.ifsc}
              onChange={(e) => setEmpForm({ ...empForm, ifsc: e.target.value })}
            />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: RECORD ATTENDANCE                                                    */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={attModal}
        onClose={() => setAttModal(false)}
        title="Record Daily Attendance"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setAttModal(false)}>
              Cancel
            </BtnOutline>
            <BtnPrimary onClick={handleMarkAttendance}>Save Attendance</BtnPrimary>
          </>
        }
      >
        <FormGroup label="Select Employee *" t={t}>
          <Select
            t={t}
            value={attForm.employee_id}
            onChange={(e) => setAttForm({ ...attForm, employee_id: e.target.value })}
          >
            <option value="">-- Choose Employee --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.emp_code} — {e.name} ({e.role})
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGrid>
          <FormGroup label="Attendance Date" t={t} half>
            <Input
              t={t}
              type="date"
              value={attForm.attendance_date}
              onChange={(e) => setAttForm({ ...attForm, attendance_date: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Status" t={t} half>
            <Select
              t={t}
              value={attForm.status}
              onChange={(e) => setAttForm({ ...attForm, status: e.target.value })}
            >
              <option>Present</option>
              <option>Absent</option>
              <option>Half Day</option>
              <option>On Leave</option>
            </Select>
          </FormGroup>
        </FormGrid>

        <FormGrid>
          <FormGroup label="Check In Time" t={t} half>
            <Input
              t={t}
              type="time"
              value={attForm.check_in}
              onChange={(e) => setAttForm({ ...attForm, check_in: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Check Out Time" t={t} half>
            <Input
              t={t}
              type="time"
              value={attForm.check_out}
              onChange={(e) => setAttForm({ ...attForm, check_out: e.target.value })}
            />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: APPLY FOR LEAVE                                                      */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={leaveModal}
        onClose={() => setLeaveModal(false)}
        title="Submit Leave Application"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setLeaveModal(false)}>
              Cancel
            </BtnOutline>
            <BtnPrimary onClick={handleSubmitLeave}>Submit Leave Request</BtnPrimary>
          </>
        }
      >
        <FormGroup label="Select Staff Member *" t={t}>
          <Select
            t={t}
            value={leaveForm.employee_id}
            onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })}
          >
            <option value="">-- Choose Employee --</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.emp_code} — {e.name} ({e.role})
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup label="Leave Type" t={t}>
          <Select
            t={t}
            value={leaveForm.leave_type}
            onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
          >
            <option>Casual Leave</option>
            <option>Sick Leave</option>
            <option>Paid Leave</option>
            <option>Emergency Leave</option>
          </Select>
        </FormGroup>

        <FormGrid>
          <FormGroup label="From Date *" t={t} half>
            <Input
              t={t}
              type="date"
              value={leaveForm.from_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="To Date *" t={t} half>
            <Input
              t={t}
              type="date"
              value={leaveForm.to_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
            />
          </FormGroup>
        </FormGrid>

        <FormGroup label="Reason for Leave" t={t}>
          <Input
            t={t}
            placeholder="Reason for Leave"
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
          />
        </FormGroup>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: PAY SALARY                                                           */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={payModal}
        onClose={() => setPayModal(false)}
        title="Process Monthly Salary Payment"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setPayModal(false)}>
              Cancel
            </BtnOutline>
            <BtnPrimary onClick={handlePaySalary}>Confirm Salary Transfer</BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Basic Salary (₹)" t={t} half>
            <Input t={t} value={fmt(payForm.basic_salary)} readOnly />
          </FormGroup>
          <FormGroup label="Deductions (₹)" t={t} half>
            <Input
              t={t}
              type="number"
              value={payForm.deductions}
              onChange={(e) => setPayForm({ ...payForm, deductions: e.target.value })}
            />
          </FormGroup>
        </FormGrid>

        <FormGrid>
          <FormGroup label="Sales Commission / Incentive (₹)" t={t} half>
            <Input
              t={t}
              type="number"
              value={payForm.incentives_commission}
              onChange={(e) => setPayForm({ ...payForm, incentives_commission: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Payment Mode" t={t} half>
            <Select
              t={t}
              value={payForm.payment_mode}
              onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })}
            >
              <option>RTGS / NEFT</option>
              <option>UPI</option>
              <option>Cash</option>
              <option>Cheque</option>
            </Select>
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: PRINT SALARY PAYSLIP                                                 */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={slipModal}
        onClose={() => setSlipModal(false)}
        title="Official Salary Payslip"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setSlipModal(false)}>
              Close
            </BtnOutline>
            <BtnPrimary onClick={() => window.print()}>🖨 Print Payslip</BtnPrimary>
          </>
        }
      >
        <div
          style={{
            background: "#ffffff",
            color: "#111",
            border: "2px solid #222",
            borderRadius: 8,
            padding: 24,
            fontFamily: "'Times New Roman', serif",
          }}
        >
          <div style={{ textAlign: "center", borderBottom: "2px solid #222", paddingBottom: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1.5, color: BRAND.purple }}>
              CERITAGE JEWELS SHOWROOM
            </div>
            <div style={{ fontSize: 11, fontStyle: "italic" }}>
              Monthly Employee Salary Payslip · {selectedPayslip?.payroll_month}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, marginBottom: 14 }}>
            <div><strong>Employee Code:</strong> {selectedPayslip?.emp_code}</div>
            <div><strong>Payslip No:</strong> {selectedPayslip?.payslip_no}</div>
            <div><strong>Employee Name:</strong> {selectedPayslip?.employee_name}</div>
            <div><strong>Designation:</strong> {selectedPayslip?.role}</div>
            <div><strong>Department:</strong> {selectedPayslip?.department}</div>
            <div><strong>Days Present:</strong> {selectedPayslip?.days_present} Days</div>
          </div>

          <div style={{ border: "1px solid #444", borderRadius: 4, padding: 12, marginBottom: 14, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Basic Salary:</span>
              <strong>{fmt(selectedPayslip?.basic_salary)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#27ae60" }}>
              <span>Sales Commission & Incentives:</span>
              <strong>+ {fmt(selectedPayslip?.incentives_commission || 0)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#e74c3c" }}>
              <span>Attendance & Leave Deductions:</span>
              <strong>- {fmt(selectedPayslip?.deductions || 0)}</strong>
            </div>
            <hr style={{ border: "0.5px solid #ccc", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: "bold" }}>
              <span>Net Salary Payable:</span>
              <span style={{ color: "#27ae60" }}>{fmt(selectedPayslip?.net_salary)}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, fontSize: 12 }}>
            <div>_______________________<br />Employee Signature</div>
            <div>_______________________<br />Showroom Director</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
