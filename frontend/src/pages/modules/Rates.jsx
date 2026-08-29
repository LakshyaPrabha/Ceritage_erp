import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, FormGroup, FormGrid, Input, Select } from "../../components/ui";
import { apiRequest } from "../../lib/api";

const TABS = [
  { id:"live",        label:"Live Market" },
  { id:"mcx",         label:"MCX Reference" },
  { id:"lbma",        label:"LBMA Reference" },
  { id:"adjustments", label:"Shop Adjustments" },
  { id:"manual",      label:"Manual Update" },
  { id:"history",     label:"Rate History" },
  { id:"alerts",      label:"Rate Alerts" },
];

const METALS_LIST = [
  { key:"gold24K",     metal:"GOLD",      purity:"999", label:"24K Gold (999)",      color:BRAND.purple, note:"Pure Market Rate" },
  { key:"gold22K",     metal:"GOLD",      purity:"916", label:"22K Gold (916)",      color:BRAND.blue,   note:"Calculated (22/24)" },
  { key:"gold18K",     metal:"GOLD",      purity:"750", label:"18K Gold (750)",      color:"#3498db",    note:"Calculated (18/24)" },
  { key:"gold14K",     metal:"GOLD",      purity:"585", label:"14K Gold (585)",      color:BRAND.pink,   note:"Calculated (14/24)" },
  { key:"silver999",   metal:"SILVER",    purity:"999", label:"Silver (999)",        color:"#95a5a6",    note:"Fine Silver" },
  { key:"platinum999", metal:"PLATINUM",  purity:"999", label:"Platinum (999)",      color:"#bdc3c7",    note:"Fine Platinum" },
  { key:"palladium999",metal:"PALLADIUM", purity:"999", label:"Palladium (999)",     color:"#1abc9c",    note:"Fine Palladium" },
];

function fmt(val) {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  if (!isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n);
}

