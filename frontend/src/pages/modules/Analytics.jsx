import { useEffect, useState, useCallback, useMemo } from "react";
import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable, BtnPrimary, BtnOutline, BtnSm, Select } from "../../components/ui";
import { apiRequest, formatCurrency } from "../../lib/api";

const TABS = [
  { id:"daily",     label:"Daily Sales" },
  { id:"monthly",   label:"Monthly Sales" },
  { id:"yearly",    label:"Yearly Sales" },
  { id:"best",      label:"Best Products" },
  { id:"lowstock",  label:"Low Stock" },
  { id:"customers", label:"Customer" },
  { id:"profit",    label:"Profit" },
  { id:"branch",    label:"Branch" },
  { id:"employee",  label:"Employee" },
];

const TABLE_COLUMNS = {
  daily: ["Date","Bills","Revenue","Returns","Net Sales","Cash","UPI","Card","Share"],
  monthly: ["Month","Revenue","Cost","Profit","Margin","Bills","MoM Growth","Share"],
  yearly: ["Year","Revenue","Cost","Profit","Margin","Bills"],
  best: ["#","Product","Category","Units Sold","Revenue","Margin","Revenue Share"],
  lowstock: ["SKU","Product","Category","Purity","Stock","Min Stock","Status"],
  customers: ["#","Customer","Tier","Total Spent","Visits","Avg/Visit","Last Visit"],
  profit: ["Month","Revenue","COGS","Gross Profit","OpEx","Net Profit","Margin"],
  branch: ["Branch","Sales","Bills","Customers","Stock Value","Staff"],
  employee: ["#","Employee","Role","Sales Achieved","Target","Bills","Customers","Avg Ticket","Rating"],
};

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function mapRows(tab, rawRows) {
  return rawRows.map((row) => {
    if (tab === "daily") {
      return {
        Date: row.date,
        Bills: row.bills,
        Revenue: formatCurrency(row.revenue),
        Returns: formatCurrency(row.returns),
        "Net Sales": formatCurrency(row.net_sales),
        Cash: formatCurrency(row.cash),
        UPI: formatCurrency(row.upi),
        Card: formatCurrency(row.card),
        Share: percent(row.share),
      };
    }
    if (tab === "monthly") {
      return {
        Month: row.month,
        Revenue: formatCurrency(row.revenue),
        Cost: formatCurrency(row.cost),
        Profit: formatCurrency(row.profit),
        Margin: percent(row.margin),
        Bills: row.bills,
        "MoM Growth": percent(row.mom_growth),
        Share: percent(row.share),
      };
    }
    if (tab === "yearly") {
      return {
        Year: row.year,
        Revenue: formatCurrency(row.revenue),
        Cost: formatCurrency(row.cost),
        Profit: formatCurrency(row.profit),
        Margin: percent(row.margin),
        Bills: row.bills,
      };
    }
    if (tab === "best") {
      return {
        "#": row.rank,
        Product: row.product,
        Category: row.category,
        "Units Sold": row.units_sold,
        Revenue: formatCurrency(row.revenue),
        Margin: percent(row.margin),
        "Revenue Share": percent(row.revenue_share),
      };
    }
    if (tab === "lowstock") {
      return {
        SKU: row.sku,
        Product: row.name,
        Category: row.product_category || "-",
        Purity: row.purity || "-",
        Stock: row.stock_qty,
        "Min Stock": row.min_stock,
        Status: row.stock_status,
      };
    }
    if (tab === "customers") {
      return {
        "#": row.rank,
        Customer: row.customer,
        Tier: row.tier,
        "Total Spent": formatCurrency(row.total_spent),
        Visits: row.visits,
        "Avg/Visit": formatCurrency(row.avg_visit),
        "Last Visit": row.last_visit,
      };
    }
    if (tab === "branch") {
      return {
        Branch: row.branch,
        Sales: formatCurrency(row.sales),
        Bills: row.bills,
        Customers: row.customers,
        "Stock Value": formatCurrency(row.stock_value),
        Staff: row.staff,
      };
    }
    if (tab === "employee") {
      return {
        "#": row.rank,
        Employee: row.employee,
        Role: row.role || "Staff",
        "Sales Achieved": formatCurrency(row.sales_achieved),
        Target: formatCurrency(row.target),
        Bills: row.bills,
        Customers: row.customers,
        "Avg Ticket": formatCurrency(row.avg_ticket),
        Rating: row.rating || "Active",
      };
    }

    return {
      Month: row.month,
      Revenue: formatCurrency(row.revenue),
      COGS: formatCurrency(row.cogs),
      "Gross Profit": formatCurrency(row.gross_profit),
      OpEx: formatCurrency(row.opex),
      "Net Profit": formatCurrency(row.net_profit),
      Margin: percent(row.margin),
    };
  });
}

