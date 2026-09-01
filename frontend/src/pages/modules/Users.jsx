// ─── Ceritage ERP — User Administration & RBAC Matrix ────────────────────────
import { useState, useEffect, useCallback } from "react";
import { BRAND } from "../../theme.js";
import {
  PageHeader, Card, CardHeader, StatCard, DataTable,
  BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
  Input, Select, Tabs, SectionTitle
} from "../../components/ui";

const API = window.__CERITAGE_API__ || "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("ceritage_token") || sessionStorage.getItem("ceritage_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

const ROLES = [
  { id: "admin",           label: "Admin / Super Admin", desc: "Full unrestricted access to all modules and configurations" },
  { id: "branch_manager",  label: "Branch Manager",      desc: "Full operational access to assigned branch" },
  { id: "accountant",      label: "Accountant",          desc: "Finance, ledgers, GST, EMI & accounting access" },
  { id: "sales",           label: "Sales Executive",     desc: "Billing/POS, customers, orders and products" },
  { id: "inventory",       label: "Inventory Manager",   desc: "Stock, catalogue, purchase and inward GRN" },
  { id: "cashier",         label: "Cashier",             desc: "Billing checkouts and payment collection only" },
  { id: "readonly",        label: "Read Only",           desc: "Audit & viewing access across reports" },
];

const MODULES = [
  { id: "dashboard",     label: "Dashboard & KPIs" },
  { id: "analytics",     label: "Analytics & Trends" },
  { id: "customers",     label: "Customer Directory & 360" },
  { id: "products",      label: "Product Catalogue & Stones" },
  { id: "billing",       label: "Billing / GST POS Invoicing" },
  { id: "purchase",      label: "Purchase Orders & GRN" },
  { id: "suppliers",     label: "Supplier Directory & Ledger" },
  { id: "rates",         label: "Live Metal Rates & Adjustments" },
  { id: "karigar",       label: "Karigar Workshop & Gold Issue" },
  { id: "orders",        label: "Custom Jewellery Orders" },
  { id: "repair",        label: "Repair Job Cards" },
  { id: "gold-exchange", label: "Old Metal & Gold Exchange" },
  { id: "emi",           label: "EMI & Credit Sales Management" },
  { id: "employees",     label: "Employees & Attendance" },
  { id: "communication", label: "WhatsApp & SMS Communications" },
  { id: "users",         label: "User Accounts & Security" },
];

