import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback, useRef } from "react";
import { apiRequest } from "../../lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  StatCard,
  Tabs,
  DataTable,
  BtnPrimary,
  BtnOutline,
  BtnSm,
} from "../../components/ui";

function fmt(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function cleanTitle(str) {
  if (!str) return "—";
  return String(str).replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

const TABS = [
  { id: "demand",          label: "Festive Demand Forecaster" },
  { id: "deadstock",       label: "Dead Stock & Velocity Predictor" },
  { id: "rfm",             label: "AI Customer Segmentation (RFM)" },
  { id: "goldtrend",       label: "Gold Market Trend Advisor" },
  { id: "fraud",           label: "AI Fraud & Loss Radar" },
  { id: "recommendations", label: "AI Product Bundles" },
  { id: "interactive",     label: "Interactive Assistant Console" },
  { id: "settings",        label: "⚙️ AI Model Settings & API Key" },
];

export default function Ai({ t, onNavigate }) {
  const [tab, setTab] = useState("demand");
  const [loading, setLoading] = useState(false);

  const [demandData, setDemandData] = useState(null);
  const [deadStockData, setDeadStockData] = useState(null);
  const [rfmData, setRfmData] = useState(null);
  const [goldTrendData, setGoldTrendData] = useState(null);
  const [fraudData, setFraudData] = useState(null);
  const [recData, setRecData] = useState(null);

  // Settings & LLM Config State
  const [aiStatus, setAiStatus] = useState(null);
  const [configForm, setConfigForm] = useState({
    openai_api_key: "",
    openai_model: "gpt-4o-mini",
    openai_base_url: "https://api.openai.com/v1",
    gemini_api_key: "",
    gemini_model: "gemini-1.5-flash",
  });
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [activeTabProvider, setActiveTabProvider] = useState("gemini");
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadAiStatus = useCallback(async () => {
    try {
      const res = await apiRequest("/ai/status");
      if (res && res.success) {
        setAiStatus(res.data);
        setConfigForm(prev => ({
          ...prev,
          openai_model: res.data.openai?.model || "gpt-4o-mini",
          openai_base_url: res.data.openai?.base_url || "https://api.openai.com/v1",
          gemini_model: res.data.gemini?.model || "gemini-1.5-flash",
        }));
      }
    } catch {
      // silent
    }
  }, []);

  const handleTestConnection = async (provider = "openai") => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const payload = {
        provider,
        api_key: provider === "openai" ? configForm.openai_api_key : configForm.gemini_api_key,
        model: provider === "openai" ? configForm.openai_model : configForm.gemini_model,
        base_url: configForm.openai_base_url,
      };
      const res = await apiRequest("/ai/test-connection", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.model && provider === "gemini") {
        setConfigForm(f => ({ ...f, gemini_model: res.model }));
      }
      setTestResult({
        success: true,
        message: res.message || "Connected successfully!",
        reply: res.reply,
        latency_ms: res.latency_ms,
        provider: res.provider,
      });
      loadAiStatus();
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Failed to connect",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setSaveSuccess(false);
    try {
      const res = await apiRequest("/ai/config", {
        method: "POST",
        body: JSON.stringify(configForm),
      });
      if (res && res.success) {
        setSaveSuccess(true);
        loadAiStatus();
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      alert("Failed to save config: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Embedded Interactive Console State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "bot",
      text: "Namaste! How can I help you today?",
      time: "Just now",
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleConsoleSend = async (queryText = null) => {
    const text = (queryText || chatInput).trim();
    if (!text || chatLoading) return;

    const userMsg = { sender: "user", text, time: "Just now" };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const historyContext = chatMessages
        .filter(m => m.sender === "user" || m.sender === "bot")
        .slice(-8)
        .map(m => ({ sender: m.sender, text: m.text }));

      const res = await apiRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, history: historyContext }),
      });
      if (res && res.success) {
        setChatMessages(prev => [...prev, {
          sender: "bot",
          text: res.reply,
          action: res.action,
          source: res.source,
          time: "Just now",
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: "bot", text: `Error: ${err.message}`, time: "Just now" }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── 1. LOAD AI PREDICTIVE ENGINES ───────────────────────────────────────────
  const loadDemand = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiRequest("/ai/demand-forecast");
      if (d.success) setDemandData(d.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const loadDeadStock = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiRequest("/ai/dead-stock");
      if (d.success) setDeadStockData(d.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const loadRfm = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiRequest("/ai/customer-segments");
      if (d.success) setRfmData(d.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const loadGoldTrend = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiRequest("/ai/gold-trend");
      if (d.success) setGoldTrendData(d.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const loadFraud = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiRequest("/ai/fraud-radar");
      if (d.success) setFraudData(d.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const loadRecs = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiRequest("/ai/recommendations");
      if (d.success) setRecData(d.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAiStatus();
  }, [loadAiStatus]);

  useEffect(() => {
    if (tab === "demand") loadDemand();
    if (tab === "deadstock") loadDeadStock();
    if (tab === "rfm") loadRfm();
    if (tab === "goldtrend") loadGoldTrend();
    if (tab === "fraud") loadFraud();
    if (tab === "recommendations") loadRecs();
    if (tab === "settings" || tab === "interactive") loadAiStatus();
  }, [tab, loadDemand, loadDeadStock, loadRfm, loadGoldTrend, loadFraud, loadRecs, loadAiStatus]);

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="AI Predictive Intelligence & Business Optimization Hub"
        subtitle="Automated Demand Forecasting · Slow-Moving Stock Liquidation · RFM Customer Clustering · Gold Trend Advisor · Fraud Radar"
        t={t}
        actions={
          <span style={{
            background: "rgba(139,59,200,0.12)", color: BRAND.purple,
            border: `1.5px solid ${BRAND.purple}44`, borderRadius: 20,
            padding: "7px 18px", fontSize: 12, fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 6
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71", display: "inline-block" }}></span>
            AI Engine Live (Zero Latency)
          </span>
        }
      />

      {/* ── Tabs Navigation ── */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: FESTIVE DEMAND FORECASTER                                            */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "demand" && (
        <div>
          <div style={{
            background: t.card,
            border: `1.5px solid ${BRAND.purple}33`,
            borderRadius: 14, padding: "20px 24px", marginBottom: 20,
            boxShadow: t.cardShadow, display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: 14
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: BRAND.purple, textTransform: "uppercase", letterSpacing: 1 }}>
                Seasonal Multiplier & Procurement Intelligence
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: t.text, margin: "4px 0 6px 0" }}>
                Target Event: {demandData?.upcoming_event || "Diwali & Dhanteras Jewellery Rush"}
              </h3>
              <div style={{ fontSize: 13, color: t.textSub }}>
                Recommended Stock Readiness: <strong style={{ color: BRAND.blue }}>{demandData?.recommended_procurement_target_date || "10 Days Before Dhanteras"}</strong>
              </div>
            </div>
            <BtnOutline t={t} onClick={loadDemand}>Recalculate Forecast</BtnOutline>
          </div>

          <Card t={t}>
            <CardHeader title="Jewellery Category Procurement Matrix (AI Demand vs Live Showroom Stock)" t={t} />
            <DataTable
              t={t}
              loading={loading}
              columns={[
                "Category",
                "90-Day Sales Volume",
                "Live Showroom Stock",
                "Predicted Festive Demand",
                "Procurement Deficit",
                "AI Recommendation Status",
                "Confidence"
              ]}
              data={demandData?.recommendations || []}
              renderRow={(r) => ({
                "Category": <strong style={{ color: t.text }}>{r.category}</strong>,
                "90-Day Sales Volume": `${r.historical_90d_sales} pcs`,
                "Live Showroom Stock": <span style={{ color: r.current_stock < 5 ? "#e74c3c" : t.textSub, fontWeight: 700 }}>{r.current_stock} pcs</span>,
                "Predicted Festive Demand": <strong style={{ color: BRAND.purple }}>{r.predicted_festive_demand} pcs</strong>,
                "Procurement Deficit": (
                  <span style={{
                    color: r.recommended_procurement > 0 ? "#e74c3c" : "#2ecc71",
                    fontWeight: 800,
                    fontSize: 13
                  }}>
                    {r.recommended_procurement > 0 ? `+${r.recommended_procurement} pcs needed` : "✓ Stock Surplus"}
                  </span>
                ),
                "AI Recommendation Status": (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                    background: r.urgency === "CRITICAL_ORDER_NOW" ? "rgba(230,59,138,0.15)" : "rgba(46,204,113,0.15)",
                    color: r.urgency === "CRITICAL_ORDER_NOW" ? BRAND.pink : "#2ecc71"
                  }}>
                    {r.urgency === "CRITICAL_ORDER_NOW" ? "⚡ Order From Karigar Immediately" : "Sufficient Stock"}
                  </span>
                ),
                "Confidence": <span style={{ color: BRAND.blue, fontWeight: 700 }}>{r.confidence_score}</span>
              })}
            />
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: DEAD STOCK & SLOW MOVING INVENTORY                                    */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "deadstock" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
            <StatCard label="Slow-Moving Designs Detected" value={deadStockData?.total_slow_items || 0} color={BRAND.pink} t={t} />
            <StatCard label="Total Capital Locked" value={fmt(deadStockData?.total_capital_locked || 0)} color="#e74c3c" t={t} />
            <StatCard label="AI Recommended Action" value="Melt & Recast or 15% Making Discount" color="#f39c12" t={t} />
          </div>

          <Card t={t}>
            <CardHeader title="Slow-Moving Stock Liquidation Radar (> 45 Days in Display)" t={t} />
            <DataTable
              t={t}
              loading={loading}
              columns={["Product / SKU", "Category & Purity", "Weight", "Selling Price", "Days in Stock", "Holding Cost Impact", "AI Liquidation Action"]}
              data={deadStockData?.items || []}
              renderRow={(item) => ({
                "Product / SKU": (
                  <div>
                    <div style={{ fontWeight: 700, color: t.text }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: BRAND.purple }}>{item.id ? `PRD-${item.id}` : "—"}</div>
                  </div>
                ),
                "Category & Purity": `${item.category || "Jewellery"} · ${item.purity || "22K"}`,
                "Weight": `${item.gross_weight || 0}g`,
                "Selling Price": <strong style={{ color: t.text }}>{fmt(item.selling_price)}</strong>,
                "Days in Stock": (
                  <span style={{ color: item.days_in_stock > 90 ? "#e74c3c" : "#f39c12", fontWeight: 800 }}>
                    {item.days_in_stock} Days
                  </span>
                ),
                "Holding Cost Impact": <span style={{ color: "#e74c3c", fontSize: 12 }}>{item.holding_cost_impact}</span>,
                "AI Liquidation Action": (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                    background: "rgba(139,59,200,0.12)", color: BRAND.purple, border: `1px solid ${BRAND.purple}33`
                  }}>
                    {item.ai_recommendation}
                  </span>
                )
              })}
            />
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: AI CUSTOMER RFM CLUSTERING                                           */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "rfm" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
            <StatCard label="VIP Champions (Top Spenders)" value={rfmData?.summary?.champions_count || 0} color="#2ecc71" t={t} />
            <StatCard label="Loyal Spenders" value={rfmData?.summary?.loyal_count || 0} color={BRAND.blue} t={t} />
            <StatCard label="At-Risk (Dormant > 120 Days)" value={rfmData?.summary?.at_risk_count || 0} color="#e74c3c" t={t} />
            <StatCard label="Potential Upgrades" value={rfmData?.summary?.potential_count || 0} color="#f39c12" t={t} />
          </div>

          <Card t={t}>
            <CardHeader title="Customer Engagement & Personalized Retention Action Plan" t={t} />
            <DataTable
              t={t}
              loading={loading}
              columns={["Customer Name", "Contact", "Total Spend", "Orders", "Last Purchase", "AI Customer Segment", "Automated Action"]}
              data={[
                ...(rfmData?.segments?.vip_champions || []),
                ...(rfmData?.segments?.loyal_spenders || []),
                ...(rfmData?.segments?.at_risk_dormant || []),
                ...(rfmData?.segments?.potential_upgrades || []),
              ]}
              renderRow={(c) => ({
                "Customer Name": <strong style={{ color: t.text }}>{c.full_name}</strong>,
                "Contact": <span style={{ color: t.textSub }}>{c.phone}</span>,
                "Total Spend": <strong style={{ color: "#2ecc71" }}>{fmt(c.total_spend)}</strong>,
                "Orders": `${c.total_orders} Bills`,
                "Last Purchase": c.days_since_last_purchase != null ? `${c.days_since_last_purchase}d ago` : "—",
                "AI Customer Segment": (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
                    background: c.segment === "VIP Champion" ? "rgba(46,204,113,0.15)" :
                                c.segment === "At Risk (Dormant)" ? "rgba(231,76,60,0.15)" : "rgba(59,85,230,0.15)",
                    color: c.segment === "VIP Champion" ? "#2ecc71" :
                           c.segment === "At Risk (Dormant)" ? "#e74c3c" : BRAND.blue
                  }}>
                    {c.segment}
                  </span>
                ),
                "Automated Action": <span style={{ color: BRAND.purple, fontWeight: 600, fontSize: 12 }}>{c.ai_action}</span>
              })}
            />
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: GOLD TREND & BULLION ADVISOR                                         */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "goldtrend" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
            <StatCard label="Market Trend Signal" value={goldTrendData?.trend || "BULLISH"} color="#2ecc71" t={t} />
            <StatCard label="Procurement Recommendation" value={goldTrendData?.signal || "BUY_ON_DIPS"} color={BRAND.blue} t={t} />
            <StatCard label="7-Day Rate Momentum" value={goldTrendData?.momentum_7d || "+2.4%"} color="#f39c12" t={t} />
          </div>

          <Card t={t}>
            <CardHeader title="AI Bullion Procurement & Rate Hedging Advisory" t={t} />
            <div style={{ padding: 20, background: t.card2, borderRadius: 12, marginBottom: 20, border: `1px solid ${BRAND.purple}33` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.purple, textTransform: "uppercase", marginBottom: 6 }}>
                Market Intelligence Summary
              </div>
              <p style={{ fontSize: 14, color: t.text, lineHeight: 1.6, margin: "0 0 12px 0" }}>
                {goldTrendData?.procurement_advice || "Recommended to hedge 30% of next month's manufacturing bullion requirements via Bhav Cut / Advance Rate Lock."}
              </p>
              <div style={{ fontSize: 12, color: t.textMuted }}>
                Sentiment: <strong>{goldTrendData?.market_sentiment || "High Wedding Season Demand"}</strong>
              </div>
            </div>

            <DataTable
              t={t}
              loading={loading}
              columns={["Effective Date", "24K Fine Gold Rate", "22K Hallmark Gold Rate", "925 Silver Rate"]}
              data={goldTrendData?.recent_history || []}
              renderRow={(h) => ({
                "Effective Date": fmtDate(h.effective_date),
                "24K Fine Gold Rate": <strong style={{ color: "#f39c12" }}>{fmt(h.rate_24k)} / g</strong>,
                "22K Hallmark Gold Rate": <strong style={{ color: BRAND.purple }}>{fmt(h.rate_22k)} / g</strong>,
                "925 Silver Rate": <strong style={{ color: t.textSub }}>{fmt(h.silver_rate)} / g</strong>,
              })}
            />
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: AI FRAUD DETECTION & LOSS PREVENTION RADAR                          */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "fraud" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
            <StatCard label="Threat Level" value={fraudData?.threat_level || "NORMAL_SECURE"} color="#2ecc71" t={t} />
            <StatCard label="Security Risk Score" value={`${fraudData?.risk_score || 0} / 100`} color={BRAND.pink} t={t} />
            <StatCard label="Active Loss Radar" value="Continuous Real-Time Audit" color={BRAND.blue} t={t} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card t={t}>
              <CardHeader title="Karigar Wastage & Gold Loss Spikes (> 3.2% Wastage)" t={t} />
              <DataTable
                t={t}
                loading={loading}
                columns={["Karigar Name", "Metal", "Issued Weight", "Received Weight", "Wastage Loss", "Wastage %", "Audit Status"]}
                data={fraudData?.anomalies?.karigar_wastage || []}
                renderRow={(w) => ({
                  "Karigar Name": <strong style={{ color: t.text }}>{w.karigar_name}</strong>,
                  "Metal": w.metal_type || "Gold",
                  "Issued Weight": `${w.issued_weight}g`,
                  "Received Weight": `${w.received_weight}g`,
                  "Wastage Loss": <span style={{ color: "#e74c3c", fontWeight: 700 }}>{w.wastage}g</span>,
                  "Wastage %": <strong style={{ color: "#e74c3c" }}>{w.wastage_pct}%</strong>,
                  "Audit Status": (
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, background: "rgba(230,59,138,0.15)", color: BRAND.pink, fontWeight: 700 }}>
                      High Variance Flagged
                    </span>
                  ),
                })}
              />
            </Card>

            <Card t={t}>
              <CardHeader title="High Value Cash Structuring Alerts (Near ₹2 Lakh TCS Threshold)" t={t} />
              <DataTable
                t={t}
                loading={loading}
                columns={["Invoice No", "Date", "Customer Name", "PAN Status", "Amount Paid", "Mode", "TCS Flag"]}
                data={fraudData?.anomalies?.cash_structuring_alerts || []}
                renderRow={(c) => ({
                  "Invoice No": <strong style={{ color: BRAND.purple }}>{c.invoice_no}</strong>,
                  "Date": fmtDate(c.invoice_date),
                  "Customer Name": c.customer_name || "Walk-in",
                  "PAN Status": c.pan ? <span style={{ color: "#2ecc71" }}>PAN Attached</span> : <span style={{ color: "#e74c3c" }}>No PAN</span>,
                  "Amount Paid": <strong style={{ color: t.text }}>{fmt(c.paid_amount || c.grand_total)}</strong>,
                  "Mode": c.payment_mode,
                  "TCS Flag": (
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, background: "rgba(243,156,18,0.15)", color: "#f39c12", fontWeight: 700 }}>
                      Sec 206C Watchlist
                    </span>
                  ),
                })}
              />
            </Card>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: AI PRODUCT RECOMMENDATIONS & BUNDLES                                */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "recommendations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {recData?.bundles?.map((b, idx) => (
            <Card key={idx} t={t}>
              <div style={{ padding: "18px 22px", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: t.text, margin: "0 0 4px 0" }}>
                      {b.title}
                    </h3>
                    <div style={{ fontSize: 12, color: t.textSub }}>
                      Occasion: <strong style={{ color: BRAND.purple }}>{b.target_occasion}</strong> · Affinity Match: <strong style={{ color: "#2ecc71" }}>{b.confidence}</strong>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 12,
                    background: "rgba(59,85,230,0.12)", color: BRAND.blue
                  }}>
                    High Affinity Cross-Sell Bundle
                  </span>
                </div>
                <div style={{ fontSize: 13, color: t.textMuted, marginTop: 8 }}>
                  {b.affinity_reason}
                </div>
              </div>

              <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                {b.suggested_items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "14px",
                      borderRadius: 12,
                      background: t.card2,
                      border: `1px solid ${t.border}`,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: BRAND.purple, fontWeight: 600 }}>
                      SKU: {item.sku}
                    </div>
                    <div style={{ fontSize: 12, color: t.textSub, marginTop: 6 }}>
                      {item.purity} · Wt: {item.gross_weight}g
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#2ecc71", marginTop: 8 }}>
                      {fmt(item.mrp)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 7: EMBEDDED INTERACTIVE AI CONSOLE                                      */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "interactive" && (
        <Card t={t}>
          <CardHeader title="Interactive AI Showroom Console" t={t} />
          <div style={{ padding: 20 }}>
            {/* Conversation Log */}
            <div style={{
              height: 380, overflowY: "auto", background: t.card2,
              borderRadius: 14, padding: 18, border: `1px solid ${t.border}`,
              display: "flex", flexDirection: "column", gap: 12, marginBottom: 16
            }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{
                  display: "flex", flexDirection: "column",
                  alignItems: m.sender === "user" ? "flex-end" : "flex-start"
                }}>
                  <div style={{
                    maxWidth: "80%", padding: "12px 16px",
                    borderRadius: m.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: m.sender === "user" ? BRAND.gradBtn : t.card,
                    color: m.sender === "user" ? "#fff" : t.text,
                    border: m.sender === "user" ? "none" : `1px solid ${BRAND.purple}33`,
                    fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap"
                  }}>
                    {m.text}
                    {m.action && m.action.type === "NAVIGATE" && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={() => onNavigate && onNavigate(m.action.target)}
                          style={{
                            background: BRAND.grad, color: "#fff", border: "none",
                            borderRadius: 6, padding: "5px 12px", fontSize: 11,
                            fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          {m.action.label || `Open ${m.action.target.toUpperCase()} →`}
                        </button>
                      </div>
                    )}
                    {m.source && (
                      <div style={{ marginTop: 4, fontSize: 10, color: BRAND.purple, opacity: 0.85 }}>
                        Powered by {m.source}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ fontSize: 12, color: t.textMuted }}>Thinking...</div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {[
                "Aaj ka gold rate kya h?",
                "Total inventory valuation kitni h?",
                "Jewellery par GST rules samjhao",
                "Karigar gold balance dikhao",
                "Aaj kitne bills bane hain?",
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleConsoleSend(chip)}
                  style={{
                    padding: "5px 12px",
                    background: "rgba(139,59,200,0.12)",
                    border: `1px solid ${BRAND.purple}33`,
                    borderRadius: 14,
                    color: t.text,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleConsoleSend(); }} style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                placeholder="Ask about live metal rates, inventory stock valuation, GST calculations, or showroom insights..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1, height: 44, background: t.inputBg, color: t.inputColor,
                  border: `1px solid ${t.inputBorder}`, borderRadius: 10,
                  padding: "0 14px", fontSize: 13, outline: "none"
                }}
              />
              <BtnPrimary t={t} onClick={() => handleConsoleSend()} disabled={chatLoading || !chatInput.trim()}>
                Send Query
              </BtnPrimary>
            </form>
          </div>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 8: AI MODEL SETTINGS & API KEY CONFIGURATION                            */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Status Overview Card */}
          <Card t={t}>
            <div style={{
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              background: aiStatus?.is_llm_active ? "rgba(46, 204, 113, 0.08)" : "rgba(139, 59, 200, 0.08)",
              borderBottom: `1px solid ${t.border}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: aiStatus?.is_llm_active ? "rgba(46, 204, 113, 0.2)" : "rgba(139, 59, 200, 0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20
                }}>
                  {aiStatus?.is_llm_active ? "🟢" : "⚡"}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>
                    Current Active Engine: <span style={{ color: BRAND.purple }}>{aiStatus?.active_provider || "Loading..."}</span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textSub, marginTop: 3 }}>
                    {aiStatus?.is_llm_active
                      ? "Real-time LLM reasoning active with Live Showroom RAG Ground-Truth."
                      : "Using Ceritage Built-in Rule Engine. Add your OpenAI API key below to unlock conversational reasoning & dialect mirroring."}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={loadAiStatus}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(139,59,200,0.12)",
                    border: `1px solid ${BRAND.purple}44`,
                    borderRadius: 8,
                    color: t.text,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ↻ Refresh Status
                </button>
              </div>
            </div>

            <div style={{ padding: 24 }}>
              {/* Provider Sub-Tabs */}
              <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: `1px solid ${t.border}`, paddingBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveTabProvider("gemini")}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: activeTabProvider === "gemini" ? BRAND.gradBtn : "transparent",
                    color: activeTabProvider === "gemini" ? "#fff" : t.textSub,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>✨</span> Google Gemini (Primary)
                  {aiStatus?.gemini?.configured && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71" }} />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabProvider("openai")}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: activeTabProvider === "openai" ? BRAND.gradBtn : "transparent",
                    color: activeTabProvider === "openai" ? "#fff" : t.textSub,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>🤖</span> OpenAI / Groq / DeepSeek
                  {aiStatus?.openai?.configured && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71" }} />}
                </button>
              </div>

              {/* ── OpenAI Config Panel ── */}
              {activeTabProvider === "openai" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                    {/* API Key */}
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 8 }}>
                        OpenAI API Key (or Groq / DeepSeek Key) *
                      </label>
                      <div style={{ display: "flex", gap: 10 }}>
                        <input
                          type={showOpenAiKey ? "text" : "password"}
                          placeholder={aiStatus?.openai?.masked_key ? `Configured: ${aiStatus.openai.masked_key} (Paste new key to change)` : "sk-proj-..."}
                          value={configForm.openai_api_key}
                          onChange={(e) => setConfigForm(f => ({ ...f, openai_api_key: e.target.value }))}
                          style={{
                            flex: 1,
                            height: 42,
                            background: t.inputBg,
                            color: t.inputColor,
                            border: `1px solid ${t.inputBorder}`,
                            borderRadius: 8,
                            padding: "0 14px",
                            fontSize: 13,
                            fontFamily: "monospace",
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOpenAiKey(v => !v)}
                          style={{
                            padding: "0 14px",
                            background: t.card2,
                            border: `1px solid ${t.border}`,
                            borderRadius: 8,
                            color: t.textSub,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          {showOpenAiKey ? "Hide" : "Show"}
                        </button>
                      </div>
                      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>
                        Key is encrypted and stored locally in <code>backend/.env</code>.
                      </div>
                    </div>

                    {/* Model Selector */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 8 }}>
                        LLM Model Selection
                      </label>
                      <select
                        value={configForm.openai_model}
                        onChange={(e) => setConfigForm(f => ({ ...f, openai_model: e.target.value }))}
                        style={{
                          width: "100%",
                          height: 42,
                          background: t.inputBg,
                          color: t.inputColor,
                          border: `1px solid ${t.inputBorder}`,
                          borderRadius: 8,
                          padding: "0 12px",
                          fontSize: 13,
                          outline: "none",
                        }}
                      >
                        <option value="gpt-4o-mini">gpt-4o-mini (Fast & Intelligent — Recommended)</option>
                        <option value="gpt-4o">gpt-4o (Most Capable Flagship)</option>
                        <option value="gpt-4-turbo">gpt-4-turbo</option>
                        <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Groq)</option>
                        <option value="deepseek-chat">deepseek-chat (DeepSeek V3)</option>
                      </select>
                    </div>

                    {/* Base URL (Optional for Groq / DeepSeek / Ollama) */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 8 }}>
                        API Base URL (Default: OpenAI)
                      </label>
                      <input
                        type="text"
                        placeholder="https://api.openai.com/v1"
                        value={configForm.openai_base_url}
                        onChange={(e) => setConfigForm(f => ({ ...f, openai_base_url: e.target.value }))}
                        style={{
                          width: "100%",
                          height: 42,
                          background: t.inputBg,
                          color: t.inputColor,
                          border: `1px solid ${t.inputBorder}`,
                          borderRadius: 8,
                          padding: "0 14px",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
                        For Groq use: <code>https://api.groq.com/openai/v1</code> · For DeepSeek: <code>https://api.deepseek.com/v1</code>
                      </div>
                    </div>
                  </div>

                  {/* Test & Save Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
                    <button
                      type="button"
                      onClick={() => handleTestConnection("openai")}
                      disabled={testingConnection}
                      style={{
                        padding: "10px 20px",
                        background: "rgba(139,59,200,0.15)",
                        border: `1px solid ${BRAND.purple}`,
                        borderRadius: 8,
                        color: BRAND.purple,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: testingConnection ? "not-allowed" : "pointer",
                      }}
                    >
                      {testingConnection ? "Testing Connection..." : "⚡ Test OpenAI Connection"}
                    </button>

                    <BtnPrimary t={t} onClick={handleSaveConfig} disabled={savingConfig}>
                      {savingConfig ? "Saving..." : "💾 Save Settings"}
                    </BtnPrimary>

                    {saveSuccess && (
                      <span style={{ color: "#2ecc71", fontSize: 13, fontWeight: 600 }}>
                        ✓ Configuration saved successfully!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Google Gemini Config Panel ── */}
              {activeTabProvider === "gemini" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                    {/* Gemini API Key */}
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 8 }}>
                        Google Gemini API Key *
                      </label>
                      <div style={{ display: "flex", gap: 10 }}>
                        <input
                          type={showGeminiKey ? "text" : "password"}
                          placeholder={aiStatus?.gemini?.masked_key ? `Configured: ${aiStatus.gemini.masked_key} (Paste new key to change)` : "AIzaSy..."}
                          value={configForm.gemini_api_key}
                          onChange={(e) => setConfigForm(f => ({ ...f, gemini_api_key: e.target.value }))}
                          style={{
                            flex: 1,
                            height: 42,
                            background: t.inputBg,
                            color: t.inputColor,
                            border: `1px solid ${t.inputBorder}`,
                            borderRadius: 8,
                            padding: "0 14px",
                            fontSize: 13,
                            fontFamily: "monospace",
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowGeminiKey(v => !v)}
                          style={{
                            padding: "0 14px",
                            background: t.card2,
                            border: `1px solid ${t.border}`,
                            borderRadius: 8,
                            color: t.textSub,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          {showGeminiKey ? "Hide" : "Show"}
                        </button>
                      </div>
                      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 6 }}>
                        Get a free key from Google AI Studio: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: BRAND.purple }}>aistudio.google.com</a>
                      </div>
                    </div>

                    {/* Gemini Model Selector */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 8 }}>
                        Gemini Model (Auto-detected from Key)
                      </label>
                      <select
                        value={configForm.gemini_model}
                        onChange={(e) => setConfigForm(f => ({ ...f, gemini_model: e.target.value }))}
                        style={{
                          width: "100%",
                          height: 42,
                          background: t.inputBg,
                          color: t.inputColor,
                          border: `1px solid ${t.inputBorder}`,
                          borderRadius: 8,
                          padding: "0 12px",
                          fontSize: 13,
                          outline: "none",
                        }}
                      >
                        {aiStatus?.gemini?.available_models?.length > 0 && (
                          <optgroup label="Discovered on Your API Key">
                            {aiStatus.gemini.available_models.map(m => (
                              <option key={m} value={m}>{m} (Active Key Supported)</option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Standard Gemini Models">
                          <option value="gemini-2.5-flash">gemini-2.5-flash (Fastest & Latest)</option>
                          <option value="gemini-2.0-flash">gemini-2.0-flash (Next-Gen Flash)</option>
                          <option value="gemini-1.5-flash-latest">gemini-1.5-flash-latest (Auto-Updated)</option>
                          <option value="gemini-1.5-flash">gemini-1.5-flash (Default Flash)</option>
                          <option value="gemini-pro">gemini-pro (Standard Pro)</option>
                          <option value="gemini-1.5-pro-latest">gemini-1.5-pro-latest</option>
                          <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Test & Save Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
                    <button
                      type="button"
                      onClick={() => handleTestConnection("gemini")}
                      disabled={testingConnection}
                      style={{
                        padding: "10px 20px",
                        background: "rgba(139,59,200,0.15)",
                        border: `1px solid ${BRAND.purple}`,
                        borderRadius: 8,
                        color: BRAND.purple,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: testingConnection ? "not-allowed" : "pointer",
                      }}
                    >
                      {testingConnection ? "Testing Connection..." : "⚡ Test Gemini Connection"}
                    </button>

                    <BtnPrimary t={t} onClick={handleSaveConfig} disabled={savingConfig}>
                      {savingConfig ? "Saving..." : "💾 Save Settings"}
                    </BtnPrimary>

                    {saveSuccess && (
                      <span style={{ color: "#2ecc71", fontSize: 13, fontWeight: 600 }}>
                        ✓ Configuration saved successfully!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Test Result Box */}
              {testResult && (
                <div style={{
                  marginTop: 20,
                  padding: "14px 18px",
                  borderRadius: 10,
                  background: testResult.success ? "rgba(46, 204, 113, 0.1)" : "rgba(231, 76, 60, 0.1)",
                  border: `1px solid ${testResult.success ? "rgba(46, 204, 113, 0.3)" : "rgba(231, 76, 60, 0.3)"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: testResult.success ? "#2ecc71" : "#e74c3c" }}>
                      {testResult.success ? "✓ Test Passed" : "✕ Test Failed"}
                    </span>
                    {testResult.latency_ms > 0 && (
                      <span style={{ fontSize: 11, color: t.textMuted }}>Latency: {testResult.latency_ms}ms</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: t.text, lineHeight: 1.5 }}>
                    {testResult.message}
                  </div>
                  {testResult.reply && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: t.card, borderRadius: 6, fontSize: 12, color: t.textSub, fontStyle: "italic" }}>
                      AI Response: "{testResult.reply}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Quick Guide Card */}
          <Card t={t}>
            <CardHeader title="📖 Quick Setup Guide: How to get OpenAI Key" t={t} />
            <div style={{ padding: "0 24px 24px", fontSize: 13, color: t.textSub, lineHeight: 1.6 }}>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: BRAND.purple, fontWeight: 600 }}>platform.openai.com/api-keys</a> and log in or create an account.</li>
                <li style={{ marginBottom: 8 }}>Click on <strong>"+ Create new secret key"</strong>.</li>
                <li style={{ marginBottom: 8 }}>Copy the key (starts with <code>sk-...</code>) and paste it into the <strong>OpenAI API Key</strong> field above.</li>
                <li style={{ marginBottom: 8 }}>Click <strong>"Test OpenAI Connection"</strong> to verify, then click <strong>"Save Settings"</strong>.</li>
                <li>Your Ceritage AI Assistant will immediately start reasoning with real-time showroom data in Hinglish, Hindi, and English!</li>
              </ol>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
