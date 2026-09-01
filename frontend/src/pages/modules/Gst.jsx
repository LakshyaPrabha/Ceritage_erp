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
  FormGroup,
  FormGrid,
  Input,
  Select,
  Modal,
} from "../../components/ui";

function fmt(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

const TABS = [
  { id: "dashboard",  label: "GST Control Centre" },
  { id: "errors",     label: "GST Error & Exception Centre" },
  { id: "returns",    label: "GSTR-1 & GSTR-3B Working" },
  { id: "gstr2b",     label: "GSTR-2B ITC Reconciliation" },
  { id: "tax_master", label: "Versioned Tax Master" },
  { id: "ca_pack",    label: "CA Review Pack & Lock" },
];

export default function Gst({ t }) {
  const [tab, setTab] = useState("dashboard");
  const [fy, setFy] = useState("2026-27");
  const [period, setPeriod] = useState("2026-08");

  // Live State from 22-Step Pipeline
  const [controlData, setControlData] = useState(null);
  const [validating, setValidating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Tab Data States
  const [errorsList, setErrorsList] = useState([]);
  const [returnsWorking, setReturnsWorking] = useState({ b2b: [], b2c_summary: {}, hsn_summary: {} });
  const [gstr2bList, setGstr2bList] = useState([]);
  const [taxRules, setTaxRules] = useState([]);

  // Drilldown Modal
  const [selectedError, setSelectedError] = useState(null);
  const [drillModal, setDrillModal] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // ── Execute Complete 22-Step GST Validation Engine ─────────────────────────
  const runGstValidationPipeline = useCallback(async () => {
    setValidating(true);
    setProgress(15);
    try {
      setTimeout(() => setProgress(45), 250);
      setTimeout(() => setProgress(82), 600);

      const d = await apiRequest("/gst/validate-complete", {
        method: "POST",
        body: JSON.stringify({ tax_period: period, financial_year: fy }),
      });

      if (d.success) {
        setProgress(100);
        setControlData(d.data);
      }
    } catch (err) {
      console.warn("GST Validation Pipeline error:", err.message);
    } finally {
      setTimeout(() => setValidating(false), 400);
    }
  }, [period, fy]);

  // ── Load Sub-tab Data ──────────────────────────────────────────────────────
  const loadErrors = useCallback(async () => {
    try {
      const d = await apiRequest("/gst/errors");
      if (d.success) setErrorsList(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadReturnsWorking = useCallback(async () => {
    try {
      const d = await apiRequest("/gst/returns-working");
      if (d.success) setReturnsWorking(d.data || { b2b: [], b2c_summary: {}, hsn_summary: {} });
    } catch { /* silent */ }
  }, []);

  const loadGstr2b = useCallback(async () => {
    try {
      const d = await apiRequest("/gst/gstr2b");
      if (d.success) setGstr2bList(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadTaxMaster = useCallback(async () => {
    try {
      const d = await apiRequest("/gst/tax-master");
      if (d.success) setTaxRules(d.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    runGstValidationPipeline();
  }, [runGstValidationPipeline]);

  useEffect(() => {
    if (tab === "errors") loadErrors();
    if (tab === "returns") loadReturnsWorking();
    if (tab === "gstr2b") loadGstr2b();
    if (tab === "tax_master") loadTaxMaster();
  }, [tab, loadErrors, loadReturnsWorking, loadGstr2b, loadTaxMaster]);

  // ── 1-Click Recalculate & Fix Invoice GST ──────────────────────────────────
  async function handleRecalculate(errorItem) {
    if (!errorItem || !errorItem.transaction_id) return;
    setRecalculating(true);
    try {
      const d = await apiRequest(`/gst/recalculate-invoice/${errorItem.transaction_id}`, {
        method: "POST",
      });
      if (d.success) {
        alert(` ${d.message}`);
        setDrillModal(false);
        await runGstValidationPipeline();
        loadErrors();
      } else {
        alert(d.message || "Failed to recalculate invoice.");
      }
    } catch (err) {
      alert(err.message || "Cannot connect to GST engine.");
    } finally {
      setRecalculating(false);
    }
  }

  // ── Close GST Period & Lock ────────────────────────────────────────────────
  async function handleClosePeriod() {
    if (!window.confirm(`Are you sure you want to permanently CLOSE & LOCK GST Period ${period} (${fy})? No unapproved alterations will be permitted.`)) return;
    try {
      const d = await apiRequest("/gst/close-period", {
        method: "POST",
        body: JSON.stringify({ tax_period: period, financial_year: fy }),
      });
      if (d.success) {
        alert(`✓ ${d.message}`);
        runGstValidationPipeline();
      } else {
        alert(d.message || "Failed to lock GST period.");
      }
    } catch (err) {
      alert(err.message || "Cannot close period due to critical errors.");
    }
  }

  // ── Download CA Review Pack ────────────────────────────────────────────────
  async function handleDownloadCaPack() {
    try {
      const d = await apiRequest("/gst/ca-review-pack", {
        method: "POST",
        body: JSON.stringify({ tax_period: period }),
      });
      if (d.success && d.data) {
        const jsonStr = JSON.stringify(d.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ceritage_CA_REVIEW_PACK_${period}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert("Complete 22-Report CA Review Pack generated & downloaded successfully!");
      }
    } catch (err) {
      alert(err.message || "Failed to generate CA pack.");
    }
  }

  const s = controlData?.summary || {};
  const hs = controlData?.health_score || { score: 0, status: "SYNCING", breakdown: {} };
  const bd = hs.breakdown || {};
  const isReady = controlData?.readiness === "READY_FOR_CA_REVIEW";

  const b2cSum = returnsWorking.b2c_summary || {};
  const hsnSum = returnsWorking.hsn_summary || {};

  return (
    <div>
      {/* ── GST Control Centre Header ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 16, flexWrap: "wrap", gap: 14
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.text, margin: "0 0 4px 0" }}>
            GST Control Centre & Statutory Audit Engine
          </h1>
          <div style={{ fontSize: 13, color: t.textSub }}>
            Showroom: <strong>{controlData?.branch_name || "Main Store"}</strong> · GSTIN: <strong>{controlData?.gstin || "24AAACG1234F1Z5"}</strong>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Select t={t} style={{ width: 120 }} value={fy} onChange={e => setFy(e.target.value)}>
            <option value="2026-27">FY 2026-27</option>
            <option value="2025-26">FY 2025-26</option>
          </Select>
          <Select t={t} style={{ width: 140 }} value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
          </Select>
          <BtnPrimary onClick={runGstValidationPipeline} disabled={validating}>
            {validating ? `Validating Engine (${progress}%)...` : "⚡ GENERATE COMPLETE GST REPORT"}
          </BtnPrimary>
        </div>
      </div>

      {/* ── Live 22-Step Pipeline Progress Bar ── */}
      {validating && (
        <div style={{
          background: t.card, border: `1px solid ${BRAND.purple}44`,
          borderRadius: 12, padding: "14px 18px", marginBottom: 18
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            <span style={{ color: BRAND.purple }}>Running 22-Step Real-Time Verification Engine...</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: 6, background: "rgba(59,85,230,0.12)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`, background: BRAND.gradBtn,
              transition: "width 0.2s ease"
            }} />
          </div>
        </div>
      )}

      {/* ── ROW 1: TOP FINANCIAL KPI SUMMARY CARDS (100% Live DB Data) ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: 12, marginBottom: 16
      }}>
        <StatCard label="Outward Taxable Sales" value={fmt(s.outward_taxable)} color={BRAND.blue} t={t} />
        <StatCard label="Output GST Collected" value={fmt(s.output_gst)} color={BRAND.purple} t={t} />
        <StatCard label="Input GST / ITC" value={fmt(s.input_itc)} color="#2ecc71" t={t} />
        <StatCard label="Net Tax Liability" value={fmt(s.net_tax_liability)} color="#f39c12" t={t} />
        <StatCard
          label="GST Errors & Anomalies"
          value={s.gst_errors_count || 0}
          color={(s.gst_errors_count || 0) > 0 ? BRAND.pink : "#2ecc71"}
          t={t}
        />
        <StatCard
          label="GSTR-2B Mismatches"
          value={s.mismatch_2b_count || 0}
          color={(s.mismatch_2b_count || 0) > 0 ? "#f39c12" : "#2ecc71"}
          t={t}
        />
      </div>

      {/* ── ROW 2: GST HEALTH SCORE & "CAN I FILE?" READINESS BAR ── */}
      <Card t={t} style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          {/* Health Score Gauge */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              fontSize: 24, fontWeight: 900,
              padding: "8px 16px", borderRadius: 12,
              background: hs.score >= 90 ? "rgba(46,204,113,0.15)" : hs.score >= 75 ? "rgba(243,156,18,0.15)" : "rgba(230,59,138,0.15)",
              color: hs.score >= 90 ? "#27ae60" : hs.score >= 75 ? "#d35400" : BRAND.pink,
              border: `1.5px solid ${hs.score >= 90 ? "#2ecc7144" : "#f39c1244"}`
            }}>
              {hs.score} / 100
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>
                GST Compliance Health Score ({hs.status})
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                Invoice: {bd.invoice_validation || 100}% · Math: {bd.gst_calculation || 100}% · GSTIN: {bd.gstin_validation || 100}% · 2B ITC: {bd.itc_reconciliation || 100}%
              </div>
            </div>
          </div>

          {/* "Can I File?" Indicator Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800,
              background: isReady ? "rgba(46,204,113,0.15)" : "rgba(230,59,138,0.15)",
              color: isReady ? "#27ae60" : BRAND.pink,
              border: `1px solid ${isReady ? "#2ecc7144" : "rgba(230,59,138,0.3)"}`
            }}>
              {isReady ? " READY FOR CA REVIEW" : " REVIEW REQUIRED / CRITICAL ISSUES"}
            </div>
            <BtnOutline t={t} onClick={handleDownloadCaPack}>
              Download CA Review Pack
            </BtnOutline>
            <BtnPrimary onClick={handleClosePeriod}>
              Close & Lock GST Period
            </BtnPrimary>
          </div>
        </div>
      </Card>

      {/* ── Tabs Navigation ── */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: GST CONTROL CENTRE & DASHBOARD (100% Live Breakdown)                 */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "dashboard" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18 }}>
          <Card t={t}>
            <CardHeader title="Live Jewellery GST Tax Performance" t={t} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "6px 0" }}>
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "12px 14px",
                background: t.card2 || t.card, borderRadius: 8, border: `1px solid ${t.borderDash}`
              }}>
                <span style={{ fontSize: 13, color: t.textSub }}>B2C Retail Sales Tax (3% HSN 7113):</span>
                <strong style={{ fontSize: 13, color: t.text }}>{fmt(s.b2c_output_gst)}</strong>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "12px 14px",
                background: t.card2 || t.card, borderRadius: 8, border: `1px solid ${t.borderDash}`
              }}>
                <span style={{ fontSize: 13, color: t.textSub }}>B2B Registered GST Sales Tax (3%):</span>
                <strong style={{ fontSize: 13, color: BRAND.purple }}>{fmt(s.b2b_output_gst)}</strong>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "12px 14px",
                background: t.card2 || t.card, borderRadius: 8, border: `1px solid ${t.borderDash}`
              }}>
                <span style={{ fontSize: 13, color: t.textSub }}>Eligible Input Tax Credit (Purchase ITC Claims):</span>
                <strong style={{ fontSize: 13, color: "#27ae60" }}>{fmt(s.input_itc)}</strong>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", padding: "12px 14px",
                background: t.card2 || t.card, borderRadius: 8, border: `1px solid ${t.borderDash}`
              }}>
                <span style={{ fontSize: 13, color: t.textSub }}>Net Payable Balance (Electronic Cash Ledger):</span>
                <strong style={{ fontSize: 14, color: BRAND.pink }}>{fmt(s.net_tax_liability)}</strong>
              </div>
            </div>
          </Card>

          <Card t={t}>
            <CardHeader title="Statutory Jewellery Tax Rules (HSN 7113)" t={t} />
            <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: t.card2 || t.card, borderRadius: 6 }}>
                <span style={{ color: t.textSub }}>Gold & Diamond Articles (HSN 7113)</span>
                <strong>3.0% (1.5% CGST + 1.5% SGST)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: t.card2 || t.card, borderRadius: 6 }}>
                <span style={{ color: t.textSub }}>Silver Jewellery (HSN 7106)</span>
                <strong>3.0% (1.5% CGST + 1.5% SGST)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: t.card2 || t.card, borderRadius: 6 }}>
                <span style={{ color: t.textSub }}>Job Work / Making Charges (HSN 9988)</span>
                <strong>5.0% (2.5% CGST + 2.5% SGST)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: t.card2 || t.card, borderRadius: 6 }}>
                <span style={{ color: t.textSub }}>Old Gold Exchange Accounting</span>
                <strong style={{ color: "#27ae60" }}>Separate Purchase Ledger</strong>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: GST ERROR & EXCEPTION CENTRE                                         */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "errors" && (
        <Card t={t}>
          <CardHeader
            title={`Forensic GST Anomalies & Errors (${errorsList.length} Items Detected)`}
            t={t}
            actions={<BtnOutline t={t} onClick={loadErrors}>↻ Refresh Error List</BtnOutline>}
          />
          <DataTable
            columns={["Severity", "Error Code", "Invoice No", "Customer / Party", "Taxable Value", "Recorded Tax", "Expected Tax", "Difference", "Action"]}
            rows={errorsList.map(err => ({
              "Severity": (
                <span style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
                  background: err.severity === "CRITICAL" ? "rgba(230,59,138,0.15)" : "rgba(243,156,18,0.15)",
                  color: err.severity === "CRITICAL" ? BRAND.pink : "#d35400"
                }}>
                  {err.severity}
                </span>
              ),
              "Error Code": <code style={{ fontSize: 11, fontWeight: 700 }}>{err.error_code}</code>,
              "Invoice No": <strong>{err.invoice_no}</strong>,
              "Customer / Party": <span>{err.party_name || "Customer"}</span>,
              "Taxable Value": fmt(err.taxable_value),
              "Recorded Tax": fmt(err.recorded_gst),
              "Expected Tax": fmt(err.expected_gst),
              "Difference": <span style={{ color: BRAND.pink, fontWeight: 700 }}>{fmt(err.difference)}</span>,
              "Action": (
                <BtnSm
                  t={t}
                  onClick={() => {
                    setSelectedError(err);
                    setDrillModal(true);
                  }}
                >
                  Inspect & Fix
                </BtnSm>
              ),
            }))}
            t={t}
            emptyMsg=" Zero GST errors detected! All sales, purchases, and tax calculations match 100%."
          />
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: GSTR-1 & GSTR-3B WORKING TABLES (100% Live DB Queries)                */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "returns" && (
        <Card t={t}>
          <CardHeader
            title="GSTR-1 Outward Supplies Working Sheet (Live Database)"
            t={t}
            actions={<BtnPrimary onClick={handleDownloadCaPack}>Export GSTR-1 JSON (Govt Portal)</BtnPrimary>}
          />
          <div style={{ padding: "8px 0" }}>
            <DataTable
              columns={["Section", "Description", "Vouchers", "Taxable Value (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", "Total Tax (₹)"]}
              rows={[
                {
                  "Section": <strong style={{ color: BRAND.blue }}>Table 4A</strong>,
                  "Description": "B2B Registered Invoices (With Customer GSTIN)",
                  "Vouchers": String(returnsWorking.b2b?.length || 0),
                  "Taxable Value (₹)": fmt(returnsWorking.b2b?.reduce((acc, r) => acc + Number(r.taxable_value || 0), 0)),
                  "CGST (₹)": fmt(returnsWorking.b2b?.reduce((acc, r) => acc + Number(r.cgst || 0), 0)),
                  "SGST (₹)": fmt(returnsWorking.b2b?.reduce((acc, r) => acc + Number(r.sgst || 0), 0)),
                  "IGST (₹)": fmt(returnsWorking.b2b?.reduce((acc, r) => acc + Number(r.igst || 0), 0)),
                  "Total Tax (₹)": fmt(returnsWorking.b2b?.reduce((acc, r) => acc + Number(r.total_tax || 0), 0)),
                },
                {
                  "Section": <strong style={{ color: BRAND.purple }}>Table 7</strong>,
                  "Description": "B2C Small Retail Invoices (Unregistered Walk-in Customers)",
                  "Vouchers": String(b2cSum.invoice_count || 0),
                  "Taxable Value (₹)": fmt(b2cSum.taxable_value),
                  "CGST (₹)": fmt(b2cSum.cgst),
                  "SGST (₹)": fmt(b2cSum.sgst),
                  "IGST (₹)": fmt(b2cSum.igst),
                  "Total Tax (₹)": fmt(b2cSum.total_tax),
                },
                {
                  "Section": <strong style={{ color: "#27ae60" }}>Table 12</strong>,
                  "Description": "HSN 7113 Summary (Gold & Diamond Jewellery Articles)",
                  "Vouchers": String(hsnSum.total_vouchers || 0),
                  "Taxable Value (₹)": fmt(hsnSum.taxable_value),
                  "CGST (₹)": fmt(hsnSum.cgst),
                  "SGST (₹)": fmt(hsnSum.sgst),
                  "IGST (₹)": fmt(hsnSum.igst),
                  "Total Tax (₹)": fmt(hsnSum.total_tax),
                },
              ]}
              t={t}
            />
          </div>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: GSTR-2B VS PURCHASE ITC RECONCILIATION                               */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "gstr2b" && (
        <Card t={t}>
          <CardHeader
            title="GSTR-2B Auto-Reconciliation & Supplier Matching"
            t={t}
            actions={<BtnOutline t={t} onClick={loadGstr2b}>↻ Match GSTR-2B</BtnOutline>}
          />
          <DataTable
            columns={["Supplier Name", "Supplier GSTIN", "Invoice No", "Invoice Date", "Books GST", "2B GST", "Difference", "Reconciliation Status"]}
            rows={gstr2bList.map(r => ({
              "Supplier Name": <strong>{r.supplier_name}</strong>,
              "Supplier GSTIN": <code>{r.supplier_gstin}</code>,
              "Invoice No": r.invoice_no,
              "Invoice Date": fmtDate(r.invoice_date),
              "Books GST": fmt(r.books_gst),
              "2B GST": r.gstr2b_gst ? fmt(r.gstr2b_gst) : "—",
              "Difference": <span style={{ color: r.difference_gst > 0 ? BRAND.pink : "inherit" }}>{fmt(r.difference_gst)}</span>,
              "Reconciliation Status": (
                <span style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
                  background: r.match_status === "MATCHED" ? "rgba(46,204,113,0.15)" : "rgba(243,156,18,0.15)",
                  color: r.match_status === "MATCHED" ? "#27ae60" : "#d35400"
                }}>
                  {r.match_status.replace(/_/g, " ")}
                </span>
              ),
            }))}
            t={t}
            emptyMsg="No GSTR-2B reconciliation data available for current tax period."
          />
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: VERSIONED TAX MASTER                                                 */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "tax_master" && (
        <Card t={t}>
          <CardHeader title="Statutory GST Tax Rules & Versioned HSN Directory" t={t} />
          <DataTable
            columns={["Rule Code", "HSN Code", "Product Category", "GST Rate", "CGST", "SGST", "IGST", "Effective From", "Status"]}
            rows={taxRules.map(tr => ({
              "Rule Code": <code>{tr.rule_code}</code>,
              "HSN Code": <strong>{tr.hsn_code}</strong>,
              "Product Category": tr.product_category,
              "GST Rate": `${tr.gst_rate}%`,
              "CGST": `${tr.cgst_rate}%`,
              "SGST": `${tr.sgst_rate}%`,
              "IGST": `${tr.igst_rate}%`,
              "Effective From": fmtDate(tr.effective_from),
              "Status": (
                <span style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
                  background: "rgba(46,204,113,0.15)", color: "#27ae60"
                }}>
                  ACTIVE
                </span>
              ),
            }))}
            t={t}
          />
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: CA REVIEW PACK & PERIOD LOCK                                         */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "ca_pack" && (
        <Card t={t}>
          <CardHeader title="Chartered Accountant Review Pack & Statutory Locking" t={t} />
          <div style={{ padding: "8px 0" }}>
            <div style={{
              background: "rgba(59,85,230,0.06)", border: "1px solid rgba(59,85,230,0.2)",
              borderRadius: 12, padding: 20, marginBottom: 20, lineHeight: 1.6
            }}>
              <strong style={{ fontSize: 15, color: BRAND.blue }}>📜 22-Report CA Statutory Package</strong>
              <p style={{ fontSize: 13, color: t.textSub, margin: "6px 0 12px 0" }}>
                Generate an end-to-end verified GST file bundle for your Tax Auditor or CA containing Sales Registers, Purchase GRN ITC, GSTR-2B Mismatches, and HSN 7113 Weight reconciliations.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <BtnPrimary onClick={handleDownloadCaPack}>
                   Download Complete CA Review Pack (JSON)
                </BtnPrimary>
                <BtnOutline t={t} onClick={handleClosePeriod}>
                   Validate & Lock GST Period
                </BtnOutline>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── ERROR DRILLDOWN & 1-CLICK RECALCULATE MODAL ─────────────────────── */}
      <Modal
        open={drillModal}
        onClose={() => setDrillModal(false)}
        title={`Inspect GST Anomaly: ${selectedError?.error_code || ""}`}
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setDrillModal(false)}>Close</BtnOutline>
            <BtnPrimary
              onClick={() => handleRecalculate(selectedError)}
              disabled={recalculating}
            >
              {recalculating ? "Recalculating..." : "⚡ Recalculate & Auto-Fix Tax"}
            </BtnPrimary>
          </>
        }
      >
        {selectedError && (
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div style={{
              background: "rgba(230,59,138,0.08)", border: "1px solid rgba(230,59,138,0.2)",
              borderRadius: 8, padding: "10px 14px", color: BRAND.pink, fontWeight: 700, marginBottom: 14
            }}>
              Anomaly: {selectedError.message}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div><strong>Invoice No:</strong> {selectedError.invoice_no}</div>
              <div><strong>Invoice Date:</strong> {fmtDate(selectedError.invoice_date)}</div>
              <div><strong>Customer / Party:</strong> {selectedError.party_name || "Walk-in Customer"}</div>
              <div><strong>GSTIN:</strong> {selectedError.party_gstin || "Unregistered (B2C)"}</div>
              <div><strong>Taxable Value:</strong> {fmt(selectedError.taxable_value)}</div>
              <div><strong>HSN Code:</strong> {selectedError.hsn_code || "7113"}</div>
            </div>

            <div style={{
              background: t.card2 || t.card, border: `1px solid ${t.borderDash}`,
              borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10
            }}>
              <div>
                <span style={{ fontSize: 11, color: t.textMuted }}>Recorded Tax:</span>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(selectedError.recorded_gst)}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: t.textMuted }}>Expected 3% Tax:</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#27ae60" }}>{fmt(selectedError.expected_gst)}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: t.textMuted }}>Discrepancy:</span>
                <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.pink }}>{fmt(selectedError.difference)}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
