﻿import { BRAND } from "../../theme.js";
import { useState, useEffect } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
         Input, Select, SectionTitle } from "../../components/ui";

const API = window.__CERITAGE_API__ || "/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const TABS = [
  { id:"list",       label:"All Customers" },
  { id:"ledger",     label:"Ledger" },
  { id:"wallet",     label:"Wallet & Points" },
  { id:"membership", label:"Membership" },
  { id:"credit",     label:"Credit" },
  { id:"due",        label:"Due Tracking" },
  { id:"history",    label:"Purchase History" },
  { id:"kyc",        label:"KYC" },
  { id:"reminders",  label:"Reminders" },
];

const EMPTY_FORM = {
  full_name:"", phone:"", alt_phone:"", email:"",
  date_of_birth:"", anniversary:"", gender:"",
  tier:"Regular", city:"", state:"",
  pan:"", aadhaar:"", gst_number:"", credit_limit:"0", notes:"",
};

const STATES = ["Maharashtra","Gujarat","Rajasthan","Delhi","Karnataka",
  "Tamil Nadu","West Bengal","Uttar Pradesh","Punjab","Madhya Pradesh",
  "Haryana","Andhra Pradesh","Telangana","Kerala","Odisha","Bihar","Other"];

function validateForm(form) {
  const errors = {};
  if (!form.full_name.trim())                                               errors.full_name    = "Full name is required.";
  else if (form.full_name.trim().length < 2)                               errors.full_name    = "Full name must be at least 2 characters.";
  if (!form.phone.trim())                                                   errors.phone        = "Phone number is required.";
  else if (!/^[6-9]\d{9}$/.test(form.phone.trim()))                        errors.phone        = "Enter a valid 10-digit Indian mobile number (starts with 6-9).";
  if (form.alt_phone.trim() && !/^[6-9]\d{9}$/.test(form.alt_phone.trim())) errors.alt_phone   = "Enter a valid 10-digit mobile number.";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!form.city.trim())                                                    errors.city         = "City is required.";
  if (!form.state)                                                          errors.state        = "State is required.";
  if (!form.gender)                                                         errors.gender       = "Gender is required.";
  if (form.pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan.trim().toUpperCase())) errors.pan = "PAN must be in format: ABCDE1234F.";
  const ac = form.aadhaar.replace(/\s/g,"");
  if (form.aadhaar.trim() && !/^\d{12}$/.test(ac))                          errors.aadhaar     = "Aadhaar must be exactly 12 digits.";
  if (form.gst_number.trim() && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gst_number.trim().toUpperCase())) errors.gst_number = "Enter a valid 15-character GST number.";
  if (form.credit_limit !== "" && (isNaN(form.credit_limit) || parseFloat(form.credit_limit) < 0)) errors.credit_limit = "Credit limit must be a valid non-negative amount.";
  return errors;
}

