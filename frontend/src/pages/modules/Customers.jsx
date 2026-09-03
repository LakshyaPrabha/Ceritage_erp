import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
         Input, Select, SectionTitle } from "../../components/ui";
import { apiRequest, formatCurrency } from "../../lib/api";

const API = window.__CERITAGE_API__ || "/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const TABS = [
  { id:"list",       label:"All Customers" },
  { id:"membership", label:"Membership & VIP Tiers" },
  { id:"reminders",  label:"Occasion Reminders" },
  { id:"notes",      label:"Customer Notes (CRM)" },
  { id:"history",    label:"Purchases & Returns" },
  { id:"ledger",     label:"Financial Ledger" },
  { id:"wallet",     label:"Wallet & Loyalty" },
  { id:"due",        label:"Due Tracking" },
  { id:"credit",     label:"Credit" },
  { id:"kyc",        label:"KYC" },
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
  const [tab, setTab] = useState("list");

  // ── Main States ──
  const [kpis, setKpis] = useState({});
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  // Selected Customer for sub-tabs & 360 View
  const [selectedCustId, setSelectedCustId] = useState("");
  const [custDetails, setCustDetails] = useState(null);
  const [c360Data, setC360Data] = useState(null);
  const [c360Modal, setC360Modal] = useState(false);
  const [c360Tab, setC360Tab] = useState("overview");

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [addWalletModal, setAddWalletModal] = useState(false);
  const [adjustWalletModal, setAdjustWalletModal] = useState(false);
  const [adjustLoyaltyModal, setAdjustLoyaltyModal] = useState(false);
  const [addNoteModal, setAddNoteModal] = useState(false);

  // Membership States & Modals
  const [membershipKpis, setMembershipKpis] = useState({});
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const [enrollModal, setEnrollModal] = useState(false);
  const [renewModal, setRenewModal] = useState(false);
  const [upgradeResultModal, setUpgradeResultModal] = useState(false);
  const [upgradeResults, setUpgradeResults] = useState(null);
  const [evaluatingUpgrades, setEvaluatingUpgrades] = useState(false);

  // Occasions State & Modals
  const [occasionKpis, setOccasionKpis] = useState({});
  const [occasions, setOccasions] = useState([]);
  const [occRange, setOccRange] = useState("7d");
  const [occFilter, setOccFilter] = useState("all");
  const [greetingModal, setGreetingModal] = useState(false);
  const [greetingCustomer, setGreetingCustomer] = useState(null);
  const [greetingResult, setGreetingResult] = useState(null);
  const [generatingGreeting, setGeneratingGreeting] = useState(false);
  const [includeCoupon, setIncludeCoupon] = useState(true);
  const [includeBonusPts, setIncludeBonusPts] = useState(false);
  const [bonusPointsVal, setBonusPointsVal] = useState(100);
  const [copied, setCopied] = useState(false);

  const [customerToArchive, setCustomerToArchive] = useState(null);

  // Sub-data for tabs
  const [ledgerData, setLedgerData] = useState({ customer: null, totalDebit: 0, totalCredit: 0, balanceDue: 0, entries: [] });
  const [walletDetails, setWalletDetails] = useState({ balance: 0, transactions: [] });
  const [loyaltyDetails, setLoyaltyDetails] = useState({ points: 0, redeemable_value: 0, transactions: [] });
  const [purchasesAndReturns, setPurchasesAndReturns] = useState({ summary: {}, invoices: [], returns: [] });
  const [customerNotes, setCustomerNotes] = useState([]);
  const [activityEvents, setActivityEvents] = useState([]);
  const [dues, setDues] = useState([]);
  const [creditList, setCreditList] = useState([]);
  const [kycList, setKycList] = useState([]);

  // Forms
  const [formData, setFormData] = useState({
    full_name: "", phone: "", email: "", date_of_birth: "", anniversary: "",
    tier: "Regular", city: "", state: "Maharashtra", pan: "", aadhaar: "",
    gst_number: "", credit_limit: 0, loyalty_points: 0, wallet_balance: 0,
    kyc_status: "Pending",
    opt_in_whatsapp: true, opt_in_sms: true, opt_in_marketing: false,
    preferred_channel: "WHATSAPP",
  });
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const [enrollForm, setEnrollForm] = useState({
    customer_id: "", plan_id: "", start_date: new Date().toISOString().slice(0, 10),
    fee_paid: 0, payment_mode: "Cash", notes: "",
  });
  const [renewForm, setRenewForm] = useState({
    customer_id: "", fee_paid: 0, payment_mode: "Cash", notes: "",
  });
  const [memMsg, setMemMsg] = useState("");

  const [paymentForm, setPaymentForm] = useState({
    amount: "", payment_mode: "UPI", invoice_no: "", notes: "", date: new Date().toISOString().slice(0, 10),
  });
  const [paying, setPaying] = useState(false);
  const [payMsg, setPayMsg] = useState("");

  const [walletTopupForm, setWalletTopupForm] = useState({ amount: "", payment_mode: "Cash", notes: "" });
  const [walletAdjustForm, setWalletAdjustForm] = useState({ amount: "", type: "CREDIT", reason: "" });
  const [loyaltyAdjustForm, setLoyaltyAdjustForm] = useState({ points: "", type: "EARN", reason: "" });
  const [walletMsg, setWalletMsg] = useState("");
  const [loyaltyMsg, setLoyaltyMsg] = useState("");

  const [noteForm, setNoteForm] = useState({ category: "General", note_text: "", is_pinned: false });
  const [noteMsg, setNoteMsg] = useState("");

  // ── Load KPIs ──
  const loadKpis = useCallback(async () => {
    try {
      const res = await apiRequest("/customers/kpis");
      setKpis(res.data || {});
    } catch (err) {
      console.warn("KPI error:", err.message);
    }
  }, []);

  // ── Load Customer List ──
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let q = `/customers?limit=100&status=${statusFilter}`;
      if (search) q += `&search=${encodeURIComponent(search)}`;
      if (tierFilter) q += `&tier=${encodeURIComponent(tierFilter)}`;
      const res = await apiRequest(q);
      setCustomers(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load customers.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search, tierFilter, statusFilter]);

  // ── Load Membership Data ──
  const loadMembershipData = useCallback(async () => {
    try {
      const [plansRes, membersRes, kpisRes] = await Promise.all([
        apiRequest("/membership/plans"),
        apiRequest("/membership/members"),
        apiRequest("/membership/kpis"),
      ]);
      setMembershipPlans(plansRes.data || []);
      setActiveMembers(membersRes.data || []);
      setMembershipKpis(kpisRes.data || {});
    } catch (err) {
      console.warn("Membership load notice:", err.message);
    }
  }, []);

  // ── Load Occasion Reminders Data ──
  const loadOccasionsData = useCallback(async () => {
    try {
      const [kpiRes, occRes] = await Promise.all([
        apiRequest("/customers/occasions/kpis"),
        apiRequest(`/customers/occasions?range=${occRange}&occasion=${occFilter}`),
      ]);
      setOccasionKpis(kpiRes.data || {});
      setOccasions(occRes.data || []);
    } catch (err) {
      console.warn("Occasion load error:", err.message);
    }
  }, [occRange, occFilter]);

  useEffect(() => {
    loadKpis();
    loadCustomers();
    loadMembershipData();
    loadOccasionsData();
  }, [loadKpis, loadCustomers, loadMembershipData, loadOccasionsData]);

  // ── Load Tab Data ──
  const loadTabData = useCallback(async () => {
    try {
      if (tab === "membership") {
        await loadMembershipData();
      } else if (tab === "reminders") {
        await loadOccasionsData();
      } else if (tab === "due") {
        const res = await apiRequest("/customers/reports/dues");
        setDues(res.data || []);
      } else if (tab === "credit") {
        const res = await apiRequest("/customers/reports/credit");
        setCreditList(res.data || []);
      } else if (tab === "kyc") {
        const res = await apiRequest("/customers/reports/kyc");
        setKycList(res.data || []);
      }
    } catch (err) {
      console.warn("Tab load notice:", err.message);
    }
  }, [tab, loadMembershipData, loadOccasionsData]);

  useEffect(() => {
    loadTabData();
  }, [tab, loadTabData]);

  // ── Load Specific Customer Details ──
  const handleLoadCustomer360 = async (cid) => {
    if (!cid) return;
    setSelectedCustId(cid);
    try {
      const [c360Res, notesRes, actsRes, prRes] = await Promise.all([
        apiRequest(`/customers/${cid}/360`),
        apiRequest(`/customers/${cid}/notes`),
        apiRequest(`/customers/${cid}/activity?limit=50`),
        apiRequest(`/customers/${cid}/purchases-and-returns`),
      ]);
      setC360Data(c360Res.data);
      setCustomerNotes(notesRes.data || []);
      setActivityEvents(actsRes.data || []);
      setPurchasesAndReturns(prRes.data || { summary: {}, invoices: [], returns: [] });
      setC360Tab("overview");
      setC360Modal(true);
    } catch (err) {
      alert(`Could not load Customer 360 profile: ${err.message}`);
    }
  };

  const handleLoadNotes = async (cid) => {
    if (!cid) { setCustomerNotes([]); return; }
    try {
      const res = await apiRequest(`/customers/${cid}/notes`);
      setCustomerNotes(res.data || []);
    } catch {
      setCustomerNotes([]);
    }
  };

  const handleLoadPurchasesAndReturns = async (cid) => {
    if (!cid) { setPurchasesAndReturns({ summary: {}, invoices: [], returns: [] }); return; }
    try {
      const res = await apiRequest(`/customers/${cid}/purchases-and-returns`);
      setPurchasesAndReturns(res.data || { summary: {}, invoices: [], returns: [] });
    } catch {
      setPurchasesAndReturns({ summary: {}, invoices: [], returns: [] });
    }
  };

  const handleLoadLedger = async (cid) => {
    if (!cid) { setLedgerData({ customer: null, totalDebit: 0, totalCredit: 0, balanceDue: 0, entries: [] }); return; }
    try {
      const res = await apiRequest(`/customers/${cid}/ledger`);
      setLedgerData(res.data || { customer: null, totalDebit: 0, totalCredit: 0, balanceDue: 0, entries: [] });
    } catch {
      setLedgerData({ customer: null, totalDebit: 0, totalCredit: 0, balanceDue: 0, entries: [] });
    }
  };

  const handleLoadWalletLoyalty = async (cid) => {
    if (!cid) {
      setWalletDetails({ balance: 0, transactions: [] });
      setLoyaltyDetails({ points: 0, redeemable_value: 0, transactions: [] });
      return;
    }
    try {
      const [wRes, lRes] = await Promise.all([
        apiRequest(`/customers/${cid}/wallet`),
        apiRequest(`/customers/${cid}/loyalty`),
      ]);
      setWalletDetails(wRes.data || { balance: 0, transactions: [] });
      setLoyaltyDetails(lRes.data || { points: 0, redeemable_value: 0, transactions: [] });
    } catch (err) {
      console.warn("Wallet/Loyalty error:", err.message);
    }
  };

  // ── Occasion Greeting & Ack Handlers ──
  const openGreetingModal = (occ) => {
    setGreetingCustomer(occ);
    setGreetingResult(null);
    setCopied(false);
    setIncludeCoupon(true);
    setIncludeBonusPts(false);
    setGreetingModal(true);
  };

  const handleGenerateGreetingAction = async () => {
    if (!greetingCustomer) return;
    setGeneratingGreeting(true);
    try {
      const res = await apiRequest(`/customers/${greetingCustomer.customerId}/occasions/greeting`, {
        method: "POST",
        body: JSON.stringify({
          occasion_type: greetingCustomer.occasionType,
          include_coupon: includeCoupon,
          include_bonus_points: includeBonusPts,
          bonus_points: bonusPointsVal
        }),
      });
      setGreetingResult(res.data);
      await loadOccasionsData();
    } catch (err) {
      alert(`Could not generate greeting: ${err.message}`);
    } finally {
      setGeneratingGreeting(false);
    }
  };

  const handleCopyGreeting = () => {
    if (greetingResult?.greeting) {
      navigator.clipboard.writeText(greetingResult.greeting);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleAcknowledgeOccasion = async (occ) => {
    try {
      await apiRequest(`/customers/${occ.customerId}/occasions/${occ.occasionType}/acknowledge`, {
        method: "POST",
        body: JSON.stringify({
          occasion_date: occ.occasionDate,
          notes: "Acknowledged via Reminders Portal"
        }),
      });
      await loadOccasionsData();
    } catch (err) {
      alert(`Could not acknowledge reminder: ${err.message}`);
    }
  };

  // ── Membership Handlers ──
  const openEnrollModal = (cust = null, plan = null) => {
    setEnrollForm({
      customer_id: cust ? cust.id : (customers[0]?.id || ""),
      plan_id: plan ? plan.id : (membershipPlans[1]?.id || membershipPlans[0]?.id || ""),
      start_date: new Date().toISOString().slice(0, 10),
      fee_paid: plan?.annual_fee || 0,
      payment_mode: "Cash",
      notes: "Enrolled from Membership Portal",
    });
    setMemMsg("");
    setEnrollModal(true);
  };

  const openRenewModal = (member) => {
    setRenewForm({
      customer_id: member.customer_id,
      customer_name: member.customer_name,
      plan_name: member.plan_name,
      fee_paid: member.fee_paid || 0,
      payment_mode: "Cash",
      notes: "Membership renewal",
    });
    setMemMsg("");
    setRenewModal(true);
  };

  const handleSaveEnrollment = async (e) => {
    e.preventDefault();
    if (!enrollForm.customer_id || !enrollForm.plan_id) {
      setMemMsg("Please select customer and membership plan");
      return;
    }
    try {
      await apiRequest(`/customers/${enrollForm.customer_id}/membership/enroll`, {
        method: "POST",
        body: JSON.stringify(enrollForm),
      });
      setEnrollModal(false);
      await loadMembershipData();
      await loadCustomers();
      await loadKpis();
    } catch (err) {
      setMemMsg(`✗ ${err.message}`);
    }
  };

  const handleSaveRenewal = async (e) => {
    e.preventDefault();
    if (!renewForm.customer_id) return;
    try {
      await apiRequest(`/customers/${renewForm.customer_id}/membership/renew`, {
        method: "POST",
        body: JSON.stringify(renewForm),
      });
      setRenewModal(false);
      await loadMembershipData();
      await loadCustomers();
      await loadKpis();
    } catch (err) {
      setMemMsg(`✗ ${err.message}`);
    }
  };

  const handleEvaluateTierUpgrades = async () => {
    setEvaluatingUpgrades(true);
    try {
      const res = await apiRequest("/membership/evaluate-tier-upgrades", { method: "POST" });
      setUpgradeResults(res.data);
      setUpgradeResultModal(true);
      await loadMembershipData();
      await loadCustomers();
      await loadKpis();
    } catch (err) {
      alert(`Could not evaluate tier upgrades: ${err.message}`);
    } finally {
      setEvaluatingUpgrades(false);
    }
  };

  // ── Note Handlers ──
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!selectedCustId || !noteForm.note_text) {
      setNoteMsg("Note text is required");
      return;
    }
    try {
      await apiRequest(`/customers/${selectedCustId}/notes`, {
        method: "POST",
        body: JSON.stringify(noteForm),
      });
      setAddNoteModal(false);
      setNoteForm({ category: "General", note_text: "", is_pinned: false });
      await handleLoadNotes(selectedCustId);
      if (c360Modal) {
        const c360Res = await apiRequest(`/customers/${selectedCustId}/360`);
        setC360Data(c360Res.data);
      }
    } catch (err) {
      setNoteMsg(`✗ ${err.message}`);
    }
  };

  const handleTogglePinNote = async (note) => {
    try {
      await apiRequest(`/customers/${selectedCustId}/notes/${note.id}/pin`, {
        method: "PUT",
        body: JSON.stringify({ is_pinned: !note.is_pinned }),
      });
      await handleLoadNotes(selectedCustId);
    } catch (err) {
      alert(`Could not toggle pin: ${err.message}`);
    }
  };

  const handleDeleteNote = async (note) => {
    if (!confirm("Are you sure you want to remove this customer note?")) return;
    try {
      await apiRequest(`/customers/${selectedCustId}/notes/${note.id}`, { method: "DELETE" });
      await handleLoadNotes(selectedCustId);
    } catch (err) {
      alert(`Could not delete note: ${err.message}`);
    }
  };

  // ── Customer CRUD & Payment Handlers ──
  const openAddModal = () => {
    setFormData({
      full_name: "", phone: "", email: "", date_of_birth: "", anniversary: "",
      tier: "Regular", city: "", state: "Maharashtra", pan: "", aadhaar: "",
      gst_number: "", credit_limit: 0, loyalty_points: 0, wallet_balance: 0,
      kyc_status: "Pending",
      opt_in_whatsapp: true, opt_in_sms: true, opt_in_marketing: false,
      preferred_channel: "WHATSAPP",
    });
    setFormMsg("");
    setAddModal(true);
  };

  const openEditModal = (cust) => {
    setCustDetails(cust);
    setFormData({
      full_name: cust.full_name || "",
      phone: cust.phone || "",
      email: cust.email || "",
      date_of_birth: cust.date_of_birth ? cust.date_of_birth.slice(0, 10) : "",
      anniversary: cust.anniversary ? cust.anniversary.slice(0, 10) : "",
      tier: cust.tier || "Regular",
      city: cust.city || "",
      state: cust.state || "Maharashtra",
      pan: cust.pan || "",
      aadhaar: cust.aadhaar || "",
      gst_number: cust.gst_number || "",
      credit_limit: cust.credit_limit || 0,
      loyalty_points: cust.loyalty_points || 0,
      wallet_balance: cust.wallet_balance || 0,
      kyc_status: cust.kyc_status || "Pending",
      opt_in_whatsapp: cust.opt_in_whatsapp !== undefined ? Boolean(cust.opt_in_whatsapp) : true,
      opt_in_sms: cust.opt_in_sms !== undefined ? Boolean(cust.opt_in_sms) : true,
      opt_in_marketing: Boolean(cust.opt_in_marketing),
      preferred_channel: cust.preferred_channel || "WHATSAPP",
    });
    setFormMsg("");
    setEditModal(true);
  };

  const openPaymentModal = (cust) => {
    setCustDetails(cust);
    setSelectedCustId(cust.id);
    setPaymentForm({
      amount: cust.balance_due > 0 ? cust.balance_due : "",
      payment_mode: "UPI",
      invoice_no: "",
      notes: "Due settlement",
      date: new Date().toISOString().slice(0, 10),
    });
    setPayMsg("");
    setPaymentModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) {
      setFormMsg("Name and mobile phone are required.");
      return;
    }
    setSaving(true);
    setFormMsg("");
    try {
      await apiRequest("/customers", { method: "POST", body: JSON.stringify(formData) });
      setAddModal(false);
      await loadCustomers();
      await loadKpis();
      await loadOccasionsData();
    } catch (err) {
      setFormMsg(`✗ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!custDetails?.id) return;
    setSaving(true);
    setFormMsg("");
    try {
      await apiRequest(`/customers/${custDetails.id}`, { method: "PUT", body: JSON.stringify(formData) });
      setEditModal(false);
      await loadCustomers();
      await loadKpis();
      await loadOccasionsData();
    } catch (err) {
      setFormMsg(`✗ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedCustId || !paymentForm.amount || Number(paymentForm.amount) <= 0) return;
    setPaying(true);
    setPayMsg("");
    try {
      await apiRequest(`/customers/${selectedCustId}/payments`, { method: "POST", body: JSON.stringify(paymentForm) });
      setPaymentModal(false);
      await handleLoadLedger(selectedCustId);
      await loadCustomers();
      await loadKpis();
    } catch (err) {
      setPayMsg(`✗ ${err.message}`);
    } finally {
      setPaying(false);
    }
  };

  const handleTopupWallet = async (e) => {
    e.preventDefault();
    if (!selectedCustId || !walletTopupForm.amount) return;
    try {
      await apiRequest(`/customers/${selectedCustId}/wallet/credit`, { method: "POST", body: JSON.stringify(walletTopupForm) });
      setAddWalletModal(false);
      setWalletTopupForm({ amount: "", payment_mode: "Cash", notes: "" });
      await handleLoadWalletLoyalty(selectedCustId);
      await loadCustomers();
    } catch (err) {
      setWalletMsg(`✗ ${err.message}`);
    }
  };

  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    if (!selectedCustId || !walletAdjustForm.amount || !walletAdjustForm.reason) return;
    try {
      await apiRequest(`/customers/${selectedCustId}/wallet/adjust`, { method: "POST", body: JSON.stringify(walletAdjustForm) });
      setAdjustWalletModal(false);
      setWalletAdjustForm({ amount: "", type: "CREDIT", reason: "" });
      await handleLoadWalletLoyalty(selectedCustId);
      await loadCustomers();
    } catch (err) {
      setWalletMsg(`✗ ${err.message}`);
    }
  };

  const handleAdjustLoyalty = async (e) => {
    e.preventDefault();
    if (!selectedCustId || !loyaltyAdjustForm.points || !loyaltyAdjustForm.reason) return;
    try {
      await apiRequest(`/customers/${selectedCustId}/loyalty/adjust`, { method: "POST", body: JSON.stringify(loyaltyAdjustForm) });
      setAdjustLoyaltyModal(false);
      setLoyaltyAdjustForm({ points: "", type: "EARN", reason: "" });
      await handleLoadWalletLoyalty(selectedCustId);
      await loadCustomers();
    } catch (err) {
      setLoyaltyMsg(`✗ ${err.message}`);
    }
  };

  const promptArchiveCustomer = (cust) => {
    setCustomerToArchive(cust);
    setArchiveModal(true);
  };

  const handleConfirmArchive = async () => {
    if (!customerToArchive?.id) return;
    try {
      await apiRequest(`/customers/${customerToArchive.id}`, { method: "DELETE" });
      setArchiveModal(false);
      setCustomerToArchive(null);
      await loadCustomers();
      await loadKpis();
    } catch (err) {
      alert(`Could not archive customer: ${err.message}`);
    }
  };

  const handleRestoreCustomer = async (cust) => {
    try {
      await apiRequest(`/customers/${cust.id}/restore`, { method: "POST" });
      await loadCustomers();
      await loadKpis();
    } catch (err) {
      alert(`Could not restore customer: ${err.message}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customer Management & 360° Profile"
        subtitle="Customer Directory · VIP Membership Tiers · Occasion Reminders · CRM Notes · Purchases & Returns · Financial Ledger"
        t={t}
        actions={<>
          <BtnPrimary onClick={openAddModal}>+ Add Customer</BtnPrimary>
        </>}
      />

      {/* ── KPI Stat Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Active Customers"    value={kpis.total_customers ?? 0} color={BRAND.blue}   t={t} />
        <StatCard label="Birthdays Today"     value={occasionKpis.birthdaysToday ?? 0} color={BRAND.purple} t={t} />
        <StatCard label="Anniversaries Today" value={occasionKpis.anniversariesToday ?? 0} color="#e67e22" t={t} />
        <StatCard label="Pending Dues"        value={kpis.pending_dues ?? 0}    color={BRAND.pink}   t={t} />
        <StatCard label="Total VIP Members"   value={membershipKpis.total_vip_members ?? 0} color="#f1c40f" t={t} />
        <StatCard label="Archived Customers"  value={kpis.archived_customers ?? 0} color="#95a5a6"    t={t} />
      </div>

      {error && (
        <div style={{ color:BRAND.pink, fontSize:13, marginBottom:16 }}>
          {error}
        </div>
      )}

      {/* ── Tabs Navigation ── */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── TAB 1: ALL CUSTOMERS DIRECTORY ── */}
      {tab === "list" && (
        <Card t={t}>
          <CardHeader
            title="Customer Directory"
            actions={<>
              <input
                placeholder="Search name, phone, ID, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                  borderRadius:8, padding:"7px 12px", fontSize:13,
                  color:t.inputColor, outline:"none", fontFamily:"inherit", width:230
                }}
              />
              <Select
                t={t}
                style={{ width:130 }}
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
              >
                <option value="">All Tiers</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Regular">Regular</option>
              </Select>
              <Select
                t={t}
                style={{ width:160 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="active">Active Customers</option>
                <option value="archived">Archived Customers</option>
                <option value="all">All (Active & Archived)</option>
              </Select>
              <BtnOutline t={t} onClick={loadCustomers}>Refresh</BtnOutline>
            </>}
            t={t}
          />
          <DataTable
            columns={["Customer ID", "Full Name", "Phone", "Registered Branch", "Tier", "City", "Wallet", "Points", "Balance Due", "Actions"]}
            rows={customers.map(c => ({
              "Customer ID": <code>{c.customer_id || `CUST-${c.id}`}</code>,
              "Full Name": <strong>{c.full_name}</strong>,
              "Phone": c.phone,
              "Registered Branch": (
                <span style={{
                  padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: "rgba(59,85,230,0.1)", color: BRAND.blue,
                  display: "inline-flex", alignItems: "center", gap: 4
                }}>
                   {c.branch_name || "Main Showroom"}
                </span>
              ),
              "Tier": (
                <span style={{
                  padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700,
                  background: c.tier === "Platinum" ? `${BRAND.purple}22` : (c.tier === "Gold" ? "#f0c04022" : (c.tier === "Silver" ? "#95a5a622" : "#3498db22")),
                  color: c.tier === "Platinum" ? BRAND.purple : (c.tier === "Gold" ? "#b7950b" : (c.tier === "Silver" ? "#7f8c8d" : "#2980b9"))
                }}>
                  {c.tier}
                </span>
              ),
              "City": c.city || "-",
              "Wallet": <strong style={{ color:"#27ae60" }}>{formatCurrency(c.wallet_balance || 0)}</strong>,
              "Points": <span style={{ color:BRAND.purple, fontWeight:700 }}>{c.loyalty_points || 0} pts</span>,
              "Balance Due": (
                <span style={{ color: c.balance_due > 0 ? BRAND.pink : t.textMuted, fontWeight: c.balance_due > 0 ? 700 : 400 }}>
                  {formatCurrency(c.balance_due)}
                </span>
              ),
              "Actions": (
                <div style={{ display:"flex", gap:6 }}>
                  <BtnSm t={t} primary onClick={() => handleLoadCustomer360(c.id)}>View 360°</BtnSm>
                  <BtnSm t={t} onClick={() => openEditModal(c)}>Edit</BtnSm>
                  {c.status === "ACTIVE" ? (
                    <BtnSm t={t} style={{ color:BRAND.pink }} onClick={() => promptArchiveCustomer(c)}>Archive</BtnSm>
                  ) : (
                    <BtnSm t={t} onClick={() => handleRestoreCustomer(c)}>Restore</BtnSm>
                  )}
                </div>
              )
            }))}
            t={t}
            emptyMsg={loading ? "Loading customers..." : "No matching customers found"}
          />
        </Card>
      )}

      {/* ── TAB 2: MEMBERSHIP & VIP TIERS ── */}
      {tab === "membership" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12, marginBottom:16 }}>
            <StatCard label="Total VIP Members" value={membershipKpis.total_vip_members ?? 0} color={BRAND.purple} t={t} />
            <StatCard label="Platinum Tier"    value={membershipKpis.platinum_count ?? 0}    color="#8e44ad"      t={t} />
            <StatCard label="Gold Tier"        value={membershipKpis.gold_count ?? 0}        color="#f39c12"      t={t} />
            <StatCard label="Silver Tier"      value={membershipKpis.silver_count ?? 0}      color="#7f8c8d"      t={t} />
            <StatCard label="Expiring in 30d"  value={membershipKpis.expiring_soon ?? 0}     color={BRAND.pink}   t={t} />
            <StatCard label="Plan Revenue"     value={formatCurrency(membershipKpis.total_membership_revenue || 0)} color="#27ae60" t={t} />
          </div>

          <Card t={t} style={{ marginBottom:16 }}>
            <CardHeader
              title="Membership Tier Plans & Benefit Rules"
              t={t}
              actions={<>
                <BtnOutline t={t} onClick={handleEvaluateTierUpgrades} disabled={evaluatingUpgrades}>
                  {evaluatingUpgrades ? "Scanning Spend..." : "Evaluate Tier Upgrades"}
                </BtnOutline>
                <BtnPrimary onClick={() => openEnrollModal()}>
                  + Enroll Member
                </BtnPrimary>
              </>}
            />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:14, padding:"0 16px 16px 16px" }}>
              {membershipPlans.map(p => (
                <div key={p.id} style={{
                  background: t.card2 || t.card,
                  border: `1px solid ${p.badge_color || BRAND.purple}55`,
                  borderRadius:12, padding:16, position:"relative", overflow:"hidden"
                }}>
                  <div style={{
                    position:"absolute", top:0, left:0, right:0, height:4,
                    background: p.badge_color || BRAND.purple
                  }} />
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <strong style={{ fontSize:16, color: p.badge_color || t.text }}>{p.name}</strong>
                    <span style={{
                      padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:800,
                      background:`${p.badge_color || BRAND.purple}22`, color: p.badge_color || BRAND.purple
                    }}>
                      {p.loyalty_multiplier}X Points
                    </span>
                  </div>

                  <div style={{ fontSize:12, color:t.textMuted, marginBottom:10 }}>
                    <div>Min Qualifying Spend: <strong>{formatCurrency(p.min_spend)}</strong></div>
                    <div>Making Discount: <strong style={{ color: Number(p.making_discount_pct) > 0 ? "#27ae60" : t.text }}>{p.making_discount_pct}% OFF</strong></div>
                    <div>Validity: <strong>{p.validity_days} Days</strong></div>
                  </div>

                  <div style={{ fontSize:11, color:t.text, borderTop:`1px solid ${t.borderDash}`, paddingTop:8, lineHeight:1.4 }}>
                    {p.perks_description || "Standard loyalty and invoicing"}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card t={t}>
            <CardHeader title="Active Member Subscriptions Directory" t={t} />
            <DataTable
              columns={["Customer", "Plan Tier", "Start Date", "Expiry Date", "Days Left", "Making Disc %", "Points Multiplier", "Status", "Actions"]}
              rows={activeMembers.map(m => ({
                "Customer": (
                  <div>
                    <strong>{m.customer_name}</strong>
                    <div style={{ fontSize:11, color:t.textMuted }}>{m.cust_code} · {m.customer_phone}</div>
                  </div>
                ),
                "Plan Tier": (
                  <span style={{
                    padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700,
                    background:`${m.badge_color || BRAND.purple}22`, color: m.badge_color || BRAND.purple
                  }}>
                    {m.plan_name}
                  </span>
                ),
                "Start Date": m.start_date ? new Date(m.start_date).toLocaleDateString("en-IN") : "-",
                "Expiry Date": m.expiry_date ? new Date(m.expiry_date).toLocaleDateString("en-IN") : "-",
                "Days Left": (
                  <span style={{
                    fontWeight:700,
                    color: m.days_remaining <= 0 ? BRAND.pink : (m.days_remaining <= 30 ? "#e67e22" : "#27ae60")
                  }}>
                    {m.days_remaining <= 0 ? "Expired" : `${m.days_remaining} days`}
                  </span>
                ),
                "Making Disc %": <strong>{m.making_discount_pct}%</strong>,
                "Points Multiplier": <strong>{m.loyalty_multiplier}X</strong>,
                "Status": (
                  <span style={{
                    padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                    background: m.active_status === "ACTIVE" ? "#2ecc7122" : (m.active_status === "UPGRADED" ? "#3498db22" : "#e74c3c22"),
                    color: m.active_status === "ACTIVE" ? "#27ae60" : (m.active_status === "UPGRADED" ? "#2980b9" : BRAND.pink)
                  }}>
                    {m.active_status}
                  </span>
                ),
                "Actions": (
                  <div style={{ display:"flex", gap:6 }}>
                    <BtnSm t={t} onClick={() => openRenewModal(m)}>Renew</BtnSm>
                    <BtnSm t={t} primary onClick={() => openEnrollModal({ id: m.customer_id, full_name: m.customer_name })}>Upgrade</BtnSm>
                  </div>
                )
              }))}
              t={t}
              emptyMsg="No active member subscriptions found"
            />
          </Card>
        </div>
      )}

      {/* ── TAB 3: OCCASION REMINDERS (PHASE 6A) ── */}
      {tab === "reminders" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12, marginBottom:16 }}>
            <StatCard label="Birthdays Today"      value={occasionKpis.birthdaysToday ?? 0}     color={BRAND.purple} t={t} />
            <StatCard label="Anniversaries Today"  value={occasionKpis.anniversariesToday ?? 0} color="#e67e22"      t={t} />
            <StatCard label="Next 7 Days"          value={occasionKpis.upcoming7Days ?? 0}      color={BRAND.blue}   t={t} />
            <StatCard label="VIP Occasions"        value={occasionKpis.vipOccasionsThisMonth ?? 0} color="#f1c40f"  t={t} />
          </div>

          <Card t={t}>
            <CardHeader
              title="Birthday & Anniversary Celebrations Feed"
              t={t}
              actions={<>
                <Select
                  t={t}
                  style={{ width:150 }}
                  value={occRange}
                  onChange={(e) => setOccRange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="7d">Next 7 Days</option>
                  <option value="30d">Next 30 Days</option>
                  <option value="month">This Month</option>
                  <option value="all">All Occasions</option>
                </Select>

                <Select
                  t={t}
                  style={{ width:160 }}
                  value={occFilter}
                  onChange={(e) => setOccFilter(e.target.value)}
                >
                  <option value="all">All Event Types</option>
                  <option value="birthday">Birthdays Only</option>
                  <option value="anniversary">Anniversaries Only</option>
                </Select>

                <BtnOutline t={t} onClick={loadOccasionsData}>Refresh</BtnOutline>
              </>}
            />

            <DataTable
              columns={["Customer", "Event Type", "Event Date", "Countdown", "Tier", "Channels", "Status", "Actions"]}
              rows={occasions.map(o => ({
                Customer: (
                  <div>
                    <strong>{o.customerName}</strong>
                    <div style={{ fontSize:11, color:t.textMuted }}>{o.custCode} · {o.phone}</div>
                  </div>
                ),
                "Event Type": (
                  <span style={{
                    padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:700,
                    background: o.occasionType === "BIRTHDAY" ? `${BRAND.purple}22` : "#e67e2222",
                    color: o.occasionType === "BIRTHDAY" ? BRAND.purple : "#d35400"
                  }}>
                    {o.occasionType === "BIRTHDAY" ? "Birthday" : "Anniversary"}
                  </span>
                ),
                "Event Date": o.occasionDate ? new Date(o.occasionDate).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "-",
                Countdown: (
                  <span style={{
                    fontWeight:800,
                    color: o.daysUntil === 0 ? "#27ae60" : (o.daysUntil <= 3 ? BRAND.purple : (o.daysUntil <= 7 ? BRAND.blue : t.textMuted))
                  }}>
                    {o.daysUntil === 0 ? "TODAY" : (o.daysUntil === 1 ? "Tomorrow" : `In ${o.daysUntil} days`)}
                  </span>
                ),
                Tier: (
                  <span style={{
                    padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700,
                    background: `${o.badgeColor || BRAND.purple}22`,
                    color: o.badgeColor || BRAND.purple
                  }}>
                    {o.tier}
                  </span>
                ),
                Channels: (
                  <span style={{ fontSize:11, color:t.textMuted }}>
                    {o.preferences.optInWhatsapp ? "WA" : ""}{o.preferences.optInSms ? " + SMS" : ""}
                  </span>
                ),
                Status: (
                  <span style={{
                    padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                    background: o.status === "ACKNOWLEDGED" ? "#2ecc7122" : (o.daysUntil === 0 ? "#e74c3c22" : "#3498db22"),
                    color: o.status === "ACKNOWLEDGED" ? "#27ae60" : (o.daysUntil === 0 ? BRAND.pink : "#2980b9")
                  }}>
                    {o.status}
                  </span>
                ),
                Actions: (
                  <div style={{ display:"flex", gap:6 }}>
                    <BtnSm t={t} primary onClick={() => openGreetingModal(o)}>Generate Greeting</BtnSm>
                    {o.status !== "ACKNOWLEDGED" && (
                      <BtnSm t={t} onClick={() => handleAcknowledgeOccasion(o)}>Acknowledge</BtnSm>
                    )}
                  </div>
                )
              }))}
              t={t}
              emptyMsg="No upcoming occasions found for the selected window"
            />
          </Card>
        </div>
      )}

      {/* ── TAB 4: CUSTOMER NOTES (CRM) ── */}
      {tab === "notes" && (
        <Card t={t}>
          <CardHeader
            title="Customer Notes & Staff Follow-ups"
            t={t}
            actions={<>
              <Select
                t={t}
                style={{ width:280 }}
                value={selectedCustId}
                onChange={(e) => {
                  setSelectedCustId(e.target.value);
                  handleLoadNotes(e.target.value);
                }}
              >
                <option value="">-- Select Customer for Notes --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone}) - {c.tier}
                  </option>
                ))}
              </Select>
              {selectedCustId && (
                <BtnPrimary onClick={() => { setNoteMsg(""); setAddNoteModal(true); }}>
                  + Add Note
                </BtnPrimary>
              )}
            </>}
          />

          {selectedCustId ? (
            <div style={{ padding:"0 16px 16px 16px" }}>
              {customerNotes.length === 0 ? (
                <div style={{ padding:30, textAlign:"center", color:t.textMuted, fontSize:13 }}>
                  No notes recorded for this customer yet. Click "+ Add Note" to create one.
                </div>
              ) : (
                <div style={{ display:"grid", gap:10 }}>
                  {customerNotes.map(n => (
                    <div key={n.id} style={{
                      background: n.is_pinned ? `${BRAND.purple}08` : (t.card2 || t.card),
                      border: `1px solid ${n.is_pinned ? `${BRAND.purple}44` : t.borderDash}`,
                      borderRadius:10, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"flex-start"
                    }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{
                            padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                            background: n.category === "VIP" ? `${BRAND.purple}22` : (n.category === "Complaint" ? "#e74c3c22" : (n.category === "Preference" ? "#3498db22" : "#2ecc7122")),
                            color: n.category === "VIP" ? BRAND.purple : (n.category === "Complaint" ? BRAND.pink : (n.category === "Preference" ? "#2980b9" : "#27ae60"))
                          }}>
                            {n.category}
                          </span>
                          {n.is_pinned && <span style={{ fontSize:11, color:BRAND.purple, fontWeight:700 }}>Pinned Note</span>}
                          <span style={{ fontSize:11, color:t.textMuted }}>by {n.created_by || 'Staff'} · {new Date(n.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div style={{ fontSize:14, color:t.text, whiteSpace:"pre-wrap", marginTop:4 }}>
                          {n.note_text}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, marginLeft:12 }}>
                        <BtnSm t={t} onClick={() => handleTogglePinNote(n)}>
                          {n.is_pinned ? "Unpin" : "Pin"}
                        </BtnSm>
                        <BtnSm t={t} style={{ color:BRAND.pink }} onClick={() => handleDeleteNote(n)}>
                          Delete
                        </BtnSm>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding:40, textAlign:"center", color:t.textMuted, fontSize:13 }}>
              Please select a customer above to view and manage their CRM notes & preferences.
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 5: PURCHASES & RETURNS JOIN ── */}
      {tab === "history" && (
        <div>
          <Card t={t}>
            <CardHeader
              title="Customer Purchase Orders & Returns Join"
              t={t}
              actions={<>
                <Select
                  t={t}
                  style={{ width:300 }}
                  value={selectedCustId}
                  onChange={(e) => {
                    setSelectedCustId(e.target.value);
                    handleLoadPurchasesAndReturns(e.target.value);
                  }}
                >
                  <option value="">-- Select Customer for Order History --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone}) - Spend: {formatCurrency(c.total_purchase || 0)}
                    </option>
                  ))}
                </Select>
              </>}
            />

            {selectedCustId && purchasesAndReturns.summary && (
              <div style={{
                display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",
                gap:12, padding:"14px 16px", background:t.card2||t.card,
                borderBottom:`1px solid ${t.borderDash}`, marginBottom:12
              }}>
                <div>
                  <div style={{ fontSize:11, color:t.textMuted }}>Gross Invoiced Spend</div>
                  <div style={{ fontSize:17, fontWeight:800, color:t.text }}>
                    {formatCurrency(purchasesAndReturns.summary.totalGrossPurchases || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:t.textMuted }}>Total Returns & Refunds</div>
                  <div style={{ fontSize:17, fontWeight:800, color:BRAND.pink }}>
                    {formatCurrency(purchasesAndReturns.summary.totalRefundedReturns || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:t.textMuted }}>Net Retained Lifetime Spend</div>
                  <div style={{ fontSize:18, fontWeight:800, color:"#27ae60" }}>
                    {formatCurrency(purchasesAndReturns.summary.netRetainedSpend || 0)}
                  </div>
                </div>
              </div>
            )}

            <DataTable
              columns={["Invoice No", "Date", "Items Purchased", "Gross Total (₹)", "Returned (₹)", "Net Retained (₹)", "Status"]}
              rows={(purchasesAndReturns.invoices || []).map(h => ({
                "Invoice No": <strong>{h.invoice_no}</strong>,
                "Date": h.invoice_date ? new Date(h.invoice_date).toLocaleDateString("en-IN") : "-",
                "Items Purchased": h.items_summary || "Jewellery Items",
                "Gross Total (₹)": <strong>{formatCurrency(h.grand_total)}</strong>,
                "Returned (₹)": Number(h.total_returned_on_invoice) > 0 ? (
                  <span style={{ color:BRAND.pink, fontWeight:700 }}>
                    -{formatCurrency(h.total_returned_on_invoice)} ({h.returns_count} ret)
                  </span>
                ) : "-",
                "Net Retained (₹)": (
                  <strong style={{ color:"#27ae60" }}>
                    {formatCurrency(h.net_retained_value)}
                  </strong>
                ),
                "Status": (
                  <span style={{
                    padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700,
                    background: h.status === "Paid" ? "#2ecc7122" : (h.status === "Partial" ? "#f39c1222" : "#e74c3c22"),
                    color: h.status === "Paid" ? "#27ae60" : (h.status === "Partial" ? "#d35400" : BRAND.pink)
                  }}>
                    {h.status}
                  </span>
                )
              }))}
              t={t}
              emptyMsg={selectedCustId ? "No purchase invoices found for this customer" : "Please select a customer above to view purchase & return history"}
            />
          </Card>

          {selectedCustId && (purchasesAndReturns.returns || []).length > 0 && (
            <Card t={t} style={{ marginTop:16 }}>
              <CardHeader title="Sales Returns History" t={t} />
              <DataTable
                columns={["Return No", "Invoice Ref", "Item Returned", "Reason", "Refund Amount (₹)", "Refund Mode", "Condition", "Date"]}
                rows={(purchasesAndReturns.returns || []).map(r => ({
                  "Return No": <strong>{r.return_no}</strong>,
                  "Invoice Ref": <code>{r.invoice_ref || "-"}</code>,
                  "Item Returned": r.item_description,
                  "Reason": r.reason || "-",
                  "Refund Amount (₹)": <strong style={{ color:BRAND.pink }}>{formatCurrency(r.refund_amount)}</strong>,
                  "Refund Mode": r.refund_mode || "Store Credit",
                  "Condition": r.item_condition || "Good",
                  "Date": r.return_date ? new Date(r.return_date).toLocaleDateString("en-IN") : "-",
                }))}
                t={t}
              />
            </Card>
          )}
        </div>
      )}

      {/* ── TAB 6: FINANCIAL LEDGER ── */}
      {tab === "ledger" && (
        <Card t={t}>
          <CardHeader
            title="Customer Financial Ledger & Audit Trail"
            t={t}
            actions={<>
              <Select
                t={t}
                style={{ width:280 }}
                value={selectedCustId}
                onChange={(e) => {
                  setSelectedCustId(e.target.value);
                  handleLoadLedger(e.target.value);
                }}
              >
                <option value="">-- Select Customer to View Ledger --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone}) - Due: {formatCurrency(c.balance_due)}
                  </option>
                ))}
              </Select>
              {selectedCustId && (
                <BtnPrimary onClick={() => {
                  const cust = customers.find(c => String(c.id) === String(selectedCustId));
                  if (cust) openPaymentModal(cust);
                }}>
                  + Record Payment
                </BtnPrimary>
              )}
            </>}
          />

          {selectedCustId && (
            <div style={{
              display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",
              gap:12, padding:"14px 16px", background:t.card2||t.card,
              borderBottom:`1px solid ${t.borderDash}`, marginBottom:12
            }}>
              <div>
                <div style={{ fontSize:11, color:t.textMuted }}>Total Invoiced (Debits)</div>
                <div style={{ fontSize:16, fontWeight:700, color:BRAND.pink }}>
                  {formatCurrency(ledgerData.totalDebit || 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, color:t.textMuted }}>Total Received (Credits)</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#27ae60" }}>
                  {formatCurrency(ledgerData.totalCredit || 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, color:t.textMuted }}>Current Outstanding Due</div>
                <div style={{ fontSize:18, fontWeight:800, color: ledgerData.balanceDue > 0 ? BRAND.pink : "#27ae60" }}>
                  {formatCurrency(ledgerData.balanceDue || 0)}
                </div>
              </div>
            </div>
          )}

          <DataTable
            columns={["Date", "Particulars", "Reference", "Debit (₹)", "Credit (₹)", "Running Balance (₹)"]}
            rows={(ledgerData.entries || []).map(r => ({
              Date: r.date ? new Date(r.date).toLocaleDateString("en-IN") : "-",
              Particulars: <strong>{r.particulars || "-"}</strong>,
              Reference: <code>{r.reference || "-"}</code>,
              "Debit (₹)": Number(r.debit) > 0 ? <span style={{ color:BRAND.pink, fontWeight:700 }}>{formatCurrency(r.debit)}</span> : "-",
              "Credit (₹)": Number(r.credit) > 0 ? <span style={{ color:"#27ae60", fontWeight:700 }}>{formatCurrency(r.credit)}</span> : "-",
              "Running Balance (₹)": (
                <strong style={{ color: Number(r.balance) > 0 ? BRAND.pink : t.text }}>
                  {formatCurrency(r.balance)}
                </strong>
              ),
            }))}
            t={t}
            emptyMsg={selectedCustId ? "No financial ledger entries recorded for this customer" : "Please select a customer above to view their financial ledger"}
          />
        </Card>
      )}

      {/* ── TAB 7: WALLET & LOYALTY ── */}
      {tab === "wallet" && (
        <div>
          <Card t={t}>
            <CardHeader
              title="Store Wallet & Loyalty Points Register"
              t={t}
              actions={<>
                <Select
                  t={t}
                  style={{ width:300 }}
                  value={selectedCustId}
                  onChange={(e) => {
                    setSelectedCustId(e.target.value);
                    handleLoadWalletLoyalty(e.target.value);
                  }}
                >
                  <option value="">-- Select Customer for Wallet & Points --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone}) - Wallet: {formatCurrency(c.wallet_balance || 0)} | {c.loyalty_points || 0} pts
                    </option>
                  ))}
                </Select>
                {selectedCustId && (
                  <>
                    <BtnPrimary onClick={() => { setWalletMsg(""); setAddWalletModal(true); }}>+ Add Money</BtnPrimary>
                    <BtnOutline t={t} onClick={() => { setWalletMsg(""); setAdjustWalletModal(true); }}>Adjust Wallet</BtnOutline>
                    <BtnOutline t={t} onClick={() => { setLoyaltyMsg(""); setAdjustLoyaltyModal(true); }}>Adjust Points</BtnOutline>
                  </>
                )}
              </>}
            />

            {selectedCustId && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, padding:"0 16px 16px 16px" }}>
                <div style={{ background:t.card2||t.card, padding:16, borderRadius:10, border:`1px solid ${t.borderDash}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:12, color:t.textMuted }}>Store Wallet Balance</div>
                      <div style={{ fontSize:24, fontWeight:800, color:"#27ae60", marginTop:4 }}>
                        {formatCurrency(walletDetails.balance || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background:t.card2||t.card, padding:16, borderRadius:10, border:`1px solid ${t.borderDash}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:12, color:t.textMuted }}>Loyalty Points ({loyaltyDetails.tier || 'Regular'} Tier)</div>
                      <div style={{ fontSize:24, fontWeight:800, color:BRAND.purple, marginTop:4 }}>
                        {loyaltyDetails.points || 0} <span style={{ fontSize:15 }}>pts</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:t.textMuted, marginTop:8 }}>
                    Redeemable Value: <strong>{formatCurrency(loyaltyDetails.redeemable_value || 0)}</strong>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 8: DUE TRACKING ── */}
      {tab === "due" && (
        <Card t={t}>
          <CardHeader title="Outstanding Customer Dues" t={t} />
          <DataTable
            columns={["Customer ID", "Customer Name", "Phone", "Tier", "Total Purchases (₹)", "Total Paid (₹)", "Outstanding Due (₹)", "Action"]}
            rows={dues.map(d => ({
              "Customer ID": <code>{d.customer_id || `CUST-${d.id}`}</code>,
              "Customer Name": <strong>{d.full_name}</strong>,
              "Phone": d.phone,
              "Tier": d.tier,
              "Total Purchases (₹)": formatCurrency(d.total_purchase),
              "Total Paid (₹)": <span style={{ color:"#27ae60" }}>{formatCurrency(d.total_paid)}</span>,
              "Outstanding Due (₹)": <strong style={{ color:BRAND.pink, fontSize:15 }}>{formatCurrency(d.balance_due)}</strong>,
              "Action": <BtnSm t={t} primary onClick={() => openPaymentModal(d)}>Collect Payment</BtnSm>
            }))}
            t={t}
            emptyMsg="✓ No outstanding balance dues pending from any customers!"
          />
        </Card>
      )}

      {/* ── TAB 9: CREDIT REGISTER ── */}
      {tab === "credit" && (
        <Card t={t}>
          <CardHeader title="Credit Limit & Outstanding Register" t={t} />
          <DataTable
            columns={["Customer ID", "Customer Name", "Phone", "Credit Limit", "Used Credit", "Available Credit", "Balance Due"]}
            rows={creditList.map(cr => ({
              "Customer ID": <code>{cr.customer_id || `CUST-${cr.id}`}</code>,
              "Customer Name": <strong>{cr.full_name}</strong>,
              "Phone": cr.phone,
              "Credit Limit": formatCurrency(cr.credit_limit),
              "Used Credit": <span style={{ color: cr.used_credit > 0 ? BRAND.pink : t.textMuted }}>{formatCurrency(cr.used_credit)}</span>,
              "Available Credit": <span style={{ color:"#27ae60", fontWeight:600 }}>{formatCurrency(cr.available_credit)}</span>,
              "Balance Due": <strong>{formatCurrency(cr.balance_due)}</strong>,
            }))}
            t={t}
          />
        </Card>
      )}

      {/* ── TAB 10: KYC REGISTER ── */}
      {tab === "kyc" && (
        <Card t={t}>
          <CardHeader title="Government Compliance & KYC Register (Masked)" t={t} />
          <DataTable
            columns={["Customer ID", "Customer Name", "Phone", "PAN Card", "Aadhaar", "GSTIN", "KYC Status"]}
            rows={kycList.map(k => ({
              "Customer ID": <code>{k.customer_id || `CUST-${k.id}`}</code>,
              "Customer Name": <strong>{k.full_name}</strong>,
              "Phone": k.phone,
              "PAN Card": k.pan ? <code>{k.pan}</code> : "-",
              "Aadhaar": k.aadhaar ? <code>{k.aadhaar}</code> : "-",
              "GSTIN": k.gst_number || "-",
              "KYC Status": (
                <span style={{
                  padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700,
                  background: k.kyc_status === "Complete" ? "#2ecc7122" : "#e67e2222",
                  color: k.kyc_status === "Complete" ? "#27ae60" : "#e67e22"
                }}>
                  {k.kyc_status || "Pending"}
                </span>
              )
            }))}
            t={t}
          />
        </Card>
      )}

      {/* ── CUSTOMER 360° PROFILE MODAL ── */}
      <Modal
        open={c360Modal}
        onClose={() => setC360Modal(false)}
        title={`Customer 360° Profile: ${c360Data?.customer?.full_name || ''}`}
        t={t}
        wide
        footer={<BtnOutline t={t} onClick={() => setC360Modal(false)}>Close 360° View</BtnOutline>}
      >
        {c360Data && (
          <div>
            {/* Header info badge */}
            <div style={{
              background:t.card2||t.card, padding:"12px 16px", borderRadius:10,
              border:`1px solid ${t.borderDash}`, marginBottom:16,
              display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10
            }}>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:t.text }}>
                  {c360Data.customer.full_name} <span style={{ fontSize:12, fontWeight:600, color:t.textMuted }}>({c360Data.customer.customer_id})</span>
                </div>
                <div style={{ fontSize:12, color:t.textMuted, marginTop:2 }}>
                  {c360Data.customer.phone} · {c360Data.customer.city || 'Mumbai'}, {c360Data.customer.state || 'Maharashtra'} · PAN: {c360Data.customer.pan_masked || '-'}
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:700, background:`${c360Data.membership?.badge_color || BRAND.purple}22`, color: c360Data.membership?.badge_color || BRAND.purple }}>
                  {c360Data.membership?.plan_name || c360Data.customer.tier} Tier ({c360Data.membership?.loyalty_multiplier || 1.0}X Pts)
                </span>
                <span style={{ padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:700, background:"#2ecc7122", color:"#27ae60" }}>
                  KYC {c360Data.customer.kyc_status}
                </span>
              </div>
            </div>

            {/* Top Financial Stat KPI Cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10, marginBottom:16 }}>
              <div style={{ background:t.card2||t.card, padding:10, borderRadius:8, border:`1px solid ${t.borderDash}` }}>
                <div style={{ fontSize:10, color:t.textMuted }}>Outstanding Due</div>
                <div style={{ fontSize:15, fontWeight:800, color: c360Data.financials.balance_due > 0 ? BRAND.pink : "#27ae60" }}>
                  {formatCurrency(c360Data.financials.balance_due)}
                </div>
              </div>
              <div style={{ background:t.card2||t.card, padding:10, borderRadius:8, border:`1px solid ${t.borderDash}` }}>
                <div style={{ fontSize:10, color:t.textMuted }}>Wallet Balance</div>
                <div style={{ fontSize:15, fontWeight:800, color:"#27ae60" }}>
                  {formatCurrency(c360Data.wallet.balance)}
                </div>
              </div>
              <div style={{ background:t.card2||t.card, padding:10, borderRadius:8, border:`1px solid ${t.borderDash}` }}>
                <div style={{ fontSize:10, color:t.textMuted }}>Loyalty Points</div>
                <div style={{ fontSize:15, fontWeight:800, color:BRAND.purple }}>
                  {c360Data.loyalty.points} pts
                </div>
              </div>
              <div style={{ background:t.card2||t.card, padding:10, borderRadius:8, border:`1px solid ${t.borderDash}` }}>
                <div style={{ fontSize:10, color:t.textMuted }}>Available Credit</div>
                <div style={{ fontSize:15, fontWeight:800, color:"#2980b9" }}>
                  {formatCurrency(c360Data.financials.available_credit)}
                </div>
              </div>
              <div style={{ background:t.card2||t.card, padding:10, borderRadius:8, border:`1px solid ${t.borderDash}` }}>
                <div style={{ fontSize:10, color:t.textMuted }}>Net Lifetime Spend</div>
                <div style={{ fontSize:15, fontWeight:800, color:"#27ae60" }}>
                  {formatCurrency(c360Data.purchases.net_retained_spend)}
                </div>
              </div>
            </div>

            {/* Internal 360 Tabs */}
            <div style={{ display:"flex", gap:8, borderBottom:`1px solid ${t.borderDash}`, paddingBottom:8, marginBottom:14, overflowX:"auto" }}>
              {["overview", "purchases", "notes", "comms", "activity"].map(sub => (
                <button
                  key={sub}
                  onClick={() => setC360Tab(sub)}
                  style={{
                    background: c360Tab === sub ? BRAND.purple : "transparent",
                    color: c360Tab === sub ? "#fff" : t.text,
                    border: "none", borderRadius:6, padding:"6px 14px", fontSize:12,
                    fontWeight:700, cursor:"pointer", textTransform:"capitalize"
                  }}
                >
                  {sub === "purchases" ? "Purchases & Returns" : (sub === "notes" ? "CRM Notes" : (sub === "comms" ? "Message History" : (sub === "activity" ? "Activity Timeline" : "Overview")))}
                </button>
              ))}
            </div>

            {/* 360 SUB-TAB 1: OVERVIEW */}
            {c360Tab === "overview" && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ background:t.card2||t.card, padding:14, borderRadius:8, border:`1px solid ${t.borderDash}` }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Membership & Tier Details</div>
                  <div style={{ fontSize:12, display:"grid", gap:6 }}>
                    <div><strong>Active Plan:</strong> {c360Data.membership?.plan_name || 'Regular'} Tier</div>
                    <div><strong>Loyalty Points Multiplier:</strong> {c360Data.membership?.loyalty_multiplier || 1.0}X</div>
                    <div><strong>Making Charge Discount:</strong> {c360Data.membership?.making_discount_pct || 0}% OFF</div>
                    <div><strong>VIP Perks:</strong> {c360Data.membership?.perks_description || 'Standard benefits'}</div>
                    <div><strong>Expiry Date:</strong> {c360Data.membership?.expiry_date ? new Date(c360Data.membership.expiry_date).toLocaleDateString('en-IN') : 'No Expiry'}</div>
                  </div>

                  <div style={{ fontWeight:700, fontSize:13, marginTop:14, marginBottom:8 }}>Upcoming Occasions</div>
                  {(!c360Data.occasions || c360Data.occasions.length === 0) ? (
                    <div style={{ fontSize:12, color:t.textMuted }}>No dates recorded</div>
                  ) : (
                    <div style={{ display:"grid", gap:6 }}>
                      {c360Data.occasions.map((occ, idx) => (
                        <div key={idx} style={{ fontSize:12, padding:"6px 8px", background:t.card, borderRadius:6, border:`1px solid ${t.borderDash}` }}>
                          <strong>{occ.type === 'BIRTHDAY' ? 'Birthday' : 'Anniversary'}:</strong> {new Date(occ.date).toLocaleDateString('en-IN', { day:"numeric", month:"long" })} ({occ.daysUntil === 0 ? 'TODAY' : `In ${occ.daysUntil} days`})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background:t.card2||t.card, padding:14, borderRadius:8, border:`1px solid ${t.borderDash}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>Recent Notes</div>
                    <BtnSm t={t} primary onClick={() => { setNoteMsg(""); setAddNoteModal(true); }}>+ Note</BtnSm>
                  </div>
                  {c360Data.recent_notes.length === 0 ? (
                    <div style={{ fontSize:12, color:t.textMuted }}>No notes recorded</div>
                  ) : (
                    <div style={{ display:"grid", gap:6 }}>
                      {c360Data.recent_notes.map(n => (
                        <div key={n.id} style={{ fontSize:12, padding:"6px 8px", background:t.card, borderRadius:6, border:`1px solid ${t.borderDash}` }}>
                          <span style={{ fontWeight:700, color:BRAND.purple }}>[{n.category}]</span> {n.note_text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 360 SUB-TAB 2: PURCHASES & RETURNS */}
            {c360Tab === "purchases" && (
              <div>
                <DataTable
                  columns={["Invoice No", "Date", "Items", "Gross (₹)", "Returned (₹)", "Net Retained (₹)", "Status"]}
                  rows={(purchasesAndReturns.invoices || []).map(i => ({
                    "Invoice No": <strong>{i.invoice_no}</strong>,
                    "Date": i.invoice_date ? new Date(i.invoice_date).toLocaleDateString("en-IN") : "-",
                    "Items": i.items_summary || "Jewellery Items",
                    "Gross (₹)": formatCurrency(i.grand_total),
                    "Returned (₹)": Number(i.total_returned_on_invoice) > 0 ? <span style={{ color:BRAND.pink }}>-{formatCurrency(i.total_returned_on_invoice)}</span> : "-",
                    "Net Retained (₹)": <strong style={{ color:"#27ae60" }}>{formatCurrency(i.net_retained_value)}</strong>,
                    "Status": i.status
                  }))}
                  t={t}
                  emptyMsg="No purchases recorded for this customer"
                />
              </div>
            )}

            {/* 360 SUB-TAB 3: NOTES */}
            {c360Tab === "notes" && (
              <div>
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
                  <BtnPrimary onClick={() => { setNoteMsg(""); setAddNoteModal(true); }}>+ Add Note</BtnPrimary>
                </div>
                <div style={{ display:"grid", gap:8 }}>
                  {customerNotes.map(n => (
                    <div key={n.id} style={{
                      background: n.is_pinned ? `${BRAND.purple}08` : (t.card2||t.card),
                      border:`1px solid ${n.is_pinned ? `${BRAND.purple}44` : t.borderDash}`,
                      borderRadius:8, padding:10, display:"flex", justifyContent:"space-between"
                    }}>
                      <div>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:`${BRAND.purple}22`, color:BRAND.purple }}>
                          {n.category}
                        </span>
                        {n.is_pinned && <span style={{ fontSize:11, marginLeft:6 }}>Pinned</span>}
                        <div style={{ fontSize:13, marginTop:4 }}>{n.note_text}</div>
                        <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>by {n.created_by} · {new Date(n.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                      <div style={{ display:"flex", gap:4 }}>
                        <BtnSm t={t} onClick={() => handleTogglePinNote(n)}>{n.is_pinned ? "Unpin" : "Pin"}</BtnSm>
                        <BtnSm t={t} style={{ color:BRAND.pink }} onClick={() => handleDeleteNote(n)}>Delete</BtnSm>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 360 SUB-TAB 4: COMMUNICATIONS */}
            {c360Tab === "comms" && (
              <div>
                <DataTable
                  columns={["Date", "Channel", "Template", "Message Content", "Status"]}
                  rows={(c360Data.communication_history || []).map(ch => ({
                    "Date": ch.created_at ? new Date(ch.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "-",
                    "Channel": (
                      <span style={{
                        padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                        background: ch.channel === "WHATSAPP" ? "#27ae6022" : "#3498db22",
                        color: ch.channel === "WHATSAPP" ? "#27ae60" : "#2980b9"
                      }}>
                        {ch.channel === "WHATSAPP" ? "WhatsApp" : "SMS"}
                      </span>
                    ),
                    "Template": <code>{ch.template_code}</code>,
                    "Message Content": <div style={{ fontSize:12, maxWidth:320 }}>{ch.message_preview}</div>,
                    "Status": (
                      <span style={{
                        padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                        background: ch.status === "SENT" || ch.status === "DELIVERED" ? "#2ecc7122" : (ch.status === "SKIPPED" ? "#f39c1222" : "#e74c3c22"),
                        color: ch.status === "SENT" || ch.status === "DELIVERED" ? "#27ae60" : (ch.status === "SKIPPED" ? "#d35400" : BRAND.pink)
                      }}>
                        {ch.status}{ch.is_test ? " (Test)" : ""}
                      </span>
                    )
                  }))}
                  t={t}
                  emptyMsg="No SMS or WhatsApp communications logged for this customer yet."
                />
              </div>
            )}

            {/* 360 SUB-TAB 5: ACTIVITY TIMELINE */}
            {c360Tab === "activity" && (
              <div style={{ display:"grid", gap:10, maxHeight:400, overflowY:"auto", paddingRight:4 }}>
                {activityEvents.length === 0 ? (
                  <div style={{ textAlign:"center", padding:20, color:t.textMuted }}>No activity recorded yet</div>
                ) : (
                  activityEvents.map((ev, idx) => (
                    <div key={idx} style={{
                      display:"flex", gap:12, padding:"10px 12px", background:t.card2||t.card,
                      borderRadius:8, border:`1px solid ${t.borderDash}`, alignItems: "center"
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: ev.type.includes("PAYMENT") ? "#2ecc71" : ev.type.includes("INVOICE") ? BRAND.blue : BRAND.purple
                      }} />
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <strong style={{ fontSize:13 }}>{ev.title}</strong>
                          <span style={{ fontSize:11, color:t.textMuted }}>{new Date(ev.date).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div style={{ fontSize:12, color:t.text, marginTop:2 }}>{ev.description}</div>
                        {ev.amount > 0 && (
                          <div style={{ fontSize:12, fontWeight:700, color:"#27ae60", marginTop:2 }}>
                            {formatCurrency(ev.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── GENERATE GREETING MODAL ── */}
      <Modal
        open={greetingModal}
        onClose={() => setGreetingModal(false)}
        title={`Generate ${greetingCustomer?.occasionType === 'BIRTHDAY' ? 'Birthday' : 'Anniversary'} Greeting`}
        t={t}
        wide
        footer={<>
          <BtnOutline t={t} onClick={() => setGreetingModal(false)}>Close</BtnOutline>
          {greetingResult && (
            <BtnPrimary onClick={handleCopyGreeting}>
              {copied ? "Copied to Clipboard!" : "Copy Greeting Text"}
            </BtnPrimary>
          )}
        </>}
      >
        <div>
          {greetingCustomer && (
            <div style={{ background:t.card2||t.card, padding:"10px 14px", borderRadius:8, border:`1px solid ${t.borderDash}`, marginBottom:14 }}>
              <strong>{greetingCustomer.customerName}</strong> ({greetingCustomer.tier} Tier) · {greetingCustomer.phone}
              <div style={{ fontSize:12, color:t.textMuted, marginTop:2 }}>
                Event Date: {new Date(greetingCustomer.occasionDate).toLocaleDateString('en-IN', { day:"numeric", month:"long" })} ({greetingCustomer.daysUntil === 0 ? "TODAY" : `In ${greetingCustomer.daysUntil} days`})
              </div>
            </div>
          )}

          <FormGrid>
            <FormGroup label="Include Special Gift Coupon?" t={t} half>
              <Select
                t={t}
                value={includeCoupon ? "true" : "false"}
                onChange={(e) => setIncludeCoupon(e.target.value === "true")}
              >
                <option value="true">Yes (5% Off Coupon Code)</option>
                <option value="false">No Coupon</option>
              </Select>
            </FormGroup>

            <FormGroup label="Award Bonus Loyalty Points?" t={t} half>
              <Select
                t={t}
                value={includeBonusPts ? "true" : "false"}
                onChange={(e) => setIncludeBonusPts(e.target.value === "true")}
              >
                <option value="false">No Points</option>
                <option value="true">Yes (Credit to Ledger)</option>
              </Select>
            </FormGroup>

            {includeBonusPts && (
              <FormGroup label="Bonus Points Amount" t={t} half>
                <Input
                  t={t}
                  type="number"
                  value={bonusPointsVal}
                  onChange={(e) => setBonusPointsVal(e.target.value)}
                />
              </FormGroup>
            )}
          </FormGrid>

          <div style={{ marginTop:14, marginBottom:14 }}>
            <BtnPrimary onClick={handleGenerateGreetingAction} disabled={generatingGreeting}>
              {generatingGreeting ? "Generating..." : "✨ Generate Personalized Greeting"}
            </BtnPrimary>
          </div>

          {greetingResult && (
            <div style={{ background:t.card2||t.card, border:`1px solid ${t.borderDash}`, borderRadius:8, padding:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:BRAND.purple }}>Personalized Greeting Card:</span>
                {greetingResult.couponCode && (
                  <span style={{ fontSize:11, padding:"2px 8px", background:`${BRAND.purple}22`, color:BRAND.purple, borderRadius:6, fontWeight:700 }}>
                    Coupon: {greetingResult.couponCode}
                  </span>
                )}
              </div>
              <textarea
                rows={7}
                readOnly
                value={greetingResult.greeting}
                style={{
                  width:"100%", background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                  borderRadius:8, padding:"10px 12px", fontSize:13, color:t.inputColor,
                  outline:"none", boxSizing:"border-box", fontFamily:"inherit", lineHeight:1.5
                }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* ── ENROLL MEMBER MODAL ── */}
      <Modal
        open={enrollModal}
        onClose={() => setEnrollModal(false)}
        title="Enroll / Upgrade Customer Membership"
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setEnrollModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSaveEnrollment}>Enroll Member</BtnPrimary>
        </>}
      >
        <form onSubmit={handleSaveEnrollment}>
          <FormGrid>
            <FormGroup label="Select Customer *" t={t}>
              <Select
                t={t}
                value={enrollForm.customer_id}
                onChange={(e) => setEnrollForm(f => ({ ...f, customer_id: e.target.value }))}
                required
              >
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone}) - Current: {c.tier}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Select Membership Plan *" t={t} half>
              <Select
                t={t}
                value={enrollForm.plan_id}
                onChange={(e) => {
                  const pid = e.target.value;
                  const pl = membershipPlans.find(p => String(p.id) === String(pid));
                  setEnrollForm(f => ({
                    ...f,
                    plan_id: pid,
                    fee_paid: pl?.annual_fee || 0,
                  }));
                }}
                required
              >
                <option value="">-- Select Plan --</option>
                {membershipPlans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.loyalty_multiplier}X Pts, {p.making_discount_pct}% Making Off)
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Start Date *" t={t} half>
              <Input
                t={t}
                type="date"
                value={enrollForm.start_date}
                onChange={(e) => setEnrollForm(f => ({ ...f, start_date: e.target.value }))}
                required
              />
            </FormGroup>

            <FormGroup label="Membership Fee (₹)" t={t} half>
              <Input
                t={t}
                type="number"
                value={enrollForm.fee_paid}
                onChange={(e) => setEnrollForm(f => ({ ...f, fee_paid: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Payment Mode" t={t} half>
              <Select
                t={t}
                value={enrollForm.payment_mode}
                onChange={(e) => setEnrollForm(f => ({ ...f, payment_mode: e.target.value }))}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </Select>
            </FormGroup>

            <FormGroup label="Remarks / Notes" t={t}>
              <Input
                t={t}
                placeholder="Reason for enrollment / Promotion source"
                value={enrollForm.notes}
                onChange={(e) => setEnrollForm(f => ({ ...f, notes: e.target.value }))}
              />
            </FormGroup>
          </FormGrid>
          {memMsg && (
            <div style={{ color: BRAND.pink, fontSize:13, marginTop:10 }}>{memMsg}</div>
          )}
        </form>
      </Modal>

      {/* ── RENEW MEMBERSHIP MODAL ── */}
      <Modal
        open={renewModal}
        onClose={() => setRenewModal(false)}
        title={`Renew Membership: ${renewForm.customer_name || ''}`}
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setRenewModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSaveRenewal}>Confirm Renewal</BtnPrimary>
        </>}
      >
        <form onSubmit={handleSaveRenewal}>
          <div style={{ background:t.card2||t.card, padding:12, borderRadius:8, marginBottom:14 }}>
            <div>Plan: <strong>{renewForm.plan_name}</strong></div>
            <div style={{ fontSize:12, color:t.textMuted, marginTop:2 }}>
              Renewal extends subscription by 365 days without losing any remaining days.
            </div>
          </div>
          <FormGrid>
            <FormGroup label="Renewal Fee (₹)" t={t} half>
              <Input
                t={t}
                type="number"
                value={renewForm.fee_paid}
                onChange={(e) => setRenewForm(f => ({ ...f, fee_paid: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Payment Mode" t={t} half>
              <Select
                t={t}
                value={renewForm.payment_mode}
                onChange={(e) => setRenewForm(f => ({ ...f, payment_mode: e.target.value }))}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </Select>
            </FormGroup>
            <FormGroup label="Remarks" t={t}>
              <Input
                t={t}
                placeholder="Annual loyalty renewal"
                value={renewForm.notes}
                onChange={(e) => setRenewForm(f => ({ ...f, notes: e.target.value }))}
              />
            </FormGroup>
          </FormGrid>
          {memMsg && (
            <div style={{ color: BRAND.pink, fontSize:13, marginTop:10 }}>{memMsg}</div>
          )}
        </form>
      </Modal>

      <Modal
        open={upgradeResultModal}
        onClose={() => setUpgradeResultModal(false)}
        title="Auto-Tier Spend Evaluation Results"
        t={t}
        footer={<BtnPrimary onClick={() => setUpgradeResultModal(false)}>Close Summary</BtnPrimary>}
      >
        <div>
          <div style={{ background:t.card2||t.card, padding:12, borderRadius:8, marginBottom:14, fontSize:13 }}>
            <div>Customers Evaluated: <strong>{upgradeResults?.customers_evaluated || 0}</strong></div>
            <div>Eligible Customers Promoted: <strong style={{ color:"#27ae60" }}>{upgradeResults?.customers_upgraded || 0}</strong></div>
          </div>
          {upgradeResults?.upgrades?.length > 0 ? (
            <DataTable
              columns={["Customer Name", "Phone", "Old Tier", "New Promoted Tier", "Spend Threshold Met"]}
              rows={upgradeResults.upgrades.map(u => ({
                "Customer Name": <strong>{u.customer_name}</strong>,
                "Phone": <span>{u.phone}</span>,
                "Old Tier": <span>{u.old_tier}</span>,
                "New Promoted Tier": <strong style={{ color:"#27ae60" }}>{u.new_tier}</strong>,
                "Spend Threshold Met": <span>{formatCurrency(u.total_spend)}</span>,
              }))}
              t={t}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0", color: t.textMuted }}>
              No customer tier promotions were required based on spend thresholds.
            </div>
          )}
        </div>
      </Modal>

      {/* ── ADD NOTE MODAL ── */}
      <Modal
        open={addNoteModal}
        onClose={() => setAddNoteModal(false)}
        title="Add Customer Note"
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setAddNoteModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSaveNote}>Save Note</BtnPrimary>
        </>}
      >
        <form onSubmit={handleSaveNote}>
          <FormGrid>
            <FormGroup label="Category *" t={t} half>
              <Select
                t={t}
                value={noteForm.category}
                onChange={(e) => setNoteForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="General">General Note</option>
                <option value="Preference">Customer Preference</option>
                <option value="Follow-up">Staff Follow-up</option>
                <option value="Special Request">Special Request</option>
                <option value="VIP">VIP Note</option>
                <option value="Complaint">Complaint / Issue</option>
              </Select>
            </FormGroup>
            <FormGroup label="Pin Note to Top" t={t} half>
              <Select
                t={t}
                value={noteForm.is_pinned ? "true" : "false"}
                onChange={(e) => setNoteForm(f => ({ ...f, is_pinned: e.target.value === "true" }))}
              >
                <option value="false">No (Normal)</option>
                <option value="true">Yes (Pin to Top)</option>
              </Select>
            </FormGroup>
            <FormGroup label="Note Content *" t={t}>
              <textarea
                rows={4}
                placeholder="e.g. Customer prefers 18K rose gold diamond bangles, ring size 14, wedding anniversary in November..."
                value={noteForm.note_text}
                onChange={(e) => setNoteForm(f => ({ ...f, note_text: e.target.value }))}
                style={{
                  width:"100%", background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                  borderRadius:9, padding:"10px 13px", fontSize:13, color:t.inputColor,
                  outline:"none", boxSizing:"border-box", fontFamily:"inherit"
                }}
                required
              />
            </FormGroup>
          </FormGrid>
          {noteMsg && (
            <div style={{ color: BRAND.pink, fontSize:13, marginTop:10 }}>
              {noteMsg}
            </div>
          )}
        </form>
      </Modal>

      {/* ── ADD WALLET MONEY MODAL ── */}
      <Modal
        open={addWalletModal}
        onClose={() => setAddWalletModal(false)}
        title="Add Money to Store Wallet"
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setAddWalletModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleTopupWallet}>+ Add Wallet Balance</BtnPrimary>
        </>}
      >
        <form onSubmit={handleTopupWallet}>
          <FormGrid>
            <FormGroup label="Top-up Amount (₹) *" t={t} half>
              <Input
                t={t}
                type="number"
                placeholder="e.g. 5000"
                value={walletTopupForm.amount}
                onChange={(e) => setWalletTopupForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="Payment Mode Received *" t={t} half>
              <Select
                t={t}
                value={walletTopupForm.payment_mode}
                onChange={(e) => setWalletTopupForm(f => ({ ...f, payment_mode: e.target.value }))}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </Select>
            </FormGroup>
            <FormGroup label="Remarks / Notes" t={t}>
              <Input
                t={t}
                placeholder="Customer advance / Festive top-up"
                value={walletTopupForm.notes}
                onChange={(e) => setWalletTopupForm(f => ({ ...f, notes: e.target.value }))}
              />
            </FormGroup>
          </FormGrid>
          {walletMsg && (
            <div style={{ color: BRAND.pink, fontSize:13, marginTop:10 }}>{walletMsg}</div>
          )}
        </form>
      </Modal>

      {/* ── ADJUST WALLET MODAL ── */}
      <Modal
        open={adjustWalletModal}
        onClose={() => setAdjustWalletModal(false)}
        title="Manual Wallet Adjustment"
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setAdjustWalletModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleAdjustWallet}>Apply Wallet Adjustment</BtnPrimary>
        </>}
      >
        <form onSubmit={handleAdjustWallet}>
          <FormGrid>
            <FormGroup label="Adjustment Type *" t={t} half>
              <Select
                t={t}
                value={walletAdjustForm.type}
                onChange={(e) => setWalletAdjustForm(f => ({ ...f, type: e.target.value }))}
              >
                <option value="CREDIT">Credit (+) Add to Wallet</option>
                <option value="DEBIT">Debit (-) Deduct from Wallet</option>
              </Select>
            </FormGroup>
            <FormGroup label="Amount (₹) *" t={t} half>
              <Input
                t={t}
                type="number"
                placeholder="0.00"
                value={walletAdjustForm.amount}
                onChange={(e) => setWalletAdjustForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="Reason for Adjustment (Mandatory) *" t={t}>
              <Input
                t={t}
                placeholder="e.g. Goodwill credit / Correction of manual entry"
                value={walletAdjustForm.reason}
                onChange={(e) => setWalletAdjustForm(f => ({ ...f, reason: e.target.value }))}
                required
              />
            </FormGroup>
          </FormGrid>
          {walletMsg && (
            <div style={{ color: BRAND.pink, fontSize:13, marginTop:10 }}>{walletMsg}</div>
          )}
        </form>
      </Modal>

      {/* ── ADJUST LOYALTY POINTS MODAL ── */}
      <Modal
        open={adjustLoyaltyModal}
        onClose={() => setAdjustLoyaltyModal(false)}
        title="Manual Loyalty Points Adjustment"
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setAdjustLoyaltyModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleAdjustLoyalty}>Apply Points Adjustment</BtnPrimary>
        </>}
      >
        <form onSubmit={handleAdjustLoyalty}>
          <FormGrid>
            <FormGroup label="Adjustment Type *" t={t} half>
              <Select
                t={t}
                value={loyaltyAdjustForm.type}
                onChange={(e) => setLoyaltyAdjustForm(f => ({ ...f, type: e.target.value }))}
              >
                <option value="EARN">Award (+) Loyalty Points</option>
                <option value="REDEEM">Deduct (-) Loyalty Points</option>
              </Select>
            </FormGroup>
            <FormGroup label="Points Count *" t={t} half>
              <Input
                t={t}
                type="number"
                placeholder="e.g. 200"
                value={loyaltyAdjustForm.points}
                onChange={(e) => setLoyaltyAdjustForm(f => ({ ...f, points: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="Reason for Adjustment (Mandatory) *" t={t}>
              <Input
                t={t}
                placeholder="e.g. Promotional bonus / Referral reward"
                value={loyaltyAdjustForm.reason}
                onChange={(e) => setLoyaltyAdjustForm(f => ({ ...f, reason: e.target.value }))}
                required
              />
            </FormGroup>
          </FormGrid>
          {loyaltyMsg && (
            <div style={{ color: BRAND.pink, fontSize:13, marginTop:10 }}>{loyaltyMsg}</div>
          )}
        </form>
      </Modal>

      {/* ── RECORD PAYMENT MODAL ── */}
      <Modal
        open={paymentModal}
        onClose={() => setPaymentModal(false)}
        title={`Record Customer Payment: ${custDetails?.full_name || ''}`}
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setPaymentModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleRecordPayment} disabled={paying}>
            {paying ? "Saving..." : "Record Payment (Credit)"}
          </BtnPrimary>
        </>}
      >
        <form onSubmit={handleRecordPayment}>
          <div style={{ background:t.card2||t.card, padding:12, borderRadius:8, marginBottom:14 }}>
            <div style={{ fontSize:12, color:t.textMuted }}>Current Outstanding Due</div>
            <div style={{ fontSize:20, fontWeight:800, color:BRAND.pink }}>
              {formatCurrency(custDetails?.balance_due || ledgerData?.balanceDue || 0)}
            </div>
          </div>

          <FormGrid>
            <FormGroup label="Payment Amount (₹) *" t={t} half>
              <Input
                t={t}
                type="number"
                placeholder="0.00"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="Payment Mode *" t={t} half>
              <Select
                t={t}
                value={paymentForm.payment_mode}
                onChange={(e) => setPaymentForm(f => ({ ...f, payment_mode: e.target.value }))}
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="Cash">Cash</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </Select>
            </FormGroup>
            <FormGroup label="Payment Date" t={t} half>
              <Input
                t={t}
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm(f => ({ ...f, date: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Against Invoice No (Optional)" t={t} half>
              <Input
                t={t}
                placeholder="e.g. INV-2026-0001"
                value={paymentForm.invoice_no}
                onChange={(e) => setPaymentForm(f => ({ ...f, invoice_no: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Notes / Reference Details" t={t}>
              <Input
                t={t}
                placeholder="Transaction ID / Remarks"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
              />
            </FormGroup>
          </FormGrid>
          {payMsg && (
            <div style={{ color: payMsg.startsWith("✓") ? "#27ae60" : BRAND.pink, fontSize:13, marginTop:10 }}>
              {payMsg}
            </div>
          )}
        </form>
      </Modal>

      {/* ── ARCHIVE CONFIRMATION MODAL ── */}
      <Modal
        open={archiveModal}
        onClose={() => setArchiveModal(false)}
        title="Archive Customer Profile"
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setArchiveModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleConfirmArchive} style={{ background: BRAND.pink }}>
            Confirm Archive
          </BtnPrimary>
        </>}
      >
        <div style={{ padding:"10px 0" }}>
          <p style={{ fontSize:14, fontWeight:700, color:t.text, marginBottom:8 }}>
            Are you sure you want to archive <u>{customerToArchive?.full_name}</u> ({customerToArchive?.customer_id})?
          </p>
          <div style={{ background:t.card2||t.card, border:`1px solid ${t.borderDash}`, borderRadius:8, padding:12, fontSize:13, color:t.textMuted }}>
            <p style={{ margin:"0 0 6px 0" }}><strong>Safety Guarantee:</strong></p>
            <ul style={{ margin:0, paddingLeft:18, lineHeight:1.5 }}>
              <li>This customer will be hidden from the active directory.</li>
              <li><strong>All historical invoices, ledger records, notes, and orders remain 100% preserved.</strong></li>
              <li>You can restore this customer at any time from "Archived Customers".</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* ── ADD CUSTOMER MODAL ── */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Register New Customer"
        t={t}
        wide
        footer={<>
          <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSaveCustomer} disabled={saving}>
            {saving ? "Saving..." : "Save Customer"}
          </BtnPrimary>
        </>}
      >
        <form onSubmit={handleSaveCustomer}>
          <SectionTitle t={t}>Personal Details</SectionTitle>
          <FormGrid>
            <FormGroup label="Full Name *" t={t} half>
              <Input
                t={t}
                placeholder="e.g. Rajesh Shah"
                value={formData.full_name}
                onChange={(e) => setFormData(f => ({ ...f, full_name: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="Mobile Number *" t={t} half>
              <Input
                t={t}
                placeholder="10-digit mobile (e.g. 9820011223)"
                value={formData.phone}
                onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="Date of Birth" t={t} half>
              <Input
                t={t}
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(f => ({ ...f, date_of_birth: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Anniversary Date" t={t} half>
              <Input
                t={t}
                type="date"
                value={formData.anniversary}
                onChange={(e) => setFormData(f => ({ ...f, anniversary: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Email Address" t={t} half>
              <Input
                t={t}
                type="email"
                placeholder="customer@email.com"
                value={formData.email}
                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Membership Tier" t={t} half>
              <Select
                t={t}
                value={formData.tier}
                onChange={(e) => setFormData(f => ({ ...f, tier: e.target.value }))}
              >
                <option value="Regular">Regular</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </Select>
            </FormGroup>
          </FormGrid>

          <SectionTitle t={t}>Communication Preferences</SectionTitle>
          <FormGrid>
            <FormGroup label="Allow WhatsApp Reminders" t={t} half>
              <Select
                t={t}
                value={formData.opt_in_whatsapp ? "true" : "false"}
                onChange={(e) => setFormData(f => ({ ...f, opt_in_whatsapp: e.target.value === "true" }))}
              >
                <option value="true">☑ Yes (Allow WhatsApp Greetings & Bills)</option>
                <option value="false">☐ No (Opt Out)</option>
              </Select>
            </FormGroup>
            <FormGroup label="Allow SMS Alerts" t={t} half>
              <Select
                t={t}
                value={formData.opt_in_sms ? "true" : "false"}
                onChange={(e) => setFormData(f => ({ ...f, opt_in_sms: e.target.value === "true" }))}
              >
                <option value="true">☑ Yes (Allow SMS Notifications)</option>
                <option value="false">☐ No (Opt Out)</option>
              </Select>
            </FormGroup>
            <FormGroup label="Preferred Channel" t={t} half>
              <Select
                t={t}
                value={formData.preferred_channel}
                onChange={(e) => setFormData(f => ({ ...f, preferred_channel: e.target.value }))}
              >
                <option value="WHATSAPP">WhatsApp Primary</option>
                <option value="SMS">SMS Primary</option>
                <option value="BOTH">Both WhatsApp & SMS</option>
                <option value="NONE">Do Not Contact</option>
              </Select>
            </FormGroup>
            <FormGroup label="Promotional Marketing" t={t} half>
              <Select
                t={t}
                value={formData.opt_in_marketing ? "true" : "false"}
                onChange={(e) => setFormData(f => ({ ...f, opt_in_marketing: e.target.value === "true" }))}
              >
                <option value="false">☐ Standard Updates Only</option>
                <option value="true">☑ Allow Festive Offers & Campaigns</option>
              </Select>
            </FormGroup>
          </FormGrid>

          <SectionTitle t={t}>KYC & Financial</SectionTitle>
          <FormGrid>
            <FormGroup label="PAN Card" t={t} half>
              <Input
                t={t}
                placeholder="ABCDE1234F"
                value={formData.pan}
                onChange={(e) => setFormData(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
              />
            </FormGroup>
            <FormGroup label="Aadhaar" t={t} half>
              <Input
                t={t}
                placeholder="12-digit Aadhaar"
                value={formData.aadhaar}
                onChange={(e) => setFormData(f => ({ ...f, aadhaar: e.target.value }))}
              />
            </FormGroup>
          </FormGrid>
          {formMsg && (
            <div style={{ color: formMsg.startsWith("✓") ? "#27ae60" : BRAND.pink, fontSize:13, marginTop:10 }}>
              {formMsg}
            </div>
          )}
        </form>
      </Modal>

      {/* ── EDIT CUSTOMER MODAL ── */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit Customer: ${custDetails?.full_name || ''}`}
        t={t}
        wide
        footer={<>
          <BtnOutline t={t} onClick={() => setEditModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleUpdateCustomer} disabled={saving}>
            {saving ? "Updating..." : "Update Customer"}
          </BtnPrimary>
        </>}
      >
        <form onSubmit={handleUpdateCustomer}>
          <SectionTitle t={t}>Personal Details</SectionTitle>
          <FormGrid>
            <FormGroup label="Full Name *" t={t} half>
              <Input
                t={t}
                value={formData.full_name}
                onChange={(e) => setFormData(f => ({ ...f, full_name: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="Mobile Number *" t={t} half>
              <Input
                t={t}
                value={formData.phone}
                onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="Date of Birth" t={t} half>
              <Input
                t={t}
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(f => ({ ...f, date_of_birth: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Anniversary Date" t={t} half>
              <Input
                t={t}
                type="date"
                value={formData.anniversary}
                onChange={(e) => setFormData(f => ({ ...f, anniversary: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Email Address" t={t} half>
              <Input
                t={t}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Membership Tier" t={t} half>
              <Select
                t={t}
                value={formData.tier}
                onChange={(e) => setFormData(f => ({ ...f, tier: e.target.value }))}
              >
                <option value="Regular">Regular</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </Select>
            </FormGroup>
          </FormGrid>

          <SectionTitle t={t}>Communication Preferences</SectionTitle>
          <FormGrid>
            <FormGroup label="Allow WhatsApp Reminders" t={t} half>
              <Select
                t={t}
                value={formData.opt_in_whatsapp ? "true" : "false"}
                onChange={(e) => setFormData(f => ({ ...f, opt_in_whatsapp: e.target.value === "true" }))}
              >
                <option value="true">☑ Yes (Allow WhatsApp Greetings & Bills)</option>
                <option value="false">☐ No (Opt Out)</option>
              </Select>
            </FormGroup>
            <FormGroup label="Allow SMS Alerts" t={t} half>
              <Select
                t={t}
                value={formData.opt_in_sms ? "true" : "false"}
                onChange={(e) => setFormData(f => ({ ...f, opt_in_sms: e.target.value === "true" }))}
              >
                <option value="true">☑ Yes (Allow SMS Notifications)</option>
                <option value="false">☐ No (Opt Out)</option>
              </Select>
            </FormGroup>
            <FormGroup label="Preferred Channel" t={t} half>
              <Select
                t={t}
                value={formData.preferred_channel}
                onChange={(e) => setFormData(f => ({ ...f, preferred_channel: e.target.value }))}
              >
                <option value="WHATSAPP">WhatsApp Primary</option>
                <option value="SMS">SMS Primary</option>
                <option value="BOTH">Both WhatsApp & SMS</option>
                <option value="NONE">Do Not Contact</option>
              </Select>
            </FormGroup>
            <FormGroup label="Promotional Marketing" t={t} half>
              <Select
                t={t}
                value={formData.opt_in_marketing ? "true" : "false"}
                onChange={(e) => setFormData(f => ({ ...f, opt_in_marketing: e.target.value === "true" }))}
              >
                <option value="false">☐ Standard Updates Only</option>
                <option value="true">☑ Allow Festive Offers & Campaigns</option>
              </Select>
            </FormGroup>
          </FormGrid>
          {formMsg && (
            <div style={{ color: formMsg.startsWith("✓") ? "#27ae60" : BRAND.pink, fontSize:13, marginTop:10 }}>
              {formMsg}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
