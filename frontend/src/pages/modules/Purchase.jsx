import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
  BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select,
} from "../../components/ui";

const API = "http://localhost:5000/api";
function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
function fmt(n)     { return n ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "₹0.00"; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }

const TABS = [
  { id:"po",         label:"Purchase Orders" },
  { id:"return",     label:"Purchase Return" },
  { id:"grn",        label:"GRN" },
  { id:"sup-ledger", label:"Supplier Ledger" },
  { id:"sup-pay",    label:"Supplier Payment" },
  { id:"old-metal",  label:"Old Gold/Silver" },
];

const EMPTY_PO = {
  supplier_id: "", purchase_date: "", material_type: "Gold",
  item_description: "", purity: "", weight_qty: "", rate: "",
  gst_pct: 3, payment_mode: "RTGS", expected_delivery: "", remarks: "",
};
const EMPTY_GRN = {
  po_id: "", supplier_id: "", received_date: "",
  item_description: "", weight_qty: "", received_by: "",
  condition: "Good", notes: "",
};
const EMPTY_PRET = {
  po_ref: "", supplier_id: "", return_date: "",
  item_description: "", quantity: "", amount: "",
  reason: "Quality Issue", refund_mode: "NEFT", notes: "",
};
const EMPTY_PAY = {
  supplier_id: "", amount: "", payment_mode: "RTGS",
  reference: "", po_ref: "", remark: "",
};
const EMPTY_OM = {
  customer_id: "", metal_type: "Gold", gross_weight: "",
  stone_deduction: 0, purity: "0.9167", rate: "", payment_mode: "Cash",
};

