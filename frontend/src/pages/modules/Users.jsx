import { useState } from "react";
import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader, DataTable, BtnPrimary, BtnOutline, BtnSm,
         Modal, FormGroup, FormGrid, Input, Select, Tabs, SectionTitle } from "../../components/ui";

// ── Roles defined ──────────────────────────────────────────
const ROLES = [
  { id:"admin",           label:"Admin",           desc:"Full access to everything" },
  { id:"branch_manager",  label:"Branch Manager",  desc:"Full access to assigned branch" },
  { id:"accountant",      label:"Accountant",      desc:"Finance & reports access" },
  { id:"sales",           label:"Sales Executive", desc:"Billing, customers, products" },
  { id:"inventory",       label:"Inventory Manager",desc:"Stock & inventory access" },
  { id:"cashier",         label:"Cashier",         desc:"Billing & payments only" },
  { id:"readonly",        label:"Read Only",       desc:"View only — no edits" },
];

// ── All modules with default permissions per role ──────────
const MODULES = [
  { id:"dashboard",     label:"Dashboard" },
  { id:"analytics",     label:"Analytics" },
  { id:"customers",     label:"Customers" },
  { id:"products",      label:"Products & Inventory" },
  { id:"billing",       label:"Billing / GST Invoice" },
  { id:"sales",         label:"Sales" },
  { id:"purchase",      label:"Purchase" },
  { id:"gold-exchange", label:"Gold Exchange" },
  { id:"repair",        label:"Repair Job Card" },
  { id:"orders",        label:"Order Booking" },
  { id:"karigar",       label:"Karigar Management" },
  { id:"jangad",        label:"Jangad / Approval" },
  { id:"accounting",    label:"Accounting" },
  { id:"payments",      label:"Payment Modes" },
  { id:"emi",           label:"EMI & Credit" },
  { id:"gst",           label:"GST & Taxation" },
  { id:"tunch",         label:"Fine Metal Ledger" },
  { id:"compliance",    label:"TCS & Compliance" },
  { id:"inventory",     label:"Inventory" },
  { id:"hallmark",      label:"Hallmark & HUID" },
  { id:"rates",         label:"Gold & Silver Rates" },
  { id:"rfid",          label:"RFID & Tray Audit" },
  { id:"advance",       label:"Rate Lock / Advance" },
  { id:"employees",     label:"Employees" },
  { id:"suppliers",     label:"Suppliers" },
  { id:"branch",        label:"Multi-Branch" },
  { id:"reports",       label:"Reports" },
  { id:"users",         label:"Users & Roles" },
  { id:"security",      label:"Security" },
  { id:"ai",            label:"AI Features" },
  { id:"communication", label:"Communication" },
];

// Default permissions for each role
const DEFAULT_PERMISSIONS = {
  admin: Object.fromEntries(MODULES.map(m => [m.id, { view:true, edit:true, delete:true }])),
  branch_manager: Object.fromEntries(MODULES.map(m => [m.id, {
    view: !["users","security","branch"].includes(m.id),
    edit: !["users","security","branch","compliance","gst","accounting"].includes(m.id),
    delete: false,
  }])),
  accountant: Object.fromEntries(MODULES.map(m => [m.id, {
    view: ["dashboard","accounting","payments","emi","gst","tunch","compliance","reports","billing","sales","purchase"].includes(m.id),
    edit: ["accounting","payments","emi","gst","tunch","compliance"].includes(m.id),
    delete: false,
  }])),
  sales: Object.fromEntries(MODULES.map(m => [m.id, {
    view: ["dashboard","customers","products","billing","sales","gold-exchange","repair","orders","rates","inventory"].includes(m.id),
    edit: ["customers","billing","sales","repair","orders"].includes(m.id),
    delete: false,
  }])),
  inventory: Object.fromEntries(MODULES.map(m => [m.id, {
    view: ["dashboard","products","inventory","hallmark","rfid","rates","purchase","karigar"].includes(m.id),
    edit: ["products","inventory","hallmark","rfid","rates","karigar"].includes(m.id),
    delete: false,
  }])),
  cashier: Object.fromEntries(MODULES.map(m => [m.id, {
    view: ["dashboard","billing","payments","customers"].includes(m.id),
    edit: ["billing","payments"].includes(m.id),
    delete: false,
  }])),
  readonly: Object.fromEntries(MODULES.map(m => [m.id, { view:true, edit:false, delete:false }])),
};

const PAGE_TABS = [
  { id:"users",       label:"All Users" },
  { id:"add",         label:"+ Add User" },
  { id:"permissions", label:"Permission Matrix" },
];

