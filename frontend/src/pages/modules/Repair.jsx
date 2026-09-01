import { BRAND } from "../../theme.js";
import { useState, useEffect } from "react";
import {PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
  BtnPrimary, BtnOutline, BtnSm, Modal,
  FormGroup, FormGrid, Input, Select, SectionTitle,
} from "../../components/ui";

const API = window.__CERITAGE_API__ || "http://localhost:5000/api";
function authHeaders() {
  const token = localStorage.getItem("ceritage_token") || sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const TABS = [
  { id: "list",   label: "All Jobs" },
  { id: "active", label: "Active" },
  { id: "ready",  label: "Ready for Pickup" },
  { id: "new",    label: "New Job" },
];

const STATUS_LIST = ["Received", "In Progress", "Ready", "Delivered", "Cancelled"];

const STATUS_COLORS = {
  "Received":   { bg: "rgba(59,85,230,0.12)",  color: BRAND.blue,   border: "rgba(59,85,230,0.3)"  },
  "In Progress":{ bg: "rgba(243,156,18,0.12)", color: "#f39c12",    border: "rgba(243,156,18,0.3)" },
  "Ready":      { bg: "rgba(46,204,113,0.12)", color: "#2ecc71",    border: "rgba(46,204,113,0.3)" },
  "Delivered":  { bg: "rgba(139,59,200,0.12)", color: BRAND.purple, border: "rgba(139,59,200,0.3)" },
  "Cancelled":  { bg: "rgba(230,59,138,0.12)", color: BRAND.pink,   border: "rgba(230,59,138,0.3)" },
};

const EMPTY_FORM = {
  customer_id: "", item_name: "", item_type: "Ring",
  metal: "Gold", purity: "22K (916)", weight_g: "",
  issue_desc: "", work_to_do: "",
  received_date: new Date().toISOString().split("T")[0],
  promised_date: "", estimated_cost: "", advance_paid: "0",
  assigned_to: "", notes: "",
};

const ITEM_TYPES = ["Ring","Necklace","Bangles","Earrings","Bracelet","Chain","Pendant","Kada","Other"];
const METALS     = ["Gold","Silver","Platinum","White Gold","Rose Gold"];

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS["Received"];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
      {status}
    </span>
  );
}

