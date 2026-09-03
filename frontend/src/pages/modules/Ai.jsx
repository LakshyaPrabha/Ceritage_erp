import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
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
  { id: "demand",    label: "Festive Demand Forecaster" },
  { id: "deadstock", label: "Dead Stock & Velocity Predictor" },
  { id: "rfm",       label: "AI Customer Segmentation (RFM)" },
  { id: "goldtrend", label: "Gold Market Trend Advisor" },
];

export default function Ai({ t }) {
  const [tab, setTab] = useState("demand");
  const [loading, setLoading] = useState(false);

  const [demandData, setDemandData] = useState(null);
  const [deadStockData, setDeadStockData] = useState(null);
  const [rfmData, setRfmData] = useState(null);
  const [goldTrendData, setGoldTrendData] = useState(null);

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

  useEffect(() => {
    if (tab === "demand") loadDemand();
    if (tab === "deadstock") loadDeadStock();
    if (tab === "rfm") loadRfm();
    if (tab === "goldtrend") loadGoldTrend();
  }, [tab, loadDemand, loadDeadStock, loadRfm, loadGoldTrend]);

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="AI Predictive Intelligence & Business Optimization Hub"
        subtitle="Automated Demand Forecasting · Slow-Moving Stock Liquidation · RFM Customer Clustering · Gold Trend Advisor"
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
          {/* Highlight Banner */}
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
              columns={["Jewellery Category", "90-Day Velocity", "In-Stock Count", "AI Predicted Demand", "Procurement Shortage", "Confidence", "Action Urgency", "AI Seasonal Logic"]}
              rows={(demandData?.recommendations || []).map(r => ({
                "Jewellery Category": <strong>{r.category}</strong>,
                "90-Day Velocity": <span>{r.historical_90d_sales} Sold</span>,
                "In-Stock Count": <span>{r.current_stock} Pcs</span>,
                "AI Predicted Demand": <strong style={{ color: BRAND.purple }}>{r.predicted_festive_demand} Pcs</strong>,
                "Procurement Shortage": (
                  <span style={{
                    color: r.recommended_procurement > 10 ? BRAND.pink : r.recommended_procurement > 0 ? BRAND.blue : "#2ecc71",
                    fontWeight: 800, fontSize: 13
                  }}>
                    {r.recommended_procurement > 0 ? `+${r.recommended_procurement} Pcs Needed` : "Well Stocked"}
                  </span>
                ),
                "Confidence": (
                  <span style={{ background: "rgba(46,204,113,0.12)", color: "#27ae60", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    {r.confidence_score}
                  </span>
                ),
                "Action Urgency": (
                  <span style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800,
                    background: r.urgency === "CRITICAL_ORDER_NOW" ? "rgba(230,59,138,0.15)" : r.urgency === "MODERATE" ? "rgba(243,156,18,0.15)" : "rgba(46,204,113,0.15)",
                    color: r.urgency === "CRITICAL_ORDER_NOW" ? BRAND.pink : r.urgency === "MODERATE" ? "#d35400" : "#27ae60"
                  }}>
                    {cleanTitle(r.urgency)}
                  </span>
                ),
                "AI Seasonal Logic": <span style={{ fontSize: 12, color: t.textSub }}>{r.reasoning}</span>,
              }))}
              t={t}
              emptyMsg="Recording showroom sales will automatically generate predictive category procurement targets."
            />
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: DEAD STOCK & SLOW MOVING INVENTORY                                   */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "deadstock" && (
        <div>
          {/* Executive Stats Row */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14, marginBottom: 20
          }}>
            <div style={{
              background: t.card, border: `1px solid ${BRAND.pink}33`,
              borderRadius: 12, padding: 18, boxShadow: t.cardShadow
            }}>
              <div style={{ fontSize: 12, color: t.textSub, fontWeight: 600 }}>Slow Moving Items (&gt;45 Days)</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: BRAND.pink, marginTop: 4 }}>
                {deadStockData?.total_slow_items || 0} <span style={{ fontSize: 14, fontWeight: 500 }}>Pieces</span>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>Unsold in display showcase trays</div>
            </div>

            <div style={{
              background: t.card, border: `1px solid rgba(243,156,18,0.3)`,
              borderRadius: 12, padding: 18, boxShadow: t.cardShadow
            }}>
              <div style={{ fontSize: 12, color: t.textSub, fontWeight: 600 }}>Capital Locked in Trays</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#f39c12", marginTop: 4 }}>
                {fmt(deadStockData?.total_capital_locked || 0)}
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>Inventory holding capital</div>
            </div>

            <div style={{
              background: t.card, border: `1px solid ${BRAND.purple}33`,
              borderRadius: 12, padding: 18, boxShadow: t.cardShadow
            }}>
              <div style={{ fontSize: 12, color: t.textSub, fontWeight: 600 }}>Holding Cost Drainage</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: BRAND.purple, marginTop: 4 }}>
                1.5% <span style={{ fontSize: 14, fontWeight: 500 }}>/ month</span>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>Interest + Insurance + Opportunity cost</div>
            </div>
          </div>

          <Card t={t}>
            <CardHeader
              title="Dead Stock Items Identified for Liquidation / Re-Melt"
              t={t}
              actions={<BtnOutline t={t} onClick={loadDeadStock}>Rescan Trays</BtnOutline>}
            />
            <DataTable
              columns={["Item Name", "Category", "Purity", "Gross Wt", "Display Location", "Days in Tray", "Selling Value", "Holding Cost", "AI Recommendation"]}
              rows={(deadStockData?.items || []).map(it => ({
                "Item Name": <strong>{it.name}</strong>,
                "Category": <span>{it.category}</span>,
                "Purity": <span>{it.purity}</span>,
                "Gross Wt": <span>{Number(it.gross_weight).toFixed(3)}g</span>,
                "Display Location": <span>{it.location}</span>,
                "Days in Tray": (
                  <span style={{
                    color: it.days_in_stock > 90 ? BRAND.pink : "#f39c12",
                    fontWeight: 800
                  }}>
                    {it.days_in_stock} Days
                  </span>
                ),
                "Selling Value": <strong>{fmt(it.selling_price)}</strong>,
                "Holding Cost": <span style={{ color: t.textSub }}>{it.holding_cost_impact}</span>,
                "AI Recommendation": (
                  <span style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: it.days_in_stock > 90 ? "rgba(230,59,138,0.15)" : "rgba(59,85,230,0.12)",
                    color: it.days_in_stock > 90 ? BRAND.pink : BRAND.blue
                  }}>
                    {it.ai_recommendation}
                  </span>
                ),
              }))}
              t={t}
              emptyMsg="High Inventory Velocity: Zero dead stock items exceeding 45 days in showcase trays."
            />
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: AI RFM CUSTOMER SEGMENTATION                                         */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "rfm" && (
        <div>
          {/* Segment Cards */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14, marginBottom: 20
          }}>
            <div style={{ background: t.card, border: "1.5px solid rgba(46,204,113,0.3)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 12, color: "#27ae60", fontWeight: 700 }}>VIP Champions</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginTop: 4 }}>
                {rfmData?.summary?.champions_count || 0} <span style={{ fontSize: 13, fontWeight: 500, color: t.textSub }}>Clients</span>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>High spend &gt; ₹5L or 5+ bills</div>
            </div>

            <div style={{ background: t.card, border: `1.5px solid ${BRAND.blue}33`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 12, color: BRAND.blue, fontWeight: 700 }}>Loyal Spenders</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginTop: 4 }}>
                {rfmData?.summary?.loyal_count || 0} <span style={{ fontSize: 13, fontWeight: 500, color: t.textSub }}>Clients</span>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>Repeat buyers &gt; ₹1.5L</div>
            </div>

            <div style={{ background: t.card, border: `1.5px solid ${BRAND.pink}33`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 12, color: BRAND.pink, fontWeight: 700 }}>At-Risk (Dormant &gt;120d)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginTop: 4 }}>
                {rfmData?.summary?.at_risk_count || 0} <span style={{ fontSize: 13, fontWeight: 500, color: t.textSub }}>Clients</span>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>No visit in past 4 months</div>
            </div>

            <div style={{ background: t.card, border: `1.5px solid ${BRAND.purple}33`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 12, color: BRAND.purple, fontWeight: 700 }}>Regular Shoppers</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: t.text, marginTop: 4 }}>
                {rfmData?.summary?.potential_count || 0} <span style={{ fontSize: 13, fontWeight: 500, color: t.textSub }}>Clients</span>
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>Eligible for Monthly Schemes</div>
            </div>
          </div>

          <Card t={t}>
            <CardHeader title="Customer Clustering & Automated WhatsApp Triggers" t={t} />
            <DataTable
              columns={["Customer Name", "Contact", "Current Tier", "Lifetime Spend", "Total Orders", "Last Visit", "AI Cluster", "AI Action"]}
              rows={[
                ...(rfmData?.segments?.vip_champions || []),
                ...(rfmData?.segments?.loyal_spenders || []),
                ...(rfmData?.segments?.at_risk_dormant || []),
                ...(rfmData?.segments?.potential_upgrades || []),
              ].map(c => ({
                "Customer Name": <strong>{c.full_name}</strong>,
                "Contact": <span>{c.phone}</span>,
                "Current Tier": <span>{c.tier || "Standard"}</span>,
                "Lifetime Spend": <strong>{fmt(c.total_spend)}</strong>,
                "Total Orders": <span>{c.total_orders} Bills</span>,
                "Last Visit": <span>{c.days_since_last_purchase === 999 ? "—" : `${c.days_since_last_purchase}d ago`}</span>,
                "AI Cluster": (
                  <span style={{
                    padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
                    background: c.segment.includes("Champion") ? "rgba(46,204,113,0.15)" : c.segment.includes("Risk") ? "rgba(230,59,138,0.15)" : "rgba(59,85,230,0.12)",
                    color: c.segment.includes("Champion") ? "#27ae60" : c.segment.includes("Risk") ? BRAND.pink : BRAND.blue
                  }}>
                    {c.segment}
                  </span>
                ),
                "AI Action": (
                  <button
                    onClick={() => {
                      const text = `Namaste ${c.full_name} ji,\n\nWe have a special festive privilege waiting for you at Ceritage Fine Jewels!\n\n${c.ai_action}.\n\nVisit our showroom this week to explore our new exclusive jewelry designs!`;
                      const phone = (c.phone || "").replace(/\D/g, "");
                      window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(text)}`, "_blank");
                    }}
                    style={{
                      background: "rgba(46,204,113,0.1)", color: "#27ae60",
                      border: "1px solid rgba(46,204,113,0.3)", borderRadius: 6,
                      padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 6
                    }}
                  >
                    WhatsApp ({c.ai_action})
                  </button>
                ),
              }))}
              t={t}
              emptyMsg="Customer segmentation will compute automatically from purchase history."
            />
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: GOLD MARKET TREND & BULLION HEDGING ADVISOR                          */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "goldtrend" && (
        <div>
          {/* Executive Analytics Row */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16, marginBottom: 20
          }}>
            {/* Card 1: Market Trend */}
            <div style={{
              background: t.card, border: `1.5px solid ${BRAND.purple}33`,
              borderRadius: 14, padding: "20px 22px", boxShadow: t.cardShadow
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Market Direction
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <span style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 15, fontWeight: 800,
                  background: (goldTrendData?.trend || "").includes("CORRECTION") ? "rgba(243,156,18,0.15)" : "rgba(46,204,113,0.15)",
                  color: (goldTrendData?.trend || "").includes("CORRECTION") ? "#d35400" : "#27ae60"
                }}>
                  {cleanTitle(goldTrendData?.trend || "Correction Phase")}
                </span>
              </div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>
                Short-term gold price consolidation
              </div>
            </div>

            {/* Card 2: Trading Signal */}
            <div style={{
              background: t.card, border: `1.5px solid ${BRAND.blue}33`,
              borderRadius: 14, padding: "20px 22px", boxShadow: t.cardShadow
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Procurement Action Signal
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <span style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 15, fontWeight: 800,
                  background: "rgba(59,85,230,0.12)", color: BRAND.blue
                }}>
                  {cleanTitle(goldTrendData?.signal || "Accumulate Bullion")}
                </span>
              </div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>
                Recommended strategy for manufacturing stock
              </div>
            </div>

            {/* Card 3: 7-Day Momentum */}
            <div style={{
              background: t.card, border: `1.5px solid ${BRAND.pink}33`,
              borderRadius: 14, padding: "20px 22px", boxShadow: t.cardShadow
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: 0.5 }}>
                7-Day Momentum
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: (goldTrendData?.momentum_7d || "").startsWith("+") ? "#27ae60" : BRAND.pink, marginTop: 6 }}>
                {goldTrendData?.momentum_7d || "-0.8%"}
              </div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>
                Rolling 7-day volatility index
              </div>
            </div>
          </div>

          {/* Macro Strategy Box */}
          <Card t={t}>
            <CardHeader title="Macro Economic Analysis & Bullion Procurement Strategy" t={t} />
            <div style={{ padding: "6px 0 10px 0", fontSize: 14, lineHeight: 1.7 }}>
              <div style={{ marginBottom: 14 }}>
                <strong style={{ color: t.text }}>Market Sentiment:</strong>{" "}
                <span style={{ color: t.textSub }}>{goldTrendData?.market_sentiment || "High Wedding Season Demand & Global Central Bank Gold Buying"}</span>
              </div>

              <div style={{
                background: "rgba(59,85,230,0.08)", border: `1px solid ${BRAND.blue}33`,
                borderRadius: 10, padding: "16px 18px", color: BRAND.blue, fontSize: 14, fontWeight: 700,
                display: "flex", alignItems: "flex-start", gap: 12
              }}>
                <div>
                  <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.8, marginBottom: 2 }}>
                    AI Procurement Recommendation:
                  </div>
                  <div>
                    {goldTrendData?.procurement_advice || "Recommended to hedge 30% of next month's manufacturing bullion requirements via Bhav Cut / Advance Rate Lock."}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
