// ─── Ceritage ERP — Old Metal & Gold/Silver Exchange Valuation ──────────────
import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs,
  BtnPrimary, BtnOutline, BtnSm, FormGroup, FormGrid, Input, Select
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
  { id: "calc",    label: "Exchange Calculator" },
  { id: "list",    label: "Exchange Register" },
  { id: "purity",  label: "Purity Standards" },
  { id: "melt",    label: "Melting Loss Calculator" },
];

const PURITY_CHART = [
  { karat: "24K", fineness: "999", pct: "99.9%", factor: 0.999, use: "Coins, Bullion, Investment Bars" },
  { karat: "22K", fineness: "916", pct: "91.6%", factor: 0.9167, use: "Indian Hallmarked Jewellery (Standard)" },
  { karat: "18K", fineness: "750", pct: "75.0%", factor: 0.750, use: "Diamond Jewellery, Western Designs" },
  { karat: "14K", fineness: "585", pct: "58.5%", factor: 0.5833, use: "Export & Lightweight Jewellery" },
  { karat: "10K", fineness: "417", pct: "41.7%", factor: 0.417, use: "Fashion Jewellery" },
  { karat: "Silver 999", fineness: "999", pct: "99.9%", factor: 0.999, use: "Fine Silver Bars & Coins" },
  { karat: "Silver 925", fineness: "925", pct: "92.5%", factor: 0.925, use: "Sterling Silver Utensils & Ornaments" },
];