export default function Purchase({ t }) {
  const [tab, setTab] = useState("po");

  // data
  const [kpis,      setKpis]      = useState({});
  const [pos,       setPOs]       = useState([]);
  const [grns,      setGRNs]      = useState([]);
  const [preturns,  setPReturns]  = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [ledger,    setLedger]    = useState([]);
  const [ledgerSum, setLedgerSum] = useState({});
  const [oldMetal,  setOldMetal]  = useState([]);
  const [omKpis,    setOmKpis]    = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(false);

  // modals
  const [poModal,     setPoModal]     = useState(false);
  const [grnModal,    setGrnModal]    = useState(false);
  const [pretModal,   setPretModal]   = useState(false);
  const [payModal,    setPayModal]    = useState(false);
  const [omModal,     setOmModal]     = useState(false);
  const [saving,      setSaving]      = useState(false);

  // forms
  const [poForm,     setPoForm]     = useState(EMPTY_PO);
  const [grnForm,    setGrnForm]    = useState(EMPTY_GRN);
  const [pretForm,   setPretForm]   = useState(EMPTY_PRET);
  const [payForm,    setPayForm]    = useState(EMPTY_PAY);
  const [omForm,     setOmForm]     = useState(EMPTY_OM);
  const [ledgerSup,  setLedgerSup]  = useState("");

  // ── calc helpers ─────────────────────────────────────────────────────────────
  const poCalc = useCallback(() => {
    const amt = (parseFloat(poForm.weight_qty) || 0) * (parseFloat(poForm.rate) || 0);
    const gst = amt * (parseFloat(poForm.gst_pct) / 100);
    return { amount: amt.toFixed(2), gst_amount: gst.toFixed(2), total: (amt + gst).toFixed(2) };
  }, [poForm.weight_qty, poForm.rate, poForm.gst_pct]);

  const omCalc = useCallback(() => {
    const net  = (parseFloat(omForm.gross_weight) || 0) - (parseFloat(omForm.stone_deduction) || 0);
    const fine = net * (parseFloat(omForm.purity) || 0.9167);
    const paid = fine * (parseFloat(omForm.rate) || 0);
    return { net_weight: net.toFixed(3), fine_weight: fine.toFixed(3), amount_paid: paid.toFixed(2) };
  }, [omForm.gross_weight, omForm.stone_deduction, omForm.purity, omForm.rate]);

  // ── fetch helpers ─────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const r = await fetch(`${API}/purchase/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data);
    } catch { /* silent */ }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const r = await fetch(`${API}/purchase/suppliers-list`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setSuppliers(d.data);
    } catch { /* silent */ }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const r = await fetch(`${API}/customers?limit=500`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setCustomers(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadPOs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/purchase?limit=100`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setPOs(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const loadGRNs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/purchase/grns/list`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setGRNs(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const loadPReturns = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/purchase/returns/list`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setPReturns(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/purchase/supplier-payments/list`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setPayments(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const loadLedger = useCallback(async (sid) => {
    if (!sid) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/purchase/supplier-ledger/${sid}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) { setLedger(d.data); setLedgerSum(d.summary); }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const loadOldMetal = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/purchase/old-metal`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) { setOldMetal(d.data); setOmKpis(d.kpis || {}); }
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  // ── initial load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadKpis();
    loadSuppliers();
  }, [loadKpis, loadSuppliers]);

  useEffect(() => {
    if (tab === "po")          loadPOs();
    else if (tab === "grn")    loadGRNs();
    else if (tab === "return") loadPReturns();
    else if (tab === "sup-pay") loadPayments();
    else if (tab === "old-metal") { loadOldMetal(); loadCustomers(); }
  }, [tab, loadPOs, loadGRNs, loadPReturns, loadPayments, loadOldMetal, loadCustomers]);

  // ── submit handlers ───────────────────────────────────────────────────────────
  async function submitPO() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/purchase`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(poForm),
      });
      const d = await r.json();
      if (d.success) { setPoModal(false); setPoForm(EMPTY_PO); loadPOs(); loadKpis(); }
      else alert(d.message || "Error creating PO");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function submitGRN() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/purchase/grns`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(grnForm),
      });
      const d = await r.json();
      if (d.success) { setGrnModal(false); setGrnForm(EMPTY_GRN); loadGRNs(); loadPOs(); }
      else alert(d.message || "Error creating GRN");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function submitPReturn() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/purchase/returns`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(pretForm),
      });
      const d = await r.json();
      if (d.success) { setPretModal(false); setPretForm(EMPTY_PRET); loadPReturns(); }
      else alert(d.message || "Error creating return");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function submitPayment() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/purchase/supplier-payments`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(payForm),
      });
      const d = await r.json();
      if (d.success) { setPayModal(false); setPayForm(EMPTY_PAY); loadPayments(); loadKpis(); loadSuppliers(); }
      else alert(d.message || "Error recording payment");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function submitOldMetal() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/purchase/old-metal`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(omForm),
      });
      const d = await r.json();
      if (d.success) { setOmModal(false); setOmForm(EMPTY_OM); loadOldMetal(); }
      else alert(d.message || "Error recording entry");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function cancelPO(id) {
    if (!window.confirm("Cancel this PO?")) return;
    try {
      await fetch(`${API}/purchase/${id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify({ status: "Cancelled" }),
      });
      loadPOs();
    } catch { /* silent */ }
  }

  // ── status badge ──────────────────────────────────────────────────────────────
  const badge = (s, map) => {
    const defaults = { Pending: "#f39c12", Received: "#2ecc71", Partial: BRAND.blue, Cancelled: "#e74c3c", Processed: "#2ecc71", Rejected: "#e74c3c", Good: "#2ecc71", "Partial Damage": "#f39c12" };
    const color = (map || defaults)[s] || "#aaa";
    return <span style={{ background: color, color: "#fff", borderRadius: 6, padding: "2px 9px", fontSize: 11 }}>{s}</span>;
  };

  const { amount: poAmt, gst_amount: poGst, total: poTotal } = poCalc();
  const { net_weight: omNet, fine_weight: omFine, amount_paid: omPaid } = omCalc();

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Purchase Management"
        subtitle="Purchase Entry · Return · Supplier Ledger · PO · GRN · Old Gold/Silver"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={() => { setPretModal(true); loadSuppliers(); }}>Purchase Return</BtnOutline>
          <BtnPrimary onClick={() => { setPoModal(true); loadSuppliers(); }}>+ New Purchase</BtnPrimary>
        </>}
      />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",
        gap:12, marginBottom:22 }}>
        <StatCard label="Total Purchase Value" color={BRAND.blue}   t={t} />
        <StatCard label="Pending Payments"     color={BRAND.pink}   t={t} />
        <StatCard label="Purchase Amount"      color={BRAND.purple} t={t} />
        <StatCard label="Total Orders"         color="#2ecc71"      t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "po" && (
        <Card t={t}>
          <CardHeader title="Purchase Orders" t={t}
            actions={<BtnSm t={t} primary onClick={() => { setPoModal(true); loadSuppliers(); }}>+ New PO</BtnSm>} />
          {pos.length === 0
            ? <p style={{ textAlign: "center", padding: 36, color: t.subtext, fontSize: 13 }}>No purchase orders found</p>
            : <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr>{["PO No.","Date","Supplier","Type","Item","Qty","Rate","Amount","GST","Total","Paid","Balance","Status","Actions"].map(c => (
                    <th key={c} style={{ textAlign:"left", padding:"9px 12px", color:t.subtext, fontWeight:600, fontSize:11, textTransform:"uppercase", borderBottom:`1px solid ${t.border}`, whiteSpace:"nowrap" }}>{c}</th>
                  ))}</tr></thead>
                  <tbody>{pos.map(p => (
                    <tr key={p.id} style={{ borderBottom:`1px solid ${t.border}` }}>
                      <td style={{ padding:"10px 12px", color:t.text, fontWeight:600 }}>{p.po_no}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{fmtDate(p.purchase_date)}</td>
                      <td style={{ padding:"10px 12px", color:t.text }}>{p.supplier_name || "—"}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{p.material_type}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{p.item_description}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{p.weight_qty}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{fmt(p.rate)}</td>
                      <td style={{ padding:"10px 12px", color:t.text }}>{fmt(p.amount)}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{fmt(p.gst_amount)}</td>
                      <td style={{ padding:"10px 12px", color:t.text, fontWeight:600 }}>{fmt(p.total)}</td>
                      <td style={{ padding:"10px 12px", color:"#2ecc71" }}>{fmt(p.paid_amount)}</td>
                      <td style={{ padding:"10px 12px", color:BRAND.pink, fontWeight:600 }}>{fmt(p.total - (p.paid_amount||0))}</td>
                      <td style={{ padding:"10px 12px" }}>{badge(p.status)}</td>
                      <td style={{ padding:"10px 12px" }}>{p.status === "Pending" && <BtnSm t={t} onClick={() => cancelPO(p.id)}>Cancel</BtnSm>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </Card>
      )}

      {tab === "return" && (
        <Card t={t}>
          <CardHeader title="Purchase Returns" t={t}
            actions={<BtnSm t={t} primary onClick={() => { setPretModal(true); loadSuppliers(); }}>+ New Return</BtnSm>} />
          {preturns.length === 0
            ? <p style={{ textAlign:"center", padding:36, color:t.subtext, fontSize:13 }}>No purchase returns</p>
            : <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Return No.","Date","PO Ref","Supplier","Item","Qty","Amount","Reason","Mode","Status"].map(c => (
                    <th key={c} style={{ textAlign:"left", padding:"9px 12px", color:t.subtext, fontWeight:600, fontSize:11, textTransform:"uppercase", borderBottom:`1px solid ${t.border}` }}>{c}</th>
                  ))}</tr></thead>
                  <tbody>{preturns.map(r => (
                    <tr key={r.id} style={{ borderBottom:`1px solid ${t.border}` }}>
                      <td style={{ padding:"10px 12px", color:t.text, fontWeight:600 }}>{r.return_no}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{fmtDate(r.return_date)}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{r.po_ref||"—"}</td>
                      <td style={{ padding:"10px 12px", color:t.text }}>{r.supplier_name||"—"}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{r.item_description}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{r.quantity}</td>
                      <td style={{ padding:"10px 12px", color:t.text, fontWeight:600 }}>{fmt(r.amount)}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{r.reason}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{r.refund_mode}</td>
                      <td style={{ padding:"10px 12px" }}>{badge(r.status)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </Card>
      )}

      {tab === "grn" && (
        <Card t={t}>
          <CardHeader title="Goods Received Note (GRN)" t={t}
            actions={<BtnSm t={t} primary onClick={() => { setGrnModal(true); loadSuppliers(); }}>+ New GRN</BtnSm>} />
          {grns.length === 0
            ? <p style={{ textAlign:"center", padding:36, color:t.subtext, fontSize:13 }}>No GRN records</p>
            : <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["GRN ID","Date","PO Ref","Supplier","Item","Qty","Received By","Condition","Notes"].map(c => (
                    <th key={c} style={{ textAlign:"left", padding:"9px 12px", color:t.subtext, fontWeight:600, fontSize:11, textTransform:"uppercase", borderBottom:`1px solid ${t.border}` }}>{c}</th>
                  ))}</tr></thead>
                  <tbody>{grns.map(g => (
                    <tr key={g.id} style={{ borderBottom:`1px solid ${t.border}` }}>
                      <td style={{ padding:"10px 12px", color:t.text, fontWeight:600 }}>{g.grn_id}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{fmtDate(g.received_date)}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{g.po_no||"—"}</td>
                      <td style={{ padding:"10px 12px", color:t.text }}>{g.supplier_name||"—"}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{g.item_description}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{g.weight_qty}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{g.received_by||"—"}</td>
                      <td style={{ padding:"10px 12px" }}>{badge(g.condition_status)}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{g.notes||"—"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </Card>
      )}

      {tab === "sup-ledger" && (
        <Card t={t}>
          <CardHeader title="Supplier Ledger" t={t}
            actions={<>
              <Select t={t} style={{ width: 240 }} value={ledgerSup}
                onChange={e => { setLedgerSup(e.target.value); loadLedger(e.target.value); }}>
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
              </Select>
            </>} />
          {ledgerSup && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
              <StatCard label="Total Billed"  value={fmt(ledgerSum.total_billed)}  color={BRAND.blue}   t={t} />
              <StatCard label="Total Paid"    value={fmt(ledgerSum.total_paid)}    color="#2ecc71"      t={t} />
              <StatCard label="Total Balance" value={fmt(ledgerSum.total_balance)} color={BRAND.pink}   t={t} />
            </div>
          )}
          {ledger.length === 0
            ? <p style={{ textAlign:"center", padding:36, color:t.subtext, fontSize:13 }}>Select a supplier to view the ledger</p>
            : <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Date","PO No.","Item","Total (₹)","Paid (₹)","Balance (₹)"].map(c => (
                    <th key={c} style={{ textAlign:"left", padding:"9px 12px", color:t.subtext, fontWeight:600, fontSize:11, textTransform:"uppercase", borderBottom:`1px solid ${t.border}` }}>{c}</th>
                  ))}</tr></thead>
                  <tbody>{ledger.map((l,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${t.border}` }}>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{fmtDate(l.date)}</td>
                      <td style={{ padding:"10px 12px", color:t.text, fontWeight:600 }}>{l.po_no||"—"}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{l.item||"—"}</td>
                      <td style={{ padding:"10px 12px", color:t.text }}>{fmt(l.total)}</td>
                      <td style={{ padding:"10px 12px", color:"#2ecc71" }}>{fmt(l.paid)}</td>
                      <td style={{ padding:"10px 12px", color:BRAND.pink, fontWeight:600 }}>{fmt(l.balance)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </Card>
      )}

      {tab === "sup-pay" && (
        <Card t={t}>
          <CardHeader title="Supplier Payments" t={t}
            actions={<BtnSm t={t} primary onClick={() => { setPayModal(true); loadSuppliers(); }}>New Payment</BtnSm>} />
          {payments.length === 0
            ? <p style={{ textAlign:"center", padding:36, color:t.subtext, fontSize:13 }}>No supplier payments</p>
            : <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Pay ID","Supplier","Date","Amount","Mode","Reference","PO Ref"].map(c => (
                    <th key={c} style={{ textAlign:"left", padding:"9px 12px", color:t.subtext, fontWeight:600, fontSize:11, textTransform:"uppercase", borderBottom:`1px solid ${t.border}` }}>{c}</th>
                  ))}</tr></thead>
                  <tbody>{payments.map(p => (
                    <tr key={p.id} style={{ borderBottom:`1px solid ${t.border}` }}>
                      <td style={{ padding:"10px 12px", color:t.text, fontWeight:600 }}>{p.pay_id}</td>
                      <td style={{ padding:"10px 12px", color:t.text }}>{p.supplier_name||"—"}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{fmtDate(p.created_at)}</td>
                      <td style={{ padding:"10px 12px", color:"#2ecc71", fontWeight:600 }}>{fmt(p.amount)}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{p.payment_mode}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{p.reference||"—"}</td>
                      <td style={{ padding:"10px 12px", color:t.subtext }}>{p.po_ref||"—"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </Card>
      )}

      {tab === "old-metal" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 12, marginBottom: 18 }}>
            <StatCard label="Total Entries"    value={omKpis.total_entries || 0}                          color={BRAND.blue}  t={t} />
            <StatCard label="Fine Gold (g)"    value={Number(omKpis.fine_gold || 0).toFixed(3) + "g"}    color="#f0c040"     t={t} />
            <StatCard label="Fine Silver (g)"  value={Number(omKpis.fine_silver || 0).toFixed(3) + "g"}  color="#95a5a6"     t={t} />
            <StatCard label="Total Value Paid" value={fmt(omKpis.total_paid)}                             color="#2ecc71"     t={t} />
          </div>
          <Card t={t}>
            <CardHeader title="Old Gold & Silver Purchase Register" t={t}
              actions={<BtnSm t={t} primary onClick={() => { setOmModal(true); loadCustomers(); }}>+ New Entry</BtnSm>} />
            {oldMetal.length === 0
              ? <p style={{ textAlign:"center", padding:36, color:t.subtext, fontSize:13 }}>No old metal purchases</p>
              : <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead><tr>{["ID","Date","Customer","Metal","Gross Wt","Stone Wt","Fine Wt","Rate","Amount Paid","Mode","Status"].map(c => (
                      <th key={c} style={{ textAlign:"left", padding:"9px 12px", color:t.subtext, fontWeight:600, fontSize:11, textTransform:"uppercase", borderBottom:`1px solid ${t.border}` }}>{c}</th>
                    ))}</tr></thead>
                    <tbody>{oldMetal.map(o => (
                      <tr key={o.id} style={{ borderBottom:`1px solid ${t.border}` }}>
                        <td style={{ padding:"10px 12px", color:t.subtext }}>{o.id}</td>
                        <td style={{ padding:"10px 12px", color:t.subtext }}>{fmtDate(o.created_at)}</td>
                        <td style={{ padding:"10px 12px", color:t.text }}>{o.customer_name||"Walk-in"}</td>
                        <td style={{ padding:"10px 12px", color:t.subtext }}>{o.metal_type}</td>
                        <td style={{ padding:"10px 12px", color:t.subtext }}>{o.gross_weight}g</td>
                        <td style={{ padding:"10px 12px", color:t.subtext }}>{o.stone_deduction}g</td>
                        <td style={{ padding:"10px 12px", color:t.text, fontWeight:600 }}>{o.fine_weight}g</td>
                        <td style={{ padding:"10px 12px", color:t.subtext }}>{fmt(o.rate)}</td>
                        <td style={{ padding:"10px 12px", color:"#2ecc71", fontWeight:600 }}>{fmt(o.amount_paid)}</td>
                        <td style={{ padding:"10px 12px", color:t.subtext }}>{o.payment_mode}</td>
                        <td style={{ padding:"10px 12px" }}>{badge(o.status, { Completed:"#2ecc71", Pending:"#f39c12" })}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
            }
          </Card>
        </div>
      )}

      {/* Add PO Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Purchase Order" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setPoModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={submitPO} disabled={saving}>{saving ? "Saving…" : "Create PO"}</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Supplier *" t={t} half>
            <Select t={t} value={poForm.supplier_id} onChange={e => setPoForm(p => ({ ...p, supplier_id: e.target.value }))}>
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Purchase Date *" t={t} half>
            <Input t={t} type="date" value={poForm.purchase_date} onChange={e => setPoForm(p => ({ ...p, purchase_date: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Material Type" t={t} half>
            <Select t={t} value={poForm.material_type} onChange={e => setPoForm(p => ({ ...p, material_type: e.target.value }))}>
              <option>Gold</option><option>Silver</option><option>Diamond</option><option>Gemstones</option><option>Platinum</option>
            </Select>
          </FormGroup>
          <FormGroup label="Purity / Quality" t={t} half>
            <Input t={t} value={poForm.purity} placeholder="e.g. 22K / 95%" onChange={e => setPoForm(p => ({ ...p, purity: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Item Description *" t={t}>
            <Input t={t} value={poForm.item_description} placeholder="e.g. Gold Bar 22K 100g" onChange={e => setPoForm(p => ({ ...p, item_description: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Weight / Qty" t={t} half>
            <Input t={t} type="number" step="0.001" value={poForm.weight_qty} onChange={e => setPoForm(p => ({ ...p, weight_qty: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Rate (₹)" t={t} half>
            <Input t={t} type="number" value={poForm.rate} onChange={e => setPoForm(p => ({ ...p, rate: e.target.value }))} />
          </FormGroup>
          <FormGroup label="GST %" t={t} half>
            <Select t={t} value={poForm.gst_pct} onChange={e => setPoForm(p => ({ ...p, gst_pct: e.target.value }))}>
              <option value={3}>3%</option><option value={0.25}>0.25%</option><option value={5}>5%</option><option value={18}>18%</option>
            </Select>
          </FormGroup>
          <FormGroup label="Payment Mode" t={t} half>
            <Select t={t} value={poForm.payment_mode} onChange={e => setPoForm(p => ({ ...p, payment_mode: e.target.value }))}>
              <option>RTGS</option><option>NEFT</option><option>Cheque</option><option>Cash</option><option>UPI</option>
            </Select>
          </FormGroup>
          <FormGroup label="Expected Delivery" t={t} half>
            <Input t={t} type="date" value={poForm.expected_delivery} onChange={e => setPoForm(p => ({ ...p, expected_delivery: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Remarks" t={t}>
            <Input t={t} value={poForm.remarks} onChange={e => setPoForm(p => ({ ...p, remarks: e.target.value }))} />
          </FormGroup>
        </FormGrid>
        {/* Live calc preview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10, background: t.rowHover, borderRadius: 8, padding: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: t.subtext }}>Amount</div>
            <div style={{ fontWeight: 700, color: t.text }}>{fmt(poAmt)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: t.subtext }}>GST</div>
            <div style={{ fontWeight: 700, color: t.text }}>{fmt(poGst)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: t.subtext }}>Total</div>
            <div style={{ fontWeight: 700, color: BRAND.blue }}>{fmt(poTotal)}</div>
          </div>
        </div>
      </Modal>

      {/* ── New GRN Modal ─────────────────────────────────────────────────────── */}
      <Modal open={grnModal} onClose={() => { setGrnModal(false); setGrnForm(EMPTY_GRN); }}
        title="New GRN (Goods Received Note)" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setGrnModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={submitGRN} disabled={saving}>{saving ? "Saving…" : "Create GRN"}</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Supplier *" t={t} half>
            <Select t={t} value={grnForm.supplier_id} onChange={e => setGrnForm(p => ({ ...p, supplier_id: e.target.value }))}>
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Received Date *" t={t} half>
            <Input t={t} type="date" value={grnForm.received_date} onChange={e => setGrnForm(p => ({ ...p, received_date: e.target.value }))} />
          </FormGroup>
          <FormGroup label="PO Reference" t={t} half>
            <Select t={t} value={grnForm.po_id} onChange={e => setGrnForm(p => ({ ...p, po_id: e.target.value }))}>
              <option value="">-- Link to PO (optional) --</option>
              {pos.filter(p => p.status === "Pending").map(p => <option key={p.id} value={p.id}>{p.po_no} – {p.item_description}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Item Description" t={t} half>
            <Input t={t} value={grnForm.item_description} onChange={e => setGrnForm(p => ({ ...p, item_description: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Weight / Qty" t={t} half>
            <Input t={t} type="number" step="0.001" value={grnForm.weight_qty} onChange={e => setGrnForm(p => ({ ...p, weight_qty: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Received By" t={t} half>
            <Input t={t} value={grnForm.received_by} onChange={e => setGrnForm(p => ({ ...p, received_by: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Condition" t={t} half>
            <Select t={t} value={grnForm.condition} onChange={e => setGrnForm(p => ({ ...p, condition: e.target.value }))}>
              <option>Good</option><option>Partial Damage</option><option>Rejected</option>
            </Select>
          </FormGroup>
          <FormGroup label="Notes" t={t} half>
            <Input t={t} value={grnForm.notes} onChange={e => setGrnForm(p => ({ ...p, notes: e.target.value }))} />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ── Purchase Return Modal ─────────────────────────────────────────────── */}
      <Modal open={pretModal} onClose={() => { setPretModal(false); setPretForm(EMPTY_PRET); }}
        title="New Purchase Return" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setPretModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={submitPReturn} disabled={saving}>{saving ? "Saving…" : "Submit Return"}</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Supplier *" t={t} half>
            <Select t={t} value={pretForm.supplier_id} onChange={e => setPretForm(p => ({ ...p, supplier_id: e.target.value }))}>
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Return Date" t={t} half>
            <Input t={t} type="date" value={pretForm.return_date} onChange={e => setPretForm(p => ({ ...p, return_date: e.target.value }))} />
          </FormGroup>
          <FormGroup label="PO Reference" t={t} half>
            <Input t={t} value={pretForm.po_ref} placeholder="PO-2026-XXXX" onChange={e => setPretForm(p => ({ ...p, po_ref: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Item Description *" t={t} half>
            <Input t={t} value={pretForm.item_description} onChange={e => setPretForm(p => ({ ...p, item_description: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Quantity" t={t} half>
            <Input t={t} type="number" step="0.001" value={pretForm.quantity} onChange={e => setPretForm(p => ({ ...p, quantity: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Return Amount (₹)" t={t} half>
            <Input t={t} type="number" value={pretForm.amount} onChange={e => setPretForm(p => ({ ...p, amount: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Reason *" t={t} half>
            <Select t={t} value={pretForm.reason} onChange={e => setPretForm(p => ({ ...p, reason: e.target.value }))}>
              <option>Quality Issue</option><option>Wrong Item</option><option>Excess Delivery</option><option>Damaged</option><option>Other</option>
            </Select>
          </FormGroup>
          <FormGroup label="Refund Mode" t={t} half>
            <Select t={t} value={pretForm.refund_mode} onChange={e => setPretForm(p => ({ ...p, refund_mode: e.target.value }))}>
              <option>NEFT</option><option>RTGS</option><option>Cheque</option><option>Cash</option><option>Credit Note</option>
            </Select>
          </FormGroup>
          <FormGroup label="Notes" t={t}>
            <Input t={t} value={pretForm.notes} onChange={e => setPretForm(p => ({ ...p, notes: e.target.value }))} />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ── Supplier Payment Modal ────────────────────────────────────────────── */}
      <Modal open={payModal} onClose={() => { setPayModal(false); setPayForm(EMPTY_PAY); }}
        title="New Supplier Payment" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setPayModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={submitPayment} disabled={saving}>{saving ? "Saving…" : "Record Payment"}</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Supplier *" t={t} half>
            <Select t={t} value={payForm.supplier_id} onChange={e => setPayForm(p => ({ ...p, supplier_id: e.target.value }))}>
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name} (Outstanding: {fmt(s.outstanding)})</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Amount (₹) *" t={t} half>
            <Input t={t} type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Payment Mode" t={t} half>
            <Select t={t} value={payForm.payment_mode} onChange={e => setPayForm(p => ({ ...p, payment_mode: e.target.value }))}>
              <option>RTGS</option><option>NEFT</option><option>Cheque</option><option>Cash</option><option>UPI</option>
            </Select>
          </FormGroup>
          <FormGroup label="Reference No." t={t} half>
            <Input t={t} value={payForm.reference} placeholder="UTR / Cheque No." onChange={e => setPayForm(p => ({ ...p, reference: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Against PO" t={t} half>
            <Input t={t} value={payForm.po_ref} placeholder="PO-2026-XXXX (optional)" onChange={e => setPayForm(p => ({ ...p, po_ref: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Remark" t={t} half>
            <Input t={t} value={payForm.remark} onChange={e => setPayForm(p => ({ ...p, remark: e.target.value }))} />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ── Old Metal Entry Modal ─────────────────────────────────────────────── */}
      <Modal open={omModal} onClose={() => { setOmModal(false); setOmForm(EMPTY_OM); }}
        title="Old Gold / Silver Purchase Entry" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setOmModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={submitOldMetal} disabled={saving}>{saving ? "Saving…" : "Save Entry"}</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Customer" t={t} half>
            <Select t={t} value={omForm.customer_id} onChange={e => setOmForm(p => ({ ...p, customer_id: e.target.value }))}>
              <option value="">Walk-in</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Metal Type" t={t} half>
            <Select t={t} value={omForm.metal_type} onChange={e => setOmForm(p => ({ ...p, metal_type: e.target.value }))}>
              <option>Gold</option><option>Silver</option>
            </Select>
          </FormGroup>
          <FormGroup label="Gross Weight (g) *" t={t} half>
            <Input t={t} type="number" step="0.001" value={omForm.gross_weight} onChange={e => setOmForm(p => ({ ...p, gross_weight: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Stone Deduction (g)" t={t} half>
            <Input t={t} type="number" step="0.001" value={omForm.stone_deduction} onChange={e => setOmForm(p => ({ ...p, stone_deduction: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Purity (decimal)" t={t} half>
            <Select t={t} value={omForm.purity} onChange={e => setOmForm(p => ({ ...p, purity: e.target.value }))}>
              <option value="0.9999">24K (0.9999)</option>
              <option value="0.9167">22K (0.9167)</option>
              <option value="0.75">18K (0.75)</option>
              <option value="0.585">14K (0.585)</option>
              <option value="0.999">Silver 99.9%</option>
            </Select>
          </FormGroup>
          <FormGroup label="Rate per gram (₹) *" t={t} half>
            <Input t={t} type="number" value={omForm.rate} onChange={e => setOmForm(p => ({ ...p, rate: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Payment Mode" t={t} half>
            <Select t={t} value={omForm.payment_mode} onChange={e => setOmForm(p => ({ ...p, payment_mode: e.target.value }))}>
              <option>Cash</option><option>UPI</option><option>NEFT</option><option>Cheque</option>
            </Select>
          </FormGroup>
        </FormGrid>
        {/* Live calc preview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10, background: t.rowHover, borderRadius: 8, padding: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: t.subtext }}>Net Weight</div>
            <div style={{ fontWeight: 700, color: t.text }}>{omNet}g</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: t.subtext }}>Fine Weight</div>
            <div style={{ fontWeight: 700, color: t.text }}>{omFine}g</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: t.subtext }}>Amount to Pay</div>
            <div style={{ fontWeight: 700, color: BRAND.blue }}>{fmt(omPaid)}</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