const PAGE_TABS = [
  { id: "users",       label: "All Users" },
  { id: "add",         label: "+ Add User" },
  { id: "permissions", label: "Role Permission Matrix" },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function Users({ t }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Selected Role for Permission Matrix
  const [selectedRole, setSelectedRole] = useState("branch_manager");
  const [rolePermissions, setRolePermissions] = useState({});
  const [permSaving, setPermSaving] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    full_name: "", username: "", password: "", role: "sales", branch_id: 1, status: "active"
  });

  // Edit User Modal
  const [editModal, setEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const notify = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Load all users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/users`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setUsers(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load permissions for selected role
  const loadRolePermissions = useCallback(async (role) => {
    try {
      const res = await fetch(`${API}/users/roles/permissions/${role}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        setRolePermissions(json.data);
      } else {
        setRolePermissions({});
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (tab === "permissions") {
      loadRolePermissions(selectedRole);
    }
  }, [tab, selectedRole, loadRolePermissions]);

  // Create User Submit
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.full_name) {
      alert("Username, password, and full name are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newUser)
      });
      const json = await res.json();
      if (json.success) {
        notify(`User ${newUser.username} created successfully`);
        setNewUser({ full_name: "", username: "", password: "", role: "sales", branch_id: 1, status: "active" });
        setTab("users");
        loadUsers();
      } else {
        alert(json.message || "Failed to create user");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update User Submit
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/${editingUser.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(editingUser)
      });
      const json = await res.json();
      if (json.success) {
        notify("User updated successfully");
        setEditModal(false);
        loadUsers();
      } else {
        alert(json.message || "Failed to update user");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Single Permission in Matrix
  const togglePermission = (moduleId, permType) => {
    setRolePermissions(prev => {
      const current = prev[moduleId] || { view: false, edit: false, delete: false };
      return {
        ...prev,
        [moduleId]: {
          ...current,
          [permType]: !current[permType]
        }
      };
    });
  };

  // Save Role Permissions Matrix
  const handleSavePermissions = async () => {
    setPermSaving(true);
    try {
      const res = await fetch(`${API}/users/roles/permissions/${selectedRole}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ permissions: rolePermissions })
      });
      const json = await res.json();
      if (json.success) {
        notify(`Permissions updated for ${selectedRole}`);
      } else {
        alert(json.message || "Failed to update permissions");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setPermSaving(false);
    }
  };

  const activeCount = users.filter(u => u.status === "active" || u.status === "ACTIVE").length;
  const adminCount = users.filter(u => u.role === "admin").length;

  return (
    <div>
      <PageHeader
        title="User Accounts & Role Permissions (RBAC)"
        subtitle="Staff Authentication · Branch Assignment · Module Access Control Matrix"
        t={t}
        actions={<BtnPrimary onClick={() => setTab("add")}>+ Add New User</BtnPrimary>}
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
        <StatCard label="Total Users"    value={users.length} color={BRAND.blue} t={t} />
        <StatCard label="Active Staff"   value={activeCount} color="#2ecc71" t={t} />
        <StatCard label="Super Admins"   value={adminCount} color={BRAND.purple} t={t} />
        <StatCard label="Defined Roles"  value={ROLES.length} color="#f0c040" t={t} />
      </div>

      <Tabs tabs={PAGE_TABS} active={tab} onChange={setTab} t={t} />

      {/* TAB 1: ALL USERS */}
      {tab === "users" && (
        <Card t={t}>
          <CardHeader title="System Users" t={t} />
          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading user accounts...</p>
          ) : users.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No users found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["ID", "Full Name", "Username", "Role", "Branch", "Status", "Last Login", "Created", "Actions"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>#{u.id}</td>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{u.full_name}</td>
                      <td style={{ padding: "11px 12px", fontFamily: "monospace", color: BRAND.blue }}>{u.username}</td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{
                          background: u.role === "admin" ? "rgba(230,59,138,0.15)" : "rgba(59,85,230,0.15)",
                          color: u.role === "admin" ? BRAND.pink : BRAND.blue,
                          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: "capitalize"
                        }}>
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px", color: t.text }}>{u.branch_name || "Main Branch"}</td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{
                          background: u.status === "active" || u.status === "ACTIVE" ? "rgba(46,204,113,0.15)" : "rgba(231,76,60,0.15)",
                          color: u.status === "active" || u.status === "ACTIVE" ? "#2ecc71" : "#e74c3c",
                          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(u.last_login)}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(u.created_at)}</td>
                      <td style={{ padding: "11px 12px" }}>
                        <BtnSm t={t} onClick={() => { setEditingUser({ ...u, password: "" }); setEditModal(true); }}>
                          Edit / Reset
                        </BtnSm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: ADD USER */}
      {tab === "add" && (
        <Card t={t}>
          <CardHeader title="Create Staff User Account" t={t} />
          <form onSubmit={handleCreateUser} style={{ maxWidth: 700 }}>
            <SectionTitle t={t}>Account Credentials</SectionTitle>
            <FormGrid>
              <FormGroup label="Full Name *" t={t} half>
                <Input t={t} placeholder="e.g. Rahul Sharma" value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} required />
              </FormGroup>
              <FormGroup label="Username (Login ID) *" t={t} half>
                <Input t={t} placeholder="e.g. rahul.s" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value.toLowerCase().trim() }))} required />
              </FormGroup>
              <FormGroup label="Temporary Password *" t={t} half>
                <Input t={t} type="password" placeholder="At least 6 characters" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} required minLength={6} />
              </FormGroup>
              <FormGroup label="Assigned Role *" t={t} half>
                <Select t={t} value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Branch Assignment" t={t} half>
                <Select t={t} value={newUser.branch_id} onChange={e => setNewUser(p => ({ ...p, branch_id: Number(e.target.value) }))}>
                  <option value={1}>Main Store (Branch #1)</option>
                  <option value={2}>Surat Workshop (Branch #2)</option>
                </Select>
              </FormGroup>
              <FormGroup label="Account Status" t={t} half>
                <Select t={t} value={newUser.status} onChange={e => setNewUser(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </Select>
              </FormGroup>
            </FormGrid>
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <BtnPrimary type="submit" disabled={loading}>{loading ? "Creating..." : "Create User"}</BtnPrimary>
              <BtnOutline t={t} onClick={() => setTab("users")}>Cancel</BtnOutline>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: ROLE PERMISSION MATRIX */}
      {tab === "permissions" && (
        <div>
          <Card t={t} style={{ marginBottom: 16 }}>
            <CardHeader
              title="Select Role to Configure Permissions"
              t={t}
              actions={
                <BtnPrimary onClick={handleSavePermissions} disabled={permSaving}>
                  {permSaving ? "Saving Matrix..." : "💾 Save Permission Changes"}
                </BtnPrimary>
              }
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 16px" }}>
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  style={{
                    background: selectedRole === r.id ? BRAND.blue : t.card,
                    color: selectedRole === r.id ? "#fff" : t.text,
                    border: `1px solid ${selectedRole === r.id ? BRAND.blue : t.border}`,
                    borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Card>

          <Card t={t}>
            <CardHeader title={`Permission Rules for Role: ${selectedRole.toUpperCase()}`} t={t} />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 14px", color: t.subtext, fontWeight: 600 }}>Module / Feature</th>
                    <th style={{ textAlign: "center", padding: "10px 14px", color: t.subtext, fontWeight: 600 }}>Can View (Read)</th>
                    <th style={{ textAlign: "center", padding: "10px 14px", color: t.subtext, fontWeight: 600 }}>Can Edit (Create / Modify)</th>
                    <th style={{ textAlign: "center", padding: "10px 14px", color: t.subtext, fontWeight: 600 }}>Can Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map(m => {
                    const perm = rolePermissions[m.id] || { view: false, edit: false, delete: false };
                    return (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                        <td style={{ padding: "11px 14px", fontWeight: 600, color: t.text }}>{m.label}</td>
                        <td style={{ textAlign: "center", padding: "11px 14px" }}>
                          <input
                            type="checkbox"
                            checked={!!perm.view}
                            onChange={() => togglePermission(m.id, "view")}
                            style={{ width: 16, height: 16, cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ textAlign: "center", padding: "11px 14px" }}>
                          <input
                            type="checkbox"
                            checked={!!perm.edit}
                            onChange={() => togglePermission(m.id, "edit")}
                            style={{ width: 16, height: 16, cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ textAlign: "center", padding: "11px 14px" }}>
                          <input
                            type="checkbox"
                            checked={!!perm.delete}
                            onChange={() => togglePermission(m.id, "delete")}
                            style={{ width: 16, height: 16, cursor: "pointer" }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── MODAL: EDIT USER ──────────────────────────────────────────── */}
      {editingUser && (
        <Modal open={editModal} onClose={() => setEditModal(false)} title={`Edit User — ${editingUser.username}`} t={t}>
          <form onSubmit={handleUpdateUser}>
            <FormGrid>
              <FormGroup label="Full Name *" t={t} half>
                <Input t={t} value={editingUser.full_name} onChange={e => setEditingUser(p => ({ ...p, full_name: e.target.value }))} required />
              </FormGroup>
              <FormGroup label="Role *" t={t} half>
                <Select t={t} value={editingUser.role} onChange={e => setEditingUser(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Account Status *" t={t} half>
                <Select t={t} value={editingUser.status} onChange={e => setEditingUser(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormGroup>
              <FormGroup label="Reset Password (Leave blank to keep current)" t={t} half>
                <Input t={t} type="password" placeholder="New password" value={editingUser.password} onChange={e => setEditingUser(p => ({ ...p, password: e.target.value }))} minLength={6} />
              </FormGroup>
            </FormGrid>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <BtnOutline t={t} onClick={() => setEditModal(false)}>Cancel</BtnOutline>
              <BtnPrimary type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</BtnPrimary>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