const fmt = (v) => "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function GoldExchange({ t }) {
  const [tab, setTab] = useState("calc");
  const [customers, setCustomers] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [kpis, setKpis] = useState({
    total_exchanges: 0,
    fine_gold_received: 0,
    fine_silver_received: 0,
    total_value_given: 0,
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  // Form State
  const [form, setForm] = useState({
    customer_id: "",
    metal_type: "Gold",
    item_description: "",
    gross_weight: "",
    stone_weight: "0",
    purity: "0.9167",
    rate: "",
    wastage_pct: "0",
    exchange_for: "New Purchase",
  });

  // Melting calculator state
  const [meltGross, setMeltGross] = useState("");
  const [meltPurity, setMeltPurity] = useState("0.9167");
  const [meltLossPct, setMeltLossPct] = useState("1.5");

  const notify = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Fetch Metal Rate
  const loadRates = useCallback(async () => {
    try {
      const res = await fetch(`${API}/metal-rates/current`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data?.gold_22k?.shop_rate) {
        setForm(prev => prev.rate ? prev : { ...prev, rate: String(json.data.gold_22k.shop_rate) });
      }
    } catch {
      // ignore
    }
  }, []);

  const loadKpis = useCallback(async () => {
    try {
      const res = await fetch(`${API}/gold-exchange/kpis`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data) setKpis(json.data);
    } catch {
      // ignore
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/customers?limit=200`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setCustomers(json.data);
    } catch {
      // ignore
    }
  }, []);

  const loadExchanges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/gold-exchange`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setExchanges(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
    loadKpis();
    loadCustomers();
    loadExchanges();
  }, [loadRates, loadKpis, loadCustomers, loadExchanges]);

  // Live Calculations
  const calculated = useMemo(() => {
    const gross = Number(form.gross_weight || 0);
    const stone = Number(form.stone_weight || 0);
    const net = Math.max(0, gross - stone);
    const purity = Number(form.purity || 0.9167);
    const fine = net * purity;
    const rate = Number(form.rate || 0);
    const base = fine * rate;
    const wastage = Number(form.wastage_pct || 0);
    const deduction = base * (wastage / 100);
    const finalVal = Math.max(0, base - deduction);

    return {
      net_weight: net.toFixed(3),
      fine_weight: fine.toFixed(3),
      base_value: base,
      deduction,
      final_value: finalVal,
      purity_pct: (purity * 100).toFixed(2) + "%",
    };
  }, [form]);

  // Submit Exchange
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.gross_weight || Number(form.gross_weight) <= 0 || !form.rate || Number(form.rate) <= 0) {
      alert("Gross weight and rate per gram are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/gold-exchange`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          gross_weight: Number(form.gross_weight),
          stone_weight: Number(form.stone_weight || 0),
          rate: Number(form.rate),
          wastage_pct: Number(form.wastage_pct || 0),
        })
      });
      const json = await res.json();
      if (json.success) {
        notify(`Exchange registered! Valuation: ${fmt(calculated.final_value)}`);
        setForm(prev => ({
          ...prev,
          item_description: "",
          gross_weight: "",
          stone_weight: "0",
          wastage_pct: "0",
        }));
        loadExchanges();
        loadKpis();
      } else {
        alert(json.message || "Failed to record exchange");
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
        title="Old Gold & Silver Exchange Valuation"
        subtitle="Customer Old Metal · Hallmarking & Touch Valuation · Instant Credit / Cash Out"
        t={t}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <BtnOutline t={t} onClick={() => setTab("melt")}>Melting Calculator</BtnOutline>
            <BtnPrimary onClick={() => setTab("calc")}>+ New Exchange Valuation</BtnPrimary>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Exchanges"      value={kpis.total_exchanges || 0} color={BRAND.blue} t={t} />
        <StatCard label="Fine Gold Inward"     value={Number(kpis.fine_gold_received || 0).toFixed(3) + "g"} color="#f0c040" t={t} />
        <StatCard label="Fine Silver Inward"   value={Number(kpis.fine_silver_received || 0).toFixed(3) + "g"} color="#95a5a6" t={t} />
        <StatCard label="Total Valuation Given" value={fmt(kpis.total_value_given)} color="#2ecc71" t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* TAB 1: CALCULATOR & ENTRY */}
      {tab === "calc" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
          <Card t={t}>
            <CardHeader title="Exchange Entry Form" t={t} />
            <form onSubmit={handleSubmit}>
              <FormGrid>
                <FormGroup label="Customer (Optional)" t={t}>
                  <Select t={t} value={form.customer_id} onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}>
                    <option value="">Walk-in Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>)}
                  </Select>
                </FormGroup>
                <FormGroup label="Metal Type" t={t} half>
                  <Select t={t} value={form.metal_type} onChange={e => setForm(p => ({ ...p, metal_type: e.target.value }))}>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Platinum">Platinum</option>
                  </Select>
                </FormGroup>
                <FormGroup label="Purity Factor *" t={t} half>
                  <Select t={t} value={form.purity} onChange={e => setForm(p => ({ ...p, purity: e.target.value }))}>
                    <option value="0.9167">22K (91.67%)</option>
                    <option value="0.999">24K (99.9%)</option>
                    <option value="0.75">18K (75.0%)</option>
                    <option value="0.5833">14K (58.33%)</option>
                    <option value="0.925">Silver 925 (92.5%)</option>
                  </Select>
                </FormGroup>
                <FormGroup label="Old Jewellery Description" t={t}>
                  <Input t={t} placeholder="e.g. Broken antique chain and 2 pairs earrings" value={form.item_description} onChange={e => setForm(p => ({ ...p, item_description: e.target.value }))} />
                </FormGroup>
                <FormGroup label="Gross Weight (g) *" t={t} half>
                  <Input t={t} type="number" step="0.001" placeholder="e.g. 15.500" value={form.gross_weight} onChange={e => setForm(p => ({ ...p, gross_weight: e.target.value }))} required />
                </FormGroup>
                <FormGroup label="Stone / Enamel Deduction (g)" t={t} half>
                  <Input t={t} type="number" step="0.001" placeholder="e.g. 0.500" value={form.stone_weight} onChange={e => setForm(p => ({ ...p, stone_weight: e.target.value }))} />
                </FormGroup>
                <FormGroup label="Current Rate per Gram (₹) *" t={t} half>
                  <Input t={t} type="number" step="0.01" placeholder="e.g. 7450" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} required />
                </FormGroup>
                <FormGroup label="Melting / Wastage Deduction (%)" t={t} half>
                  <Input t={t} type="number" step="0.1" placeholder="e.g. 2.0" value={form.wastage_pct} onChange={e => setForm(p => ({ ...p, wastage_pct: e.target.value }))} />
                </FormGroup>
                <FormGroup label="Exchange Settlement For" t={t}>
                  <Select t={t} value={form.exchange_for} onChange={e => setForm(p => ({ ...p, exchange_for: e.target.value }))}>
                    <option value="New Purchase">Adjust in New Invoice / Purchase</option>
                    <option value="Cash Payout">Cash Payout to Customer</option>
                    <option value="Store Credit">Store Credit / Customer Ledger</option>
                  </Select>
                </FormGroup>
              </FormGrid>
              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <BtnPrimary type="submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? "Recording..." : "Confirm & Issue Exchange Voucher"}
                </BtnPrimary>
              </div>
            </form>
          </Card>

          {/* Live Valuation Card */}
          <Card t={t}>
            <CardHeader title="Real-Time Metal Valuation" t={t} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: t.subtext, marginBottom: 4, textTransform: "uppercase" }}>Net Metal Weight</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: t.text }}>{calculated.net_weight}g</div>
              </div>
              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: t.subtext, marginBottom: 4, textTransform: "uppercase" }}>Fine Metal (24K Equiv)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#f0c040" }}>{calculated.fine_weight}g</div>
              </div>
              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: t.subtext, marginBottom: 4, textTransform: "uppercase" }}>Tested Purity</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: BRAND.blue }}>{calculated.purity_pct}</div>
              </div>
              <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: t.subtext, marginBottom: 4, textTransform: "uppercase" }}>Base Valuation</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: t.text }}>{fmt(calculated.base_value)}</div>
              </div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, rgba(59,85,230,0.12) 0%, rgba(139,59,200,0.12) 100%)",
              border: `1px solid ${BRAND.purple}`,
              borderRadius: 12,
              padding: 24,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.subtext, textTransform: "uppercase", letterSpacing: 1 }}>Final Exchange Credit</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: BRAND.purple, margin: "8px 0" }}>
                {fmt(calculated.final_value)}
              </div>
              <div style={{ fontSize: 12, color: "#2ecc71", fontWeight: 600 }}>
                {calculated.deduction > 0 ? `After deduction of ${fmt(calculated.deduction)} (${form.wastage_pct}%)` : "No melting deductions applied"}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: REGISTER */}
      {tab === "list" && (
        <Card t={t}>
          <CardHeader title="Old Gold Exchange History" t={t} />
          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading exchange register...</p>
          ) : exchanges.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No old gold exchanges recorded yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["ID", "Date", "Customer", "Metal", "Gross Wt", "Stone Wt", "Net Wt", "Fine Wt", "Rate/g", "Total Value", "Exchange Mode"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exchanges.map(x => (
                    <tr key={x.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "11px 12px", fontFamily: "monospace", color: BRAND.blue }}>#{x.id}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(x.created_at)}</td>
                      <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{x.customer_name || "Walk-in"}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{x.metal_type}</td>
                      <td style={{ padding: "11px 12px", color: t.text }}>{x.gross_weight}g</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{x.stone_weight || x.dust_stone_weight || 0}g</td>
                      <td style={{ padding: "11px 12px", color: t.text, fontWeight: 600 }}>{x.net_weight}g</td>
                      <td style={{ padding: "11px 12px", color: "#f0c040", fontWeight: 700 }}>{x.fine_weight ? `${x.fine_weight}g` : "—"}</td>
                      <td style={{ padding: "11px 12px", color: t.subtext }}>{fmt(x.rate)}</td>
                      <td style={{ padding: "11px 12px", color: "#2ecc71", fontWeight: 700 }}>{fmt(x.final_value || x.valuation_amount)}</td>
                      <td style={{ padding: "11px 12px", color: t.text }}>{x.exchange_for || "New Purchase"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: PURITY STANDARDS */}
      {tab === "purity" && (
        <Card t={t}>
          <CardHeader title="Official BIS & International Hallmarking Standards" t={t} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["Karat / Grade", "Fineness (Parts per 1000)", "Purity Percentage", "Conversion Factor", "Primary Applications"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 14px", color: t.subtext, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PURITY_CHART.map(p => (
                  <tr key={p.karat} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: BRAND.blue }}>{p.karat}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace" }}>{p.fineness}</td>
                    <td style={{ padding: "12px 14px", color: "#f0c040", fontWeight: 600 }}>{p.pct}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", color: t.subtext }}>{p.factor}</td>
                    <td style={{ padding: "12px 14px", color: t.text }}>{p.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: MELTING LOSS CALCULATOR */}
      {tab === "melt" && (
        <Card t={t} style={{ maxWidth: 650 }}>
          <CardHeader title="Crucible Melting & Refining Loss Calculator" t={t} />
          <FormGrid>
            <FormGroup label="Total Scrap Gross Weight (g)" t={t} half>
              <Input t={t} type="number" step="0.001" placeholder="e.g. 100.000" value={meltGross} onChange={e => setMeltGross(e.target.value)} />
            </FormGroup>
            <FormGroup label="Estimated Touch / Purity" t={t} half>
              <Select t={t} value={meltPurity} onChange={e => setMeltPurity(e.target.value)}>
                <option value="0.9167">22K (91.67%)</option>
                <option value="0.750">18K (75.0%)</option>
                <option value="0.5833">14K (58.33%)</option>
                <option value="0.999">24K (99.9%)</option>
              </Select>
            </FormGroup>
            <FormGroup label="Expected Furnace Loss (%)" t={t} half>
              <Input t={t} type="number" step="0.1" value={meltLossPct} onChange={e => setMeltLossPct(e.target.value)} />
            </FormGroup>
          </FormGrid>
          {meltGross && Number(meltGross) > 0 && (
            <div style={{ marginTop: 20, padding: 18, background: t.card, border: `1px solid ${t.border}`, borderRadius: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: t.subtext }}>Estimated Loss (g)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#e74c3c" }}>
                    {(Number(meltGross) * (Number(meltLossPct) / 100)).toFixed(3)}g
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: t.subtext }}>Expected Post-Melt Bar</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>
                    {(Number(meltGross) * (1 - Number(meltLossPct) / 100)).toFixed(3)}g
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: t.subtext }}>Fine 24K Pure Gold Yield</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f0c040" }}>
                    {(Number(meltGross) * (1 - Number(meltLossPct) / 100) * Number(meltPurity)).toFixed(3)}g
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
