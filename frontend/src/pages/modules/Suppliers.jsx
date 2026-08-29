// ─── Ceritage ERP — Supplier Management ──────────────────────────────────────
import { BRAND } from "../../theme.js";
import { useState, useEffect } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
  BtnPrimary, BtnOutline, BtnSm, Modal,
  FormGroup, FormGrid, Input, Select, SectionTitle,
} from "../../components/ui";

const API = window.__CERITAGE_API__ || "/api";
function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const TABS = [
  { id: "list",     label: "Suppliers" },
  { id: "ledger",   label: "Ledger" },
  { id: "payments", label: "Payments" },
  { id: "report",   label: "Report" },
];

const SUPPLY_TYPES = ["Gold", "Silver", "Diamond", "Gemstones", "Platinum", "Imitation", "Packaging", "Other"];

const EMPTY_FORM = {
  company_name: "", contact_person: "", phone: "", email: "",
  supply_type: "Gold", city: "", gstin: "", pan: "",
  credit_limit: "0", bank_account: "", ifsc: "",
};

// ─── Supplier Form ─────────────────────────────────────────────────────────────
function SupplierForm({ form, onChange, errors, t }) {
  const fs = k => errors[k] ? { borderColor: "rgba(230,59,138,0.7)" } : {};
  const em = k => errors[k] ? <div style={{ color: BRAND.pink, fontSize: 11, marginTop: 4 }}>{errors[k]}</div> : null;
  return (
    <>
      <SectionTitle t={t}>Company Information</SectionTitle>
      <FormGrid>
        <FormGroup label="Company Name *" t={t} half>
          <Input t={t} placeholder="e.g. Mehta Gold Traders" value={form.company_name}
            onChange={onChange("company_name")} style={fs("company_name")} />
          {em("company_name")}
        </FormGroup>
        <FormGroup label="Contact Person" t={t} half>
          <Input t={t} placeholder="Owner / Manager name" value={form.contact_person}
            onChange={onChange("contact_person")} />
        </FormGroup>
        <FormGroup label="Phone" t={t} half>
          <Input t={t} placeholder="Mobile number" value={form.phone}
            onChange={onChange("phone")} maxLength={15} />
        </FormGroup>
        <FormGroup label="Email" t={t} half>
          <Input t={t} type="email" placeholder="supplier@email.com" value={form.email}
            onChange={onChange("email")} />
        </FormGroup>
        <FormGroup label="Supply Type" t={t} half>
          <Select t={t} value={form.supply_type} onChange={onChange("supply_type")}>
            {SUPPLY_TYPES.map(s => <option key={s}>{s}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="City" t={t} half>
          <Input t={t} placeholder="City" value={form.city} onChange={onChange("city")} />
        </FormGroup>
      </FormGrid>
      <SectionTitle t={t}>GST & KYC</SectionTitle>
      <FormGrid>
        <FormGroup label="GSTIN" t={t} half>
          <Input t={t} placeholder="15-digit GSTIN" value={form.gstin}
            onChange={e => onChange("gstin")({ target: { value: e.target.value.toUpperCase() } })}
            style={{ fontFamily: "monospace" }} maxLength={15} />
        </FormGroup>
        <FormGroup label="PAN" t={t} half>
          <Input t={t} placeholder="ABCDE1234F" value={form.pan}
            onChange={e => onChange("pan")({ target: { value: e.target.value.toUpperCase() } })}
            style={{ fontFamily: "monospace" }} maxLength={10} />
        </FormGroup>
        <FormGroup label="Credit Limit (Rs.)" t={t} half>
          <Input t={t} type="number" placeholder="0" value={form.credit_limit}
            onChange={onChange("credit_limit")} />
        </FormGroup>
      </FormGrid>
      <SectionTitle t={t}>Bank Details</SectionTitle>
      <FormGrid>
        <FormGroup label="Bank Account No." t={t} half>
          <Input t={t} placeholder="Account number" value={form.bank_account}
            onChange={onChange("bank_account")} style={{ fontFamily: "monospace" }} />
        </FormGroup>
        <FormGroup label="IFSC Code" t={t} half>
          <Input t={t} placeholder="SBIN0001234" value={form.ifsc}
            onChange={e => onChange("ifsc")({ target: { value: e.target.value.toUpperCase() } })}
            style={{ fontFamily: "monospace" }} maxLength={11} />
        </FormGroup>
      </FormGrid>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Suppliers({ t }) {
  const [tab,         setTab]         = useState("list");
  const [suppliers,   setSuppliers]   = useState([]);
  const [kpis,        setKpis]        = useState({});
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("");

  // Modals
  const [addModal,    setAddModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(false);
  const [payModal,    setPayModal]    = useState(false);
  const [delModal,    setDelModal]    = useState(false);

  // Form
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editId,      setEditId]      = useState(null);
  const [formErrors,  setFormErrors]  = useState({});
  const [formError,   setFormError]   = useState("");
  const [saving,      setSaving]      = useState(false);

  // Ledger
  const [selSupplier, setSelSupplier] = useState("");
  const [ledger,      setLedger]      = useState([]);
  const [ledgerLoading,setLedgerLoading]=useState(false);

  // Payments
  const [payments,    setPayments]    = useState([]);
  const [payForm,     setPayForm]     = useState({
    supplier_id: "", amount: "", payment_mode: "NEFT", reference: "", po_ref: "", remark: "",
  });
  const [paySaving,   setPaySaving]   = useState(false);
  const [payError,    setPayError]    = useState("");

  // Delete target
  const [delTarget,   setDelTarget]   = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  async function fetchKpis() {
    try {
      const r = await fetch(`${API}/suppliers/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data || {});
    } catch {}
  }

  async function fetchSuppliers() {
    setLoading(true);
    try {
      const p = new URLSearchParams({ _t: Date.now() });
      if (search)     p.append("search", search);
      if (typeFilter) p.append("type",   typeFilter);
      const r = await fetch(`${API}/suppliers?${p}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setSuppliers(d.data || []);
    } catch {}
    setLoading(false);
  }

  async function fetchLedger(id) {
    if (!id) return;
    setLedgerLoading(true);
    try {
      const r = await fetch(`${API}/suppliers/${id}/ledger`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setLedger(d.data || []);
    } catch {}
    setLedgerLoading(false);
  }

  async function fetchPayments() {
    try {
      const r = await fetch(`${API}/suppliers/payments`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setPayments(d.data || []);
    } catch {}
  }

  useEffect(() => { fetchKpis(); fetchSuppliers(); }, []); // eslint-disable-line
  useEffect(() => { fetchSuppliers(); }, [search, typeFilter]); // eslint-disable-line
  useEffect(() => {
    if (tab === "payments") fetchPayments();
  }, [tab]); // eslint-disable-line

  // ── onChange ─────────────────────────────────────────────────────────────
  function onChange(key) {
    return e => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
      if (formErrors[key]) setFormErrors(prev => ({ ...prev, [key]: undefined }));
    };
  }

  function validate(f) {
    const errors = {};
    if (!f.company_name?.trim()) errors.company_name = "Company name is required.";
    return errors;
  }

  // ── Save supplier ─────────────────────────────────────────────────────────
  async function handleSave() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSaving(true); setFormError("");
    try {
      const url    = editId ? `${API}/suppliers/${editId}` : `${API}/suppliers`;
      const method = editId ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setFormError(d.message || "Failed to save."); setSaving(false); return; }
      setAddModal(false); setEditModal(false);
      setForm(EMPTY_FORM); setEditId(null); setFormErrors({}); setFormError("");
      fetchSuppliers(); fetchKpis();
    } catch { setFormError("Cannot connect to server."); }
    setSaving(false);
  }

  function openEdit(s) {
    setEditId(s.id);
    setForm({
      company_name:   s.company_name   || "",
      contact_person: s.contact_person || "",
      phone:          s.phone          || "",
      email:          s.email          || "",
      supply_type:    s.supply_type    || "Gold",
      city:           s.city           || "",
      gstin:          s.gstin          || "",
      pan:            s.pan            || "",
      credit_limit:   s.credit_limit   || "0",
      bank_account:   s.bank_account   || "",
      ifsc:           s.ifsc           || "",
    });
    setFormErrors({}); setFormError("");
    setEditModal(true);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!delTarget) return;
    try {
      const r = await fetch(`${API}/suppliers/${delTarget.id}`, { method: "DELETE", headers: authHeaders() });
      const d = await r.json();
      if (d.success) { fetchSuppliers(); fetchKpis(); setDelModal(false); setDelTarget(null); }
      else alert(d.message || "Delete failed.");
    } catch { alert("Cannot connect to server."); }
  }

  // ── Payment ───────────────────────────────────────────────────────────────
  async function handlePayment() {
    if (!payForm.supplier_id || !payForm.amount || parseFloat(payForm.amount) <= 0) {
      setPayError("Select supplier and enter valid amount."); return;
    }
    setPaySaving(true); setPayError("");
    try {
      const r = await fetch(`${API}/suppliers/payment`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(payForm),
      });
      const d = await r.json();
      if (d.success) {
        setPayModal(false);
        setPayForm({ supplier_id: "", amount: "", payment_mode: "NEFT", reference: "", po_ref: "", remark: "" });
        fetchSuppliers(); fetchKpis(); fetchPayments();
      } else { setPayError(d.message || "Payment failed."); }
    } catch { setPayError("Cannot connect to server."); }
    setPaySaving(false);
  }

  // ── Rating stars ──────────────────────────────────────────────────────────
  const stars = n => "★".repeat(n) + "☆".repeat(5 - n);

  // ── Rows ──────────────────────────────────────────────────────────────────
  const rows = suppliers.map(s => ({
    "Supplier":    (
      <div>
        <div style={{ fontWeight: 600, color: t.text, fontSize: 13 }}>{s.company_name}</div>
        <div style={{ fontSize: 11, color: t.textMuted }}>{s.contact_person || ""}</div>
      </div>
    ),
    "Type":        s.supply_type || "—",
    "Phone":       s.phone || "—",
    "GSTIN":       s.gstin ? <span style={{ fontFamily: "monospace", fontSize: 11 }}>{s.gstin}</span> : "—",
    "Purchased":   `Rs.${parseFloat(s.total_purchased || 0).toLocaleString("en-IN")}`,
    "Outstanding": (
      <span style={{ color: parseFloat(s.outstanding) > 0 ? BRAND.pink : "#2ecc71", fontWeight: 600 }}>
        Rs.{parseFloat(s.outstanding || 0).toLocaleString("en-IN")}
      </span>
    ),
    "Rating":      <span style={{ color: "#f0c040", letterSpacing: 1 }}>{stars(s.rating || 5)}</span>,
    "Status": (
      <span style={{
        background: s.status === "Active" ? "rgba(46,204,113,0.12)" : "rgba(230,59,138,0.12)",
        color: s.status === "Active" ? "#2ecc71" : BRAND.pink,
        border: `1px solid ${s.status === "Active" ? "rgba(46,204,113,0.3)" : "rgba(230,59,138,0.3)"}`,
        borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600,
      }}>{s.status}</span>
    ),
    "Actions": (
      <div style={{ display: "flex", gap: 5 }}>
        <button onClick={() => openEdit(s)}
          style={{ background: BRAND.gradBtn, border: "none", borderRadius: 6, color: "#fff", fontSize: 11, padding: "3px 9px", cursor: "pointer" }}>
          Edit
        </button>
        <button onClick={() => { setPayForm(p => ({ ...p, supplier_id: String(s.id) })); setPayModal(true); }}
          style={{ background: "none", border: `1px solid #2ecc71`, borderRadius: 6, color: "#2ecc71", fontSize: 11, padding: "3px 9px", cursor: "pointer" }}>
          Pay
        </button>
        <button onClick={() => { setSelSupplier(String(s.id)); setTab("ledger"); fetchLedger(s.id); }}
          style={{ background: "none", border: `1px solid ${BRAND.blue}`, borderRadius: 6, color: BRAND.blue, fontSize: 11, padding: "3px 9px", cursor: "pointer" }}>
          Ledger
        </button>
        <button onClick={() => { setDelTarget(s); setDelModal(true); }}
          style={{ background: "none", border: `1px solid ${BRAND.pink}`, borderRadius: 6, color: BRAND.pink, fontSize: 11, padding: "3px 9px", cursor: "pointer" }}>
          Delete
        </button>
      </div>
    ),
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Supplier Management"
        subtitle="Registration | Ledger | Payments | Report"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={() => { setPayModal(true); }}>Record Payment</BtnOutline>
          <BtnPrimary onClick={() => { setForm(EMPTY_FORM); setEditId(null); setFormErrors({}); setFormError(""); setAddModal(true); }}>
            + Add Supplier
          </BtnPrimary>
        </>} />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Total Suppliers"   value={kpis.total             ?? "—"} color={BRAND.blue}   t={t} />
        <StatCard label="Active"            value={kpis.active            ?? "—"} color="#2ecc71"       t={t} />
        <StatCard label="Total Outstanding" value={kpis.total_outstanding ? `Rs.${parseFloat(kpis.total_outstanding).toLocaleString("en-IN")}` : "Rs.0"} color={BRAND.pink} t={t} />
        <StatCard label="Total Purchases"   value={kpis.total_purchases   ? `Rs.${parseFloat(kpis.total_purchases).toLocaleString("en-IN")}` : "Rs.0"}   color={BRAND.purple} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── LIST ── */}
      {tab === "list" && (
        <Card t={t}>
          <CardHeader
            title={loading ? "Loading..." : `Supplier Directory (${suppliers.length})`}
            t={t}
            actions={<>
              <div style={{ position: "relative" }}>
                <input placeholder="Search name, city, phone..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "7px 12px 7px 32px", fontSize: 13, color: t.inputColor, outline: "none", fontFamily: "inherit", width: 200 }} />
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: t.textMuted, fontSize: 14 }}>?</span>
              </div>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, color: t.inputColor, outline: "none", fontFamily: "inherit" }}>
                <option value="" selected>All Types</option>
                {SUPPLY_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </>} />
          {loading
            ? <div style={{ textAlign: "center", padding: 32, color: t.textFaint }}>Loading suppliers...</div>
            : <DataTable
                columns={["Supplier","Type","Phone","GSTIN","Purchased","Outstanding","Rating","Status","Actions"]}
                rows={rows} t={t}
                emptyMsg="No suppliers yet. Click + Add Supplier to add your first supplier." />
          }
        </Card>
      )}

      {/* ── LEDGER ── */}
      {tab === "ledger" && (
        <Card t={t}>
          <CardHeader title={selSupplier ? `Ledger — ${suppliers.find(s => String(s.id) === selSupplier)?.company_name || ""}` : "Supplier Ledger"} t={t}
            actions={
              <select value={selSupplier}
                onChange={e => { setSelSupplier(e.target.value); fetchLedger(e.target.value); }}
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, color: t.inputColor, outline: "none", fontFamily: "inherit", width: 260 }}>
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
              </select>
            } />
          {!selSupplier ? (
            <div style={{ textAlign: "center", padding: 36, color: t.textFaint, fontSize: 13 }}>
              Select a supplier from the dropdown to view their ledger.
            </div>
          ) : ledgerLoading ? (
            <div style={{ textAlign: "center", padding: 32, color: t.textFaint }}>Loading ledger...</div>
          ) : (
            <DataTable
              columns={["#", "Date", "Particulars", "Debit (Rs.)", "Credit (Rs.)", "Balance (Rs.)"]}
              rows={ledger.map((l, i) => ({
                "#":            i + 1,
                "Date":         l.date ? new Date(l.date).toLocaleDateString("en-IN") : "—",
                "Particulars":  l.particulars || "—",
                "Debit (Rs.)":  parseFloat(l.debit)  > 0 ? `Rs.${parseFloat(l.debit).toLocaleString("en-IN")}` : "—",
                "Credit (Rs.)": parseFloat(l.credit) > 0 ? `Rs.${parseFloat(l.credit).toLocaleString("en-IN")}` : "—",
                "Balance (Rs.)": `Rs.${parseFloat(l.running_balance || 0).toLocaleString("en-IN")}`,
              }))}
              t={t} emptyMsg="No ledger entries yet." />
          )}
        </Card>
      )}

      {/* ── PAYMENTS ── */}
      {tab === "payments" && (
        <Card t={t}>
          <CardHeader title={`Payment History (${payments.length})`} t={t}
            actions={
              <button onClick={() => setPayModal(true)}
                style={{ background: BRAND.gradBtn, border: "none", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700, padding: "6px 16px", cursor: "pointer", fontFamily: "inherit" }}>
                + New Payment
              </button>
            } />
          <DataTable
            columns={["Pay ID", "Supplier", "Date", "Amount", "Mode", "Reference", "Remark"]}
            rows={payments.map(p => ({
              "Pay ID":    <span style={{ fontFamily: "monospace", fontSize: 11, color: BRAND.purple }}>{p.pay_id}</span>,
              "Supplier":  p.supplier_name || "—",
              "Date":      new Date(p.created_at).toLocaleDateString("en-IN"),
              "Amount":    <span style={{ fontWeight: 700, color: "#2ecc71" }}>Rs.{parseFloat(p.amount).toLocaleString("en-IN")}</span>,
              "Mode":      p.payment_mode || "—",
              "Reference": p.reference || "—",
              "Remark":    p.remark || "—",
            }))}
            t={t} emptyMsg="No payments recorded yet." />
        </Card>
      )}

      {/* ── REPORT ── */}
      {tab === "report" && (
        <Card t={t}>
          <CardHeader title="Supplier Performance Report" t={t} />
          {suppliers.length === 0 ? (
            <div style={{ textAlign: "center", padding: 36, color: t.textFaint, fontSize: 13 }}>No supplier data yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
              {suppliers.map(s => (
                <div key={s.id} style={{ background: t.card2 || t.card, border: `1px solid ${t.borderDash}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontWeight: 700, color: t.text, fontSize: 14, marginBottom: 4 }}>{s.company_name}</div>
                  <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 10 }}>{s.supply_type} | {s.city || "—"}</div>
                  {[
                    ["Total Purchased", `Rs.${parseFloat(s.total_purchased || 0).toLocaleString("en-IN")}`],
                    ["Outstanding",     `Rs.${parseFloat(s.outstanding || 0).toLocaleString("en-IN")}`],
                    ["Credit Limit",    `Rs.${parseFloat(s.credit_limit || 0).toLocaleString("en-IN")}`],
                    ["Rating",          stars(s.rating || 5)],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, borderBottom: `1px solid ${t.borderDash}`, color: t.textSub }}>
                      <span>{k}</span>
                      <span style={{ fontWeight: 600, color: t.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── ADD MODAL ── */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setFormErrors({}); setFormError(""); }}
        title="Add Supplier" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Supplier"}</BtnPrimary>
        </>}>
        <SupplierForm form={form} onChange={onChange} errors={formErrors} t={t} />
        {formError && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(230,59,138,0.1)", border: "1px solid rgba(230,59,138,0.3)", borderRadius: 9, color: BRAND.pink, fontSize: 13 }}>{formError}</div>}
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setFormErrors({}); setFormError(""); }}
        title="Edit Supplier" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setEditModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Update Supplier"}</BtnPrimary>
        </>}>
        <SupplierForm form={form} onChange={onChange} errors={formErrors} t={t} />
        {formError && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(230,59,138,0.1)", border: "1px solid rgba(230,59,138,0.3)", borderRadius: 9, color: BRAND.pink, fontSize: 13 }}>{formError}</div>}
      </Modal>

      {/* ── PAYMENT MODAL ── */}
      <Modal open={payModal} onClose={() => { setPayModal(false); setPayError(""); }}
        title="Record Supplier Payment" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setPayModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handlePayment} disabled={paySaving}>{paySaving ? "Processing..." : "Confirm Payment"}</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Select Supplier *" t={t}>
            <Select t={t} value={payForm.supplier_id} onChange={e => setPayForm(p => ({ ...p, supplier_id: e.target.value }))}>
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.company_name} (Outstanding: Rs.{parseFloat(s.outstanding || 0).toLocaleString("en-IN")})</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Amount (Rs.) *" t={t} half>
            <Input t={t} type="number" step="0.01" placeholder="0.00" value={payForm.amount}
              onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Payment Mode *" t={t} half>
            <Select t={t} value={payForm.payment_mode} onChange={e => setPayForm(p => ({ ...p, payment_mode: e.target.value }))}>
              <option>NEFT</option><option>RTGS</option><option>IMPS</option>
              <option>Cheque</option><option>Cash</option><option>UPI</option>
            </Select>
          </FormGroup>
          <FormGroup label="UTR / Reference" t={t} half>
            <Input t={t} placeholder="Transaction reference" value={payForm.reference}
              onChange={e => setPayForm(p => ({ ...p, reference: e.target.value }))} />
          </FormGroup>
          <FormGroup label="PO Reference" t={t} half>
            <Input t={t} placeholder="Against PO no." value={payForm.po_ref}
              onChange={e => setPayForm(p => ({ ...p, po_ref: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Remark" t={t}>
            <Input t={t} placeholder="Payment notes..." value={payForm.remark}
              onChange={e => setPayForm(p => ({ ...p, remark: e.target.value }))} />
          </FormGroup>
        </FormGrid>
        {payError && <div style={{ color: BRAND.pink, fontSize: 13, marginTop: 10 }}>{payError}</div>}
      </Modal>

      {/* ── DELETE CONFIRM ── */}
      <Modal open={delModal} onClose={() => { setDelModal(false); setDelTarget(null); }}
        title="Delete Supplier" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setDelModal(false)}>Cancel</BtnOutline>
          <button onClick={handleDelete}
            style={{ background: BRAND.pink, border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 20px", cursor: "pointer", fontFamily: "inherit" }}>
            Delete
          </button>
        </>}>
        <div style={{ fontSize: 14, color: t.text, lineHeight: 1.7 }}>
          Are you sure you want to delete <strong>{delTarget?.company_name}</strong>?
          <br />
          <span style={{ fontSize: 12, color: t.textFaint }}>This cannot be undone. All ledger entries will also be removed.</span>
        </div>
      </Modal>
    </div>
  );
}
