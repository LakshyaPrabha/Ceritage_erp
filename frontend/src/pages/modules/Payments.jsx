import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
  BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select,
} from "../../components/ui";

const API = "http://localhost:5000/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token") || localStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function fmt(n) {
  return n ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "₹0.00";
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "—";
}

const TABS = [
  { id: "overview",     label: "Mode Breakdown & Analytics" },
  { id: "transactions", label: "Unified Transactions Log" },
  { id: "modes",        label: "Payment Modes Configuration" },
  { id: "gateway",      label: "Gateway Configuration" }
];

const EMPTY_RECORD = {
  type: "CUSTOMER_DUES",
  customer_id: "",
  supplier_id: "",
  amount: "",
  payment_mode: "Cash",
  reference_no: "",
  remark: ""
};

export default function Payments({ t }) {
  const [tab, setTab] = useState("overview");

  // Data states
  const [kpis, setKpis] = useState({
    total_collection: 0,
    today_collection: 0,
    cash_total: 0,
    upi_total: 0,
    card_total: 0,
    bank_total: 0,
    cheque_total: 0,
    emi_total: 0,
    breakdown: []
  });

  const [modes, setModes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [gatewayConfig, setGatewayConfig] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [modeFilter, setModeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [recordModal, setRecordModal] = useState(false);
  const [editModeModal, setEditModeModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [recordForm, setRecordForm] = useState(EMPTY_RECORD);
  const [saving, setSaving] = useState(false);

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const r = await fetch(`${API}/payments/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data);
    } catch { /* silent */ }
  }, []);

  const loadModes = useCallback(async () => {
    try {
      const r = await fetch(`${API}/payments/modes`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setModes(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (modeFilter !== "ALL") query.append("mode", modeFilter);
      if (search) query.append("search", search);
      query.append("limit", "100");

      const r = await fetch(`${API}/payments/transactions?${query.toString()}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setTransactions(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [modeFilter, search]);

  const loadGateway = useCallback(async () => {
    try {
      const [configRes, settlementRes] = await Promise.all([
        fetch(`${API}/payments/gateway/config?provider=mock`, { headers: authHeaders() }),
        fetch(`${API}/payments/settlements`, { headers: authHeaders() })
      ]);
      const [configData, settlementData] = await Promise.all([configRes.json(), settlementRes.json()]);
      if (configData.success) setGatewayConfig(configData.data);
      if (settlementData.success) setSettlements(settlementData.data || []);
    } catch { /* silent */ }
  }, []);

  const loadParties = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch(`${API}/customers?limit=200`, { headers: authHeaders() }),
        fetch(`${API}/purchase/suppliers-list`, { headers: authHeaders() })
      ]);
      const [cData, sData] = await Promise.all([cRes.json(), sRes.json()]);
      if (cData.success) setCustomers(cData.data || []);
      if (sData.success) setSuppliers(sData.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadKpis();
    loadModes();
    loadGateway();
    loadParties();
  }, [loadKpis, loadModes, loadGateway, loadParties]);

  useEffect(() => {
    if (tab === "transactions") {
      loadTransactions();
    }
  }, [tab, loadTransactions]);

  // ── Record Payment Submit ───────────────────────────────────────────────────
  async function submitPaymentRecord() {
    if (!recordForm.amount || parseFloat(recordForm.amount) <= 0) {
      alert("Please enter a valid positive payment amount.");
      return;
    }
    if (recordForm.type === "CUSTOMER_DUES" && !recordForm.customer_id) {
      alert("Please select a customer.");
      return;
    }
    if (recordForm.type === "SUPPLIER_PAYMENT" && !recordForm.supplier_id) {
      alert("Please select a supplier.");
      return;
    }

    setSaving(true);
    try {
      const r = await fetch(`${API}/payments/record`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(recordForm)
      });
      const d = await r.json();
      if (d.success) {
        alert(d.message || "Payment recorded successfully!");
        setRecordModal(false);
        setRecordForm(EMPTY_RECORD);
        loadKpis();
        loadParties();
        if (tab === "transactions") loadTransactions();
      } else {
        alert(d.message || "Failed to record payment.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle / Update Mode ────────────────────────────────────────────────────
  async function toggleModeActive(mode) {
    try {
      const r = await fetch(`${API}/payments/modes/${mode.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !mode.is_active })
      });
      const d = await r.json();
      if (d.success) loadModes();
      else alert(d.message);
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  async function saveModeConfig() {
    if (!selectedMode) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/payments/modes/${selectedMode.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          mdr_pct: selectedMode.mdr_pct,
          vpa_id: selectedMode.vpa_id,
          account_no: selectedMode.account_no,
          terminal_id: selectedMode.terminal_id,
          description: selectedMode.description,
          gateway_provider: selectedMode.gateway_provider,
          gateway_environment: selectedMode.gateway_environment,
          gateway_status: selectedMode.gateway_status,
          webhook_status: selectedMode.webhook_status,
          settlement_status: selectedMode.settlement_status
        })
      });
      const d = await r.json();
      if (d.success) {
        setEditModeModal(false);
        setSelectedMode(null);
        loadModes();
        loadGateway();
      } else {
        alert(d.message || "Failed to update configuration.");
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  const badge = (s) => {
    const isReceived = s === "Completed" || s === "Settled" || s === "Received";
    const bg = isReceived ? "#2ecc71" : "#f39c12";
    return <span style={{ background: bg, color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{s}</span>;
  };

  const selectedCust = customers.find(c => String(c.id) === String(recordForm.customer_id));
  const selectedSup = suppliers.find(s => String(s.id) === String(recordForm.supplier_id));

  return (
    <div>
      <PageHeader
        title="Payment Modes & Treasury"
        subtitle="Cash · UPI · Card POS · NetBanking / RTGS · Cheque · EMI & Store Credit · Live Reconciliation"
        t={t}
        actions={
          <BtnPrimary onClick={() => { setRecordModal(true); loadParties(); }}>
            + Record Payment / Settlement
          </BtnPrimary>
        }
      />

      {/* Top StatCards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Total Inflow"        value={fmt(kpis.total_collection)} color={BRAND.blue}   t={t} />
        <StatCard label="Cash Tender"         value={fmt(kpis.cash_total)}       color="#2ecc71"      t={t} />
        <StatCard label="UPI / QR Code"       value={fmt(kpis.upi_total)}        color="#3498db"      t={t} />
        <StatCard label="Card (POS Swipe)"    value={fmt(kpis.card_total)}       color={BRAND.purple} t={t} />
        <StatCard label="Bank / NEFT / Cheque" value={fmt(kpis.bank_total + kpis.cheque_total)} color="#f39c12" t={t} />
        <StatCard label="Today's Collection"  value={fmt(kpis.today_collection)} color={BRAND.pink}   t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── TAB 1: OVERVIEW & BREAKDOWN ────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          <Card t={t} style={{ marginBottom: 0 }}>
            <CardHeader title="Mode-Wise Collection Breakdown" t={t} />
            <div style={{ padding: "8px 0" }}>
              {(kpis.breakdown || []).map((b) => (
                <div key={b.mode} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: t.text, fontWeight: 600 }}>{b.mode}</span>
                    <span style={{ fontWeight: 700, color: b.color }}>
                      {fmt(b.total)} <span style={{ fontSize: 11, color: t.subtext, fontWeight: 400 }}>({b.pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: t.borderDash, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.max(2, b.pct)}%`, background: b.color, borderRadius: 4, transition: "width 0.4s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card t={t} style={{ marginBottom: 0 }}>
            <CardHeader title="Payment Mode Status & Terminals" t={t} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {modes.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: t.card2,
                    border: `1px solid ${t.border}`,
                    borderRadius: 8
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{m.mode_name}</div>
                    <div style={{ fontSize: 11, color: t.subtext, marginTop: 2 }}>
                      {m.vpa_id ? `VPA: ${m.vpa_id}` : m.account_no ? `A/C: ${m.account_no}` : m.terminal_id ? `Terminal: ${m.terminal_id}` : m.description || "Standard Tender"}
                      {Number(m.mdr_pct) > 0 ? ` · MDR: ${m.mdr_pct}%` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => toggleModeActive(m)}
                      style={{
                        padding: "3px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                        background: m.is_active ? "#2ecc71" : "#e74c3c",
                        color: "#fff"
                      }}
                    >
                      {m.is_active ? "Active" : "Disabled"}
                    </button>
                    <BtnSm
                      t={t}
                      onClick={() => {
                        setSelectedMode({ ...m });
                        setEditModeModal(true);
                      }}
                    >
                      Config
                    </BtnSm>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 2: UNIFIED TRANSACTIONS REGISTER ───────────────────────────── */}
      {tab === "transactions" && (
        <Card t={t}>
          <CardHeader
            title="Unified Payment Transactions Feed"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Select
                  t={t}
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  style={{ width: 140, padding: "4px 8px", fontSize: 12 }}
                >
                  <option value="ALL">All Modes</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="Card">Card POS</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="EMI">EMI Scheme</option>
                </Select>
                <Input
                  t={t}
                  placeholder="Search receipt / party / mode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 200, padding: "4px 8px", fontSize: 12 }}
                />
              </div>
            }
          />

          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading payment feed...</p>
          ) : transactions.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No payment transactions found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Ref / Receipt</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Date</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Party / Description</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Type</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Payment Mode</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Amount</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{tx.ref_no}</td>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{fmtDate(tx.date)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>
                        {tx.party_name} <span style={{ fontSize: 11, color: t.subtext, fontWeight: 400 }}>({tx.party_type})</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: t.subtext, fontSize: 12 }}>{tx.type.replace(/_/g, " ")}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{tx.payment_mode}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: tx.type === "SUPPLIER_PAYOUT" ? "#e74c3c" : "#2ecc71" }}>
                        {tx.type === "SUPPLIER_PAYOUT" ? "- " : "+ "}{fmt(tx.amount)}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{badge(tx.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 3: PAYMENT MODES CONFIGURATION MATRIX ──────────────────────── */}
      {tab === "modes" && (
        <Card t={t}>
          <CardHeader title="Store Tender Configuration & Merchant Settings" t={t} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Code</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Payment Mode</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>MDR / Fee %</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Merchant Identifier (VPA / A/C)</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Gateway</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {modes.map((m) => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{m.mode_code}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>{m.mode_name}</td>
                    <td style={{ padding: "10px 12px", color: t.subtext }}>{Number(m.mdr_pct || 0).toFixed(2)}%</td>
                    <td style={{ padding: "10px 12px", color: t.text }}>{m.vpa_id || m.account_no || m.terminal_id || "—"}</td>
                    <td style={{ padding: "10px 12px", color: t.subtext }}>
                      {m.gateway_provider ? `${m.gateway_provider} / ${m.gateway_environment || "TEST"}` : "-"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        onClick={() => toggleModeActive(m)}
                        style={{
                          cursor: "pointer",
                          background: m.is_active ? "#2ecc71" : "#e74c3c",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        {m.is_active ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <BtnSm
                        t={t}
                        primary
                        onClick={() => {
                          setSelectedMode({ ...m });
                          setEditModeModal(true);
                        }}
                      >
                        Edit Config
                      </BtnSm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "gateway" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
          <Card t={t} style={{ marginBottom: 0 }}>
            <CardHeader title="Gateway Runtime Status" t={t} actions={<BtnOutline t={t} onClick={loadGateway}>Refresh</BtnOutline>} />
            <div style={{ display: "grid", gap: 12, fontSize: 13 }}>
              <div><strong>Provider:</strong> {gatewayConfig?.provider || "mock"}</div>
              <div><strong>Environment:</strong> {gatewayConfig?.environment || "TEST"}</div>
              <div><strong>Credentials:</strong> {gatewayConfig?.configured ? "Configured" : "Pending"}</div>
              <div><strong>Webhook:</strong> {gatewayConfig?.webhook_configured ? "Ready" : "Pending"}</div>
              <div><strong>Captured Payments:</strong> {Number(gatewayConfig?.counts?.captured || 0)}</div>
              <div><strong>Failed Payments:</strong> {Number(gatewayConfig?.counts?.failed || 0)}</div>
            </div>
          </Card>

          <Card t={t} style={{ marginBottom: 0 }}>
            <CardHeader title="Settlement Reconciliation" t={t} />
            <DataTable
              columns={["Settlement ID", "Provider", "Gross", "Fees", "Net", "Date", "Status"]}
              rows={(settlements || []).map(s => ({
                "Settlement ID": <code>{s.settlement_id}</code>,
                "Provider": s.provider,
                "Gross": fmt(s.gross_amount),
                "Fees": fmt(Number(s.gateway_fee || 0) + Number(s.gateway_fee_tax || 0)),
                "Net": <strong>{fmt(s.net_amount)}</strong>,
                "Date": fmtDate(s.settlement_date),
                "Status": badge(s.status)
              }))}
              t={t}
              emptyMsg="No gateway settlements recorded"
            />
          </Card>
        </div>
      )}

      {/* ── MODAL: RECORD PAYMENT / SETTLEMENT ─────────────────────────────── */}
      <Modal
        open={recordModal}
        onClose={() => { setRecordModal(false); setRecordForm(EMPTY_RECORD); }}
        title="Record Payment / Settle Balance"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setRecordModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitPaymentRecord} disabled={saving}>
              {saving ? "Processing…" : "Confirm Payment"}
            </BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Transaction Type *" t={t} half>
            <Select
              t={t}
              value={recordForm.type}
              onChange={(e) => setRecordForm(prev => ({ ...prev, type: e.target.value, customer_id: "", supplier_id: "" }))}
            >
              <option value="CUSTOMER_DUES">Customer Dues Collection (Inflow)</option>
              <option value="SUPPLIER_PAYMENT">Supplier Payout Settlement (Outflow)</option>
            </Select>
          </FormGroup>

          <FormGroup label="Payment Tender Mode *" t={t} half>
            <Select
              t={t}
              value={recordForm.payment_mode}
              onChange={(e) => setRecordForm(prev => ({ ...prev, payment_mode: e.target.value }))}
            >
              <option value="Cash">Cash Tender</option>
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Card">Card (POS Swipe / Tap)</option>
              <option value="NetBanking">NetBanking / NEFT / RTGS</option>
              <option value="Cheque">Bank Cheque / DD</option>
              <option value="Split">Split Multi-Tender</option>
            </Select>
          </FormGroup>

          {recordForm.type === "CUSTOMER_DUES" ? (
            <FormGroup label="Select Customer *" t={t}>
              <Select
                t={t}
                value={recordForm.customer_id}
                onChange={(e) => setRecordForm(prev => ({ ...prev, customer_id: e.target.value }))}
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone || "No Phone"}) · Due: ₹{Number(c.balance_due || 0).toLocaleString("en-IN")}
                  </option>
                ))}
              </Select>
            </FormGroup>
          ) : (
            <FormGroup label="Select Supplier *" t={t}>
              <Select
                t={t}
                value={recordForm.supplier_id}
                onChange={(e) => setRecordForm(prev => ({ ...prev, supplier_id: e.target.value }))}
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name} · Outstanding: ₹{Number(s.outstanding || 0).toLocaleString("en-IN")}
                  </option>
                ))}
              </Select>
            </FormGroup>
          )}

          {selectedCust && recordForm.type === "CUSTOMER_DUES" && (
            <div style={{ gridColumn: "span 2", background: t.card2, padding: "10px 14px", borderRadius: 8, border: `1px solid ${t.border}`, fontSize: 13 }}>
              Current Outstanding Balance Due: <strong style={{ color: "#e74c3c" }}>₹{Number(selectedCust.balance_due || 0).toLocaleString("en-IN")}</strong>
            </div>
          )}

          {selectedSup && recordForm.type === "SUPPLIER_PAYMENT" && (
            <div style={{ gridColumn: "span 2", background: t.card2, padding: "10px 14px", borderRadius: 8, border: `1px solid ${t.border}`, fontSize: 13 }}>
              Current Supplier Outstanding: <strong style={{ color: "#e74c3c" }}>₹{Number(selectedSup.outstanding || 0).toLocaleString("en-IN")}</strong>
            </div>
          )}

          <FormGroup label="Amount (₹) *" t={t} half>
            <Input
              t={t}
              type="number"
              placeholder="0.00"
              value={recordForm.amount}
              onChange={(e) => setRecordForm(prev => ({ ...prev, amount: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Reference / UTR / Cheque No." t={t} half>
            <Input
              t={t}
              placeholder="e.g. UTR12345678 or CHQ-0045"
              value={recordForm.reference_no}
              onChange={(e) => setRecordForm(prev => ({ ...prev, reference_no: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Remarks / Note" t={t}>
            <Input
              t={t}
              placeholder="e.g. Counter settlement for invoice clearance"
              value={recordForm.remark}
              onChange={(e) => setRecordForm(prev => ({ ...prev, remark: e.target.value }))}
            />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ── MODAL: EDIT MODE CONFIG ────────────────────────────────────────── */}
      {selectedMode && (
        <Modal
          open={editModeModal}
          onClose={() => setEditModeModal(false)}
          title={`Configure Tender — ${selectedMode.mode_name}`}
          t={t}
          footer={
            <>
              <BtnOutline t={t} onClick={() => setEditModeModal(false)}>Cancel</BtnOutline>
              <BtnPrimary onClick={saveModeConfig} disabled={saving}>
                {saving ? "Saving…" : "Save Configuration"}
              </BtnPrimary>
            </>
          }
        >
          <FormGrid>
            <FormGroup label="MDR / Processing Fee %" t={t} half>
              <Input
                t={t}
                type="number"
                step="0.01"
                value={selectedMode.mdr_pct}
                onChange={(e) => setSelectedMode(prev => ({ ...prev, mdr_pct: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="UPI VPA ID" t={t} half>
              <Input
                t={t}
                placeholder="e.g. storename@bank"
                value={selectedMode.vpa_id || ""}
                onChange={(e) => setSelectedMode(prev => ({ ...prev, vpa_id: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Bank Account / IFSC" t={t} half>
              <Input
                t={t}
                placeholder="e.g. 50200012345678 (HDFC0001)"
                value={selectedMode.account_no || ""}
                onChange={(e) => setSelectedMode(prev => ({ ...prev, account_no: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="POS Machine / Terminal ID" t={t} half>
              <Input
                t={t}
                placeholder="e.g. TID-987456"
                value={selectedMode.terminal_id || ""}
                onChange={(e) => setSelectedMode(prev => ({ ...prev, terminal_id: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Description" t={t}>
              <Input
                t={t}
                value={selectedMode.description || ""}
                onChange={(e) => setSelectedMode(prev => ({ ...prev, description: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Gateway Provider" t={t} half>
              <Select
                t={t}
                value={selectedMode.gateway_provider || ""}
                onChange={(e) => setSelectedMode(prev => ({ ...prev, gateway_provider: e.target.value }))}
              >
                <option value="">None</option>
                <option value="mock">Mock / Sandbox</option>
                <option value="razorpay">Razorpay</option>
              </Select>
            </FormGroup>

            <FormGroup label="Gateway Environment" t={t} half>
              <Select
                t={t}
                value={selectedMode.gateway_environment || "TEST"}
                onChange={(e) => setSelectedMode(prev => ({ ...prev, gateway_environment: e.target.value }))}
              >
                <option value="TEST">TEST</option>
                <option value="LIVE">LIVE</option>
              </Select>
            </FormGroup>

            <FormGroup label="Gateway Status" t={t} half>
              <Select
                t={t}
                value={selectedMode.gateway_status || "NOT_CONFIGURED"}
                onChange={(e) => setSelectedMode(prev => ({ ...prev, gateway_status: e.target.value }))}
              >
                <option value="NOT_CONFIGURED">Not Configured</option>
                <option value="CONFIGURED">Configured</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
                <option value="ERROR">Error</option>
              </Select>
            </FormGroup>

            <FormGroup label="Webhook Status" t={t} half>
              <Select
                t={t}
                value={selectedMode.webhook_status || "UNKNOWN"}
                onChange={(e) => setSelectedMode(prev => ({ ...prev, webhook_status: e.target.value }))}
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="HEALTHY">Healthy</option>
                <option value="FAILING">Failing</option>
              </Select>
            </FormGroup>
          </FormGrid>
        </Modal>
      )}
    </div>
  );
}
