// ─── Ceritage ERP — Gold & Silver Rates ──────────────────────────────────────
import { BRAND } from "../../theme.js";
import { useState, useEffect } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
  BtnPrimary, BtnOutline, FormGroup, FormGrid, Input, Select, SectionTitle,
} from "../../components/ui";

const API = window.__CERITAGE_API__ || "/api";
function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const TABS = [
  { id: "manual",  label: "Update Rates" },
  { id: "history", label: "Rate History" },
  { id: "calc",    label: "Calculator" },
];

const EMPTY_RATES = {
  rate_22k: "", rate_24k: "", rate_18k: "", rate_14k: "",
  silver_rate: "", platinum_rate: "", usd_inr: "",
  effective_date: new Date().toISOString().split("T")[0],
  remarks: "",
};

// ── Purity multipliers ────────────────────────────────────────────────────────
const PURITY = {
  "24K (999)":  0.999,
  "22K (916)":  0.9167,
  "18K (750)":  0.75,
  "14K (583)":  0.583,
  "Silver 999": 1.0,
  "Silver 925": 0.925,
  "Silver 800": 0.80,
};

export default function Rates({ t }) {
  const [tab,          setTab]          = useState("manual");
  const [current,      setCurrent]      = useState(null);
  const [history,      setHistory]      = useState([]);
  const [historyDays,  setHistoryDays]  = useState("30");
  const [histLoading,  setHistLoading]  = useState(false);

  // Rate form
  const [form,         setForm]         = useState(EMPTY_RATES);
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState("");
  const [saveError,    setSaveError]    = useState("");

  // Calculator
  const [calcWeight,   setCalcWeight]   = useState("");
  const [calcPurity,   setCalcPurity]   = useState("22K (916)");
  const [calcMaking,   setCalcMaking]   = useState("");
  const [calcStone,    setCalcStone]    = useState("");

  // ── Fetch ────────────────────────────────────────────────────────────────
  async function fetchCurrent() {
    try {
      const r = await fetch(`${API}/rates/current`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success && d.data) {
        setCurrent(d.data);
        // Pre-fill form with latest rates
        setForm(prev => ({
          ...prev,
          rate_22k:      d.data.rate_22k      || "",
          rate_24k:      d.data.rate_24k      || "",
          rate_18k:      d.data.rate_18k      || "",
          rate_14k:      d.data.rate_14k      || "",
          silver_rate:   d.data.silver_rate   || "",
          platinum_rate: d.data.platinum_rate || "",
          usd_inr:       d.data.usd_inr       || "",
          effective_date: new Date().toISOString().split("T")[0],
        }));
      }
    } catch {}
  }

  async function fetchHistory() {
    setHistLoading(true);
    try {
      const r = await fetch(`${API}/rates/history?days=${historyDays}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setHistory(d.data || []);
    } catch {}
    setHistLoading(false);
  }

  useEffect(() => { fetchCurrent(); }, []); // eslint-disable-line
  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab, historyDays]); // eslint-disable-line

  // ── Save rates ────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.rate_22k || !form.rate_24k) {
      setSaveError("22K and 24K gold rates are required."); return;
    }
    setSaving(true); setSaveMsg(""); setSaveError("");
    try {
      const r = await fetch(`${API}/rates`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.success) {
        setSaveMsg("Rates updated successfully!");
        fetchCurrent();
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        setSaveError(d.message || "Failed to update rates.");
      }
    } catch { setSaveError("Cannot connect to server."); }
    setSaving(false);
  }

  // ── Calculator ────────────────────────────────────────────────────────────
  function calcGoldValue() {
    const w  = parseFloat(calcWeight)  || 0;
    const pu = PURITY[calcPurity]      || 0.9167;
    const r  = current ? (calcPurity.includes("Silver")
      ? parseFloat(current.silver_rate || 0)
      : parseFloat(current.rate_22k || 0) * pu / 0.9167)
      : 0;
    const making = parseFloat(calcMaking) || 0;
    const stone  = parseFloat(calcStone)  || 0;
    const metal  = w * r;
    const total  = metal + making + stone;
    const gst    = total * 0.03;
    return { metal, making, stone, gst, total: total + gst };
  }

  const calc = calcGoldValue();

  // ── Rate card helper ──────────────────────────────────────────────────────
  const fmt = v => v ? `Rs.${parseFloat(v).toLocaleString("en-IN")}` : "—";

  const METAL_CARDS = current ? [
    { label: "22K Gold /g",   value: fmt(current.rate_22k),      color: BRAND.blue   },
    { label: "24K Gold /g",   value: fmt(current.rate_24k),      color: BRAND.purple },
    { label: "18K Gold /g",   value: fmt(current.rate_18k),      color: "#3498db"    },
    { label: "14K Gold /g",   value: fmt(current.rate_14k),      color: BRAND.pink   },
    { label: "Silver /g",     value: fmt(current.silver_rate),   color: "#95a5a6"    },
    { label: "Platinum /g",   value: fmt(current.platinum_rate), color: "#bdc3c7"    },
    { label: "USD / INR",     value: fmt(current.usd_inr),       color: "#2ecc71"    },
  ] : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Daily Gold & Silver Rates"
        subtitle="Update rates | Rate history | Gold calculator"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={fetchCurrent}>Refresh</BtnOutline>
          <BtnPrimary onClick={handleSave} disabled={saving}>
            {saving ? "Updating..." : "Update All Rates"}
          </BtnPrimary>
        </>} />

      {/* Current Rate Cards */}
      {current ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 8 }}>
            {METAL_CARDS.map(m => (
              <div key={m.label} style={{ background: t.card, border: `1px solid ${t.borderDash}`, borderTop: `3px solid ${m.color}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 5 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: t.textMuted }}>
            Last updated: <strong style={{ color: BRAND.purple }}>
              {current.effective_date ? new Date(current.effective_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </strong>
            {current.updated_by && <span> by {current.updated_by}</span>}
            {current.remarks && <span style={{ color: t.textFaint }}> | {current.remarks}</span>}
          </div>
        </div>
      ) : (
        <div style={{ background: `rgba(59,85,230,0.06)`, border: `1px solid rgba(59,85,230,0.15)`, borderRadius: 10, padding: "14px 18px", marginBottom: 16, fontSize: 13, color: t.textSub }}>
          No rates entered yet. Use the Update Rates tab to add today's rates.
        </div>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── MANUAL UPDATE ── */}
      {tab === "manual" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card t={t} style={{ marginBottom: 0 }}>
            <CardHeader title="Gold Rates" t={t} />
            <FormGrid>
              <FormGroup label="22K Gold (Rs./g) *" t={t} half>
                <Input t={t} type="number" step="0.01" placeholder="e.g. 7100"
                  value={form.rate_22k} onChange={e => setForm(p => ({ ...p, rate_22k: e.target.value }))} />
              </FormGroup>
              <FormGroup label="24K Gold (Rs./g) *" t={t} half>
                <Input t={t} type="number" step="0.01" placeholder="e.g. 7750"
                  value={form.rate_24k} onChange={e => setForm(p => ({ ...p, rate_24k: e.target.value }))} />
              </FormGroup>
              <FormGroup label="18K Gold (Rs./g)" t={t} half>
                <Input t={t} type="number" step="0.01" placeholder="e.g. 5800"
                  value={form.rate_18k} onChange={e => setForm(p => ({ ...p, rate_18k: e.target.value }))} />
                <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>Auto: 24K x 0.75</div>
              </FormGroup>
              <FormGroup label="14K Gold (Rs./g)" t={t} half>
                <Input t={t} type="number" step="0.01" placeholder="e.g. 4500"
                  value={form.rate_14k} onChange={e => setForm(p => ({ ...p, rate_14k: e.target.value }))} />
              </FormGroup>
              <FormGroup label="Silver (Rs./g)" t={t} half>
                <Input t={t} type="number" step="0.01" placeholder="e.g. 90"
                  value={form.silver_rate} onChange={e => setForm(p => ({ ...p, silver_rate: e.target.value }))} />
              </FormGroup>
              <FormGroup label="Platinum (Rs./g)" t={t} half>
                <Input t={t} type="number" step="0.01" placeholder="e.g. 3200"
                  value={form.platinum_rate} onChange={e => setForm(p => ({ ...p, platinum_rate: e.target.value }))} />
              </FormGroup>
            </FormGrid>
          </Card>

          <Card t={t} style={{ marginBottom: 0 }}>
            <CardHeader title="Other Details" t={t} />
            <FormGrid>
              <FormGroup label="USD / INR" t={t} half>
                <Input t={t} type="number" step="0.01" placeholder="e.g. 84.50"
                  value={form.usd_inr} onChange={e => setForm(p => ({ ...p, usd_inr: e.target.value }))} />
              </FormGroup>
              <FormGroup label="Effective Date *" t={t} half>
                <Input t={t} type="date" value={form.effective_date}
                  onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))} />
              </FormGroup>
              <FormGroup label="Source / Remarks" t={t}>
                <Input t={t} placeholder="e.g. IBJA | MCX | RBI" value={form.remarks}
                  onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
              </FormGroup>
            </FormGrid>

            {/* Auto-calculate helper */}
            {form.rate_24k && (
              <div style={{ background: `rgba(59,85,230,0.06)`, border: `1px solid rgba(59,85,230,0.15)`, borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.blue, marginBottom: 6 }}>Auto-calculated from 24K rate:</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 12, color: t.textSub }}>
                  <span>22K = Rs.{(parseFloat(form.rate_24k) * 0.9167).toFixed(2)}/g</span>
                  <span>18K = Rs.{(parseFloat(form.rate_24k) * 0.75).toFixed(2)}/g</span>
                  <span>14K = Rs.{(parseFloat(form.rate_24k) * 0.583).toFixed(2)}/g</span>
                </div>
                <button
                  onClick={() => setForm(p => ({
                    ...p,
                    rate_22k: (parseFloat(p.rate_24k) * 0.9167).toFixed(2),
                    rate_18k: (parseFloat(p.rate_24k) * 0.75).toFixed(2),
                    rate_14k: (parseFloat(p.rate_24k) * 0.583).toFixed(2),
                  }))}
                  style={{ marginTop: 8, background: "none", border: `1px solid ${BRAND.blue}`, borderRadius: 6, color: BRAND.blue, fontSize: 11, fontWeight: 600, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                  Apply Auto Values
                </button>
              </div>
            )}

            {saveMsg && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(46,204,113,0.12)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 8, color: "#2ecc71", fontSize: 13 }}>
                {saveMsg}
              </div>
            )}
            {saveError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(230,59,138,0.1)", border: "1px solid rgba(230,59,138,0.3)", borderRadius: 8, color: BRAND.pink, fontSize: 13 }}>
                {saveError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <BtnOutline t={t} onClick={() => setForm(EMPTY_RATES)}>Reset</BtnOutline>
              <BtnPrimary onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                {saving ? "Updating..." : "Update All Rates"}
              </BtnPrimary>
            </div>
          </Card>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === "history" && (
        <Card t={t}>
          <CardHeader title="Rate History" t={t}
            actions={
              <div style={{ display: "flex", gap: 6 }}>
                {["7", "30", "90"].map(d => (
                  <button key={d} onClick={() => setHistoryDays(d)}
                    style={{
                      background: historyDays === d ? BRAND.gradBtn : "transparent",
                      border: historyDays === d ? "none" : `1px solid ${t.borderDash}`,
                      color: historyDays === d ? "#fff" : t.textSub,
                      borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    {d}D
                  </button>
                ))}
              </div>
            } />
          {histLoading ? (
            <div style={{ textAlign: "center", padding: 32, color: t.textFaint }}>Loading...</div>
          ) : (
            <DataTable
              columns={["Date", "22K (Rs./g)", "24K (Rs./g)", "18K", "Silver", "Platinum", "USD/INR", "Updated By", "Source"]}
              rows={history.map(r => ({
                "Date":        new Date(r.effective_date).toLocaleDateString("en-IN"),
                "22K (Rs./g)": r.rate_22k ? <strong style={{ color: BRAND.blue }}>{fmt(r.rate_22k)}</strong> : "—",
                "24K (Rs./g)": r.rate_24k ? fmt(r.rate_24k) : "—",
                "18K":         r.rate_18k ? fmt(r.rate_18k) : "—",
                "Silver":      r.silver_rate ? fmt(r.silver_rate) : "—",
                "Platinum":    r.platinum_rate ? fmt(r.platinum_rate) : "—",
                "USD/INR":     r.usd_inr ? fmt(r.usd_inr) : "—",
                "Updated By":  r.updated_by || "—",
                "Source":      r.remarks || "—",
              }))}
              t={t} emptyMsg="No rate history found." />
          )}
        </Card>
      )}

      {/* ── CALCULATOR ── */}
      {tab === "calc" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Input */}
          <Card t={t} style={{ marginBottom: 0 }}>
            <CardHeader title="Gold Value Calculator" t={t} />
            <FormGrid>
              <FormGroup label="Weight (g)" t={t} half>
                <Input t={t} type="number" step="0.001" placeholder="0.000"
                  value={calcWeight} onChange={e => setCalcWeight(e.target.value)} />
              </FormGroup>
              <FormGroup label="Purity" t={t} half>
                <Select t={t} value={calcPurity} onChange={e => setCalcPurity(e.target.value)}>
                  {Object.keys(PURITY).map(p => <option key={p}>{p}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Making Charges (Rs.)" t={t} half>
                <Input t={t} type="number" step="0.01" placeholder="0.00"
                  value={calcMaking} onChange={e => setCalcMaking(e.target.value)} />
              </FormGroup>
              <FormGroup label="Stone / Other Charges (Rs.)" t={t} half>
                <Input t={t} type="number" step="0.01" placeholder="0.00"
                  value={calcStone} onChange={e => setCalcStone(e.target.value)} />
              </FormGroup>
            </FormGrid>

            {!current && (
              <div style={{ fontSize: 12, color: BRAND.pink, marginTop: 8 }}>
                Add today's rates first to use the calculator.
              </div>
            )}
          </Card>

          {/* Result */}
          <Card t={t} style={{ marginBottom: 0 }}>
            <CardHeader title="Calculated Value" t={t} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["Metal Value",      `Rs.${calc.metal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, BRAND.blue],
                ["Making Charges",   `Rs.${calc.making.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, t.textSub],
                ["Stone Charges",    `Rs.${calc.stone.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, t.textSub],
                ["GST @ 3%",         `Rs.${calc.gst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, "#f39c12"],
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: t.card2 || t.card, borderRadius: 8, border: `1px solid ${t.borderDash}` }}>
                  <span style={{ fontSize: 13, color: t.textSub }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "monospace" }}>{value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: `linear-gradient(135deg,${BRAND.blue}15,${BRAND.purple}10)`, borderRadius: 10, border: `1px solid ${BRAND.purple}44` }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Total (incl. GST)</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: BRAND.purple, fontFamily: "monospace" }}>
                  Rs.{calc.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {current && calcWeight && (
                <div style={{ fontSize: 11, color: t.textFaint, textAlign: "center", marginTop: 4 }}>
                  Based on {calcPurity} rate: Rs.{current.rate_22k}/g (22K)
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
