import { useEffect, useState, useCallback } from "react";
import { BRAND } from "../../theme.js";
import { StatCard, Card, CardHeader, BtnPrimary, BtnOutline, DataTable } from "../../components/ui";
import { apiRequest, formatCurrency } from "../../lib/api";

const KPI_LABELS = [
  { key:"todaySales",     label:"Today's Sales",   color:BRAND.blue },
  { key:"billsToday",     label:"Bills Today",     color:"#2ecc71" },
  { key:"totalCustomers", label:"Total Customers", color:BRAND.purple },
  { key:"pendingRepairs", label:"Pending Repairs", color:BRAND.pink },
  { key:"stockItems",     label:"Stock Items",     color:"#3498db" },
  { key:"goldInStock",    label:"Gold in Stock",   color:BRAND.blue },
];

const QUICK_ACTIONS = [
  { label:"New Bill",         module:"billing",       primary:true },
  { label:"Add Customer",     module:"customers" },
  { label:"New Repair",       module:"repair" },
  { label:"New Order",        module:"orders" },
  { label:"Purchase Entry",   module:"purchase" },
  { label:"Gold Exchange",    module:"gold-exchange" },
  { label:"Issue to Karigar", module:"karigar" },
  { label:"Update Rates",     module:"rates" },
];

// metal tiles config — maps DB column -> display label + color
const METAL_TILES = [
  { key:"rate_22k",      label:"22K Gold",  color:BRAND.blue },
  { key:"rate_24k",      label:"24K Gold",  color:BRAND.purple },
  { key:"rate_18k",      label:"18K Gold",  color:"#3498db" },
  { key:"silver_rate",   label:"Silver",    color:"#95a5a6" },
  { key:"platinum_rate", label:"Platinum",  color:"#bdc3c7" },
];

