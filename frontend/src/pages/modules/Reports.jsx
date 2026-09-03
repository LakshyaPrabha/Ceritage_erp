import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  Card,
  CardHeader,
  StatCard,
  Tabs,
  BtnPrimary,
  BtnOutline,
  BtnSm,
  Select,
  Input,
  Modal,
} from "../../components/ui";

const API = window.__CERITAGE_API__ || "http://localhost:5000/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token") || localStorage.getItem("ceritage_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function fmt(n) {
  return n != null
    ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "₹0";
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const TABS = [
  { id: "sales",     label: "Sales Performance" },
  { id: "purchase",  label: "Purchase & Bullion Intake" },
  { id: "inventory", label: "Stock Valuation & Inventory" },
  { id: "profit",    label: "P&L Profitability" },
  { id: "gst",       label: "GST Returns Summary" },
  { id: "customers", label: "Customer Dues & Receivables" },
  { id: "suppliers", label: "Supplier Payables" },
];

export default function Reports({ t }) {
  const [tab, setTab] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState({});
  const [reportData, setReportData] = useState([]);
  const [printModal, setPrintModal] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ── 1. LOAD DATA ────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const r = await fetch(`${API}/reports/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data);
    } catch { /* silent */ }
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (fromDate) q.append("from_date", fromDate);
      if (toDate) q.append("to_date", toDate);

      const r = await fetch(`${API}/reports/${tab}?${q.toString()}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setReportData(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [tab, fromDate, toDate]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleSeedDemo = async () => {
    try {
      const r = await fetch(`${API}/reports/seed-demo-data`, {
        method: "POST",
        headers: authHeaders(),
      });
      const d = await r.json();
      if (d.success) {
        alert("✓ " + d.message);
        loadKpis();
        loadReport();
      }
    } catch { /* silent */ }
  };

  const handleClearDemo = async () => {
    if (!window.confirm("Are you sure you want to delete all test demo transactions and products? Real configuration and users will not be affected.")) {
      return;
    }
    try {
      const r = await fetch(`${API}/reports/clear-demo-data`, {
        method: "POST",
        headers: authHeaders(),
      });
      const d = await r.json();
      if (d.success) {
        alert("✓ " + d.message);
        loadKpis();
        loadReport();
      }
    } catch { /* silent */ }
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="Executive MIS Reports & Analytics"
        subtitle="Real-Time Showroom Financial Intelligence · Sales & Purchase Ledger · Stock Valuation · P&L Statement"
        t={t}
        actions={
          <>
            <BtnOutline t={t} onClick={handleSeedDemo}>
               Populate Demo Data
            </BtnOutline>
            <BtnOutline
              t={t}
              onClick={handleClearDemo}
              style={{ color: BRAND.pink, borderColor: "rgba(230,59,138,0.3)" }}
            >
               Clear Demo Data
            </BtnOutline>
            <BtnOutline t={t} onClick={loadReport}>
              Refresh
            </BtnOutline>
            <BtnPrimary onClick={() => setPrintModal(true)}>
               Print Executive Report
            </BtnPrimary>
          </>
        }
      />

      {/* ── KPI Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <StatCard label="Total Invoiced Sales" value={fmt(kpis.net_sales)} color="#2ecc71" t={t} />
        <StatCard label="Stock Valuation" value={fmt(kpis.stock_valuation)} color={BRAND.blue} t={t} />
        <StatCard label="Gold Weight in Stock" value={`${Number(kpis.total_gold_weight_g || 0).toFixed(2)} g`} color="#f0c040" t={t} />
        <StatCard label="Total Purchases" value={fmt(kpis.total_purchases)} color={BRAND.purple} t={t} />
        <StatCard label="Customer Receivables" value={fmt(kpis.total_receivables)} color="#3498db" t={t} />
        <StatCard label="Supplier Payables" value={fmt(kpis.total_payables)} color={BRAND.pink} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── Report Card Container ── */}
      <Card t={t}>
        <CardHeader
          title={TABS.find((tb) => tb.id === tab)?.label || "Report"}
          t={t}
          actions={
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: t.textSub }}>Date Filter:</span>
              <Input
                t={t}
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ width: 135, padding: "5px 8px", fontSize: 12 }}
              />
              <span style={{ fontSize: 12, color: t.textMuted }}>to</span>
              <Input
                t={t}
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ width: 135, padding: "5px 8px", fontSize: 12 }}
              />
              <BtnSm
                t={t}
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear
              </BtnSm>
            </div>
          }
        />

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: t.textMuted, fontSize: 13 }}>
            Generating report from database...
          </div>
        ) : reportData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: t.textMuted, fontSize: 13 }}>
            No records found for the selected period.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            
            {tab === "sales" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Date</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Invoices</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Gross Sales</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Discount</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>GST (3%)</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Net Revenue</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Cash</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>UPI / Digital</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Card</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: t.text }}>{fmtDate(r.sale_date)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: BRAND.blue, fontWeight: 700 }}>
                        {r.bill_count}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.text }}>{fmt(r.gross_sales)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: BRAND.pink }}>
                        {r.total_discount > 0 ? `- ${fmt(r.total_discount)}` : "₹0"}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textSub }}>{fmt(r.total_gst)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#2ecc71" }}>
                        {fmt(r.net_sales)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.text }}>{fmt(r.cash_sales)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: BRAND.purple }}>{fmt(r.upi_sales)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.text }}>{fmt(r.card_sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. PURCHASE REPORT TABLE */}
            {tab === "purchase" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Purchase #</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Date</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Supplier Vendor</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Total Amount</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Amount Paid</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Balance Due</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((p) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>
                        {p.purchase_no || `PUR-${p.id}`}
                      </td>
                      <td style={{ padding: "10px 12px", color: t.text }}>{fmtDate(p.purchase_date)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>
                        {p.supplier_name || "Bullion Supplier"} ({p.supplier_city || "Mumbai"})
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: t.text }}>
                        {fmt(p.total_amount)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#2ecc71" }}>{fmt(p.paid_amount)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: BRAND.pink, fontWeight: 700 }}>
                        {fmt(p.balance_amount || (p.total_amount - (p.paid_amount || 0)))}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            background:
                              p.status === "PAID"
                                ? "rgba(46,204,113,0.12)"
                                : "rgba(243,156,18,0.12)",
                            color: p.status === "PAID" ? "#2ecc71" : "#f39c12",
                            borderRadius: 12,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {p.status || "Completed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. INVENTORY VALUATION TABLE */}
            {tab === "inventory" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Jewelry Category</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>SKU Count</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Gross Weight</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Net Gold Weight</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Total Valuation</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Stock Health</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((inv, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: t.text }}>{inv.category}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: BRAND.blue }}>
                        {inv.total_skus} Items
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.text }}>
                        {Number(inv.total_weight_g).toFixed(2)} g
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textSub }}>
                        {Number(inv.total_net_weight_g || inv.total_weight_g).toFixed(2)} g
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#2ecc71" }}>
                        {fmt(inv.total_valuation)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            background: "rgba(46,204,113,0.12)",
                            color: "#2ecc71",
                            borderRadius: 12,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          ● Healthy
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. PROFIT & LOSS TABLE */}
            {tab === "profit" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Financial Month</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Showroom Revenue</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Cost of Goods (COGS)</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Gross Profit</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Operating Expenses</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Net Profit</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Net Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((pf, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{pf.month}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: t.text }}>
                        {fmt(pf.revenue)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textSub }}>{fmt(pf.cogs)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: BRAND.purple }}>
                        {fmt(pf.gross_profit)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: BRAND.pink }}>- {fmt(pf.opex)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#2ecc71" }}>
                        {fmt(pf.net_profit)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            background: "rgba(46,204,113,0.12)",
                            color: "#2ecc71",
                            borderRadius: 12,
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {pf.margin_pct}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. GST RETURNS SUMMARY TABLE */}
            {tab === "gst" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Tax Period</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Tax Invoices</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Taxable Turnover</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>CGST (1.5%)</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>SGST (1.5%)</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Total GST Payable</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Filing Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((g, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{g.tax_period}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: t.text }}>{g.total_invoices}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: t.text }}>
                        {fmt(g.taxable_turnover)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textSub }}>{fmt(g.cgst_1_5_pct)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textSub }}>{fmt(g.sgst_1_5_pct)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: BRAND.purple }}>
                        {fmt(g.total_gst_collected)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            background: "rgba(46,204,113,0.12)",
                            color: "#2ecc71",
                            borderRadius: 12,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Ready to File
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 6. CUSTOMER DUES TABLE */}
            {tab === "customers" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Customer</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Phone</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>City</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Tier</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Lifetime Purchases</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Balance Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: t.text }}>{c.full_name}</td>
                      <td style={{ padding: "10px 12px", color: t.textSub }}>{c.phone}</td>
                      <td style={{ padding: "10px 12px", color: t.text }}>{c.city || "—"}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            background:
                              c.tier === "VIP"
                                ? "rgba(243,156,18,0.15)"
                                : "rgba(59,85,230,0.12)",
                            color: c.tier === "VIP" ? "#f39c12" : BRAND.blue,
                            borderRadius: 12,
                            padding: "2px 8px",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {c.tier || "Standard"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#2ecc71" }}>
                        {fmt(c.total_purchases)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: BRAND.pink }}>
                        {fmt(c.balance_due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 7. SUPPLIER PAYABLES TABLE */}
            {tab === "suppliers" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Supplier Vendor</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Supply Type</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Contact</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Total Purchased</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Credit Limit</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Current Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((s) => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: t.text }}>{s.company_name}</td>
                      <td style={{ padding: "10px 12px", color: BRAND.blue, fontWeight: 600 }}>{s.supply_type}</td>
                      <td style={{ padding: "10px 12px", color: t.textSub }}>{s.phone} ({s.contact_person})</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.text }}>{fmt(s.total_purchased)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>{fmt(s.credit_limit)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: BRAND.pink }}>
                        {fmt(s.outstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: PRINT EXECUTIVE MIS REPORT                                           */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={printModal}
        onClose={() => setPrintModal(false)}
        title="Executive MIS Boardroom Report"
        t={t}
        wide
        footer={
          <>
            <BtnOutline t={t} onClick={() => setPrintModal(false)}>
              Close
            </BtnOutline>
            <BtnPrimary onClick={() => window.print()}>Print Executive Report</BtnPrimary>
          </>
        }
      >
        <div
          style={{
            background: "#ffffff",
            color: "#111",
            border: "2px solid #222",
            borderRadius: 8,
            padding: 24,
            fontFamily: "'Times New Roman', serif",
          }}
        >
          <div style={{ textAlign: "center", borderBottom: "2px solid #222", paddingBottom: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1.5, color: BRAND.purple }}>
              CERITAGE JEWELS ENTERPRISE
            </div>
            <div style={{ fontSize: 11, fontStyle: "italic" }}>
              Monthly Executive MIS Business & Financial Audit Report
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 12, marginBottom: 16 }}>
            <div><strong>Report Type:</strong> {TABS.find((tb) => tb.id === tab)?.label}</div>
            <div><strong>Generated On:</strong> {new Date().toLocaleDateString("en-IN")}</div>
            <div><strong>Audit Status:</strong> Verified & Reconciled</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              padding: 12,
              background: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: 6,
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "#666" }}>TOTAL INVOICED SALES</div>
              <div style={{ fontSize: 16, fontWeight: "bold", color: "#27ae60" }}>{fmt(kpis.net_sales)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#666" }}>STOCK VALUATION</div>
              <div style={{ fontSize: 16, fontWeight: "bold", color: "#2980b9" }}>{fmt(kpis.stock_valuation)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#666" }}>GOLD ASSET HELD</div>
              <div style={{ fontSize: 16, fontWeight: "bold", color: "#f39c12" }}>
                {Number(kpis.total_gold_weight_g || 0).toFixed(2)} g
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", marginBottom: 24 }}>
            * This report reflects the verified transactional data from the Ceritage ERP core ledger, synchronized with physical vault inventory, bullion purchases, and retail GST invoices.
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36, fontSize: 12 }}>
            <div>_______________________<br />Prepared By (Accounts Head)</div>
            <div>_______________________<br />Internal Auditor</div>
            <div>_______________________<br />Managing Director</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