// ── Visual Interactive Mini-Chart Component ──
function AnalyticsVisualizer({ tab, rawData, t }) {
  if (!rawData || rawData.length === 0) {
    return (
      <div style={{ height:140, display:"flex", alignItems:"center", justifyContent:"center",
        background:t.card2||t.card, borderRadius:10, border:`1px dashed ${t.borderDash}`, marginBottom:16 }}>
        <span style={{ fontSize:12, color:t.textFaint }}>No trend records available for visual chart</span>
      </div>
    );
  }

  // Bar chart for daily, monthly, profit, best, branch
  let chartItems = [];
  if (tab === "daily") {
    chartItems = rawData.slice(0, 14).reverse().map(r => ({ label: r.date?.slice(5), val: r.revenue, sub: `₹${r.revenue}` }));
  } else if (tab === "monthly" || tab === "profit") {
    chartItems = rawData.slice(0, 12).reverse().map(r => ({ label: r.month, val: r.revenue, sub: `₹${r.revenue}` }));
  } else if (tab === "yearly") {
    chartItems = rawData.map(r => ({ label: String(r.year), val: r.revenue, sub: `₹${r.revenue}` }));
  } else if (tab === "best") {
    chartItems = rawData.slice(0, 7).map(r => ({ label: r.product?.slice(0, 12), val: r.revenue, sub: `₹${r.revenue}` }));
  } else if (tab === "branch") {
    chartItems = rawData.map(r => ({ label: r.branch?.slice(0, 12), val: r.sales, sub: `₹${r.sales}` }));
  } else if (tab === "customers") {
    chartItems = rawData.slice(0, 7).map(r => ({ label: r.customer?.slice(0, 10), val: r.total_spent, sub: `₹${r.total_spent}` }));
  } else if (tab === "employee") {
    chartItems = rawData.slice(0, 7).map(r => ({ label: r.employee?.slice(0, 10), val: r.sales_achieved, sub: `₹${r.sales_achieved}` }));
  }

  if (chartItems.length === 0) return null;

  const maxVal = Math.max(...chartItems.map(c => Number(c.val || 0)), 1);

  return (
    <div style={{ background:t.card2||t.card, borderRadius:10, padding:"16px 20px",
      border:`1px solid ${t.borderDash}`, marginBottom:18 }}>
      <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:t.textMuted,
        letterSpacing:"0.6px", marginBottom:14, display:"flex", justifyContent:"space-between" }}>
        <span>Performance & Distribution Trend</span>
        <span style={{ color:BRAND.purple }}>Real-Time Data Visualization</span>
      </div>

      <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:120, paddingBottom:8 }}>
        {chartItems.map((item, idx) => {
          const heightPct = Math.max(8, Math.round((Number(item.val || 0) / maxVal) * 100));
          return (
            <div key={idx} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%", justifyContent:"flex-end" }}>
              <div style={{ fontSize:9, color:t.textMuted, marginBottom:4, whiteSpace:"nowrap" }}>
                {item.val > 0 ? (item.val > 1000 ? `${(item.val/1000).toFixed(0)}k` : item.val) : "0"}
              </div>
              <div
                title={`${item.label}: ${item.sub}`}
                style={{
                  width:"100%",
                  maxWidth:36,
                  height:`${heightPct}%`,
                  background: idx === chartItems.length - 1 ? BRAND.gradBtn : (idx % 2 === 0 ? BRAND.purple : BRAND.blue),
                  borderRadius:"4px 4px 0 0",
                  transition:"height 0.4s ease",
                  opacity: item.val > 0 ? 0.9 : 0.25,
                }}
              />
              <div style={{ fontSize:10, color:t.textFaint, marginTop:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:50 }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Analytics({ t }) {
  const [tab, setTab] = useState("daily");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [summary, setSummary] = useState({});
  const [rawTableData, setRawTableData] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (activeTab = tab, yr = selectedYear) => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, tableRes] = await Promise.all([
        apiRequest(`/analytics/summary?year=${yr}`),
        apiRequest(`/analytics/${activeTab}?year=${yr}`),
      ]);
      setSummary(summaryRes.data || {});
      const raw = tableRes.data || [];
      setRawTableData(raw);
      setRows(mapRows(activeTab, raw));
    } catch (err) {
      setError(err.message || "Failed to load analytics data.");
      setRawTableData([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedYear]);

  useEffect(() => {
    loadAnalytics(tab, selectedYear);
  }, [tab, selectedYear, loadAnalytics]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (!rows || rows.length === 0) return;
    const cols = TABLE_COLUMNS[tab] || Object.keys(rows[0]);
    const headerLine = cols.join(",");
    const csvLines = rows.map(r => cols.map(c => `"${String(r[c] || '').replace(/"/g, '""')}"`).join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headerLine, ...csvLines].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ceritage_Analytics_${tab}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <PageHeader
        title="Analytics Dashboard"
        subtitle="End-to-End Business Performance · Daily · Monthly · Yearly Sales · Products · Customers · Profit · Branches · Staff"
        t={t}
        actions={<>
          <Select
            t={t}
            style={{ width:160 }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2026">This Year (2026)</option>
            <option value="2025">Last Year (2025)</option>
            <option value="2024">Year 2024</option>
          </Select>
          <BtnOutline t={t} onClick={handleExportCSV} disabled={rows.length === 0}>
            ⤓ Export CSV
          </BtnOutline>
          <BtnPrimary onClick={() => loadAnalytics(tab, selectedYear)} disabled={loading}>
            {loading ? "Loading..." : "↻ Refresh"}
          </BtnPrimary>
        </>}
      />

      {/* ── Summary KPI Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Annual Revenue"   value={loading ? "..." : formatCurrency(summary.annual_revenue)} color={BRAND.blue}   t={t} />
        <StatCard label="Profit Margin"    value={loading ? "..." : percent(summary.profit_margin)}         color="#2ecc71"      t={t} />
        <StatCard label="Today's Sales"    value={loading ? "..." : formatCurrency(summary.today_sales)}    color={BRAND.purple} t={t} />
        <StatCard label="Total Customers"  value={loading ? "..." : summary.total_customers ?? 0}           color={BRAND.blue}   t={t} />
        <StatCard label="Low/Out of Stock" value={loading ? "..." : summary.low_out_stock ?? 0}            color={BRAND.pink}   t={t} />
        <StatCard label="Active Branches"  value={loading ? "..." : summary.active_branches ?? 0}           color="#3498db"      t={t} />
      </div>

      {error && (
        <Card t={t} style={{ borderColor:BRAND.pink, marginBottom:16 }}>
          <div style={{ color:BRAND.pink, fontSize:13 }}>⚠ {error}</div>
        </Card>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      <Card t={t}>
        <CardHeader
          title={`${tab.charAt(0).toUpperCase()+tab.slice(1)} Analytics (${selectedYear})`}
          t={t}
          actions={
            <BtnSm t={t} onClick={handleExportCSV} disabled={rows.length === 0}>
              Export {tab.toUpperCase()}
            </BtnSm>
          }
        />

        {/* ── Interactive Trend Chart ── */}
        <AnalyticsVisualizer tab={tab} rawData={rawTableData} t={t} />

        {/* ── Tabular Data ── */}
        <DataTable
          columns={TABLE_COLUMNS[tab] || TABLE_COLUMNS.profit}
          rows={rows}
          t={t}
          emptyMsg={loading ? "Loading live analytics from database..." : `No ${tab} transactions found for ${selectedYear}`}
        />
      </Card>
    </div>
  );
}