function fmt(val) {
  const n = Number(val);
  if (!val || !isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

function LiveRatesCard({ t, onNavigate }) {
  const [rates,     setRates]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,     setError]     = useState("");

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/metal-rates/current");
      if (res && res.success && res.isAvailable) {
        setRates({
          rate_24k:      res.liveMarket?.gold24K,
          rate_22k:      res.liveMarket?.gold22K,
          rate_18k:      res.liveMarket?.gold18K,
          silver_rate:   res.liveMarket?.silver999,
          platinum_rate: res.liveMarket?.platinum999,
          created_at:    res.updatedAt,
        });
      } else {
        const legRes = await apiRequest("/rates/current");
        setRates(legRes.data || null);
      }
    } catch (err) {
      setError(err.message || "Rates could not be loaded.");
      setRates(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      await apiRequest("/metal-rates/refresh", { method: "POST" });
      await fetchRates();
      window.dispatchEvent(new Event("metal-rates-updated"));
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const handleUpdate = () => fetchRates();
    window.addEventListener("metal-rates-updated", handleUpdate);
    return () => window.removeEventListener("metal-rates-updated", handleUpdate);
  }, [fetchRates]);

  // format "last updated" timestamp
  let updatedLabel = "—";
  if (rates?.created_at) {
    const d = new Date(rates.created_at);
    updatedLabel = d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (rates?.effective_date) {
    const d = new Date(rates.effective_date);
    updatedLabel = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <Card t={t}>
      <CardHeader
        title="Live Gold & Silver Rates"
        t={t}
        actions={
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {rates && (
              <span style={{ fontSize:11, color:t.textMuted }}>
                Updated: {updatedLabel}
              </span>
            )}
            <BtnOutline
              t={t}
              style={{ padding:"4px 12px", fontSize:12 }}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </BtnOutline>
            <BtnOutline
              t={t}
              style={{ padding:"4px 12px", fontSize:12 }}
              onClick={() => onNavigate("rates")}
            >
              Update
            </BtnOutline>
          </div>
        }
      />

      {loading && (
        <div style={{ textAlign:"center", padding:"24px 16px",
          color:t.textFaint, fontSize:13 }}>
          Loading rates...
        </div>
      )}

      {!loading && error && (
        <div style={{ padding:"12px 16px", color:BRAND.pink, fontSize:13,
          background:`${BRAND.pink}11`, borderRadius:8, border:`1px solid ${BRAND.pink}33` }}>
          {error} —{" "}
          <button onClick={() => fetchRates()} style={{ background:"none", border:"none",
            color:BRAND.purple, cursor:"pointer", fontSize:13, fontFamily:"inherit",
            textDecoration:"underline" }}>retry</button>
        </div>
      )}

      {!loading && !error && !rates && (
        <div style={{ textAlign:"center", padding:"24px 16px",
          color:t.textFaint, fontSize:13,
          border:`1px dashed ${t.borderDash}`, borderRadius:9 }}>
          No rates found. <button onClick={() => onNavigate("rates")}
            style={{ background:"none", border:"none", color:BRAND.purple,
              cursor:"pointer", fontSize:13, fontFamily:"inherit",
              textDecoration:"underline" }}>Add rates →</button>
        </div>
      )}

      {!loading && rates && (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
          {METAL_TILES.map(({ key, label, color }) => {
            const val = fmt(rates[key]);
            return (
              <div key={key} style={{ background:t.card2 || t.card,
                border:`1px solid ${t.borderDash}`, borderRadius:10,
                padding:"12px 14px", textAlign:"center" }}>
                <div style={{ fontSize:10, color:t.textMuted,
                  textTransform:"uppercase", letterSpacing:"0.7px",
                  marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:18, fontWeight:900, color:val ? color : t.textFaint }}>
                  {val ? `₹${val}` : "—"}
                </div>
                <div style={{ fontSize:10, color:t.textFaint, marginTop:3 }}>/gram</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function DashboardHome({ t, onNavigate }) {
  const [kpis, setKpis] = useState({});
  const [occasionKpis, setOccasionKpis] = useState({});
  const [recentBills, setRecentBills] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [kpiRes, billRes, alertRes, occRes] = await Promise.all([
          apiRequest("/dashboard/kpis"),
          apiRequest("/dashboard/recent-bills"),
          apiRequest("/dashboard/alerts"),
          apiRequest("/customers/occasions/kpis").catch(() => ({ data: {} })),
        ]);

        if (ignore) return;

        setKpis(kpiRes.data || {});
        setOccasionKpis(occRes.data || {});
        setRecentBills((billRes.data || []).map((bill) => ({
          "Bill No": bill.invoice_no,
          Customer: bill.customer || "-",
          Amount: formatCurrency(bill.amount),
          "Payment Mode": bill.payment_mode || "-",
          Status: bill.status || "-",
        })));
        setAlerts(alertRes.data || []);
      } catch (err) {
        if (!ignore) setError(err.message || "Dashboard data load nahi ho paya.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboard();
    return () => { ignore = true; };
  }, []);

  const values = {
    todaySales: formatCurrency(kpis.today_sales),
    billsToday: kpis.bills_today ?? 0,
    totalCustomers: kpis.total_customers ?? 0,
    pendingRepairs: kpis.pending_repairs ?? 0,
    stockItems: kpis.stock_items ?? 0,
    goldInStock: kpis.gold_in_stock || "0.00 kg",
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", marginBottom:24,
        flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:21, fontWeight:700, margin:0,
            background:BRAND.grad, WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            Dashboard
          </h2>
          <p style={{ fontSize:12, color:t.textMuted, margin:"5px 0 0" }}>
            Ceritage Jewelry ERP - Admin Panel
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <BtnOutline t={t} onClick={() => onNavigate("rates")}>Update Rates</BtnOutline>
          <BtnPrimary onClick={() => onNavigate("billing")}>New Invoice</BtnPrimary>
        </div>
      </div>

      {/* KPI stat cards */}
      <div style={{ display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",
        gap:14, marginBottom:24 }}>
        {KPI_LABELS.map((k) => (
          <StatCard
            key={k.key}
            label={k.label}
            value={loading ? "..." : values[k.key]}
            color={k.color}
            t={t}
          />
        ))}
      </div>

      {error && (
        <Card t={t} style={{ borderColor:BRAND.pink }}>
          <div style={{ color:BRAND.pink, fontSize:13 }}>{error}</div>
        </Card>
      )}

      {/* Quick actions + Alerts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:16, marginBottom:18 }}>
        <Card t={t}>
          <CardHeader title="Quick Actions" t={t} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {QUICK_ACTIONS.map((a) => (
              a.primary
                 ? <BtnPrimary key={a.module} onClick={() => onNavigate(a.module)}>{a.label}</BtnPrimary>
                : <BtnOutline key={a.module} t={t} onClick={() => onNavigate(a.module)}>{a.label}</BtnOutline>
            ))}
          </div>
        </Card>

        <Card t={t}>
          <CardHeader title="Alerts & Notifications" t={t} />
          {alerts.length === 0 ? (
            <div style={{ textAlign:"center", padding:"28px 16px",
              color:t.textFaint, fontSize:13, lineHeight:1.7,
              border:`1px dashed ${t.borderDash}`, borderRadius:9 }}>
              {loading ? "Loading alerts..." : "No alerts right now."}
            </div>
          ) : (
            <div style={{ display:"grid", gap:10 }}>
              {alerts.map((alert, index) => (
                <div key={`${alert.type}-${index}`} style={{
                  border:`1px solid ${t.borderDash}`,
                  borderLeft:`3px solid ${alert.color || BRAND.purple}`,
                  borderRadius:8,
                  padding:"10px 12px",
                  background:t.card2 || t.card,
                }}>
                  <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{alert.title}</div>
                  <div style={{ fontSize:12, color:t.textSub, marginTop:3 }}>{alert.meta}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Customer Occasions & Milestones Card ── */}
      <div style={{ marginBottom:20 }}>
        <Card t={t}>
          <CardHeader
            title="🎂 Customer Milestones & Occasion Reminders"
            t={t}
            actions={
              <BtnOutline t={t} onClick={() => onNavigate("customers")} style={{ padding:"4px 12px", fontSize:12 }}>
                View All Reminders →
              </BtnOutline>
            }
          />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12 }}>
            <div
              onClick={() => onNavigate("customers")}
              style={{
                background:t.card2||t.card, border:`1px solid ${t.borderDash}`,
                borderRadius:10, padding:"12px 14px", cursor:"pointer", transition:"transform 0.15s ease"
              }}
            >
              <div style={{ fontSize:11, color:t.textMuted }}>🎂 Birthdays Today</div>
              <div style={{ fontSize:22, fontWeight:800, color:BRAND.purple, marginTop:4 }}>
                {occasionKpis.birthdaysToday ?? 0}
              </div>
              <div style={{ fontSize:10, color:t.textFaint, marginTop:2 }}>Actionable today</div>
            </div>

            <div
              onClick={() => onNavigate("customers")}
              style={{
                background:t.card2||t.card, border:`1px solid ${t.borderDash}`,
                borderRadius:10, padding:"12px 14px", cursor:"pointer"
              }}
            >
              <div style={{ fontSize:11, color:t.textMuted }}>💍 Anniversaries Today</div>
              <div style={{ fontSize:22, fontWeight:800, color:"#e67e22", marginTop:4 }}>
                {occasionKpis.anniversariesToday ?? 0}
              </div>
              <div style={{ fontSize:10, color:t.textFaint, marginTop:2 }}>Actionable today</div>
            </div>

            <div
              onClick={() => onNavigate("customers")}
              style={{
                background:t.card2||t.card, border:`1px solid ${t.borderDash}`,
                borderRadius:10, padding:"12px 14px", cursor:"pointer"
              }}
            >
              <div style={{ fontSize:11, color:t.textMuted }}>📅 Next 7 Days</div>
              <div style={{ fontSize:22, fontWeight:800, color:BRAND.blue, marginTop:4 }}>
                {occasionKpis.upcoming7Days ?? 0}
              </div>
              <div style={{ fontSize:10, color:t.textFaint, marginTop:2 }}>Upcoming celebrations</div>
            </div>

            <div
              onClick={() => onNavigate("customers")}
              style={{
                background:t.card2||t.card, border:`1px solid ${t.borderDash}`,
                borderRadius:10, padding:"12px 14px", cursor:"pointer"
              }}
            >
              <div style={{ fontSize:11, color:t.textMuted }}>⭐ VIP Occasions</div>
              <div style={{ fontSize:22, fontWeight:800, color:"#f1c40f", marginTop:4 }}>
                {occasionKpis.vipOccasionsThisMonth ?? 0}
              </div>
              <div style={{ fontSize:10, color:t.textFaint, marginTop:2 }}>Gold & Platinum members</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Live rates card ── */}
      <div style={{ marginBottom:18 }}>
        <LiveRatesCard t={t} onNavigate={onNavigate} />
      </div>

      {/* Recent bills */}
      <Card t={t}>
        <CardHeader title="Recent Bills"
          actions={<BtnOutline t={t} onClick={() => onNavigate("billing")} style={{padding:"5px 12px",fontSize:12}}>View All</BtnOutline>}
          t={t} />
        <DataTable
          columns={["Bill No","Customer","Amount","Payment Mode","Status"]}
          rows={recentBills}
          t={t}
          emptyMsg={loading ? "Loading recent bills..." : "No recent bills found"}
        />
      </Card>
    </div>
  );
}