// ── CustomerForm component (outside to prevent re-mount) ───
function CustomerForm({ form, onChange, errors, t }) {
  const fs = (key) => errors[key] ? { borderColor:"rgba(230,59,138,0.7)" } : {};
  const em = (key) => errors[key]  ? <div style={{ color:BRAND.pink, fontSize:11, marginTop:4 }}>{errors[key]}</div> : null;
  return (
    <>
      <SectionTitle t={t}>Personal Information</SectionTitle>
      <FormGrid>
        <FormGroup label="Full Name *"         t={t} half><Input t={t} placeholder="Customer full name"            value={form.full_name}    onChange={onChange("full_name")}    style={fs("full_name")}    />{em("full_name")}</FormGroup>
        <FormGroup label="Mobile Number *"     t={t} half><Input t={t} placeholder="10-digit (e.g. 9876543210)"   value={form.phone}         onChange={onChange("phone")}        style={fs("phone")}        maxLength={10} />{em("phone")}</FormGroup>
        <FormGroup label="Alternate Mobile"    t={t} half><Input t={t} placeholder="Optional alternate number"    value={form.alt_phone}    onChange={onChange("alt_phone")}   style={fs("alt_phone")}    maxLength={10} />{em("alt_phone")}</FormGroup>
        <FormGroup label="Email Address"       t={t} half><Input t={t} type="email" placeholder="customer@email.com" value={form.email}      onChange={onChange("email")}       style={fs("email")}        />{em("email")}</FormGroup>
        <FormGroup label="Gender *"            t={t} half>
          <Select t={t} value={form.gender} onChange={onChange("gender")} style={fs("gender")}>
            <option value="">-- Select Gender --</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </Select>{em("gender")}
        </FormGroup>
        <FormGroup label="Customer Tier"       t={t} half>
          <Select t={t} value={form.tier} onChange={onChange("tier")}>
            <option>Regular</option><option>Silver</option><option>Gold</option><option>Platinum</option>
          </Select>
        </FormGroup>
        <FormGroup label="Date of Birth"       t={t} half><Input t={t} type="date" value={form.date_of_birth} onChange={onChange("date_of_birth")} /></FormGroup>
        <FormGroup label="Wedding Anniversary" t={t} half><Input t={t} type="date" value={form.anniversary}   onChange={onChange("anniversary")}   /></FormGroup>
        <FormGroup label="City *"              t={t} half><Input t={t} placeholder="City name" value={form.city}  onChange={onChange("city")}  style={fs("city")}  />{em("city")}</FormGroup>
        <FormGroup label="State *"             t={t} half>
          <Select t={t} value={form.state} onChange={onChange("state")} style={fs("state")}>
            <option value="">-- Select State --</option>
            {STATES.map(s => <option key={s}>{s}</option>)}
          </Select>{em("state")}
        </FormGroup>
      </FormGrid>
      <SectionTitle t={t}>KYC & Identity Verification</SectionTitle>
      <div style={{ background:`rgba(59,85,230,0.06)`, border:`1px solid rgba(59,85,230,0.15)`, borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:12, color:t.textSub }}>
        KYC documents are mandatory for purchases above Rs.2,00,000 as per PMLA regulations.
      </div>
      <FormGrid>
        <FormGroup label="PAN Card Number"          t={t} half>
          <Input t={t} placeholder="e.g. ABCDE1234F" value={form.pan} maxLength={10}
            onChange={e => onChange("pan")({ target:{ value: e.target.value.toUpperCase() }})}
            style={{ ...fs("pan"), textTransform:"uppercase", fontFamily:"monospace", letterSpacing:"1px" }} />
          {em("pan")}<div style={{ fontSize:10, color:t.textFaint, marginTop:3 }}>Format: 5 letters + 4 digits + 1 letter</div>
        </FormGroup>
        <FormGroup label="Aadhaar Card Number"      t={t} half>
          <Input t={t} placeholder="e.g. 1234 5678 9012" value={form.aadhaar} maxLength={14}
            onChange={onChange("aadhaar")} style={{ ...fs("aadhaar"), fontFamily:"monospace", letterSpacing:"1px" }} />
          {em("aadhaar")}<div style={{ fontSize:10, color:t.textFaint, marginTop:3 }}>12-digit Aadhaar number</div>
        </FormGroup>
        <FormGroup label="GST Number (B2B only)"    t={t} half>
          <Input t={t} placeholder="e.g. 27AAPFU0939F1ZV" value={form.gst_number} maxLength={15}
            onChange={e => onChange("gst_number")({ target:{ value: e.target.value.toUpperCase() }})}
            style={{ ...fs("gst_number"), textTransform:"uppercase", fontFamily:"monospace", letterSpacing:"0.5px" }} />
          {em("gst_number")}
        </FormGroup>
        <FormGroup label="Credit Limit (?)"         t={t} half>
          <Input t={t} type="number" placeholder="0" min="0" value={form.credit_limit} onChange={onChange("credit_limit")} style={fs("credit_limit")} />
          {em("credit_limit")}<div style={{ fontSize:10, color:t.textFaint, marginTop:3 }}>Maximum credit allowed</div>
        </FormGroup>
      </FormGrid>
      <SectionTitle t={t}>Additional Notes</SectionTitle>
      <FormGrid>
        <FormGroup label="Notes" t={t}>
          <textarea rows={3} placeholder="Any special preferences or notes about this customer..."
            value={form.notes} onChange={onChange("notes")}
            style={{ width:"100%", background:t.inputBg, border:`1.5px solid ${t.inputBorder}`, borderRadius:9, padding:"10px 13px", fontSize:13, color:t.inputColor, outline:"none", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical" }} />
        </FormGroup>
      </FormGrid>
    </>
  );
}

// ── Wallet Credit Modal ─────────────────────────────────────
function WalletCreditModal({ open, onClose, customerId, customerName, t, onSuccess }) {
  const [amount, setAmount]   = useState("");
  const [desc,   setDesc]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState("");

  async function handleCredit() {
    if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount."); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/customers/${customerId}/wallet/credit`, {
        method:"POST", headers: authHeaders(),
        body: JSON.stringify({ amount: parseFloat(amount), description: desc || "Wallet credit" }),
      });
      const d = await r.json();
      if (d.success) { onSuccess(); onClose(); setAmount(""); setDesc(""); }
      else setError(d.message || "Failed to credit wallet.");
    } catch { setError("Cannot connect to server."); }
    setSaving(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add Wallet Credit  ? ${customerName}`} t={t}
      footer={<>
        <BtnOutline t={t} onClick={onClose}>Cancel</BtnOutline>
        <BtnPrimary onClick={handleCredit} disabled={saving}>{saving ? "Processing..." : "Add Credit"}</BtnPrimary>
      </>}>
      <FormGrid>
        <FormGroup label="Amount *" t={t}>
          <Input t={t} type="number" placeholder="e.g. 500" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }} />
        </FormGroup>
        <FormGroup label="Description" t={t}>
          <Input t={t} placeholder="e.g. Diwali gift, Loyalty bonus" value={desc} onChange={e => setDesc(e.target.value)} />
        </FormGroup>
      </FormGrid>
      {error && <div style={{ color:BRAND.pink, fontSize:13, marginTop:8 }}>{error}</div>}
    </Modal>
  );
}

// ── KYC Update Modal ────────────────────────────────────────
function KycModal({ open, onClose, customer, t, onSuccess }) {
  const [kyc, setKyc] = useState({ pan:"", aadhaar:"", gst_number:"", kyc_status:"Pending" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    if (customer) setKyc({
      pan:        customer.pan          || "",
      aadhaar:    customer.aadhaar      || "",
      gst_number: customer.gst_number   || "",
      kyc_status: customer.kyc_status   || "Pending",
    });
  }, [customer]);

  async function handleSave() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/customers/${customer.id}/kyc`, {
        method:"PUT", headers: authHeaders(), body: JSON.stringify(kyc),
      });
      const d = await r.json();
      if (d.success) { onSuccess(); onClose(); }
      else setError(d.message || "Failed to update KYC.");
    } catch { setError("Cannot connect to server."); }
    setSaving(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={`Update KYC   ${customer?.full_name || ""}`} t={t}
      footer={<>
        <BtnOutline t={t} onClick={onClose}>Cancel</BtnOutline>
        <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save KYC"}</BtnPrimary>
      </>}>
      <FormGrid>
        <FormGroup label="PAN Card Number" t={t} half>
          <Input t={t} placeholder="ABCDE1234F" maxLength={10}
            value={kyc.pan}
            onChange={e => setKyc(k => ({ ...k, pan: e.target.value.toUpperCase() }))}
            style={{ fontFamily:"monospace", letterSpacing:"1px" }} />
        </FormGroup>
        <FormGroup label="Aadhaar Number" t={t} half>
          <Input t={t} placeholder="12-digit Aadhaar" maxLength={14}
            value={kyc.aadhaar}
            onChange={e => setKyc(k => ({ ...k, aadhaar: e.target.value }))}
            style={{ fontFamily:"monospace" }} />
        </FormGroup>
        <FormGroup label="GST Number (optional)" t={t} half>
          <Input t={t} placeholder="15-char GST number" maxLength={15}
            value={kyc.gst_number}
            onChange={e => setKyc(k => ({ ...k, gst_number: e.target.value.toUpperCase() }))}
            style={{ fontFamily:"monospace" }} />
        </FormGroup>
        <FormGroup label="KYC Status" t={t} half>
          <Select t={t} value={kyc.kyc_status} onChange={e => setKyc(k => ({ ...k, kyc_status: e.target.value }))}>
            <option>Pending</option><option>Incomplete</option><option>Complete</option>
          </Select>
        </FormGroup>
      </FormGrid>
      {error && <div style={{ color:BRAND.pink, fontSize:13, marginTop:8 }}>{error}</div>}
    </Modal>
  );
}

