import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, CardHeader, StatCard,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const API = window.__CERITAGE_API__ || "http://localhost:5000/api";
function authHeaders() {
  const token = localStorage.getItem("ceritage_token") || sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function fmt(n)     { return n != null ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "₹0.00"; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }

const EMPTY_FORM = {
  order_id: "", customer_id: "", customer_name: "",
  item_description: "", locked_rate: "", lock_date: "",
  valid_till: "", advance_paid: "", weight_g: "", notes: "",
};

const STATUS_COLOR = {
  Active:    "#2ecc71",
  Expired:   "#f39c12",
  Redeemed:  BRAND.blue,
  Cancelled: "#e74c3c",
};

export default function Advance({ t }) {
  const [kpis,      setKpis]      = useState({});
  const [locks,     setLocks]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [statusF,   setStatusF]   = useState("");

  // ── loaders ───────────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const r = await fetch(`${API}/advance/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data);
    } catch { /* silent */ }
  }, []);

  const loadLocks = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusF ? `?status=${statusF}` : "";
      const r = await fetch(`${API}/advance${q}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setLocks(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [statusF]);

  const loadCustomers = useCallback(async () => {
    try {
      const r = await fetch(`${API}/customers?limit=500`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setCustomers(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const r = await fetch(`${API}/sales/orders/pending`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setOrders(d.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadKpis(); loadLocks(); }, [loadKpis, loadLocks]);
  useEffect(() => { if (modal) { loadCustomers(); loadOrders(); } }, [modal, loadCustomers, loadOrders]);

  // ── create rate lock ──────────────────────────────────────────────────────────
  async function submitLock() {
    if (!form.locked_rate || !form.lock_date) {
      return alert("Locked Rate and Lock Date are required");
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/advance`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.success) {
        setModal(false); setForm(EMPTY_FORM);
        loadKpis(); loadLocks();
      } else alert(d.message || "Error creating rate lock");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  // ── update status ─────────────────────────────────────────────────────────────
  async function updateStatus(id, status) {
    if (!window.confirm(`Mark this lock as ${status}?`)) return;
    try {
      await fetch(`${API}/advance/${id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify({ status }),
      });
      loadLocks(); loadKpis();
    } catch { /* silent */ }
  }

  // ── live calc ─────────────────────────────────────────────────────────────────
  const lockedValue = ((parseFloat(form.weight_g) || 0) * (parseFloat(form.locked_rate) || 0)).toFixed(2);
  const currentRate = kpis.current_rate_22k;
  const plPerGram   = currentRate && form.locked_rate
    ? (parseFloat(currentRate) - parseFloat(form.locked_rate)).toFixed(2)
    : null;

  const inp = {
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 8, padding: "7px 10px", fontSize: 13,
    color: t.inputColor, outline: "none", fontFamily: "inherit",
  };

  const TH = ({ c }) => (
    <th style={{ textAlign: "left", padding: "9px 12px", color: t.textMuted, fontWeight: 600,
      fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.borderDash}`,
      whiteSpace: "nowrap" }}>{c}</th>
  );
  const TD = ({ v, bold, color }) => (
    <td style={{ padding: "10px 12px", color: color || (bold ? t.text : t.textSub),
      fontWeight: bold ? 600 : 400 }}>{v ?? "—"}</td>
  );

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Gold Rate Locking Engine"
        subtitle="Lock gold rates for advance orders — protect customer & shop from price fluctuation"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={() => loadLocks()}>Refresh</BtnOutline>
          <BtnPrimary onClick={() => setModal(true)}>Lock Rate for Order</BtnPrimary>
        </>} />

      {/* Current Rate Banner */}
      <div style={{ background: `linear-gradient(135deg,${BRAND.blue}15,${BRAND.purple}10)`,
        border: `1px solid ${t.borderDash}`, borderRadius: 12, padding: "18px 24px",
        marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Current 22K Rate (Live)</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: BRAND.blue }}>
            {currentRate ? fmt(currentRate) + "/g" : "—"}
          </div>
        </div>
        <div style={{ fontSize: 12, color: t.textSub, maxWidth: 300, textAlign: "right", lineHeight: 1.8 }}>
          Rate locking ensures customers pay <strong>today's rate</strong> on future delivery.<br />
          Shop is protected from gold price rise between booking and delivery.
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Active Rate Locks" value={kpis.active_locks || 0}            color={BRAND.blue}   t={t} />
        <StatCard label="Total Orders"      value={kpis.total_orders || 0}            color={BRAND.purple} t={t} />
        <StatCard label="Locked Value"      value={fmt(kpis.locked_value)}            color="#f0c040"      t={t} />
        <StatCard label="Advance Collected" value={fmt(kpis.advance_collected)}       color="#2ecc71"      t={t} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <select style={{ ...inp, width: 160 }} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Status</option>
          <option>Active</option><option>Expired</option><option>Redeemed</option><option>Cancelled</option>
        </select>
        <BtnSm t={t} primary onClick={loadLocks}>Filter</BtnSm>
      </div>

      {/* Rate Lock Register */}
      <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.borderDash}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.borderDash}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Rate Lock Register</span>
          <BtnSm t={t} primary onClick={() => setModal(true)}>+ New Lock</BtnSm>
        </div>
        {locks.length === 0 && !loading
          ? <p style={{ padding: 40, textAlign: "center", color: t.textMuted }}>No rate locks yet — create one with "+ Lock Rate for Order"</p>
          : <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>
                  {["Order Ref","Customer","Item","Locked Rate","Current Rate","P&L/g","Wt (g)","Locked Value","Advance","Lock Date","Valid Till","Status","Actions"].map(c => <TH key={c} c={c} />)}
                </tr></thead>
                <tbody>
                  {locks.map(lock => {
                    const pl = parseFloat(lock.pl_per_gram || 0);
                    return (
                      <tr key={lock.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                        <TD v={lock.order_id || `RL-${lock.id}`} bold />
                        <TD v={lock.customer_name || lock.customer_full_name || "—"} />
                        <TD v={lock.item_description} />
                        <TD v={fmt(lock.locked_rate)} bold color={BRAND.blue} />
                        <TD v={lock.current_rate ? fmt(lock.current_rate) : "—"} />
                        <td style={{ padding: "10px 12px" }}>
                          {lock.pl_per_gram !== "—"
                            ? <span style={{ color: pl >= 0 ? "#e74c3c" : "#2ecc71", fontWeight: 700 }}>
                                {pl >= 0 ? `▲ ₹${pl}` : `▼ ₹${Math.abs(pl)}`}
                              </span>
                            : <span style={{ color: t.textMuted }}>—</span>
                          }
                        </td>
                        <TD v={lock.weight_g} />
                        <TD v={fmt(lock.locked_value)} bold />
                        <TD v={fmt(lock.advance_paid)} color="#2ecc71" />
                        <TD v={fmtDate(lock.lock_date)} />
                        <TD v={fmtDate(lock.valid_till)}
                          color={lock.status === "Active" && lock.valid_till && new Date(lock.valid_till) < new Date() ? "#e74c3c" : undefined} />
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: `${STATUS_COLOR[lock.status]}22`,
                            color: STATUS_COLOR[lock.status],
                            border: `1px solid ${STATUS_COLOR[lock.status]}44`,
                            borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                            {lock.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {lock.status === "Active" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <BtnSm t={t} onClick={() => updateStatus(lock.id, "Redeemed")}>Redeem</BtnSm>
                              <BtnSm t={t} onClick={() => updateStatus(lock.id, "Cancelled")}>Cancel</BtnSm>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* ── RATE LOCK MODAL ── */}
      <Modal open={modal} onClose={() => { setModal(false); setForm(EMPTY_FORM); }}
        title="Lock Gold Rate for Order" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={submitLock} disabled={saving}>{saving ? "Saving…" : "Lock Rate"}</BtnPrimary>
        </>}>

        <FormGrid>
          <FormGroup label="Order Reference" t={t} half>
            <Select t={t} value={form.order_id}
              onChange={e => {
                const ord = orders.find(o => o.order_id === e.target.value);
                setForm(p => ({
                  ...p, order_id: e.target.value,
                  item_description: ord?.item_description || p.item_description,
                  customer_name: ord?.customer_name || p.customer_name,
                }));
              }}>
              <option value="">-- Link to Order (optional) --</option>
              {orders.map(o => <option key={o.id} value={o.order_id}>{o.order_id} — {o.customer_name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Customer *" t={t} half>
            <Select t={t} value={form.customer_id}
              onChange={e => {
                const cust = customers.find(c => String(c.id) === e.target.value);
                setForm(p => ({ ...p, customer_id: e.target.value, customer_name: cust?.full_name || "" }));
              }}>
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Item Description *" t={t}>
            <Input t={t} value={form.item_description} placeholder="e.g. Gold Necklace 22K 25g"
              onChange={e => setForm(p => ({ ...p, item_description: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Rate to Lock (₹/g) *" t={t} half>
            <Input t={t} type="number" value={form.locked_rate}
              placeholder={currentRate ? `Market: ${currentRate}` : "Enter rate"}
              onChange={e => setForm(p => ({ ...p, locked_rate: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Weight (g)" t={t} half>
            <Input t={t} type="number" step="0.001" value={form.weight_g}
              onChange={e => setForm(p => ({ ...p, weight_g: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Lock Date *" t={t} half>
            <Input t={t} type="date" value={form.lock_date}
              onChange={e => setForm(p => ({ ...p, lock_date: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Valid Till" t={t} half>
            <Input t={t} type="date" value={form.valid_till}
              onChange={e => setForm(p => ({ ...p, valid_till: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Advance Paid (₹)" t={t} half>
            <Input t={t} type="number" value={form.advance_paid}
              placeholder="Min 25% recommended"
              onChange={e => setForm(p => ({ ...p, advance_paid: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Notes" t={t} half>
            <Input t={t} value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </FormGroup>
        </FormGrid>

        {/* Live preview */}
        {(form.locked_rate || form.weight_g) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14,
            background: t.rowHover || t.card, borderRadius: 8, padding: 14, border: `1px solid ${t.borderDash}` }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: t.textMuted }}>Locked Value</div>
              <div style={{ fontWeight: 800, color: BRAND.blue, fontSize: 16 }}>{fmt(lockedValue)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: t.textMuted }}>Market Now</div>
              <div style={{ fontWeight: 700, color: t.text }}>{currentRate ? fmt(currentRate) + "/g" : "—"}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: t.textMuted }}>P&L per gram</div>
              <div style={{ fontWeight: 800, fontSize: 16,
                color: plPerGram == null ? t.textMuted : parseFloat(plPerGram) >= 0 ? "#e74c3c" : "#2ecc71" }}>
                {plPerGram != null ? (parseFloat(plPerGram) >= 0 ? `▲ ₹${plPerGram}` : `▼ ₹${Math.abs(plPerGram)}`) : "—"}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
