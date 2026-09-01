// ─── Ceritage ERP — Employees & Human Resource Management ─────────────────────
import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs,
  BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select, SectionTitle
} from "../../components/ui";

const API = window.__CERITAGE_API__ || "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("ceritage_token") || sessionStorage.getItem("ceritage_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

const TABS = [
  { id: "profiles",   label: "Staff Directory" },
  { id: "attendance", label: "Attendance Logs" },
  { id: "leaves",     label: "Leave Applications" },
  { id: "payroll",    label: "Payroll Summary" },
];

const ROLES = [
  "Store Manager", "Sales Associate", "Senior Goldsmith", "Accountant",
  "Cashier", "Inventory Specialist", "Security Officer", "Apprentice"
];

const fmt = (v) => "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function Employees({ t }) {
  const [tab, setTab] = useState("profiles");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // KPIs
  const [kpis, setKpis] = useState({
    total_employees: 0,
    active_employees: 0,
    monthly_payroll: 0,
    present_today: 0,
    on_leave_today: 0,
  });

  // State collections
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [attModal, setAttModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);

  // Forms
  const [empForm, setEmpForm] = useState({
    name: "", phone: "", email: "", role: "Sales Associate", salary: "", branch_id: 1
  });

  const [attForm, setAttForm] = useState({
    employee_id: "", attendance_date: new Date().toISOString().split("T")[0],
    status: "Present", check_in: "10:00", check_out: "19:30"
  });

  const [leaveForm, setLeaveForm] = useState({
    employee_id: "", leave_type: "Casual Leave",
    from_date: new Date().toISOString().split("T")[0],
    to_date: new Date().toISOString().split("T")[0],
    reason: ""
  });

  const notify = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const loadKpis = useCallback(async () => {
    try {
      const res = await fetch(`${API}/employees/kpis`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data) setKpis(json.data);
    } catch {
      // ignore
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API}/employees?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setEmployees(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  const loadAttendance = useCallback(async () => {
    try {
      const res = await fetch(`${API}/employees/attendance`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setAttendance(json.data);
    } catch {
      // ignore
    }
  }, []);

  const loadLeaves = useCallback(async () => {
    try {
      const res = await fetch(`${API}/employees/leaves`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setLeaves(json.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadKpis();
    loadEmployees();
    loadAttendance();
    loadLeaves();
  }, [loadKpis, loadEmployees, loadAttendance, loadLeaves]);

  // Submit Add Employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!empForm.name || !empForm.phone) {
      alert("Name and phone number are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/employees`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(empForm)
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || "Employee registered successfully");
        setAddModal(false);
        setEmpForm({ name: "", phone: "", email: "", role: "Sales Associate", salary: "", branch_id: 1 });
        loadEmployees();
        loadKpis();
      } else {
        alert(json.message || "Failed to register employee");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Attendance
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!attForm.employee_id) {
      alert("Please select an employee");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/employees/attendance`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(attForm)
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || "Attendance recorded");
        setAttModal(false);
        loadAttendance();
        loadKpis();
      } else {
        alert(json.message || "Failed to mark attendance");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Leave
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.employee_id) {
      alert("Please select an employee");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/employees/leaves`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(leaveForm)
      });
      const json = await res.json();
      if (json.success) {
        notify("Leave application submitted");
        setLeaveModal(false);
        loadLeaves();
        loadKpis();
      } else {
        alert(json.message || "Failed to submit leave");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Approve / Reject Leave
  const handleApproveLeave = async (leaveId, status) => {
    try {
      const res = await fetch(`${API}/employees/leaves/${leaveId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        notify(`Leave status updated to ${status}`);
        loadLeaves();
      } else {
        alert(json.message || "Failed to update status");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Employee & Human Resource Management"
        subtitle="Staff Directory · Biometric & Manual Attendance · Leave Approvals · Monthly Payroll"
        t={t}
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <BtnOutline t={t} onClick={() => setAttModal(true)}>⏱ Mark Attendance</BtnOutline>
            <BtnOutline t={t} onClick={() => setLeaveModal(true)}>🏖 Apply Leave</BtnOutline>
            <BtnPrimary onClick={() => setAddModal(true)}>+ Add Employee</BtnPrimary>
          </div>
        }
      />

      {successMsg && (
        <div style={{ background: "rgba(46,204,113,0.15)", border: "1px solid #2ecc71", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#2ecc71", fontSize: 13, fontWeight: 600 }}>
          ✓ {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(231,76,60,0.15)", border: "1px solid #e74c3c", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#e74c3c", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI Ribbon */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Staff"     value={kpis.total_employees} color={BRAND.blue} t={t} />
        <StatCard label="Active Staff"    value={kpis.active_employees} color="#2ecc71" t={t} />
        <StatCard label="Monthly Payroll" value={fmt(kpis.monthly_payroll)} color="#f0c040" t={t} />
        <StatCard label="Present Today"   value={kpis.present_today} color={BRAND.purple} t={t} />
        <StatCard label="On Leave Today"  value={kpis.on_leave_today} color={BRAND.pink} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* TAB 1: PROFILES */}
      {tab === "profiles" && (
        <Card t={t}>
          <CardHeader
            title="Employee Directory"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="Search name, phone, code..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 8, padding: "7px 12px", fontSize: 13,
                    color: t.inputColor, outline: "none", width: 220
                  }}
                />
                <Select t={t} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 130 }}>
                  <option value="ALL">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>
            }
          />
          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading employees...</p>
          ) : employees.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No employees registered yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["Code", "Full Name", "Role / Designation", "Branch", "Phone", "Email", "Monthly Salary", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map(e => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "11px 12px", fontFamily: "monospace", fontWeight: 600, color: BRAND.blue }}>{e.emp_code}</td>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{e.name}</td>
                      <td style={{ padding: "11px 12px", color: t.text }}>{e.role}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{e.branch_name || "Main Branch"}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{e.phone}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{e.email || "—"}</td>
                      <td style={{ padding: "11px 12px", color: "#2ecc71", fontWeight: 700 }}>{fmt(e.salary)}</td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{
                          background: e.status === "Active" ? "rgba(46,204,113,0.15)" : "rgba(231,76,60,0.15)",
                          color: e.status === "Active" ? "#2ecc71" : "#e74c3c",
                          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600
                        }}>
                          {e.status}
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

      {/* TAB 2: ATTENDANCE */}
      {tab === "attendance" && (
        <Card t={t}>
          <CardHeader
            title="Daily Attendance Register"
            t={t}
            actions={<BtnSm t={t} primary onClick={() => setAttModal(true)}>+ Mark Attendance</BtnSm>}
          />
          {attendance.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No attendance entries logged yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["Date", "Employee Name", "Role", "Check In", "Check Out", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(a.attendance_date)}</td>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{a.employee_name} ({a.emp_code})</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{a.role}</td>
                      <td style={{ padding: "11px 12px", color: t.text }}>{a.check_in || "10:00"}</td>
                      <td style={{ padding: "11px 12px", color: t.text }}>{a.check_out || "19:30"}</td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{
                          background: a.status === "Present" ? "rgba(46,204,113,0.15)" : a.status === "Half Day" ? "rgba(241,196,15,0.15)" : "rgba(231,76,60,0.15)",
                          color: a.status === "Present" ? "#2ecc71" : a.status === "Half Day" ? "#f1c40f" : "#e74c3c",
                          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600
                        }}>
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

      {/* TAB 3: LEAVES */}
      {tab === "leaves" && (
        <Card t={t}>
          <CardHeader
            title="Leave Applications & Approvals"
            t={t}
            actions={<BtnSm t={t} primary onClick={() => setLeaveModal(true)}>+ Apply Leave</BtnSm>}
          />
          {leaves.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No leave requests submitted.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["Employee", "Leave Type", "From Date", "To Date", "Reason", "Status", "Actions"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{l.employee_name} ({l.emp_code})</td>
                      <td style={{ padding: "11px 12px", color: t.text }}>{l.leave_type}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(l.from_date)}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(l.to_date)}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{l.reason || "—"}</td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{
                          background: l.status === "APPROVED" ? "rgba(46,204,113,0.15)" : l.status === "REJECTED" ? "rgba(231,76,60,0.15)" : "rgba(241,196,15,0.15)",
                          color: l.status === "APPROVED" ? "#2ecc71" : l.status === "REJECTED" ? "#e74c3c" : "#f1c40f",
                          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600
                        }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        {l.status === "PENDING" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <BtnSm t={t} primary onClick={() => handleApproveLeave(l.id, "APPROVED")}>Approve</BtnSm>
                            <BtnSm t={t} onClick={() => handleApproveLeave(l.id, "REJECTED")}>Reject</BtnSm>
                          </div>
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

      {/* TAB 4: PAYROLL */}
      {tab === "payroll" && (
        <Card t={t}>
          <CardHeader title="Monthly Payroll & Compensation Schedule" t={t} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["Code", "Employee", "Role", "Branch", "Basic Salary", "Disbursement Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "11px 12px", fontFamily: "monospace", color: BRAND.blue }}>{e.emp_code}</td>
                    <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{e.name}</td>
                    <td style={{ padding: "11px 12px", color: t.text }}>{e.role}</td>
                    <td style={{ padding: "11px 12px", color: t.subtext }}>{e.branch_name || "Main Branch"}</td>
                    <td style={{ padding: "11px 12px", color: "#2ecc71", fontWeight: 700 }}>{fmt(e.salary)}</td>
                    <td style={{ padding: "11px 12px" }}>
                      <span style={{ background: "rgba(46,204,113,0.15)", color: "#2ecc71", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        Scheduled (Auto-Credit)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── MODAL: ADD EMPLOYEE ───────────────────────────────────────── */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Register New Employee" t={t}>
        <form onSubmit={handleAddEmployee}>
          <SectionTitle t={t}>Employee Information</SectionTitle>
          <FormGrid>
            <FormGroup label="Full Name *" t={t} half>
              <Input t={t} placeholder="e.g. Anjali Gupta" value={empForm.name} onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Phone Number *" t={t} half>
              <Input t={t} placeholder="10-digit mobile" value={empForm.phone} onChange={e => setEmpForm(p => ({ ...p, phone: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Email Address" t={t} half>
              <Input t={t} type="email" placeholder="e.g. anjali@ceritage.com" value={empForm.email} onChange={e => setEmpForm(p => ({ ...p, email: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Role / Designation *" t={t} half>
              <Select t={t} value={empForm.role} onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Monthly Basic Salary (₹) *" t={t} half>
              <Input t={t} type="number" placeholder="e.g. 35000" value={empForm.salary} onChange={e => setEmpForm(p => ({ ...p, salary: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Branch Assignment" t={t} half>
              <Select t={t} value={empForm.branch_id} onChange={e => setEmpForm(p => ({ ...p, branch_id: Number(e.target.value) }))}>
                <option value={1}>Main Store (Branch #1)</option>
                <option value={2}>Surat Workshop (Branch #2)</option>
              </Select>
            </FormGroup>
          </FormGrid>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={loading}>{loading ? "Saving..." : "Save Employee"}</BtnPrimary>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: MARK ATTENDANCE ────────────────────────────────────── */}
      <Modal open={attModal} onClose={() => setAttModal(false)} title="Mark Employee Attendance" t={t}>
        <form onSubmit={handleMarkAttendance}>
          <FormGrid>
            <FormGroup label="Select Employee *" t={t} half>
              <Select t={t} value={attForm.employee_id} onChange={e => setAttForm(p => ({ ...p, employee_id: e.target.value }))} required>
                <option value="">-- Choose Employee --</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Date *" t={t} half>
              <Input t={t} type="date" value={attForm.attendance_date} onChange={e => setAttForm(p => ({ ...p, attendance_date: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Status *" t={t} half>
              <Select t={t} value={attForm.status} onChange={e => setAttForm(p => ({ ...p, status: e.target.value }))}>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Half Day">Half Day</option>
                <option value="On Leave">On Leave</option>
              </Select>
            </FormGroup>
            <FormGroup label="Check In Time" t={t} half>
              <Input t={t} type="time" value={attForm.check_in} onChange={e => setAttForm(p => ({ ...p, check_in: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Check Out Time" t={t} half>
              <Input t={t} type="time" value={attForm.check_out} onChange={e => setAttForm(p => ({ ...p, check_out: e.target.value }))} />
            </FormGroup>
          </FormGrid>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnOutline t={t} onClick={() => setAttModal(false)}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={loading}>{loading ? "Saving..." : "Log Attendance"}</BtnPrimary>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: APPLY LEAVE ────────────────────────────────────────── */}
      <Modal open={leaveModal} onClose={() => setLeaveModal(false)} title="Submit Leave Application" t={t}>
        <form onSubmit={handleLeaveSubmit}>
          <FormGrid>
            <FormGroup label="Select Employee *" t={t} half>
              <Select t={t} value={leaveForm.employee_id} onChange={e => setLeaveForm(p => ({ ...p, employee_id: e.target.value }))} required>
                <option value="">-- Choose Employee --</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Leave Type *" t={t} half>
              <Select t={t} value={leaveForm.leave_type} onChange={e => setLeaveForm(p => ({ ...p, leave_type: e.target.value }))}>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Privilege Leave">Privilege Leave</option>
                <option value="Maternity / Paternity">Maternity / Paternity</option>
              </Select>
            </FormGroup>
            <FormGroup label="From Date *" t={t} half>
              <Input t={t} type="date" value={leaveForm.from_date} onChange={e => setLeaveForm(p => ({ ...p, from_date: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="To Date *" t={t} half>
              <Input t={t} type="date" value={leaveForm.to_date} onChange={e => setLeaveForm(p => ({ ...p, to_date: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Reason / Notes" t={t}>
              <Input t={t} placeholder="e.g. Family medical emergency" value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} />
            </FormGroup>
          </FormGrid>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnOutline t={t} onClick={() => setLeaveModal(false)}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Application"}</BtnPrimary>
          </div>
        </form>
      </Modal>
    </div>
  );
}