export default function Rates({ t }) {
  const [tab, setTab] = useState("live");

  // ── Rate data from backend ──────────────────────────────
  const [ratesData,    setRatesData]    = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError,   setRatesError]   = useState("");
  const [refreshing,   setRefreshing]   = useState(false);
  const [refreshMsg,   setRefreshMsg]   = useState("");

  // ── Manual update form state ─────────────────────────────
  const [form,         setForm]         = useState({});
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState("");

  // ── Shop adjustments state ───────────────────────────────
  const [adjForm,      setAdjForm]      = useState({});
  const [savingAdj,    setSavingAdj]    = useState(false);
  const [adjMsg,       setAdjMsg]       = useState("");

  // ── Rate history state ───────────────────────────────────
  const [history,      setHistory]      = useState([]);
  const [histDays,     setHistDays]     = useState(30);
  const [histLoading,  setHistLoading]  = useState(false);

  // ── Fetch current rates from /api/metal-rates/current ────
  const fetchCurrent = useCallback(async () => {
    setRatesLoading(true);
    setRatesError("");
    try {
      const res = await apiRequest("/metal-rates/current");
      setRatesData(res);

      if (res?.shopSellingRates) {
        const adjs = {};
        for (const m of METALS_LIST) {
          const item = res.shopSellingRates[m.key];
          if (item) {
            adjs[`${m.metal}_${m.purity}`] = item.shopAdjustmentPerGram || 0;
          }
        }
        setAdjForm(adjs);
      }

      if (res?.liveMarket) {
        setForm({
          rate_24k:      res.liveMarket.gold24K    || "",
          rate_22k:      res.liveMarket.gold22K    || "",
          rate_18k:      res.liveMarket.gold18K    || "",
          rate_14k:      res.liveMarket.gold14K    || "",
          silver_rate:   res.liveMarket.silver999  || "",
          platinum_rate: res.liveMarket.platinum999|| "",
          usd_inr:       "86.80",
          effective_date: new Date().toISOString().split("T")[0],
          remarks: "Manual Market Update",
        });
      }
    } catch (err) {
      setRatesError(err.message || "Failed to load live metal rates.");
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  // ── Refresh Rates from Metals.Dev API ────────────────────
  async function handleRefreshMarketRates() {
    setRefreshing(true);
    setRefreshMsg("Syncing latest rates from Metals.Dev...");
    try {
      const res = await apiRequest("/metal-rates/refresh", { method: "POST" });
      if (res && res.success) {
        setRefreshMsg("✓ Market rates successfully refreshed from Metals.Dev!");
        await fetchCurrent();
        window.dispatchEvent(new Event("metal-rates-updated"));
      } else {
        setRefreshMsg(`⚠ ${res?.message || "Using last saved rate."}`);
        await fetchCurrent();
        window.dispatchEvent(new Event("metal-rates-updated"));
      }
    } catch (err) {
      setRefreshMsg(`✗ ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  }

  // ── Fetch rate history ───────────────────────────────────
  const fetchHistory = useCallback(async (days) => {
    setHistLoading(true);
    try {
      const res = await apiRequest(`/metal-rates/history?days=${days}`);
      setHistory(res.data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "history") fetchHistory(histDays);
  }, [tab, histDays, fetchHistory]);

  // ── Save manual rates ────────────────────────────────────
  async function handleSaveManualRates(e) {
    e.preventDefault();
    if (!form.rate_22k || !form.rate_24k) {
      setSaveMsg("22K and 24K gold rates are required.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      await apiRequest("/rates", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSaveMsg("✓ Rates successfully updated!");
      await fetchCurrent();
    } catch (err) {
      setSaveMsg(`✗ ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Save shop adjustments ────────────────────────────────
  async function handleSaveAdjustments(e) {
    e.preventDefault();
    setSavingAdj(true);
    setAdjMsg("");
    try {
      const adjustments = METALS_LIST.map(m => ({
        metal: m.metal,
        purity: m.purity,
        adjustmentPerGram: Number(adjForm[`${m.metal}_${m.purity}`] || 0),
      }));

      const res = await apiRequest("/metal-rates/adjustments", {
        method: "POST",
        body: JSON.stringify({ adjustments }),
      });

      setAdjMsg("✓ Shop adjustments successfully saved!");
      await fetchCurrent();
    } catch (err) {
      setAdjMsg(`✗ ${err.message}`);
    } finally {
      setSavingAdj(false);
    }
  }

  // Format updated timestamp
  let updatedLabel = "—";
  if (ratesData?.updatedAt) {
    updatedLabel = new Date(ratesData.updatedAt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // History table rows
  const histRows = history.map(r => ({
    "Date & Time": r.created_at ? new Date(r.created_at).toLocaleString("en-IN") : "—",
    "Metal":       r.metal,
    "Purity":      r.purity,
    "Price (₹/g)": fmt(r.price_per_gram) || "—",
    "Rate Type":   r.rate_type || "LIVE_MARKET",
    "Source":      r.source || "Metals.Dev",
  }));

  const live = ratesData?.liveMarket || {};
  const selling = ratesData?.shopSellingRates || {};
  const mcx = ratesData?.mcxReference || {};
  const lbma = ratesData?.lbmaReference || {};

  return (
    <div>
      <PageHeader
        title="Live Metal Rates"
        subtitle="Metals.Dev Live Market Rates · MCX Reference · LBMA Reference · Shop Adjustments · Rate History"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={handleRefreshMarketRates} disabled={refreshing || ratesLoading}>
            {refreshing ? "Refreshing..." : "↻ Refresh Market Rates"}
          </BtnOutline>
        </>}
      />

      {/* ── Status Banner & Daily 2-Request Schedule Indicators ── */}
      <div style={{ background:t.card, border:`1px solid ${t.borderDash}`, borderRadius:10,
        padding:"12px 16px", marginBottom:18, display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:12, color:t.textMuted }}>
            <div><strong>Provider:</strong> <span style={{ color:BRAND.purple, fontWeight:700 }}>Metals.Dev</span></div>
            <div>•</div>
            <div><strong>Currency:</strong> INR</div>
            <div>•</div>
            <div><strong>Unit:</strong> ₹ / gram</div>
            <div>•</div>
            <div><strong>Last Saved Rate:</strong> <span style={{ color:t.text }}>{updatedLabel}</span></div>
          </div>
          <div>
            {ratesData?.isStale ? (
              <span style={{ fontSize:11, background:"#f39c1222", color:"#e67e22", padding:"3px 8px", borderRadius:6, fontWeight:700 }}>
                ⚠ Rate last updated at {updatedLabel} (Stale)
              </span>
            ) : ratesData?.isAvailable ? (
              <span style={{ fontSize:11, background:"#2ecc7122", color:"#27ae60", padding:"3px 8px", borderRadius:6, fontWeight:700 }}>
                ● Live Market Active
              </span>
            ) : (
              <span style={{ fontSize:11, background:"#e74c3c22", color:"#c0392b", padding:"3px 8px", borderRadius:6, fontWeight:700 }}>
                ⚠ Rates Unavailable
              </span>
            )}
          </div>
        </div>

        {/* ── Twice-Daily Automated Sync Slot Status ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          borderTop:`1px solid ${t.borderDash}`, paddingTop:8, fontSize:12, color:t.textMuted }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <span><strong>Daily Auto-Sync:</strong></span>
            <span>
              ☀️ Day Slot ({ratesData?.quotaStatus?.daySlotTime || "10:30"} AM IST):{" "}
              <strong style={{ color: ratesData?.quotaStatus?.daySlotCompleted ? "#27ae60" : "#e67e22" }}>
                {ratesData?.quotaStatus?.daySlotCompleted ? "✓ Completed" : "Pending"}
              </strong>
            </span>
            <span>
              🌙 Evening Slot ({ratesData?.quotaStatus?.eveningSlotTime || "18:30"} PM IST):{" "}
              <strong style={{ color: ratesData?.quotaStatus?.eveningSlotCompleted ? "#27ae60" : "#e67e22" }}>
                {ratesData?.quotaStatus?.eveningSlotCompleted ? "✓ Completed" : "Pending"}
              </strong>
            </span>
          </div>
          <div>
            <span>Daily Requests: </span>
            <strong style={{ color: ratesData?.quotaStatus?.canRequest ? BRAND.purple : "#e74c3c" }}>
              {ratesData?.quotaStatus?.requestsToday ?? 0} / {ratesData?.quotaStatus?.dailyLimit ?? 2}
            </strong>
          </div>
        </div>
      </div>

      {refreshMsg && (
        <div style={{ fontSize:13, marginBottom:14, padding:"8px 12px", borderRadius:8,
          background: refreshMsg.startsWith("✓") ? "#2ecc7115" : (refreshMsg.startsWith("⚠") ? "#f39c1215" : "#e74c3c15"),
          color: refreshMsg.startsWith("✓") ? "#27ae60" : (refreshMsg.startsWith("⚠") ? "#e67e22" : BRAND.pink) }}>
          {refreshMsg}
        </div>
      )}

      {ratesError && (
        <div style={{ fontSize:13, marginBottom:14, color:BRAND.pink }}>
          ⚠ {ratesError}
        </div>
      )}

      {/* ── Key Live Selling Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:22 }}>
        {METALS_LIST.map((m) => {
          const item = selling[m.key];
          const sellVal = fmt(item?.sellingPricePerGram || live[m.key]);
          const marketVal = fmt(item?.marketPricePerGram || live[m.key]);
          const adj = item?.shopAdjustmentPerGram || 0;

          return (
            <div key={m.key} style={{ background:t.card, border:`1px solid ${t.borderDash}`,
              borderRadius:12, padding:"14px 16px", boxShadow:t.cardShadow }}>
              <div style={{ fontSize:10, color:t.textMuted, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 }}>
                {m.label}
              </div>
              <div style={{ fontSize:20, fontWeight:900, color: sellVal ? m.color : t.textFaint }}>
                {ratesLoading ? "..." : sellVal ? `₹${sellVal}` : "—"}
              </div>
              <div style={{ fontSize:11, color:t.textFaint, marginTop:4 }}>
                {ratesLoading ? "" : (
                  adj !== 0 ? (
                    <span>Mkt: ₹{marketVal} ({adj > 0 ? `+₹${adj}` : `₹${adj}`})</span>
                  ) : (
                    <span>{m.note}</span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── Tab 1: Live Market Rates ── */}
      {tab === "live" && (
        <Card t={t}>
          <CardHeader title="Live Market Prices (Metals.Dev)" t={t} />
          <div style={{ fontSize:13, color:t.textMuted, marginBottom:14 }}>
            Direct live spot pricing from Metals.Dev with calculated standard purities (22K, 18K, 14K) and Ceritage shop adjustments.
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${t.borderDash}`, textAlign:"left" }}>
                <th style={{ padding:"10px 12px", color:t.textMuted }}>Metal & Purity</th>
                <th style={{ padding:"10px 12px", color:t.textMuted }}>Market Rate (₹/g)</th>
                <th style={{ padding:"10px 12px", color:t.textMuted }}>Shop Adjustment (₹/g)</th>
                <th style={{ padding:"10px 12px", color:t.textMuted }}>Ceritage Selling Rate (₹/g)</th>
                <th style={{ padding:"10px 12px", color:t.textMuted }}>Calculation Basis</th>
              </tr>
            </thead>
            <tbody>
              {METALS_LIST.map((m) => {
                const item = selling[m.key];
                const marketVal = fmt(item?.marketPricePerGram || live[m.key]);
                const sellVal = fmt(item?.sellingPricePerGram || live[m.key]);
                const adj = item?.shopAdjustmentPerGram || 0;

                return (
                  <tr key={m.key} style={{ borderBottom:`1px solid ${t.borderDash}` }}>
                    <td style={{ padding:"12px", fontWeight:700, color:t.text }}>{m.label}</td>
                    <td style={{ padding:"12px", color:m.color, fontWeight:600 }}>{marketVal ? `₹${marketVal}` : "—"}</td>
                    <td style={{ padding:"12px", color: adj > 0 ? "#27ae60" : (adj < 0 ? "#e74c3c" : t.textMuted) }}>
                      {adj !== 0 ? (adj > 0 ? `+₹${adj.toFixed(2)}` : `₹${adj.toFixed(2)}`) : "₹0.00"}
                    </td>
                    <td style={{ padding:"12px", fontWeight:900, color: sellVal ? m.color : t.textFaint, fontSize:14 }}>
                      {sellVal ? `₹${sellVal}` : "—"}
                    </td>
                    <td style={{ padding:"12px", color:t.textMuted, fontSize:12 }}>{m.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── Tab 2: MCX Reference ── */}
      {tab === "mcx" && (
        <Card t={t}>
          <CardHeader title="MCX Commodity References (Metals.Dev Feed)" t={t} />
          <div style={{ fontSize:13, color:t.textMuted, marginBottom:16 }}>
            Indian Multi Commodity Exchange (MCX) contract reference values provided via the Metals.Dev data feed.
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div style={{ background:t.card2||t.card, borderRadius:10, padding:16, border:`1px solid ${t.borderDash}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:BRAND.purple, textTransform:"uppercase", marginBottom:10 }}>MCX Gold Reference</div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ color:t.textMuted }}>Current MCX Gold:</span>
                <strong style={{ color:t.text }}>{mcx.gold ? `₹${fmt(mcx.gold)} / g` : "—"}</strong>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ color:t.textMuted }}>MCX Gold AM:</span>
                <span>{mcx.goldAM ? `₹${fmt(mcx.goldAM)} / g` : "—"}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:t.textMuted }}>MCX Gold PM:</span>
                <span>{mcx.goldPM ? `₹${fmt(mcx.goldPM)} / g` : "—"}</span>
              </div>
            </div>

            <div style={{ background:t.card2||t.card, borderRadius:10, padding:16, border:`1px solid ${t.borderDash}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#95a5a6", textTransform:"uppercase", marginBottom:10 }}>MCX Silver Reference</div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ color:t.textMuted }}>Current MCX Silver:</span>
                <strong style={{ color:t.text }}>{mcx.silver ? `₹${fmt(mcx.silver)} / g` : "—"}</strong>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ color:t.textMuted }}>MCX Silver AM:</span>
                <span>{mcx.silverAM ? `₹${fmt(mcx.silverAM)} / g` : "—"}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:t.textMuted }}>MCX Silver PM:</span>
                <span>{mcx.silverPM ? `₹${fmt(mcx.silverPM)} / g` : "—"}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Tab 3: LBMA Reference ── */}
      {tab === "lbma" && (
        <Card t={t}>
          <CardHeader title="LBMA Reference Prices (Metals.Dev Feed)" t={t} />
          <div style={{ fontSize:13, color:t.textMuted, marginBottom:16 }}>
            London Bullion Market Association (LBMA) official benchmark fixings converted to INR/gram via Metals.Dev.
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${t.borderDash}`, textAlign:"left" }}>
                <th style={{ padding:"10px 12px", color:t.textMuted }}>Instrument</th>
                <th style={{ padding:"10px 12px", color:t.textMuted }}>AM Fixing (₹/g)</th>
                <th style={{ padding:"10px 12px", color:t.textMuted }}>PM Fixing (₹/g)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom:`1px solid ${t.borderDash}` }}>
                <td style={{ padding:"12px", fontWeight:700 }}>LBMA Gold</td>
                <td style={{ padding:"12px" }}>{lbma.goldAM ? `₹${fmt(lbma.goldAM)}` : "—"}</td>
                <td style={{ padding:"12px" }}>{lbma.goldPM ? `₹${fmt(lbma.goldPM)}` : "—"}</td>
              </tr>
              <tr style={{ borderBottom:`1px solid ${t.borderDash}` }}>
                <td style={{ padding:"12px", fontWeight:700 }}>LBMA Silver</td>
                <td style={{ padding:"12px" }} colSpan={2}>{lbma.silver ? `₹${fmt(lbma.silver)}` : "—"}</td>
              </tr>
              <tr style={{ borderBottom:`1px solid ${t.borderDash}` }}>
                <td style={{ padding:"12px", fontWeight:700 }}>LBMA Platinum</td>
                <td style={{ padding:"12px" }}>{lbma.platinumAM ? `₹${fmt(lbma.platinumAM)}` : "—"}</td>
                <td style={{ padding:"12px" }}>{lbma.platinumPM ? `₹${fmt(lbma.platinumPM)}` : "—"}</td>
              </tr>
              <tr style={{ borderBottom:`1px solid ${t.borderDash}` }}>
                <td style={{ padding:"12px", fontWeight:700 }}>LBMA Palladium</td>
                <td style={{ padding:"12px" }}>{lbma.palladiumAM ? `₹${fmt(lbma.palladiumAM)}` : "—"}</td>
                <td style={{ padding:"12px" }}>{lbma.palladiumPM ? `₹${fmt(lbma.palladiumPM)}` : "—"}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {/* ── Tab 4: Shop Adjustments ── */}
      {tab === "adjustments" && (
        <Card t={t}>
          <CardHeader title="Ceritage Shop Selling Adjustments" t={t} />
          <div style={{ fontSize:13, color:t.textMuted, marginBottom:16 }}>
            Set custom shop margin / premium (+ or - ₹ per gram) added to the Metals.Dev live market rate.
            Formula: <code>Ceritage Selling Rate = Metals.Dev Market Rate + Shop Adjustment</code>.
          </div>
          <form onSubmit={handleSaveAdjustments}>
            <FormGrid>
              {METALS_LIST.map((m) => (
                <FormGroup key={m.key} label={`${m.label} Adjustment (₹/g)`} t={t} half>
                  <Input
                    t={t}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={adjForm[`${m.metal}_${m.purity}`] ?? 0}
                    onChange={(e) => setAdjForm(f => ({ ...f, [`${m.metal}_${m.purity}`]: e.target.value }))}
                  />
                </FormGroup>
              ))}
            </FormGrid>
            {adjMsg && (
              <div style={{ fontSize:13, marginBottom:10, color: adjMsg.startsWith("✓") ? "#27ae60" : BRAND.pink }}>
                {adjMsg}
              </div>
            )}
            <BtnPrimary type="submit" disabled={savingAdj} style={{ marginTop:8 }}>
              {savingAdj ? "Saving Adjustments..." : "Save Shop Adjustments"}
            </BtnPrimary>
          </form>
        </Card>
      )}

      {/* ── Tab 5: Manual Update ── */}
      {tab === "manual" && (
        <Card t={t}>
          <CardHeader title="Manual Metal Rate Override" t={t} />
          <div style={{ fontSize:13, color:t.textMuted, marginBottom:16 }}>
            Manually update benchmark metal rates for internal store pricing if required.
          </div>
          <form onSubmit={handleSaveManualRates}>
            <FormGrid>
              <FormGroup label="24K Gold (₹/g) *" t={t} half>
                <Input t={t} type="number" step="0.01" value={form.rate_24k || ""}
                  onChange={e => setForm(f => ({ ...f, rate_24k: e.target.value }))} />
              </FormGroup>
              <FormGroup label="22K Gold (₹/g) *" t={t} half>
                <Input t={t} type="number" step="0.01" value={form.rate_22k || ""}
                  onChange={e => setForm(f => ({ ...f, rate_22k: e.target.value }))} />
              </FormGroup>
              <FormGroup label="18K Gold (₹/g)" t={t} half>
                <Input t={t} type="number" step="0.01" value={form.rate_18k || ""}
                  onChange={e => setForm(f => ({ ...f, rate_18k: e.target.value }))} />
              </FormGroup>
              <FormGroup label="14K Gold (₹/g)" t={t} half>
                <Input t={t} type="number" step="0.01" value={form.rate_14k || ""}
                  onChange={e => setForm(f => ({ ...f, rate_14k: e.target.value }))} />
              </FormGroup>
              <FormGroup label="Silver (₹/g) *" t={t} half>
                <Input t={t} type="number" step="0.01" value={form.silver_rate || ""}
                  onChange={e => setForm(f => ({ ...f, silver_rate: e.target.value }))} />
              </FormGroup>
              <FormGroup label="Platinum (₹/g)" t={t} half>
                <Input t={t} type="number" step="0.01" value={form.platinum_rate || ""}
                  onChange={e => setForm(f => ({ ...f, platinum_rate: e.target.value }))} />
              </FormGroup>
              <FormGroup label="Effective Date" t={t} half>
                <Input t={t} type="date" value={form.effective_date || ""}
                  onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
              </FormGroup>
              <FormGroup label="Remarks" t={t} half>
                <Input t={t} placeholder="Manual Market Update" value={form.remarks || ""}
                  onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
              </FormGroup>
            </FormGrid>
            {saveMsg && (
              <div style={{ fontSize:13, marginBottom:10, color: saveMsg.startsWith("✓") ? "#27ae60" : BRAND.pink }}>
                {saveMsg}
              </div>
            )}
            <BtnPrimary type="submit" disabled={saving} style={{ marginTop:8 }}>
              {saving ? "Saving..." : "Save Manual Rates"}
            </BtnPrimary>
          </form>
        </Card>
      )}

      {/* ── Tab 6: Rate History ── */}
      {tab === "history" && (
        <Card t={t}>
          <CardHeader title={`Rate History — Last ${histDays} Days`} t={t}
            actions={<>
              {[7, 30, 90].map(d => (
                <BtnOutline key={d} t={t}
                  style={{ padding:"5px 12px", fontSize:12, fontWeight: histDays === d ? 700 : 400 }}
                  onClick={() => setHistDays(d)}>{d}D</BtnOutline>
              ))}
            </>}
          />
          <DataTable
            columns={["Date & Time", "Metal", "Purity", "Price (₹/g)", "Rate Type", "Source"]}
            rows={histRows}
            t={t}
            emptyMsg={histLoading ? "Loading history..." : "No rate history found"}
          />
        </Card>
      )}

      {/* ── Tab 7: Rate Alerts ── */}
      {tab === "alerts" && (
        <Card t={t}>
          <CardHeader title="Market Rate Alerts & Notifications" t={t} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:BRAND.purple, textTransform:"uppercase", marginBottom:12 }}>
                Threshold Alerts
              </div>
              <FormGrid>
                <FormGroup label="Alert if 24K Gold falls below" t={t} half><Input t={t} type="number" placeholder="₹/g" /></FormGroup>
                <FormGroup label="Alert if 24K Gold rises above" t={t} half><Input t={t} type="number" placeholder="₹/g" /></FormGroup>
                <FormGroup label="Alert if Silver falls below" t={t} half><Input t={t} type="number" placeholder="₹/g" /></FormGroup>
                <FormGroup label="Alert if Silver rises above" t={t} half><Input t={t} type="number" placeholder="₹/g" /></FormGroup>
              </FormGrid>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:BRAND.purple, textTransform:"uppercase", marginBottom:12 }}>
                Notification Channels
              </div>
              {["WhatsApp Alert to Store Manager","SMS Notification","Daily Morning Market Summary",
                "Auto-adjust Product Selling Prices"].map((item) => (
                <div key={item} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <span style={{ fontSize:13, color:t.textSub }}>{item}</span>
                  <div style={{ width:40, height:22, borderRadius:11, background:BRAND.gradBtn, cursor:"pointer", position:"relative" }}>
                    <div style={{ position:"absolute", right:3, top:3, width:16, height:16, borderRadius:"50%", background:"#fff" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <BtnPrimary style={{ marginTop:8 }}>Save Alert Settings</BtnPrimary>
        </Card>
      )}
    </div>
  );
}