export default function Users({ t }) {
  const [tab,        setTab]        = useState("users");
  const [editModal,  setEditModal]  = useState(false);
  const [permModal,  setPermModal]  = useState(false);
  const [selectedRole, setSelectedRole] = useState("branch_manager");
  const [permissions,  setPermissions]  = useState(DEFAULT_PERMISSIONS);
  const [newUser, setNewUser] = useState({
    name:"", username:"", password:"", role:"sales", branch:"Mumbai HQ", status:"Active"
  });

  // Toggle a single permission
  function togglePerm(role, moduleId, type) {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [moduleId]: {
          ...prev[role][moduleId],
          [type]: !prev[role][moduleId][type],
        }
      }
    }));
  }

  // Apply role defaults
  function resetRolePerms(role) {
    setPermissions(prev => ({ ...prev, [role]: DEFAULT_PERMISSIONS[role] }));
  }

  return (
    <div>
      <PageHeader title="Users & Roles"
        subtitle="Create user accounts · Assign roles · Set module-level permissions"
        t={t}
        actions={<BtnPrimary onClick={() => setTab("add")}>+ Add User</BtnPrimary>} />

      <Tabs tabs={PAGE_TABS} active={tab} onChange={setTab} t={t} />

      {/* ── ALL USERS ── */}
      {tab === "users" && (
        <Card t={t}>
          <CardHeader title="System Users" t={t}
            actions={<BtnSm t={t} primary onClick={() => setTab("add")}>+ Add User</BtnSm>} />
          <DataTable
            columns={["User","Username","Role","Branch","Status","Last Login","Actions"]}
            t={t}
            emptyMsg="No users found. Use + Add User to create the first user.
        </Card>
      )}

      {/* ── ADD USER ── */}
      {tab === "add" && (
        <Card t={t}>
          <CardHeader title="Create New User" t={t} />

          {/* Role cards */}
          <SectionTitle t={t}>Step 1 — Role Select Karo</SectionTitle>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",
            gap:12, marginBottom:22 }}>
            {ROLES.map((role) => (
              <div key={role.id}
                onClick={() => setNewUser(u => ({ ...u, role: role.id }))}
                style={{
                  background: newUser.role === role.id
                    ? `linear-gradient(135deg,${BRAND.blue}22,${BRAND.purple}15)`
                    : t.card2 || t.card,
                  border: newUser.role === role.id
                    ? `2px solid ${BRAND.purple}`
                    : `1px solid ${t.borderDash}`,
                  borderRadius:10, padding:"14px 16px", cursor:"pointer",
                  transition:"all 0.15s",
                }}>
                <div style={{ fontSize:13, fontWeight:700,
                  color: newUser.role === role.id ? BRAND.purple : t.text,
                  marginBottom:4 }}>
                  {role.label}
                </div>
                <div style={{ fontSize:11, color:t.textFaint, lineHeight:1.5 }}>
                  {role.desc}
                </div>
              </div>
            ))}
          </div>

          <SectionTitle t={t}>Step 2 — User Details</SectionTitle>
          <FormGrid>
            <FormGroup label="Full Name *"  t={t} half>
              <Input t={t} placeholder="e.g. Rahul Sharma"
                value={newUser.name}
                onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Username *"   t={t} half>
              <Input t={t} placeholder="e.g. rahul.sharma"
                value={newUser.username}
                onChange={e => setNewUser(u => ({ ...u, username: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Password *"   t={t} half>
              <Input t={t} type="password" placeholder="Set password"
                value={newUser.password}
                onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Assign Branch" t={t} half>
              <Select t={t}
                value={newUser.branch}
                onChange={e => setNewUser(u => ({ ...u, branch: e.target.value }))}>
                <option>Mumbai HQ</option>
                <option>Delhi</option>
                <option>Jaipur</option>
                <option>All Branches</option>
              </Select>
            </FormGroup>
          </FormGrid>

          {/* Permission preview for selected role */}
          <SectionTitle t={t}>Step 3 — Permissions Preview ({ROLES.find(r => r.id === newUser.role)?.label})</SectionTitle>
          <div style={{ background: t.card2 || t.card,
            border:`1px solid ${t.borderDash}`, borderRadius:10,
            padding:"12px 16px", marginBottom:18 }}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {MODULES.filter(m => permissions[newUser.role]?.[m.id]?.view).map(m => (
                <span key={m.id} style={{
                  background:`${BRAND.blue}18`, color:BRAND.blue,
                  border:`1px solid ${BRAND.blue}33`,
                  borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:600 }}>
                  {m.label}
                </span>
              ))}
            </div>
            <div style={{ marginTop:10, fontSize:11, color:t.textFaint }}>
              Sirf yahi modules is user ko dikhenge. Fine-tune karne ke liye "Permission Matrix" tab mein jao.
            </div>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <BtnOutline t={t} onClick={() => { setSelectedRole(newUser.role); setTab("permissions"); }}>
              Fine-tune Permissions
            </BtnOutline>
            <BtnPrimary onClick={() => {
              setTab("users");
              setNewUser({ name:"", username:"", password:"", role:"sales", branch:"Mumbai HQ", status:"Active" });
            }}>
              Create User
            </BtnPrimary>
          </div>
        </Card>
      )}

      {/* ── PERMISSION MATRIX ── */}
      {tab === "permissions" && (
        <Card t={t}>
          <CardHeader title="Permission Matrix" t={t}
            actions={
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <Select t={t} style={{ width:180 }}
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}>
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </Select>
                <BtnSm t={t} onClick={() => resetRolePerms(selectedRole)}>
                  Reset Defaults
                </BtnSm>
                <BtnSm t={t} primary>Save Permissions</BtnSm>
              </div>
            } />

          {/* Legend */}
          <div style={{ display:"flex", gap:16, marginBottom:16, fontSize:12, color:t.textMuted }}>
            <span style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:14, height:14, borderRadius:3,
                background:BRAND.gradBtn }} /> View
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:14, height:14, borderRadius:3,
                background:"#2ecc71" }} /> Edit
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:14, height:14, borderRadius:3,
                background:BRAND.pink }} /> Delete
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:14, height:14, borderRadius:3,
                background:t.borderDash, border:`1px solid ${t.borderDash}` }} /> No Access
            </span>
          </div>

          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign:"left", padding:"10px 14px",
                    color:t.textMuted, fontWeight:600, fontSize:11,
                    textTransform:"uppercase", letterSpacing:"0.5px",
                    borderBottom:`1px solid ${t.borderDash}`, width:220 }}>
                    Module
                  </th>
                  {["View","Edit","Delete"].map(col => (
                    <th key={col} style={{ textAlign:"center", padding:"10px 14px",
                      color:t.textMuted, fontWeight:600, fontSize:11,
                      textTransform:"uppercase", letterSpacing:"0.5px",
                      borderBottom:`1px solid ${t.borderDash}`, width:90 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod, i) => {
                  const perms = permissions[selectedRole]?.[mod.id] || { view:false, edit:false, delete:false };
                  return (
                    <tr key={mod.id}
                      style={{ background: i % 2 === 0 ? "transparent" : (t.card2 || t.card),
                        borderBottom:`1px solid ${t.borderDash}` }}>
                      <td style={{ padding:"10px 14px", color:t.textSub, fontWeight:500 }}>
                        {mod.label}
                      </td>
                      {/* View */}
                      <td style={{ textAlign:"center", padding:"10px 14px" }}>
                        <button
                          onClick={() => togglePerm(selectedRole, mod.id, "view")}
                          style={{ width:28, height:28, borderRadius:6, cursor:"pointer",
                            border:"none", fontFamily:"inherit",
                            background: perms.view ? BRAND.gradBtn : t.borderDash,
                            color: perms.view ? "#fff" : t.textFaint,
                            fontSize:14, display:"inline-flex",
                            alignItems:"center", justifyContent:"center" }}>
                          {perms.view ? "✓" : "–"}
                        </button>
                      </td>
                      {/* Edit */}
                      <td style={{ textAlign:"center", padding:"10px 14px" }}>
                        <button
                          onClick={() => togglePerm(selectedRole, mod.id, "edit")}
                          disabled={!perms.view}
                          style={{ width:28, height:28, borderRadius:6,
                            cursor: perms.view ? "pointer" : "not-allowed",
                            border:"none", fontFamily:"inherit",
                            background: perms.edit ? "#2ecc71" : t.borderDash,
                            color: perms.edit ? "#fff" : t.textFaint,
                            fontSize:14, opacity: perms.view ? 1 : 0.4,
                            display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                          {perms.edit ? "✓" : "–"}
                        </button>
                      </td>
                      {/* Delete */}
                      <td style={{ textAlign:"center", padding:"10px 14px" }}>
                        <button
                          onClick={() => togglePerm(selectedRole, mod.id, "delete")}
                          disabled={!perms.edit}
                          style={{ width:28, height:28, borderRadius:6,
                            cursor: perms.edit ? "pointer" : "not-allowed",
                            border:"none", fontFamily:"inherit",
                            background: perms.delete ? BRAND.pink : t.borderDash,
                            color: perms.delete ? "#fff" : t.textFaint,
                            fontSize:14, opacity: perms.edit ? 1 : 0.4,
                            display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                          {perms.delete ? "✓" : "–"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:16 }}>
            <BtnOutline t={t} onClick={() => resetRolePerms(selectedRole)}>Reset Defaults</BtnOutline>
            <BtnPrimary>Save Permissions</BtnPrimary>
          </div>
        </Card>
      )}
    </div>
  );
}
