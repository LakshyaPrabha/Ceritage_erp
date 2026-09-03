// ─── Ceritage ERP — Karigar (Artisan & Workshop) Management ───────────────────
import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs,
  BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
  Input, Select, SectionTitle
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
  { id: "profiles",     label: "Artisan Profiles" },
  { id: "workorders",   label: "Work Orders" },
  { id: "gold-issue",   label: "Gold Issue" },
  { id: "gold-receive", label: "Gold Receive & Wastage" },
  { id: "payments",     label: "Labour Payments" },
  { id: "balance",      label: "Metal Balances" },
];

const SKILLS = [
  "General Goldsmith", "Kundan Work", "Diamond Setting", "Polishing & Finishing",
  "Enamel (Meenakari)", "Die & Casting", "Filigree Work", "Laser Soldering", "Engraving"
];

const fmt = (v) => "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function Karigar({ t }) {
  const [tab, setTab] = useState("profiles");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // KPIs
  const [kpis, setKpis] = useState({
    total_karigars: 0,
    active_karigars: 0,
    gold_at_karigar: 0,
    silver_at_karigar: 0,
    pending_payments: 0,
    active_jobs: 0,
    total_work_orders: 0,
  });

  // State collections
  const [karigars, setKarigars] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [goldIssues, setGoldIssues] = useState([]);
  const [goldReceives, setGoldReceives] = useState([]);
  const [payments, setPayments] = useState([]);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [woModal, setWoModal] = useState(false);
  const [issueModal, setIssueModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState(false);
  const [payModal, setPayModal] = useState(false);

  // Form states
  const [karigarForm, setKarigarForm] = useState({
    name: "", phone: "", specialization: "General Goldsmith", branch_id: 1
  });

  const [woForm, setWoForm] = useState({
    karigar_id: "", item_type: "", metal_purity: "22K", target_weight: "", target_date: "", making_charge_agreed: ""
  });

  const [issueForm, setIssueForm] = useState({
    karigar_id: "", metal_type: "Gold", purity: "22K", gross_weight: "", net_weight: "", work_order_ref: "", notes: ""
  });

  const [receiveForm, setReceiveForm] = useState({
    karigar_id: "", metal_type: "Gold", purity: "22K", gross_weight: "", net_weight: "",
    wastage_reported: "0", making_charges: "", item_name: "", work_order_id: ""
  });

  const [payForm, setPayForm] = useState({
    karigar_id: "", amount: "", payment_mode: "Bank Transfer", reference_no: "", notes: ""
  });

  // Show notification toast
  const notify = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Load KPIs
  const loadKpis = useCallback(async () => {
    try {
      const res = await fetch(`${API}/karigar/kpis`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data) setKpis(json.data);
    } catch {
      // ignore
    }
  }, []);

  // Load Karigars
  const loadKarigars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API}/karigar?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setKarigars(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  // Load Work Orders
  const loadWorkOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/karigar/work-orders`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setWorkOrders(json.data);
    } catch {
      // ignore
    }
  }, []);

  // Load Issues
  const loadIssues = useCallback(async () => {
    try {
      const res = await fetch(`${API}/karigar/issues`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setGoldIssues(json.data);
    } catch {
      // ignore
    }
  }, []);

  // Load Receives
  const loadReceives = useCallback(async () => {
    try {
      const res = await fetch(`${API}/karigar/receives`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setGoldReceives(json.data);
    } catch {
      // ignore
    }
  }, []);

  // Load Payments
  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch(`${API}/karigar/payments`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setPayments(json.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadKpis();
    loadKarigars();
    loadWorkOrders();
    loadIssues();
    loadReceives();
    loadPayments();
  }, [loadKpis, loadKarigars, loadWorkOrders, loadIssues, loadReceives, loadPayments]);

  // Submit Add Karigar
  const handleAddKarigar = async (e) => {
    e.preventDefault();
    if (!karigarForm.name || !karigarForm.phone) {
      alert("Name and phone are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/karigar`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(karigarForm)
      });
      const json = await res.json();
      if (json.success) {
        notify("Karigar registered successfully");
        setAddModal(false);
        setKarigarForm({ name: "", phone: "", specialization: "General Goldsmith", branch_id: 1 });
        loadKarigars();
        loadKpis();
      } else {
        alert(json.message || "Failed to register karigar");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Work Order
  const handleCreateWo = async (e) => {
    e.preventDefault();
    if (!woForm.karigar_id || !woForm.item_type || !woForm.target_weight) {
      alert("Please fill all required work order fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/karigar/work-orders`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(woForm)
      });
      const json = await res.json();
      if (json.success) {
        notify(`Work Order ${json.data?.order_no || ""} created successfully`);
        setWoModal(false);
        setWoForm({ karigar_id: "", item_type: "", metal_purity: "22K", target_weight: "", target_date: "", making_charge_agreed: "" });
        loadWorkOrders();
        loadKpis();
      } else {
        alert(json.message || "Failed to create work order");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Issue Gold
  const handleIssueGold = async (e) => {
    e.preventDefault();
    if (!issueForm.karigar_id || !issueForm.gross_weight || Number(issueForm.gross_weight) <= 0) {
      alert("Please select Karigar and enter valid metal weight");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/karigar/gold-issue`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(issueForm)
      });
      const json = await res.json();
      if (json.success) {
        notify(`Metal issued successfully (${issueForm.gross_weight}g)`);
        setIssueModal(false);
        setIssueForm({ karigar_id: "", metal_type: "Gold", purity: "22K", gross_weight: "", net_weight: "", work_order_ref: "", notes: "" });
        loadKarigars();
        loadIssues();
        loadKpis();
      } else {
        alert(json.message || "Failed to issue gold");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Receive Gold
  const handleReceiveGold = async (e) => {
    e.preventDefault();
    if (!receiveForm.karigar_id || !receiveForm.gross_weight || Number(receiveForm.gross_weight) <= 0) {
      alert("Please select Karigar and enter valid weight");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/karigar/gold-receive`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(receiveForm)
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || "Finished jewellery received successfully");
        setReceiveModal(false);
        setReceiveForm({ karigar_id: "", metal_type: "Gold", purity: "22K", gross_weight: "", net_weight: "", wastage_reported: "0", making_charges: "", item_name: "", work_order_id: "" });
        loadKarigars();
        loadReceives();
        loadWorkOrders();
        loadKpis();
      } else {
        alert(json.message || "Failed to record gold receive");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Labour Payment
  const handleMakePayment = async (e) => {
    e.preventDefault();
    if (!payForm.karigar_id || !payForm.amount || Number(payForm.amount) <= 0) {
      alert("Please select Karigar and valid payment amount");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/karigar/payment`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payForm)
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || "Payment recorded successfully");
        setPayModal(false);
        setPayForm({ karigar_id: "", amount: "", payment_mode: "Bank Transfer", reference_no: "", notes: "" });
        loadKarigars();
        loadPayments();
        loadKpis();
      } else {
        alert(json.message || "Failed to process payment");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Karigar (Artisan & Workshop) Management"
        subtitle="Artisan Directory · Work Orders · Gold Issue & Receive"
        t={t}
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <BtnOutline t={t} onClick={() => setAddModal(true)}>+ Add Karigar</BtnOutline>
            <BtnOutline t={t} onClick={() => setIssueModal(true)}>Issue Raw Gold</BtnOutline>
            <BtnOutline t={t} onClick={() => setReceiveModal(true)}>Receive Jewellery</BtnOutline>
            <BtnPrimary onClick={() => setWoModal(true)}>+ New Work Order</BtnPrimary>
          </div>
        }
      />

      {successMsg && (
        <div style={{ background: "rgba(46,204,113,0.15)", border: "1px solid #2ecc71", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#2ecc71", fontSize: 13, fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(231,76,60,0.15)", border: "1px solid #e74c3c", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#e74c3c", fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* KPI Ribbon */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Karigars"   value={kpis.total_karigars} color={BRAND.blue} t={t} />
        <StatCard label="Active Artisans"  value={kpis.active_karigars} color="#2ecc71" t={t} />
        <StatCard label="Gold at Karigar"  value={Number(kpis.gold_at_karigar || 0).toFixed(3) + "g"} color="#f0c040" t={t} />
        <StatCard label="Active Jobs"      value={kpis.active_jobs} color={BRAND.pink} t={t} />
        <StatCard label="Labour Payable"   value={fmt(kpis.pending_payments)} color={BRAND.purple} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* TAB 1: ARTISAN PROFILES */}
      {tab === "profiles" && (
        <Card t={t}>
          <CardHeader
            title="Artisans Directory"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder="Search name, phone, code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 8, padding: "7px 12px", fontSize: 13,
                    color: t.inputColor, outline: "none", width: 220
                  }}
                />
                <Select t={t} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 130 }}>
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            }
          />
          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading artisans...</p>
          ) : karigars.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No karigars found. Click &quot;+ Add Karigar&quot; to register your first artisan.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["Code", "Artisan Name", "Phone", "Specialization", "Gold Balance", "Silver Balance", "Labour Due", "Status", "Actions"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {karigars.map(k => (
                    <tr key={k.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "11px 12px", fontFamily: "monospace", fontWeight: 600, color: BRAND.blue }}>{k.karigar_code || `KG-${k.id}`}</td>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{k.name}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{k.phone}</td>
                      <td style={{ padding: "11px 12px", color: t.text }}>
                        <span style={{ background: "rgba(139,59,200,0.12)", color: BRAND.purple, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {k.specialization}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px", color: "#f0c040", fontWeight: 700 }}>{Number(k.gold_balance_grams || 0).toFixed(3)}g</td>
                      <td style={{ padding: "11px 12px", color: "#95a5a6" }}>{Number(k.silver_balance_grams || 0).toFixed(3)}g</td>
                      <td style={{ padding: "11px 12px", color: Number(k.making_charges_due) > 0 ? "#e74c3c" : "#2ecc71", fontWeight: 700 }}>
                        {fmt(k.making_charges_due)}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{ background: k.status === "ACTIVE" ? "rgba(46,204,113,0.15)" : "rgba(149,165,166,0.15)", color: k.status === "ACTIVE" ? "#2ecc71" : "#95a5a6", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {k.status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <BtnSm t={t} primary onClick={() => { setIssueForm(prev => ({ ...prev, karigar_id: k.id })); setIssueModal(true); }}>Issue Gold</BtnSm>
                          <BtnSm t={t} onClick={() => { setReceiveForm(prev => ({ ...prev, karigar_id: k.id })); setReceiveModal(true); }}>Receive</BtnSm>
                          <BtnSm t={t} onClick={() => { setPayForm(prev => ({ ...prev, karigar_id: k.id, amount: k.making_charges_due || "" })); setPayModal(true); }}>Pay</BtnSm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: WORK ORDERS */}
      {tab === "workorders" && (
        <Card t={t}>
          <CardHeader
            title="Manufacturing Work Orders"
            t={t}
            actions={<BtnSm t={t} primary onClick={() => setWoModal(true)}>+ New Work Order</BtnSm>}
          />
          {workOrders.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No work orders created yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["Order No", "Karigar", "Item Description", "Purity", "Target Weight", "Agreed Labour", "Target Date", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map(w => (
                    <tr key={w.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "11px 12px", fontFamily: "monospace", fontWeight: 600, color: BRAND.blue }}>{w.order_no}</td>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{w.karigar_name || `Karigar #${w.karigar_id}`}</td>
                      <td style={{ padding: "11px 12px", color: t.text }}>{w.item_type}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{w.metal_purity}</td>
                      <td style={{ padding: "11px 12px", color: t.text, fontWeight: 600 }}>{w.target_weight}g</td>
                      <td style={{ padding: "11px 12px", color: "#2ecc71", fontWeight: 600 }}>{fmt(w.making_charge_agreed)}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(w.target_date)}</td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{
                          background: w.status === "COMPLETED" ? "rgba(46,204,113,0.15)" : w.status === "IN_PROGRESS" ? "rgba(52,152,219,0.15)" : "rgba(241,196,15,0.15)",
                          color: w.status === "COMPLETED" ? "#2ecc71" : w.status === "IN_PROGRESS" ? "#3498db" : "#f1c40f",
                          padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600
                        }}>
                          {w.status}
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

      {/* TAB 3: GOLD ISSUE REGISTER */}
      {tab === "gold-issue" && (
        <Card t={t}>
          <CardHeader
            title="Raw Metal Issue Register"
            t={t}
            actions={<BtnSm t={t} primary onClick={() => setIssueModal(true)}>Issue Raw Gold</BtnSm>}
          />
          {goldIssues.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No metal issues logged yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["Issue No", "Date", "Karigar", "Metal", "Purity", "Gross Weight", "Net Weight", "Work Order Ref", "Notes"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {goldIssues.map(gi => (
                    <tr key={gi.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "11px 12px", fontFamily: "monospace", fontWeight: 600, color: BRAND.blue }}>{gi.issue_no}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(gi.issue_date || gi.created_at)}</td>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{gi.karigar_name || `Karigar #${gi.karigar_id}`}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{gi.metal_type}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{gi.purity}</td>
                      <td style={{ padding: "11px 12px", color: "#f0c040", fontWeight: 700 }}>{gi.gross_weight}g</td>
                      <td style={{ padding: "11px 12px", color: t.text }}>{gi.net_weight}g</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{gi.work_order_ref || "—"}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{gi.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: GOLD RECEIVE & WASTAGE REGISTER */}
      {tab === "gold-receive" && (
        <Card t={t}>
          <CardHeader
            title="Finished Jewellery Inward & Wastage Reconciliation"
            t={t}
            actions={<BtnSm t={t} primary onClick={() => setReceiveModal(true)}>Receive Jewellery</BtnSm>}
          />
          {goldReceives.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No finished jewellery received yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["Receive No", "Date", "Karigar", "Ornament / Item", "Gross Wt", "Wastage (g)", "Labour Credited"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {goldReceives.map(gr => (
                    <tr key={gr.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "11px 12px", fontFamily: "monospace", fontWeight: 600, color: BRAND.blue }}>{gr.receive_no}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(gr.receive_date || gr.created_at)}</td>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{gr.karigar_name || `Karigar #${gr.karigar_id}`}</td>
                      <td style={{ padding: "11px 12px", color: t.text, fontWeight: 600 }}>{gr.item_name}</td>
                      <td style={{ padding: "11px 12px", color: "#2ecc71", fontWeight: 700 }}>{gr.gross_weight}g</td>
                      <td style={{ padding: "11px 12px", color: "#e74c3c" }}>{gr.wastage_reported || "0"}g</td>
                      <td style={{ padding: "11px 12px", color: "#3498db", fontWeight: 700 }}>{fmt(gr.making_charges)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: LABOUR PAYMENTS */}
      {tab === "payments" && (
        <Card t={t}>
          <CardHeader
            title="Labour Charges Payment Vouchers"
            t={t}
            actions={<BtnSm t={t} primary onClick={() => setPayModal(true)}>Pay Labour Charges</BtnSm>}
          />
          {payments.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No labour payments recorded yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["Receipt No", "Date", "Karigar", "Amount Paid", "Payment Mode", "Reference / UTR", "Notes"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "11px 12px", fontFamily: "monospace", fontWeight: 600, color: BRAND.blue }}>{p.receipt_no}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(p.payment_date || p.created_at)}</td>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{p.karigar_name || `Karigar #${p.karigar_id}`}</td>
                      <td style={{ padding: "11px 12px", color: "#2ecc71", fontWeight: 700 }}>{fmt(p.amount)}</td>
                      <td style={{ padding: "11px 12px", color: t.text }}>{p.payment_mode}</td>
                      <td style={{ padding: "11px 12px", fontFamily: "monospace", color: t.subtext }}>{p.reference_no || "—"}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 6: METAL BALANCE SUMMARY */}
      {tab === "balance" && (
        <Card t={t}>
          <CardHeader title="Artisan Metal Exposure & Balances" t={t} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["Artisan", "Specialization", "Gold Balance (Fine Wt)", "Silver Balance", "Making Charges Due", "Quick Action"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {karigars.map(k => (
                  <tr key={k.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>
                      {k.name} <span style={{ color: t.subtext, fontSize: 11 }}>({k.karigar_code})</span>
                    </td>
                    <td style={{ padding: "11px 12px", color: t.subtext }}>{k.specialization}</td>
                    <td style={{ padding: "11px 12px", color: "#f0c040", fontWeight: 700 }}>{Number(k.gold_balance_grams || 0).toFixed(3)}g</td>
                    <td style={{ padding: "11px 12px", color: "#95a5a6" }}>{Number(k.silver_balance_grams || 0).toFixed(3)}g</td>
                    <td style={{ padding: "11px 12px", color: Number(k.making_charges_due) > 0 ? "#e74c3c" : "#2ecc71", fontWeight: 700 }}>
                      {fmt(k.making_charges_due)}
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <BtnSm t={t} primary onClick={() => { setReceiveForm(prev => ({ ...prev, karigar_id: k.id })); setReceiveModal(true); }}>
                        Receive Finished Jewellery
                      </BtnSm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── MODAL: ADD KARIGAR ────────────────────────────────────────── */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Register New Karigar" t={t}>
        <form onSubmit={handleAddKarigar}>
          <SectionTitle t={t}>Personal & Skill Information</SectionTitle>
          <FormGrid>
            <FormGroup label="Full Name *" t={t} half>
              <Input t={t} placeholder="e.g. Ramesh Soni" value={karigarForm.name} onChange={e => setKarigarForm(p => ({ ...p, name: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Phone Number *" t={t} half>
              <Input t={t} placeholder="10-digit mobile" value={karigarForm.phone} onChange={e => setKarigarForm(p => ({ ...p, phone: e.target.value }))} required maxLength={15} />
            </FormGroup>
            <FormGroup label="Specialization Skill" t={t} half>
              <Select t={t} value={karigarForm.specialization} onChange={e => setKarigarForm(p => ({ ...p, specialization: e.target.value }))}>
                {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormGroup>
          </FormGrid>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={loading}>{loading ? "Saving..." : "Save Artisan"}</BtnPrimary>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: NEW WORK ORDER ─────────────────────────────────────── */}
      <Modal open={woModal} onClose={() => setWoModal(false)} title="Create Manufacturing Work Order" t={t}>
        <form onSubmit={handleCreateWo}>
          <FormGrid>
            <FormGroup label="Select Karigar *" t={t} half>
              <Select t={t} value={woForm.karigar_id} onChange={e => setWoForm(p => ({ ...p, karigar_id: e.target.value }))} required>
                <option value="">-- Choose Artisan --</option>
                {karigars.map(k => <option key={k.id} value={k.id}>{k.name} ({k.specialization})</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Item Description *" t={t} half>
              <Input t={t} placeholder="e.g. 22K Bridal Choker Necklace" value={woForm.item_type} onChange={e => setWoForm(p => ({ ...p, item_type: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Metal Purity" t={t} half>
              <Select t={t} value={woForm.metal_purity} onChange={e => setWoForm(p => ({ ...p, metal_purity: e.target.value }))}>
                <option>24K</option><option>22K</option><option>18K</option><option>14K</option><option>925 Silver</option>
              </Select>
            </FormGroup>
            <FormGroup label="Target Weight (g) *" t={t} half>
              <Input t={t} type="number" step="0.001" placeholder="e.g. 45.500" value={woForm.target_weight} onChange={e => setWoForm(p => ({ ...p, target_weight: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Agreed Labour Charge (Rs)" t={t} half>
              <Input t={t} type="number" placeholder="e.g. 12500" value={woForm.making_charge_agreed} onChange={e => setWoForm(p => ({ ...p, making_charge_agreed: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Target Delivery Date" t={t} half>
              <Input t={t} type="date" value={woForm.target_date} onChange={e => setWoForm(p => ({ ...p, target_date: e.target.value }))} />
            </FormGroup>
          </FormGrid>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnOutline t={t} onClick={() => setWoModal(false)}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={loading}>{loading ? "Creating..." : "Create Work Order"}</BtnPrimary>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: ISSUE RAW GOLD ─────────────────────────────────────── */}
      <Modal open={issueModal} onClose={() => setIssueModal(false)} title="Issue Raw Metal to Artisan" t={t}>
        <form onSubmit={handleIssueGold}>
          <FormGrid>
            <FormGroup label="Select Karigar *" t={t} half>
              <Select t={t} value={issueForm.karigar_id} onChange={e => setIssueForm(p => ({ ...p, karigar_id: e.target.value }))} required>
                <option value="">-- Choose Artisan --</option>
                {karigars.map(k => <option key={k.id} value={k.id}>{k.name} (Cur Gold: {k.gold_balance_grams}g)</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Metal Type" t={t} half>
              <Select t={t} value={issueForm.metal_type} onChange={e => setIssueForm(p => ({ ...p, metal_type: e.target.value }))}>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Platinum">Platinum</option>
              </Select>
            </FormGroup>
            <FormGroup label="Metal Purity" t={t} half>
              <Select t={t} value={issueForm.purity} onChange={e => setIssueForm(p => ({ ...p, purity: e.target.value }))}>
                <option>24K (999)</option><option>22K (916)</option><option>18K (750)</option><option>14K (585)</option><option>Fine Silver (999)</option>
              </Select>
            </FormGroup>
            <FormGroup label="Gross Weight to Issue (g) *" t={t} half>
              <Input t={t} type="number" step="0.001" placeholder="e.g. 50.000" value={issueForm.gross_weight} onChange={e => setIssueForm(p => ({ ...p, gross_weight: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Work Order Reference (Optional)" t={t} half>
              <Input t={t} placeholder="e.g. WO-2026-0001" value={issueForm.work_order_ref} onChange={e => setIssueForm(p => ({ ...p, work_order_ref: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Notes / Instructions" t={t} half>
              <Input t={t} placeholder="e.g. Bullion bar 999 batch #441" value={issueForm.notes} onChange={e => setIssueForm(p => ({ ...p, notes: e.target.value }))} />
            </FormGroup>
          </FormGrid>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnOutline t={t} onClick={() => setIssueModal(false)}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={loading}>{loading ? "Issuing..." : "Confirm Issue"}</BtnPrimary>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: RECEIVE FINISHED JEWELLERY ─────────────────────────── */}
      <Modal open={receiveModal} onClose={() => setReceiveModal(false)} title="Receive Finished Jewellery & Reconcile Wastage" t={t}>
        <form onSubmit={handleReceiveGold}>
          <FormGrid>
            <FormGroup label="Select Karigar *" t={t} half>
              <Select t={t} value={receiveForm.karigar_id} onChange={e => setReceiveForm(p => ({ ...p, karigar_id: e.target.value }))} required>
                <option value="">-- Choose Artisan --</option>
                {karigars.map(k => <option key={k.id} value={k.id}>{k.name} (Gold with him: {k.gold_balance_grams}g)</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Ornament / Item Name *" t={t} half>
              <Input t={t} placeholder="e.g. 22K Antique Kada Pair" value={receiveForm.item_name} onChange={e => setReceiveForm(p => ({ ...p, item_name: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Received Gross Weight (g) *" t={t} half>
              <Input t={t} type="number" step="0.001" placeholder="e.g. 48.200" value={receiveForm.gross_weight} onChange={e => setReceiveForm(p => ({ ...p, gross_weight: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Wastage Reported (g)" t={t} half>
              <Input t={t} type="number" step="0.001" placeholder="e.g. 1.800" value={receiveForm.wastage_reported} onChange={e => setReceiveForm(p => ({ ...p, wastage_reported: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Labour / Making Charges Credited (Rs) *" t={t} half>
              <Input t={t} type="number" placeholder="e.g. 8500" value={receiveForm.making_charges} onChange={e => setReceiveForm(p => ({ ...p, making_charges: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Linked Work Order (Optional)" t={t} half>
              <Input t={t} placeholder="e.g. WO-2026-0001" value={receiveForm.work_order_id} onChange={e => setReceiveForm(p => ({ ...p, work_order_id: e.target.value }))} />
            </FormGroup>
          </FormGrid>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnOutline t={t} onClick={() => setReceiveModal(false)}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={loading}>{loading ? "Receiving..." : "Receive & Settle Weight"}</BtnPrimary>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: PAY LABOUR CHARGES ─────────────────────────────────── */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Artisan Labour Payment" t={t}>
        <form onSubmit={handleMakePayment}>
          <FormGrid>
            <FormGroup label="Select Karigar *" t={t} half>
              <Select t={t} value={payForm.karigar_id} onChange={e => setPayForm(p => ({ ...p, karigar_id: e.target.value }))} required>
                <option value="">-- Choose Artisan --</option>
                {karigars.map(k => <option key={k.id} value={k.id}>{k.name} (Due: {fmt(k.making_charges_due)})</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Payment Amount (Rs) *" t={t} half>
              <Input t={t} type="number" placeholder="e.g. 5000" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Payment Mode" t={t} half>
              <Select t={t} value={payForm.payment_mode} onChange={e => setPayForm(p => ({ ...p, payment_mode: e.target.value }))}>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </Select>
            </FormGroup>
            <FormGroup label="UTR / Reference No." t={t} half>
              <Input t={t} placeholder="e.g. UTR-AXIS-992812" value={payForm.reference_no} onChange={e => setPayForm(p => ({ ...p, reference_no: e.target.value }))} />
            </FormGroup>
          </FormGrid>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnOutline t={t} onClick={() => setPayModal(false)}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={loading}>{loading ? "Processing..." : "Record Payment"}</BtnPrimary>
          </div>
        </form>
      </Modal>
    </div>
  );
}