// ── Print Job Card ────────────────────────────────────────────────────────────
function printJobCard(job) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Job Card ${job.job_no}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; color: #333; }
  .header { display:flex; justify-content:space-between; border-bottom: 2px solid #8B3BC8; padding-bottom: 10px; margin-bottom: 14px; }
  .logo { font-size: 18px; font-weight: 800; color: #8B3BC8; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .field { background: #f9f6ff; padding: 8px; border-radius: 5px; }
  .label { font-size: 10px; color: #888; text-transform: uppercase; }
  .value { font-weight: 600; margin-top: 2px; }
  .issue { background: #fff3e0; border: 1px solid #f39c12; border-radius: 5px; padding: 8px; margin-bottom: 10px; }
  .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 8px; }
  .sign { display: flex; justify-content: space-between; margin-top: 30px; }
  .sign-box { text-align: center; border-top: 1px solid #333; width: 150px; padding-top: 5px; font-size: 11px; }
  @media print { body { padding: 8px; } }
</style></head><body>
<div class="header">
  <div><div class="logo">CERITAGE JEWELRY</div><div style="font-size:11px;color:#777">Repair Job Card</div></div>
  <div style="text-align:right">
    <div style="font-weight:800;font-size:16px;color:#8B3BC8">${job.job_no}</div>
    <div style="font-size:11px;color:#777">Date: ${job.received_date ? new Date(job.received_date).toLocaleDateString("en-IN") : ""}</div>
  </div>
</div>
<div class="grid">
  <div class="field"><div class="label">Customer</div><div class="value">${job.customer_name || "Walk-in"}</div></div>
  <div class="field"><div class="label">Phone</div><div class="value">${job.customer_phone || "—"}</div></div>
  <div class="field"><div class="label">Item</div><div class="value">${job.item_name} (${job.item_type || ""})</div></div>
  <div class="field"><div class="label">Metal / Purity</div><div class="value">${job.metal || ""} ${job.purity || ""}</div></div>
  <div class="field"><div class="label">Weight</div><div class="value">${job.weight_g ? job.weight_g + "g" : "—"}</div></div>
  <div class="field"><div class="label">Promised Date</div><div class="value">${job.promised_date ? new Date(job.promised_date).toLocaleDateString("en-IN") : "—"}</div></div>
  <div class="field"><div class="label">Estimated Cost</div><div class="value">Rs.${parseFloat(job.estimated_cost||0).toLocaleString("en-IN")}</div></div>
  <div class="field"><div class="label">Advance Paid</div><div class="value">Rs.${parseFloat(job.advance_paid||0).toLocaleString("en-IN")}</div></div>
</div>
<div class="issue"><div class="label">Issue / Problem</div><div style="margin-top:4px">${job.issue_desc || "—"}</div></div>
${job.work_to_do ? `<div class="issue" style="background:#e8f5e9;border-color:#2ecc71"><div class="label">Work to be Done</div><div style="margin-top:4px">${job.work_to_do}</div></div>` : ""}
<div class="sign">
  <div class="sign-box">Customer Signature</div>
  <div class="sign-box">Karigar / Technician</div>
  <div class="sign-box">Received By</div>
</div>
<div class="footer">Ceritage Jewelry — This is a computer-generated job card</div>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1200);}</script>
</body></html>`;
  const w = window.open("", "_blank", "width=800,height=600");
  if (w) { w.document.write(html); w.document.close(); }
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Repair({ t }) {
  const [tab,        setTab]        = useState("list");
  const [jobs,       setJobs]       = useState([]);
  const [kpis,       setKpis]       = useState({});
  const [customers,  setCustomers]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState("");
  const [statusFilter,setStatusFilter] = useState("");

  // Modals
  const [addModal,    setAddModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [viewModal,   setViewModal]   = useState(false);
  const [selJob,      setSelJob]      = useState(null);

  // Form
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editId,     setEditId]     = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState("");

  // Status update
  const [newStatus,    setNewStatus]    = useState("");
  const [actualCost,   setActualCost]   = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  async function fetchKpis() {
    try {
      const r = await fetch(`${API}/repair/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data || {});
    } catch {}
  }

  async function fetchJobs(statusOverride) {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: 200, _t: Date.now() });
      const s = statusOverride !== undefined ? statusOverride : statusFilter;
      if (s)      p.append("status", s);
      if (search) p.append("search", search);
      const r = await fetch(`${API}/repair?${p}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setJobs(d.data || []);
    } catch {}
    setLoading(false);
  }

  async function fetchCustomers() {
    try {
      const r = await fetch(`${API}/customers?limit=200`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setCustomers(d.data || []);
    } catch {}
  }

  useEffect(() => { fetchKpis(); fetchJobs(); fetchCustomers(); }, []); // eslint-disable-line
  useEffect(() => { fetchJobs(); }, [search, statusFilter]); // eslint-disable-line

  useEffect(() => {
    if (tab === "active") { setStatusFilter("In Progress"); fetchJobs("In Progress"); }
    else if (tab === "ready") { setStatusFilter("Ready"); fetchJobs("Ready"); }
    else { setStatusFilter(""); fetchJobs(""); }
  }, [tab]); // eslint-disable-line

  // ── Handlers ─────────────────────────────────────────────────────────────
  function onChange(key) {
    return e => setForm(p => ({ ...p, [key]: e.target.value }));
  }

  async function handleSave() {
    if (!form.item_name.trim()) { setFormError("Item name is required."); return; }
    if (!form.issue_desc.trim()) { setFormError("Issue description is required."); return; }
    setSaving(true); setFormError("");
    try {
      const url    = editId ? `${API}/repair/${editId}` : `${API}/repair`;
      const method = editId ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setFormError(d.message || "Failed to save."); setSaving(false); return; }
      setAddModal(false); setEditModal(false);
      setForm(EMPTY_FORM); setEditId(null); setFormError("");
      fetchJobs(); fetchKpis();
      if (method === "POST" && d.data) {
        // Show print option
        setTimeout(() => {
          if (window.confirm(`Job ${d.data.job_no} created! Print job card?`)) {
            fetch(`${API}/repair/${d.data.id}`, { headers: authHeaders() })
              .then(r => r.json()).then(d => { if (d.success) printJobCard(d.data); });
          }
        }, 200);
      }
    } catch { setFormError("Cannot connect to server."); }
    setSaving(false);
  }

  function openEdit(job) {
    setEditId(job.id);
    setForm({
      customer_id:    String(job.customer_id || ""),
      item_name:      job.item_name       || "",
      item_type:      job.item_type       || "Ring",
      metal:          job.metal           || "Gold",
      purity:         job.purity          || "",
      weight_g:       job.weight_g        || "",
      issue_desc:     job.issue_desc      || "",
      work_to_do:     job.work_to_do      || "",
      received_date:  job.received_date   ? job.received_date.split("T")[0] : "",
      promised_date:  job.promised_date   ? job.promised_date.split("T")[0] : "",
      estimated_cost: job.estimated_cost  || "",
      advance_paid:   job.advance_paid    || "0",
      assigned_to:    job.assigned_to     || "",
      notes:          job.notes           || "",
    });
    setFormError(""); setEditModal(true);
  }

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setStatusSaving(true);
    try {
      const r = await fetch(`${API}/repair/${selJob.id}/status`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ status: newStatus, actual_cost: actualCost || null, delivery_date: deliveryDate || null }),
      });
      const d = await r.json();
      if (d.success) {
        setStatusModal(false); setNewStatus(""); setActualCost(""); setDeliveryDate("");
        fetchJobs(); fetchKpis();
      }
    } catch {}
    setStatusSaving(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this repair job?")) return;
    try {
      await fetch(`${API}/repair/${id}`, { method: "DELETE", headers: authHeaders() });
      fetchJobs(); fetchKpis();
    } catch {}
  }

  // ── Rows ─────────────────────────────────────────────────────────────────
  const rows = jobs.map(job => {
    const isOverdue = job.promised_date && new Date(job.promised_date) < new Date() && !["Delivered","Cancelled"].includes(job.status);
    return {
      "Job No":   <span style={{ fontFamily:"monospace", fontWeight:700, color:BRAND.purple }}>{job.job_no}</span>,
      "Customer": (
        <div>
          <div style={{ fontWeight:600, color:t.text, fontSize:13 }}>{job.customer_name || "Walk-in"}</div>
          <div style={{ fontSize:11, color:t.textMuted }}>{job.customer_phone || ""}</div>
        </div>
      ),
      "Item":     (
        <div>
          <div style={{ fontWeight:600, color:t.text }}>{job.item_name}</div>
          <div style={{ fontSize:11, color:t.textMuted }}>{job.metal} {job.purity}</div>
        </div>
      ),
      "Issue":    <span style={{ fontSize:12, color:t.textSub }}>{(job.issue_desc||"").slice(0,40)}{(job.issue_desc||"").length>40?"...":""}</span>,
      "Promised": (
        <span style={{ color: isOverdue ? BRAND.pink : t.textSub, fontWeight: isOverdue ? 700 : 400 }}>
          {job.promised_date ? new Date(job.promised_date).toLocaleDateString("en-IN") : "—"}
          {isOverdue && " OVERDUE"}
        </span>
      ),
      "Est. Cost":`Rs.${parseFloat(job.estimated_cost||0).toLocaleString("en-IN")}`,
      "Status":   <StatusBadge status={job.status} />,
      "Actions":  (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          <button onClick={() => { setSelJob(job); setViewModal(true); }}
            style={{ background:"none", border:`1px solid ${BRAND.blue}`, borderRadius:6, color:BRAND.blue, fontSize:11, padding:"3px 9px", cursor:"pointer" }}>
            View
          </button>
          <button onClick={() => openEdit(job)}
            style={{ background:BRAND.gradBtn, border:"none", borderRadius:6, color:"#fff", fontSize:11, padding:"3px 9px", cursor:"pointer" }}>
            Edit
          </button>
          <button onClick={() => { setSelJob(job); setNewStatus(job.status); setActualCost(job.actual_cost||""); setDeliveryDate(job.delivery_date ? job.delivery_date.split("T")[0] : ""); setStatusModal(true); }}
            style={{ background:"none", border:`1px solid #f39c12`, borderRadius:6, color:"#f39c12", fontSize:11, padding:"3px 9px", cursor:"pointer" }}>
            Status
          </button>
          <button onClick={() => printJobCard(job)}
            style={{ background:"none", border:`1px solid ${BRAND.purple}`, borderRadius:6, color:BRAND.purple, fontSize:11, padding:"3px 9px", cursor:"pointer" }}>
            Print
          </button>
          <button onClick={() => handleDelete(job.id)}
            style={{ background:"none", border:`1px solid ${BRAND.pink}`, borderRadius:6, color:BRAND.pink, fontSize:11, padding:"3px 9px", cursor:"pointer" }}>
            Delete
          </button>
        </div>
      ),
    };
  });

  // ── Repair Form ───────────────────────────────────────────────────────────
  const RepairForm = () => (
    <>
      <SectionTitle t={t}>Customer & Item Details</SectionTitle>
      <FormGrid>
        <FormGroup label="Customer" t={t} half>
          <Select t={t} value={form.customer_id} onChange={onChange("customer_id")}>
            <option value="">Walk-in / No Customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Item Name *" t={t} half>
          <Input t={t} placeholder="e.g. Gold Ring, Necklace" value={form.item_name} onChange={onChange("item_name")} />
        </FormGroup>
        <FormGroup label="Item Type" t={t} half>
          <Select t={t} value={form.item_type} onChange={onChange("item_type")}>
            {ITEM_TYPES.map(i => <option key={i}>{i}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Metal" t={t} half>
          <Select t={t} value={form.metal} onChange={onChange("metal")}>
            {METALS.map(m => <option key={m}>{m}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Purity" t={t} half>
          <Input t={t} placeholder="e.g. 22K (916)" value={form.purity} onChange={onChange("purity")} />
        </FormGroup>
        <FormGroup label="Weight (g)" t={t} half>
          <Input t={t} type="number" step="0.001" placeholder="0.000" value={form.weight_g} onChange={onChange("weight_g")} />
        </FormGroup>
      </FormGrid>

      <SectionTitle t={t}>Issue & Work</SectionTitle>
      <FormGrid>
        <FormGroup label="Issue / Problem *" t={t}>
          <textarea rows={3} placeholder="Describe the problem in detail..."
            value={form.issue_desc} onChange={onChange("issue_desc")}
            style={{ width:"100%", background:t.inputBg, border:`1.5px solid ${t.inputBorder}`,
              borderRadius:9, padding:"10px 13px", fontSize:13, color:t.inputColor,
              outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical" }} />
        </FormGroup>
        <FormGroup label="Work to be Done" t={t}>
          <textarea rows={2} placeholder="What work needs to be done..."
            value={form.work_to_do} onChange={onChange("work_to_do")}
            style={{ width:"100%", background:t.inputBg, border:`1.5px solid ${t.inputBorder}`,
              borderRadius:9, padding:"10px 13px", fontSize:13, color:t.inputColor,
              outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical" }} />
        </FormGroup>
      </FormGrid>

      <SectionTitle t={t}>Dates & Cost</SectionTitle>
      <FormGrid>
        <FormGroup label="Received Date *" t={t} half>
          <Input t={t} type="date" value={form.received_date} onChange={onChange("received_date")} />
        </FormGroup>
        <FormGroup label="Promise Date" t={t} half>
          <Input t={t} type="date" value={form.promised_date} onChange={onChange("promised_date")} />
        </FormGroup>
        <FormGroup label="Estimated Cost (Rs.)" t={t} half>
          <Input t={t} type="number" step="0.01" placeholder="0.00" value={form.estimated_cost} onChange={onChange("estimated_cost")} />
        </FormGroup>
        <FormGroup label="Advance Paid (Rs.)" t={t} half>
          <Input t={t} type="number" step="0.01" placeholder="0.00" value={form.advance_paid} onChange={onChange("advance_paid")} />
        </FormGroup>
        <FormGroup label="Assigned To (Karigar)" t={t} half>
          <Input t={t} placeholder="Karigar / Technician name" value={form.assigned_to} onChange={onChange("assigned_to")} />
        </FormGroup>
        <FormGroup label="Notes" t={t} half>
          <Input t={t} placeholder="Any additional notes..." value={form.notes} onChange={onChange("notes")} />
        </FormGroup>
      </FormGrid>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Repair Job Card"
        subtitle="Track jewellery repairs | Job cards | Status updates | Print slips"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={() => { setTab("list"); setStatusFilter(""); }}>All Jobs</BtnOutline>
          <BtnPrimary onClick={() => { setForm(EMPTY_FORM); setEditId(null); setFormError(""); setAddModal(true); }}>
            + New Repair Job
          </BtnPrimary>
        </>} />

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Total Jobs"    value={kpis.total       ?? "—"} color={BRAND.blue}   t={t} />
        <StatCard label="Received"      value={kpis.received    ?? "—"} color="#3498db"       t={t} />
        <StatCard label="In Progress"   value={kpis.in_progress ?? "—"} color="#f39c12"       t={t} />
        <StatCard label="Ready"         value={kpis.ready       ?? "—"} color="#2ecc71"       t={t} />
        <StatCard label="Overdue"       value={kpis.overdue     ?? "—"} color={BRAND.pink}    t={t} />
        <StatCard label="Delivered"     value={kpis.delivered   ?? "—"} color={BRAND.purple}  t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* New Job inline */}
      {tab === "new" && (
        <Card t={t}>
          <CardHeader title="New Repair Job" t={t} />
          <RepairForm />
          {formError && <div style={{ color:BRAND.pink, fontSize:13, marginTop:10 }}>{formError}</div>}
          <div style={{ display:"flex", gap:10, marginTop:16, justifyContent:"flex-end" }}>
            <BtnOutline t={t} onClick={() => { setForm(EMPTY_FORM); setFormError(""); }}>Reset</BtnOutline>
            <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Create Job Card"}</BtnPrimary>
          </div>
        </Card>
      )}

      {/* Job list */}
      {tab !== "new" && (
        <Card t={t}>
          <CardHeader
            title={loading ? "Loading..." : `${tab === "active" ? "Active Jobs" : tab === "ready" ? "Ready for Pickup" : "All Repair Jobs"} (${jobs.length})`}
            t={t}
            actions={<>
              <div style={{ position:"relative" }}>
                <input placeholder="Search job no, customer, item..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ background:t.inputBg, border:`1px solid ${t.inputBorder}`, borderRadius:8,
                    padding:"7px 12px 7px 32px", fontSize:13, color:t.inputColor,
                    outline:"none", fontFamily:"inherit", width:200 }} />
                <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:t.textMuted, fontSize:14 }}>?</span>
              </div>
              {tab === "list" && (
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  style={{ background:t.inputBg, border:`1px solid ${t.inputBorder}`, borderRadius:8,
                    padding:"7px 12px", fontSize:13, color:t.inputColor, outline:"none", fontFamily:"inherit" }}>
                  <option value="">All Status</option>
                  {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                </select>
              )}
            </>} />
          {loading
            ? <div style={{ textAlign:"center", padding:32, color:t.textFaint }}>Loading...</div>
            : <DataTable
                columns={["Job No","Customer","Item","Issue","Promised","Est. Cost","Status","Actions"]}
                rows={rows} t={t}
                emptyMsg="No repair jobs found. Click + New Repair Job to create one." />
          }
        </Card>
      )}

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setFormError(""); }}
        title="New Repair Job" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Create Job Card"}</BtnPrimary>
        </>}>
        <RepairForm />
        {formError && <div style={{ color:BRAND.pink, fontSize:13, marginTop:10 }}>{formError}</div>}
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setFormError(""); }}
        title={`Edit Job — ${selJob?.job_no || ""}`} t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setEditModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Update Job"}</BtnPrimary>
        </>}>
        <RepairForm />
        {formError && <div style={{ color:BRAND.pink, fontSize:13, marginTop:10 }}>{formError}</div>}
      </Modal>

      {/* Status Update Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)}
        title={`Update Status — ${selJob?.job_no || ""}`} t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setStatusModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleStatusUpdate} disabled={statusSaving}>
            {statusSaving ? "Updating..." : "Update Status"}
          </BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="New Status *" t={t}>
            <Select t={t} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Actual Cost (Rs.)" t={t} half>
            <Input t={t} type="number" step="0.01" placeholder="0.00"
              value={actualCost} onChange={e => setActualCost(e.target.value)} />
          </FormGroup>
          <FormGroup label="Delivery Date" t={t} half>
            <Input t={t} type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
          </FormGroup>
        </FormGrid>
        {/* Balance due */}
        {selJob && actualCost && (
          <div style={{ marginTop:10, padding:"10px 14px", background:`rgba(59,85,230,0.06)`,
            border:`1px solid rgba(59,85,230,0.2)`, borderRadius:8, fontSize:13, color:t.textSub }}>
            Balance Due: <strong style={{ color:BRAND.purple }}>
              Rs.{(parseFloat(actualCost||0) - parseFloat(selJob.advance_paid||0)).toLocaleString("en-IN")}
            </strong>
          </div>
        )}
      </Modal>

      {/* View Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)}
        title={selJob?.job_no || "Job Details"} t={t} wide
        footer={
          <div style={{ display:"flex", gap:8, width:"100%", justifyContent:"space-between" }}>
            <button onClick={() => selJob && printJobCard(selJob)}
              style={{ background:BRAND.gradBtn, border:"none", borderRadius:8, color:"#fff",
                fontSize:13, fontWeight:700, padding:"8px 20px", cursor:"pointer", fontFamily:"inherit" }}>
              Print Job Card
            </button>
            <BtnOutline t={t} onClick={() => setViewModal(false)}>Close</BtnOutline>
          </div>
        }>
        {selJob && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              {[
                ["Job No",        selJob.job_no],
                ["Status",        selJob.status],
                ["Customer",      selJob.customer_name || "Walk-in"],
                ["Phone",         selJob.customer_phone || "—"],
                ["Item",          `${selJob.item_name} (${selJob.item_type || ""})`],
                ["Metal / Purity",`${selJob.metal || ""} ${selJob.purity || ""}`],
                ["Weight",        selJob.weight_g ? `${selJob.weight_g}g` : "—"],
                ["Received",      selJob.received_date ? new Date(selJob.received_date).toLocaleDateString("en-IN") : "—"],
                ["Promised",      selJob.promised_date ? new Date(selJob.promised_date).toLocaleDateString("en-IN") : "—"],
                ["Est. Cost",     `Rs.${parseFloat(selJob.estimated_cost||0).toLocaleString("en-IN")}`],
                ["Actual Cost",   `Rs.${parseFloat(selJob.actual_cost||0).toLocaleString("en-IN")}`],
                ["Advance Paid",  `Rs.${parseFloat(selJob.advance_paid||0).toLocaleString("en-IN")}`],
                ["Balance Due",   `Rs.${(parseFloat(selJob.actual_cost||selJob.estimated_cost||0)-parseFloat(selJob.advance_paid||0)).toLocaleString("en-IN")}`],
                ["Assigned To",   selJob.assigned_to || "—"],
              ].map(([k,v]) => (
                <div key={k} style={{ padding:"10px 14px", background:t.card2||t.card,
                  border:`1px solid ${t.borderDash}`, borderRadius:8 }}>
                  <div style={{ fontSize:10, color:t.textFaint, textTransform:"uppercase", marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:t.text }}>{v}</div>
                </div>
              ))}
            </div>
            {selJob.issue_desc && (
              <div style={{ padding:"10px 14px", background:`rgba(243,156,18,0.08)`,
                border:`1px solid rgba(243,156,18,0.25)`, borderRadius:8, marginBottom:10 }}>
                <div style={{ fontSize:10, color:"#f39c12", textTransform:"uppercase", marginBottom:5 }}>Issue / Problem</div>
                <div style={{ fontSize:13, color:t.text }}>{selJob.issue_desc}</div>
              </div>
            )}
            {selJob.work_to_do && (
              <div style={{ padding:"10px 14px", background:`rgba(46,204,113,0.08)`,
                border:`1px solid rgba(46,204,113,0.25)`, borderRadius:8 }}>
                <div style={{ fontSize:10, color:"#2ecc71", textTransform:"uppercase", marginBottom:5 }}>Work to be Done</div>
                <div style={{ fontSize:13, color:t.text }}>{selJob.work_to_do}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