// ── Main Customers component ───────────────────────────────
export default function Customers({ t }) {
  const [tab,         setTab]         = useState("list");
  const [addModal,    setAddModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(false);
  const [walletModal, setWalletModal] = useState(false);
  const [kycModal,    setKycModal]    = useState(false);
  const [selForModal, setSelForModal] = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editId,      setEditId]      = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [customers,   setCustomers]   = useState([]);
  const [kpis,        setKpis]        = useState({});
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [tierFilter,  setTierFilter]  = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selCustomer, setSelCustomer] = useState("");
  const [selCustData, setSelCustData] = useState(null);
  const [ledger,      setLedger]      = useState([]);
  const [wallet,      setWallet]      = useState(null);
  const [history,     setHistory]     = useState([]);
  const [reminders,   setReminders]   = useState([]);
  const [due,         setDue]         = useState([]);
  const [credit,      setCredit]      = useState([]);
  const [loadingSub,  setLoadingSub]  = useState(false);

  // Ledger entry modal
  const [ledgerModal,    setLedgerModal]    = useState(false);
  const [ledgerEntry,    setLedgerEntry]    = useState({ date: new Date().toISOString().split("T")[0], particulars: "", debit: "", credit: "" });
  const [ledgerSaving,   setLedgerSaving]   = useState(false);
  const [ledgerError,    setLedgerError]    = useState("");

  // onChange handler — stable, no re-mount
  function onChange(key) {
    return e => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
      if (fieldErrors[key]) setFieldErrors(prev => ({ ...prev, [key]: undefined }));
    };
  }

  // ── Fetch functions ──────────────────────────────────────
  async function fetchKpis() {
    try {
      const r = await fetch(`${API}/customers/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data);
    } catch {}
  }

  async function fetchCustomers() {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit:100, _t:Date.now() });
      if (debouncedSearch) p.append("search", debouncedSearch);
      if (tierFilter)      p.append("tier",   tierFilter);
      const r = await fetch(`${API}/customers?${p}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setCustomers(d.data || []);
    } catch {}
    setLoading(false);
  }

  async function fetchLedger(id) {
    setLoadingSub(true);
    try {
      const r = await fetch(`${API}/customers/${id}/ledger`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setLedger(d.data || []);
    } catch {}
    setLoadingSub(false);
  }

  async function fetchWallet(id) {
    setLoadingSub(true);
    try {
      const r = await fetch(`${API}/customers/${id}/wallet`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setWallet(d.data);
    } catch {}
    setLoadingSub(false);
  }

  async function fetchHistory(id) {
    setLoadingSub(true);
    try {
      const r = await fetch(`${API}/customers/${id}/purchase-history`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setHistory(d.data || []);
    } catch {}
    setLoadingSub(false);
  }

  async function fetchDue() {
    try {
      const r = await fetch(`${API}/customers/due-tracking`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setDue(d.data || []);
    } catch {}
  }

  async function fetchCredit() {
    try {
      const r = await fetch(`${API}/customers/credit-register`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setCredit(d.data || []);
    } catch {}
  }

  async function fetchReminders() {
    try {
      const r = await fetch(`${API}/customers/reminders?days=30`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setReminders(d.data || []);
    } catch {}
  }

  // -- Effects ----------------------------------------------
  useEffect(() => { fetchKpis(); fetchCustomers(); }, []); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [debouncedSearch, tierFilter]); // eslint-disable-line

  useEffect(() => {
    if (tab === "due")       fetchDue();
    if (tab === "credit")    fetchCredit();
    if (tab === "reminders") fetchReminders();
  }, [tab]); // eslint-disable-line

  // When customer selected in sub-tabs
  function onSelectCustomer(id) {
    setSelCustomer(id);
    const found = customers.find(c => String(c.id) === String(id));
    setSelCustData(found || null);
    if (!id) return;
    if (tab === "ledger")  fetchLedger(id);
    if (tab === "wallet")  fetchWallet(id);
    if (tab === "history") fetchHistory(id);
  }

  // ── Save customer ────────────────────────────────────────
  async function handleSave() {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSaving(true);
    setFormError("");
    try {
      const url    = editId  ? `${API}/customers/${editId}` : `${API}/customers`;
      const method = editId ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { setFormError(d.message || "Failed to save."); setSaving(false); return; }
      setAddModal(false); setEditModal(false);
      setForm(EMPTY_FORM); setEditId(null);
      setFormError(""); setFieldErrors({});
      fetchCustomers(); fetchKpis();
    } catch { setFormError("Cannot connect to server."); }
    setSaving(false);
  }

  function openEdit(c) {
    setEditId(c.id);
    setForm({
      full_name: c.full_name||"", phone: c.phone||"", alt_phone: c.alt_phone||"",
      email: c.email||"", date_of_birth: c.date_of_birth  ? c.date_of_birth.split("T")[0] : "",
      anniversary: c.anniversary  ? c.anniversary.split("T")[0] : "",
      gender: c.gender||"", tier: c.tier||"Regular", city: c.city||"", state: c.state||"",
      pan: c.pan||"", aadhaar: c.aadhaar||"", gst_number: c.gst_number||"",
      credit_limit: c.credit_limit||"0", notes: c.notes||"",
    });
    setFormError(""); setFieldErrors({});
    setEditModal(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this customer permanently? This cannot be undone.")) return;
    try {
      const r = await fetch(`${API}/customers/${id}`, { method:"DELETE", headers: authHeaders() });
      const d = await r.json();
      if (d.success) { fetchCustomers(); fetchKpis(); }
      else alert(d.message || "Delete failed.");
    } catch { alert("Cannot connect to server."); }
  }

  async function handleLedgerEntry() {
    if (!selCustomer) return;
    if (!ledgerEntry.particulars.trim()) { setLedgerError("Particulars are required."); return; }
    if (!ledgerEntry.debit && !ledgerEntry.credit) { setLedgerError("Enter debit or credit amount."); return; }
    setLedgerSaving(true); setLedgerError("");
    try {
      const r = await fetch(`${API}/customers/${selCustomer}/ledger`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          date:        ledgerEntry.date,
          particulars: ledgerEntry.particulars,
          debit:       parseFloat(ledgerEntry.debit)  || 0,
          credit:      parseFloat(ledgerEntry.credit) || 0,
        }),
      });
      const d = await r.json();
      if (d.success) {
        setLedgerModal(false);
        setLedgerEntry({ date: new Date().toISOString().split("T")[0], particulars: "", debit: "", credit: "" });
        fetchLedger(selCustomer);
      } else {
        setLedgerError(d.message || "Failed to add entry.");
      }
    } catch { setLedgerError("Cannot connect to server."); }
    setLedgerSaving(false);
  }

  // Customer dropdown for sub-tabs
  function CustomerDropdown() {
    return (
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <select value={selCustomer} onChange={e => onSelectCustomer(e.target.value)}
          style={{ background:t.inputBg, border:`1px solid ${t.inputBorder}`,
            borderRadius:8, padding:"7px 12px", fontSize:13,
            color:t.inputColor, outline:"none", fontFamily:"inherit", width:260 }}>
          <option value="">-- Select Customer --</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>
          ))}
        </select>
      </div>
    );
  }

  // Table rows
  const customerRows = customers.map(c => ({
    "Customer":       c.full_name + (c.birthday_today ? " 🎂" : ""),
    "Code":           c.customer_code || "—",
    "Phone":          c.phone,
    "Tier":           c.tier,
    "KYC":            c.kyc_status,
    "Balance Due":    parseFloat(c.balance_due) > 0 ? `₹${parseFloat(c.balance_due).toLocaleString()}` : "—",
    "Total Purchase": parseFloat(c.total_purchase) > 0 ? `₹${parseFloat(c.total_purchase).toLocaleString()}` : "—",
    "Points":         c.loyalty_points || 0,
    "Actions": (
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={() => openEdit(c)}
          style={{ background:BRAND.gradBtn, border:"none", borderRadius:6, color:"#fff", fontSize:11, padding:"4px 10px", cursor:"pointer" }}>
          Edit
        </button>
        <button onClick={() => { setSelForModal(c); setKycModal(true); }}
          style={{ background:"none", border:`1px solid ${BRAND.purple}`, borderRadius:6, color:BRAND.purple, fontSize:11, padding:"4px 10px", cursor:"pointer" }}>
          KYC
        </button>
        <button onClick={() => { setSelForModal(c); setWalletModal(true); }}
          style={{ background:"none", border:`1px solid #2ecc71`, borderRadius:6, color:"#2ecc71", fontSize:11, padding:"4px 10px", cursor:"pointer" }}>
          Wallet
        </button>
        <button onClick={() => handleDelete(c.id)}
          style={{ background:"none", border:`1px solid ${BRAND.pink}`, borderRadius:6, color:BRAND.pink, fontSize:11, padding:"4px 10px", cursor:"pointer" }}>
          Delete
        </button>
      </div>
    ),
  }));

  return (
    <div>
      <PageHeader title="Customer Management"
        subtitle="Registration · KYC · Ledger · Wallet · Loyalty · Dues · History"
        t={t}
        actions={<>
          <BtnOutline t={t}>Export</BtnOutline>
          <BtnPrimary onClick={() => { setForm(EMPTY_FORM); setFormError(""); setFieldErrors({}); setAddModal(true); }}>
            + Add Customer
          </BtnPrimary>
        </>} />

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Total Customers"      value={kpis.total_customers      ?? "—"} color={BRAND.blue}   t={t} />
        <StatCard label="Platinum"             value={kpis.platinum             ?? "—"} color={BRAND.purple} t={t} />
        <StatCard label="Gold Members"         value={kpis.gold                 ?? "—"} color="#f0c040"      t={t} />
        <StatCard label="Pending Dues"         value={kpis.pending_dues         ?? "—"} color={BRAND.pink}   t={t} />
        <StatCard label="KYC Complete"         value={kpis.kyc_complete         ?? "—"} color="#2ecc71"      t={t} />
        <StatCard label="Birthdays This Month" value={kpis.birthdays_this_month ?? "—"} color="#3498db"      t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── ALL CUSTOMERS ── */}
      {tab === "list" && (
        <Card t={t}>
          <CardHeader
            title={loading ? "Customer List — Searching..." : `Customer List ${customers.length > 0 ? `(${customers.length})` : ""}`}
            t={t}
            actions={<>
              <div style={{ position:"relative" }}>
                <input placeholder="Search by name, phone, code..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                    borderRadius:8, padding:"7px 12px 7px 32px", fontSize:13,
                    color:t.inputColor, outline:"none", fontFamily:"inherit", width:220 }} />
                <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:t.textMuted, fontSize:14 }}>⌕</span>
                {search && <button onClick={() => setSearch("")}
                  style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", color:t.textMuted, cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>}
              </div>
              <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
                style={{ background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                  borderRadius:8, padding:"7px 12px", fontSize:13,
                  color: tierFilter ? BRAND.purple : t.textSub,
                  outline:"none", fontFamily:"inherit", width:130, fontWeight: tierFilter ? 600 : 400 }}>
                <option value="">All Tiers</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Regular">Regular</option>
              </select>
            </>} />
          {loading
             ? <div style={{ textAlign:"center", padding:32, color:t.textFaint }}>Loading...</div>
            : <DataTable
                columns={["Customer","Code","Phone","Tier","KYC","Balance Due","Total Purchase","Points","Actions"]}
                rows={customerRows} t={t} emptyMsg="No customers found." />}
        </Card>
      )}

      {/* ── LEDGER ── */}
      {tab === "ledger" && (
        <Card t={t}>
          <CardHeader title={selCustData ? `Ledger — ${selCustData.full_name}` : "Customer Ledger"} t={t}
            actions={<>
              <CustomerDropdown />
              {selCustomer && (
                <button onClick={() => { setLedgerError(""); setLedgerModal(true); }}
                  style={{ background:BRAND.gradBtn, border:"none", borderRadius:7, color:"#fff", fontSize:12, fontWeight:600, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>
                  + Add Entry
                </button>
              )}
            </>} />
          {!selCustomer ? (
            <div style={{ textAlign:"center", padding:32, color:t.textFaint, fontSize:13 }}>
              Select a customer from the dropdown above to view their ledger.
              <br /><br />
              <span style={{ fontSize:12 }}>The ledger shows every debit (amount charged) and credit (amount paid) for this customer, with running balance.</span>
            </div>
          ) : loadingSub ? (
            <div style={{ textAlign:"center", padding:32, color:t.textFaint }}>Loading ledger...</div>
          ) : (
            <>
              {selCustData && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10, marginBottom:16 }}>
                  <StatCard label="Balance Due"     value={`₹${parseFloat(selCustData.balance_due||0).toLocaleString()}`}    color={BRAND.pink}   t={t} />
                  <StatCard label="Total Purchase"  value={`₹${parseFloat(selCustData.total_purchase||0).toLocaleString()}`} color={BRAND.blue}   t={t} />
                  <StatCard label="Credit Limit"    value={`₹${parseFloat(selCustData.credit_limit||0).toLocaleString()}`}   color={BRAND.purple} t={t} />
                  <StatCard label="Loyalty Points"  value={selCustData.loyalty_points || 0}                                   color="#f0c040"      t={t} />
                </div>
              )}
              <DataTable columns={["#","Date","Particulars","Debit (₹)","Credit (₹)","Balance (₹)"]}
                rows={ledger.map((l,i) => ({
                  "#": i+1,
                  "Date": l.date ? new Date(l.date).toLocaleDateString("en-IN") : "—",
                  "Particulars": l.particulars || l.entry_type || "—",
                  "Debit (₹)":  parseFloat(l.debit)  > 0 ? `₹${parseFloat(l.debit).toLocaleString()}`  : "—",
                  "Credit (₹)": parseFloat(l.credit) > 0 ? `₹${parseFloat(l.credit).toLocaleString()}` : "—",
                  "Balance (₹)": `₹${parseFloat(l.running_balance||0).toLocaleString()}`,
                }))} t={t} emptyMsg="No ledger entries yet. Entries are created automatically when invoices are raised or payments are received." />
            </>
          )}
        </Card>
      )}

      {/* ── WALLET & POINTS ── */}
      {tab === "wallet" && (
        <Card t={t}>
          <CardHeader title={selCustData ? `Wallet — ${selCustData.full_name}` : "Wallet & Loyalty Points"} t={t}
            actions={<>
              <CustomerDropdown />
              {selCustomer && selCustData && (
                <BtnSm t={t} primary onClick={() => { setSelForModal(selCustData); setWalletModal(true); }}>
                  + Add Credit
                </BtnSm>
              )}
            </>} />
          {!selCustomer ? (
            <div style={{ textAlign:"center", padding:32, color:t.textFaint, fontSize:13 }}>
              Select a customer to view their wallet balance and loyalty points.
              <br /><br />
              <span style={{ fontSize:12 }}>Wallet: Store advance/refund amounts. Points: Earned on purchases, redeemable for discounts (1 point = ₹0.25).</span>
            </div>
          ) : loadingSub ? (
            <div style={{ textAlign:"center", padding:32, color:t.textFaint }}>Loading wallet...</div>
          ) : wallet ? (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:18 }}>
                <StatCard label="Wallet Balance"   value={`₹${parseFloat(wallet.wallet_balance||0).toLocaleString()}`}  color={BRAND.blue}   t={t} />
                <StatCard label="Loyalty Points"   value={wallet.loyalty_points || 0}                                    color={BRAND.purple} t={t} />
                <StatCard label="Redeemable Value" value={`₹${(wallet.redeemable_value||0).toLocaleString()}`}           color="#2ecc71"      t={t} />
                <StatCard label="Tier"             value={wallet.tier}                                                    color="#f0c040"      t={t} />
              </div>
              <div style={{ fontSize:12, color:t.textMuted, marginBottom:12, padding:"8px 12px", background:t.card2||t.card, borderRadius:8, border:`1px solid ${t.borderDash}` }}>
                Loyalty points are earned automatically on every purchase. 1 point = ₹0.25 redeemable value.
                Wallet balance can be added manually and is adjusted against bills.
              </div>
              <DataTable columns={["Type","Amount","Description","Date"]}
                rows={(wallet.wallet_log||[]).map(l => ({
                  "Type":        l.type,
                  "Amount":      `₹${parseFloat(l.amount).toLocaleString()}`,
                  "Description": l.description || "—",
                  "Date":        new Date(l.created_at).toLocaleDateString("en-IN"),
                }))} t={t} emptyMsg="No wallet transactions yet." />
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:32, color:t.textFaint }}>Loading...</div>
          )}
        </Card>
      )}

      {/* ── MEMBERSHIP ── */}
      {tab === "membership" && (
        <Card t={t}>
          <CardHeader title="Membership Tiers & Customers" t={t} />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:12, marginBottom:20 }}>
            {[
              { tier:"Platinum", min:"₹5,00,000+",  color:BRAND.purple, benefits:"5% discount · Priority service · Free hallmarking · Birthday gold coin", count: kpis.platinum||0 },
              { tier:"Gold",     min:"₹1,00,000+",  color:"#f0c040",    benefits:"3% discount · Birthday gift · Loyalty points 2x · Special invites",      count: kpis.gold||0 },
              { tier:"Silver",   min:"₹25,000+",    color:"#95a5a6",    benefits:"2% discount · Loyalty points 1.5x · Priority service",                    count: kpis.silver||0 },
              { tier:"Regular",  min:"New customer", color:BRAND.blue,   benefits:"Standard benefits · Loyalty points 1x",                                  count: customers.filter(c=>c.tier==="Regular").length },
            ].map(tier => (
              <div key={tier.tier} style={{ background:t.card, border:`1px solid ${t.borderDash}`, borderTop:`3px solid ${tier.color}`, borderRadius:12, padding:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:tier.color }}>{tier.tier}</div>
                  <div style={{ background:`${tier.color}22`, color:tier.color, border:`1px solid ${tier.color}44`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
                    {tier.count} customers
                  </div>
                </div>
                <div style={{ fontSize:11, color:t.textFaint, marginBottom:6 }}>Min spend: {tier.min}</div>
                <div style={{ fontSize:12, color:t.textSub, lineHeight:1.6 }}>{tier.benefits}</div>
              </div>
            ))}
          </div>
          <CardHeader title="All Customers by Tier" t={t} />
          <DataTable columns={["Customer","Code","Tier","Total Spend","Loyalty Points","Status","Actions"]}
            rows={customers.map(c => ({
              "Customer":      c.full_name,
              "Code":          c.customer_code || "—",
              "Tier":          c.tier,
              "Total Spend":   `₹${parseFloat(c.total_purchase||0).toLocaleString()}`,
              "Loyalty Points":c.loyalty_points || 0,
              "Status":        c.status,
              "Actions": (
                <button onClick={() => openEdit(c)}
                  style={{ background:BRAND.gradBtn, border:"none", borderRadius:6, color:"#fff", fontSize:11, padding:"4px 10px", cursor:"pointer" }}>
                  Edit Tier
                </button>
              ),
            }))} t={t} emptyMsg="No customers yet." />
        </Card>
      )}

      {/* ── CREDIT ── */}
      {tab === "credit" && (
        <Card t={t}>
          <CardHeader title="Credit Customer Register" t={t}
            actions={<div style={{ fontSize:12, color:t.textMuted }}>
              Customers with credit limit assigned. Shows outstanding balance vs available credit.
            </div>} />
          {credit.length === 0 ? (
            <div style={{ textAlign:"center", padding:32, color:t.textFaint, fontSize:13 }}>
              No credit customers yet. Set a credit limit when adding a customer to enable credit sales.
            </div>
          ) : (
            <DataTable columns={["Customer","Phone","Tier","Credit Limit","Balance Due","Available","Total Purchase"]}
              rows={credit.map(c => ({
                "Customer":       c.full_name,
                "Phone":          c.phone,
                "Tier":           c.tier,
                "Credit Limit":   `₹${parseFloat(c.credit_limit||0).toLocaleString()}`,
                "Balance Due":    `₹${parseFloat(c.balance_due||0).toLocaleString()}`,
                "Available":      `₹${parseFloat(c.available||0).toLocaleString()}`,
                "Total Purchase": `₹${parseFloat(c.total_purchase||0).toLocaleString()}`,
              }))} t={t} emptyMsg="No credit customers." />
          )}
        </Card>
      )}

      {/* ── DUE TRACKING ── */}
      {tab === "due" && (
        <Card t={t}>
          <CardHeader title="Pending Due Tracking" t={t}
            actions={
              <button
                onClick={() => {
                  if (due.length === 0) return;
                  due.forEach(c => {
                    window.open(`https://wa.me/91${c.phone}?text=${encodeURIComponent(`Dear ${c.full_name}, this is a reminder that you have a pending due of Rs.${parseFloat(c.balance_due).toLocaleString()} at Ceritage Jewellers. Please contact us at your earliest convenience.`)}`);
                  });
                }}
                style={{ background:"none", border:`1px solid ${BRAND.pink}`, borderRadius:7, color:BRAND.pink, fontSize:12, fontWeight:600, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>
                 Send Bulk Reminder
              </button>
            } />
          {due.length === 0 ? (
            <div style={{ textAlign:"center", padding:32, color:t.textFaint, fontSize:13 }}>
              No pending dues. All customers are settled.
            </div>
          ) : (
            <>
              <div style={{ background:`rgba(230,59,138,0.08)`, border:`1px solid rgba(230,59,138,0.2)`, borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:12, color:t.textSub }}>
                {due.length} customer{due.length > 1 ? "s" : ""} with pending balance.
                Total outstanding: ₹{due.reduce((sum,c) => sum + parseFloat(c.balance_due||0), 0).toLocaleString()}
              </div>
              <DataTable columns={["Customer","Phone","Tier","Balance Due","Credit Limit","Total Purchase","Action"]}
                rows={due.map(c => ({
                  "Customer":     c.full_name,
                  "Phone":        c.phone,
                  "Tier":         c.tier,
                  "Balance Due":  `₹${parseFloat(c.balance_due||0).toLocaleString()}`,
                  "Credit Limit": `₹${parseFloat(c.credit_limit||0).toLocaleString()}`,
                  "Total Purchase":`₹${parseFloat(c.total_purchase||0).toLocaleString()}`,
                  "Action": (
                    <a href={`tel:${c.phone}`}
                      style={{ background:"none", border:`1px solid ${BRAND.blue}`, borderRadius:6, color:BRAND.blue, fontSize:11, padding:"4px 10px", cursor:"pointer", textDecoration:"none", display:"inline-block" }}>
                      📞 Call
                    </a>
                  ),
                }))} t={t} emptyMsg="No pending dues." />
            </>
          )}
        </Card>
      )}

      {/* ── PURCHASE HISTORY ── */}
      {tab === "history" && (
        <Card t={t}>
          <CardHeader title={selCustData ? `Purchase History — ${selCustData.full_name}` : "Purchase History"} t={t}
            actions={<CustomerDropdown />} />
          {!selCustomer ? (
            <div style={{ textAlign:"center", padding:32, color:t.textFaint, fontSize:13 }}>
              Select a customer to view their complete purchase history.
              <br /><br />
              <span style={{ fontSize:12 }}>Shows all invoices, items purchased, amounts, payment modes and return history for the selected customer.</span>
            </div>
          ) : loadingSub ? (
            <div style={{ textAlign:"center", padding:32, color:t.textFaint }}>Loading purchase history...</div>
          ) : (
            <DataTable columns={["Invoice No.","Date","Items","Amount","Mode","Status"]}
              rows={history.map(h => ({
                "Invoice No.": h.invoice_no || "—",
                "Date":        h.invoice_date ? new Date(h.invoice_date).toLocaleDateString("en-IN") : "—",
                "Items":       h.items || "—",
                "Amount":      h.grand_total ? `₹${parseFloat(h.grand_total).toLocaleString()}` : "—",
                "Mode":        h.payment_mode || "—",
                "Status":      h.status || "—",
              }))} t={t} emptyMsg="No purchase history yet. History is populated when invoices are created in the Billing module." />
          )}
        </Card>
      )}

      {/* ── KYC ── */}
      {tab === "kyc" && (
        <Card t={t}>
          <CardHeader title="KYC Register" t={t}
            actions={<div style={{ fontSize:12, color:t.textMuted }}>
              Mandatory for purchases above ₹2,00,000 (PMLA compliance)
            </div>} />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10, marginBottom:16 }}>
            <StatCard label="KYC Complete"    value={kpis.kyc_complete ?? "—"}                                         color="#2ecc71"      t={t} />
            <StatCard label="KYC Pending"     value={kpis.total_customers && kpis.kyc_complete ? (kpis.total_customers - kpis.kyc_complete) : "—"} color="#f39c12" t={t} />
          </div>
          <DataTable columns={["Customer","Phone","Tier","PAN","Aadhaar","GST","KYC Status","Update"]}
            rows={customers.map(c => ({
              "Customer":  c.full_name,
              "Phone":     c.phone,
              "Tier":      c.tier,
              "PAN":       c.pan       ? <span style={{ fontFamily:"monospace", fontSize:11, color:BRAND.purple }}>{c.pan}</span>     : <span style={{ color:BRAND.pink, fontSize:11 }}>Not provided</span>,
              "Aadhaar":   c.aadhaar   ? <span style={{ fontFamily:"monospace", fontSize:11 }}>{"X".repeat(8) + c.aadhaar.slice(-4)}</span> : <span style={{ color:BRAND.pink, fontSize:11 }}>Not provided</span>,
              "GST":       c.gst_number ? <span style={{ fontFamily:"monospace", fontSize:11, color:BRAND.blue }}>{c.gst_number}</span> : <span style={{ color:t.textFaint, fontSize:11 }}>—</span>,
              "KYC Status": (
                <span style={{
                  background: c.kyc_status === "Complete" ? "rgba(46,204,113,0.15)" : c.kyc_status === "Incomplete" ? "rgba(243,156,18,0.15)" : "rgba(230,59,138,0.12)",
                  color:       c.kyc_status === "Complete" ? "#2ecc71"               : c.kyc_status === "Incomplete" ? "#f39c12"                : BRAND.pink,
                  border:`1px solid ${c.kyc_status === "Complete" ? "rgba(46,204,113,0.3)" : c.kyc_status === "Incomplete" ? "rgba(243,156,18,0.3)" : "rgba(230,59,138,0.3)"}`,
                  borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:600,
                }}>
                  {c.kyc_status}
                </span>
              ),
              "Update": (
                <button onClick={() => { setSelForModal(c); setKycModal(true); }}
                  style={{ background:BRAND.gradBtn, border:"none", borderRadius:6, color:"#fff", fontSize:11, padding:"4px 10px", cursor:"pointer" }}>
                  Update KYC
                </button>
              ),
            }))} t={t} emptyMsg="No customers yet." />
        </Card>
      )}

      {/* ── REMINDERS ── */}
      {tab === "reminders" && (
        <Card t={t}>
          <CardHeader title="Birthday & Anniversary Reminders — Next 30 Days" t={t}
            actions={
              <button
                onClick={() => {
                  if (reminders.length === 0) return;
                  reminders.forEach(r => {
                    window.open(`https://wa.me/91${r.phone}?text=${encodeURIComponent(`Dear ${r.full_name}, wishing you a very Happy ${r.reminder_type || "Birthday"}! 🎉 From Ceritage Jewellers`)}`);
                  });
                }}
                style={{ background:BRAND.gradBtn, border:"none", borderRadius:7, color:"#fff", fontSize:12, fontWeight:600, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>
                💬 Send All Wishes
              </button>
            } />
          {reminders.length === 0 ? (
            <div style={{ textAlign:"center", padding:32, color:t.textFaint, fontSize:13 }}>
              No upcoming birthdays or anniversaries in the next 30 days.
            </div>
          ) : (
            <>
              <div style={{ background:`rgba(59,85,230,0.08)`, border:`1px solid rgba(59,85,230,0.15)`, borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:12, color:t.textSub }}>
                {reminders.length} upcoming event{reminders.length > 1 ? "s" : ""} in next 30 days. Send personalized wishes to strengthen customer relationships.
              </div>
              <DataTable columns={["Customer","Phone","Tier","Event","Date","Days Left","Action"]}
                rows={reminders.map(r => ({
                  "Customer": r.full_name,
                  "Phone":    r.phone,
                  "Tier":     r.tier,
                  "Event":    r.reminder_type || "—",
                  "Date":     r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString("en-IN", {day:"numeric",month:"long"}) : "—",
                  "Days Left":r.days_left != null ? (r.days_left === 0 ? "Today! 🎉" : `${r.days_left} days`) : "—",
                  "Action": (
                    <a href={`https://wa.me/91${r.phone}?text=${encodeURIComponent(`Dear ${r.full_name}, wishing you a very Happy ${r.reminder_type || "Birthday"}! 🎉 From Ceritage Jewellers`)}`}
                      target="_blank" rel="noreferrer"
                      style={{ background:BRAND.gradBtn, border:"none", borderRadius:6, color:"#fff", fontSize:11, padding:"4px 10px", cursor:"pointer", textDecoration:"none", display:"inline-block" }}>
                       WhatsApp
                    </a>
                  ),
                }))} t={t} emptyMsg="No upcoming reminders." />
            </>
          )}
        </Card>
      )}

      {/* ── MODALS ── */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setFieldErrors({}); setFormError(""); }}
        title="Add New Customer" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => { setAddModal(false); setFieldErrors({}); }}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Customer"}</BtnPrimary>
        </>}>
        <CustomerForm form={form} onChange={onChange} errors={fieldErrors} t={t} />
        {formError && <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(230,59,138,0.1)", border:"1px solid rgba(230,59,138,0.3)", borderRadius:9, color:BRAND.pink, fontSize:13 }}>{formError}</div>}
      </Modal>

      <Modal open={editModal} onClose={() => { setEditModal(false); setFieldErrors({}); setFormError(""); }}
        title="Edit Customer" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => { setEditModal(false); setFieldErrors({}); }}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Update Customer"}</BtnPrimary>
        </>}>
        <CustomerForm form={form} onChange={onChange} errors={fieldErrors} t={t} />
        {formError && <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(230,59,138,0.1)", border:"1px solid rgba(230,59,138,0.3)", borderRadius:9, color:BRAND.pink, fontSize:13 }}>{formError}</div>}
      </Modal>

      <WalletCreditModal
        open={walletModal}
        onClose={() => setWalletModal(false)}
        customerId={selForModal?.id}
        customerName={selForModal?.full_name || ""}
        t={t}
        onSuccess={() => { fetchCustomers(); fetchKpis(); if (selCustomer) fetchWallet(selCustomer); }} />

      <KycModal
        open={kycModal}
        onClose={() => setKycModal(false)}
        customer={selForModal}
        t={t}
        onSuccess={() => { fetchCustomers(); fetchKpis(); }} />

      {/* LEDGER ENTRY MODAL */}
      <Modal open={ledgerModal} onClose={() => setLedgerModal(false)}
        title={`Add Ledger Entry — ${selCustData?.full_name || ""}`} t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setLedgerModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleLedgerEntry} disabled={ledgerSaving}>
            {ledgerSaving ? "Saving..." : "Add Entry"}
          </BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Date *" t={t} half>
            <Input t={t} type="date" value={ledgerEntry.date}
              onChange={e => setLedgerEntry(p => ({ ...p, date: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Particulars *" t={t} half>
            <Input t={t} placeholder="e.g. Payment received, Invoice raised"
              value={ledgerEntry.particulars}
              onChange={e => setLedgerEntry(p => ({ ...p, particulars: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Debit Amount (₹)" t={t} half>
            <Input t={t} type="number" step="0.01" placeholder="0.00 (amount customer owes)"
              value={ledgerEntry.debit}
              onChange={e => setLedgerEntry(p => ({ ...p, debit: e.target.value }))} />
            <div style={{ fontSize:10, color:t.textFaint, marginTop:3 }}>Debit = amount charged to customer</div>
          </FormGroup>
          <FormGroup label="Credit Amount (₹)" t={t} half>
            <Input t={t} type="number" step="0.01" placeholder="0.00 (amount customer paid)"
              value={ledgerEntry.credit}
              onChange={e => setLedgerEntry(p => ({ ...p, credit: e.target.value }))} />
            <div style={{ fontSize:10, color:t.textFaint, marginTop:3 }}>Credit = amount received from customer</div>
          </FormGroup>
        </FormGrid>
        {ledgerError && (
          <div style={{ marginTop:10, color:BRAND.pink, fontSize:13 }}>{ledgerError}</div>
        )}
      </Modal>
    </div>
  );
}
