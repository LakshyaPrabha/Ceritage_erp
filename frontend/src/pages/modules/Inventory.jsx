import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select } from "../../components/ui";

const API = window.__CERITAGE_API__ || "http://localhost:5000/api";
function authHeaders() {
  const token = localStorage.getItem("ceritage_token") || sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function fmt(n)     { return n != null ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0 }) : "₹0"; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }

const TABS = [
  { id: "live",      label: "Live Stock" },
  { id: "lowstock",  label: "Low Stock" },
  { id: "damaged",   label: "Damaged / Loss" },
  { id: "adj",       label: "Adjustment" },
  { id: "movement",  label: "Movement Log" },
];

const STATUS_COLOR = {
  "In Stock":     "#2ecc71",
  "Low Stock":    "#f39c12",
  "Out of Stock": "#e74c3c",
};

const EMPTY_ADJ = { product_id: "", adj_type: "Add", qty_change: 1, reason: "", adjusted_by: "" };

export default function Inventory({ t }) {
  const [tab, setTab] = useState("live");

  // data
  const [kpis,     setKpis]     = useState({});
  const [stock,    setStock]    = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [damaged,  setDamaged]  = useState([]);
  const [adjs,     setAdjs]     = useState([]);
  const [movement, setMovement] = useState([]);
  const [loading,  setLoading]  = useState(false);

  // filters
  const [search,   setSearch]   = useState("");
  const [catFilter,setCatFilter]= useState("");
  const [stsFilter,setStsFilter]= useState("");
  const [movType,  setMovType]  = useState("");

  // adj modal
  const [adjModal, setAdjModal] = useState(false);
  const [adjForm,  setAdjForm]  = useState(EMPTY_ADJ);
  const [saving,   setSaving]   = useState(false);
  const [products, setProducts] = useState([]);

  // ── helpers ──────────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const r = await fetch(`${API}/inventory/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data);
    } catch { /* silent */ }
  }, []);

  const loadStock = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: 200 });
      if (search)    q.set("search",   search);
      if (catFilter) q.set("category", catFilter);
      if (stsFilter) q.set("status",   stsFilter);
      const r = await fetch(`${API}/inventory/live?${q}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setStock(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [search, catFilter, stsFilter]);

  const loadLowStock = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/inventory/low-stock`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setLowStock(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const loadDamaged = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/inventory/damaged`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setDamaged(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const loadAdjs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/inventory/adjustments`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setAdjs(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  const loadMovement = useCallback(async () => {
    setLoading(true);
    try {
      const q = movType ? `?type=${movType}` : "";
      const r = await fetch(`${API}/inventory/movement${q}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setMovement(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [movType]);

  const loadProducts = useCallback(async () => {
    try {
      const r = await fetch(`${API}/products?limit=500`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setProducts(d.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadKpis(); }, [loadKpis]);

  useEffect(() => {
    if (tab === "live")     loadStock();
    if (tab === "lowstock") loadLowStock();
    if (tab === "damaged")  loadDamaged();
    if (tab === "adj")      loadAdjs();
    if (tab === "movement") loadMovement();
  }, [tab, loadStock, loadLowStock, loadDamaged, loadAdjs, loadMovement]);

  useEffect(() => { if (adjModal) loadProducts(); }, [adjModal, loadProducts]);

  // ── submit adjustment ─────────────────────────────────────────────────────────
  async function submitAdj() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/inventory/adjustments`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(adjForm),
      });
      const d = await r.json();
      if (d.success) {
        setAdjModal(false); setAdjForm(EMPTY_ADJ);
        loadAdjs(); loadKpis(); loadStock();
      } else alert(d.message || "Error");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  // ── table helpers ─────────────────────────────────────────────────────────────
  const TH = ({ children }) => (
    <th style={{ textAlign: "left", padding: "9px 12px", color: t.textMuted, fontWeight: 600,
      fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.borderDash}`,
      whiteSpace: "nowrap" }}>{children}</th>
  );
  const TD = ({ children, bold, color }) => (
    <td style={{ padding: "10px 12px", color: color || (bold ? t.text : t.textSub),
      fontWeight: bold ? 600 : 400 }}>{children ?? "—"}</td>
  );
  const badge = (s) => (
    <span style={{ background: STATUS_COLOR[s] || "#aaa", color: "#fff",
      borderRadius: 6, padding: "2px 9px", fontSize: 11 }}>{s}</span>
  );
  const inp = {
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 8, padding: "7px 10px", fontSize: 13,
    color: t.inputColor, outline: "none", fontFamily: "inherit",
  };

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Inventory Management"
        subtitle="Live Stock · Low Stock · Damaged · Adjustments · Movement Log"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={() => loadStock()}>Refresh</BtnOutline>
          <BtnPrimary onClick={() => setAdjModal(true)}>+ Stock Adjustment</BtnPrimary>
        </>} />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Total Items"     value={kpis.total_items || 0}        color={BRAND.blue}   t={t} />
        <StatCard label="Stock Valuation" value={fmt(kpis.stock_valuation)}    color="#2ecc71"      t={t} />
        <StatCard label="Low Stock"       value={kpis.low_stock || 0}          color="#f39c12"      t={t} />
        <StatCard label="Out of Stock"    value={kpis.out_of_stock || 0}       color="#e74c3c"      t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── LIVE STOCK ── */}
      {tab === "live" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input placeholder="Search SKU, name..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loadStock()}
              style={{ ...inp, width: 200 }} />
            <select style={{ ...inp, width: 160 }} value={catFilter} onChange={e => { setCatFilter(e.target.value); }}>
              <option value="">All Categories</option>
              <option>Gold Jewellery</option><option>Diamond Jewellery</option>
              <option>Silver Jewellery</option><option>Platinum Jewellery</option>
              <option>Gemstone Jewellery</option>
            </select>
            <select style={{ ...inp, width: 140 }} value={stsFilter} onChange={e => { setStsFilter(e.target.value); }}>
              <option value="">All Status</option>
              <option>In Stock</option><option>Low Stock</option><option>Out of Stock</option>
            </select>
            <BtnSm t={t} primary onClick={loadStock}>Search</BtnSm>
          </div>

          <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.borderDash}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.borderDash}`, fontWeight: 700, fontSize: 14, color: t.text }}>
              Live Stock — {stock.length} items
            </div>
            {stock.length === 0 && !loading
              ? <p style={{ textAlign: "center", padding: 40, color: t.textMuted }}>No stock found</p>
              : <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead><tr><TH>SKU</TH><TH>Item Name</TH><TH>Category</TH><TH>Purity</TH><TH>Gross Wt</TH><TH>Net Wt</TH><TH>Qty</TH><TH>Min Qty</TH><TH>MRP</TH><TH>Stock Value</TH><TH>HUID</TH><TH>Status</TH></tr></thead>
                    <tbody>
                      {stock.map(p => (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                          <TD bold>{p.sku}</TD>
                          <TD bold>{p.name}</TD>
                          <TD>{p.jewellery_category}</TD>
                          <TD>{p.purity}</TD>
                          <TD>{p.gross_weight}g</TD>
                          <TD>{p.net_weight}g</TD>
                          <TD bold color={p.stock_qty <= 0 ? "#e74c3c" : p.stock_qty <= p.min_stock ? "#f39c12" : "#2ecc71"}>{p.stock_qty}</TD>
                          <TD>{p.min_stock}</TD>
                          <TD>{fmt(p.mrp)}</TD>
                          <TD bold>{fmt(p.stock_value)}</TD>
                          <TD>{p.huid || "—"}</TD>
                          <td style={{ padding: "10px 12px" }}>{badge(p.stock_status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        </div>
      )}

      {/* ── LOW STOCK ── */}
      {tab === "lowstock" && (
        <div>
          <div style={{ background: "rgba(230,59,138,0.08)", border: "1px solid rgba(230,59,138,0.25)",
            borderRadius: 10, padding: "14px 18px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, color: t.text }}>⚠ Low Stock Alert</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>
                {lowStock.length} items need restocking
              </div>
            </div>
            <BtnPrimary onClick={() => setAdjModal(true)}>+ Adjust Stock</BtnPrimary>
          </div>
          <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.borderDash}`, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr><TH>SKU</TH><TH>Item Name</TH><TH>Category</TH><TH>Current Qty</TH><TH>Min Qty</TH><TH>Shortage</TH><TH>MRP</TH><TH>Status</TH></tr></thead>
              <tbody>
                {lowStock.length === 0
                  ? <tr><td colSpan={8} style={{ padding: 36, textAlign: "center", color: t.textMuted }}>All items are adequately stocked</td></tr>
                  : lowStock.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <TD bold>{p.sku}</TD>
                      <TD bold>{p.name}</TD>
                      <TD>{p.jewellery_category}</TD>
                      <TD bold color="#e74c3c">{p.stock_qty}</TD>
                      <TD>{p.min_stock}</TD>
                      <TD bold color={BRAND.pink}>{Math.max(0, p.min_stock - p.stock_qty)}</TD>
                      <TD>{fmt(p.selling_price)}</TD>
                      <td style={{ padding: "10px 12px" }}>{badge(p.stock_status)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DAMAGED / LOSS ── */}
      {tab === "damaged" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
            <StatCard label="Damage Records" value={damaged.filter(d => d.adj_type === "Damage").length} color={BRAND.pink}   t={t} />
            <StatCard label="Loss Records"   value={damaged.filter(d => d.adj_type === "Loss").length}   color="#e74c3c"      t={t} />
            <StatCard label="Total Value"    value={fmt(damaged.reduce((s, d) => s + parseFloat(d.value_lost || 0), 0))} color={BRAND.purple} t={t} />
          </div>
          <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.borderDash}`, overflowX: "auto" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.borderDash}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Damaged & Lost Stock Register</span>
              <BtnSm t={t} primary onClick={() => { setAdjForm({ ...EMPTY_ADJ, adj_type: "Damage" }); setAdjModal(true); }}>+ Report Damage</BtnSm>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr><TH>ID</TH><TH>SKU</TH><TH>Item</TH><TH>Type</TH><TH>Qty</TH><TH>Value Lost</TH><TH>Reason</TH><TH>By</TH><TH>Date</TH></tr></thead>
              <tbody>
                {damaged.length === 0
                  ? <tr><td colSpan={9} style={{ padding: 36, textAlign: "center", color: t.textMuted }}>No damage or loss records</td></tr>
                  : damaged.map(d => (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <TD>{d.id}</TD>
                      <TD bold>{d.sku}</TD>
                      <TD>{d.product_name}</TD>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: d.adj_type === "Damage" ? "rgba(230,59,138,0.15)" : "rgba(231,76,60,0.15)",
                          color: d.adj_type === "Damage" ? BRAND.pink : "#e74c3c",
                          borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>{d.adj_type}</span>
                      </td>
                      <TD bold color="#e74c3c">{Math.abs(d.qty_change)}</TD>
                      <TD bold color={BRAND.pink}>{fmt(d.value_lost)}</TD>
                      <TD>{d.reason}</TD>
                      <TD>{d.adjusted_by}</TD>
                      <TD>{fmtDate(d.created_at)}</TD>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADJUSTMENTS ── */}
      {tab === "adj" && (
        <div>
          <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.borderDash}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.borderDash}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Stock Adjustments</span>
              <BtnSm t={t} primary onClick={() => setAdjModal(true)}>+ New Adjustment</BtnSm>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr><TH>ID</TH><TH>SKU</TH><TH>Item</TH><TH>Type</TH><TH>Qty Change</TH><TH>Reason</TH><TH>Adjusted By</TH><TH>Date</TH></tr></thead>
                <tbody>
                  {adjs.length === 0
                    ? <tr><td colSpan={8} style={{ padding: 36, textAlign: "center", color: t.textMuted }}>No adjustments yet</td></tr>
                    : adjs.map(a => (
                      <tr key={a.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                        <TD>{a.id}</TD>
                        <TD bold>{a.sku}</TD>
                        <TD>{a.product_name}</TD>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: ["Add"].includes(a.adj_type) ? "rgba(46,204,113,0.15)" : "rgba(230,59,138,0.15)",
                            color: ["Add"].includes(a.adj_type) ? "#2ecc71" : BRAND.pink,
                            borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>{a.adj_type}</span>
                        </td>
                        <TD bold color={a.qty_change > 0 ? "#2ecc71" : BRAND.pink}>{a.qty_change > 0 ? `+${a.qty_change}` : a.qty_change}</TD>
                        <TD>{a.reason}</TD>
                        <TD>{a.adjusted_by}</TD>
                        <TD>{fmtDate(a.created_at)}</TD>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MOVEMENT LOG ── */}
      {tab === "movement" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <select style={{ ...inp, width: 160 }} value={movType} onChange={e => { setMovType(e.target.value); }}>
              <option value="">All Types</option>
              <option>Sale</option><option>Add</option><option>Remove</option>
              <option>Damage</option><option>Loss</option><option>Correction</option>
            </select>
          </div>
          <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.borderDash}`, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr><TH>Date</TH><TH>SKU</TH><TH>Item</TH><TH>Type</TH><TH>Qty Change</TH><TH>From</TH><TH>To</TH><TH>Reference</TH><TH>By</TH></tr></thead>
              <tbody>
                {movement.length === 0
                  ? <tr><td colSpan={9} style={{ padding: 36, textAlign: "center", color: t.textMuted }}>No movement records</td></tr>
                  : movement.map((m, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <TD>{fmtDate(m.date)}</TD>
                      <TD bold>{m.sku || "—"}</TD>
                      <TD>{m.item || "—"}</TD>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: m.move_type === "Sale" ? "rgba(59,85,230,0.15)" : m.qty_change < 0 ? "rgba(230,59,138,0.15)" : "rgba(46,204,113,0.15)",
                          color: m.move_type === "Sale" ? BRAND.blue : m.qty_change < 0 ? BRAND.pink : "#2ecc71",
                          borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>{m.move_type}</span>
                      </td>
                      <TD bold color={m.qty_change < 0 ? BRAND.pink : "#2ecc71"}>{m.qty_change > 0 ? `+${m.qty_change}` : m.qty_change}</TD>
                      <TD>{m.from_loc}</TD>
                      <TD>{m.to_loc}</TD>
                      <TD>{m.reference}</TD>
                      <TD>{m.by_user}</TD>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADJUSTMENT MODAL ── */}
      <Modal open={adjModal} onClose={() => { setAdjModal(false); setAdjForm(EMPTY_ADJ); }}
        title="Stock Adjustment" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setAdjModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={submitAdj} disabled={saving}>{saving ? "Saving…" : "Apply Adjustment"}</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Product *" t={t}>
            <Select t={t} value={adjForm.product_id} onChange={e => setAdjForm(p => ({ ...p, product_id: e.target.value }))}>
              <option value="">-- Select Product --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name} (Stock: {p.stock_qty})</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Adjustment Type *" t={t} half>
            <Select t={t} value={adjForm.adj_type} onChange={e => setAdjForm(p => ({ ...p, adj_type: e.target.value }))}>
              <option>Add</option>
              <option>Remove</option>
              <option>Damage</option>
              <option>Loss</option>
              <option>Correction</option>
            </Select>
          </FormGroup>
          <FormGroup label="Quantity *" t={t} half>
            <Input t={t} type="number" min="1" value={adjForm.qty_change}
              onChange={e => setAdjForm(p => ({ ...p, qty_change: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Reason *" t={t}>
            <Input t={t} value={adjForm.reason} placeholder="Why is this adjustment being made?"
              onChange={e => setAdjForm(p => ({ ...p, reason: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Adjusted By" t={t} half>
            <Input t={t} value={adjForm.adjusted_by} placeholder="Staff name"
              onChange={e => setAdjForm(p => ({ ...p, adjusted_by: e.target.value }))} />
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
