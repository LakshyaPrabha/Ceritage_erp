import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs,
  BtnPrimary, BtnOutline, BtnSm, FormGroup, FormGrid, Input, Select, Modal
} from "../../components/ui";

const API = "http://localhost:5000/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token") || localStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function fmt(n) {
  return n ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "₹0.00";
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "—";
}

const TABS = [
  { id: "overview", label: "GST Overview & Compliance" },
  { id: "returns",  label: "GSTR-1 & GSTR-3B Returns" },
  { id: "hsn",      label: "HSN Codes & Tax Rates" },
  { id: "calc",     label: "Live GST & TCS Calculator" },
];

export default function Gst({ t }) {
  const [tab, setTab] = useState("overview");

  // Summary state
  const [summary, setSummary] = useState({
    output_gst: { taxable_sales: 0, cgst: 0, sgst: 0, igst: 0, total: 0, invoice_count: 0 },
    input_gst: { taxable_purchases: 0, cgst: 0, sgst: 0, igst: 0, total: 0, bill_count: 0 },
    net_tax_payable: 0,
    last_filed_date: "July 2026",
    gstin: "24AAACG1234F1Z5",
    state: "Gujarat (24)"
  });

  // Tab Data states
  const [gstr1, setGstr1] = useState([]);
  const [gstr3b, setGstr3b] = useState(null);
  const [hsnList, setHsnList] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(false);

  // HSN Modal
  const [hsnModal, setHsnModal] = useState(false);
  const [hsnForm, setHsnForm] = useState({
    hsn_code: "",
    description: "",
    category: "Jewellery",
    gst_rate: "3.00",
    cgst_rate: "1.50",
    sgst_rate: "1.50",
    igst_rate: "3.00"
  });
  const [saving, setSaving] = useState(false);

  // Calculator state
  const [calcForm, setCalcForm] = useState({
    taxable_value: "100000",
    gst_rate: "3.00",
    is_interstate: false,
    is_cash: false
  });
  const [calcResult, setCalcResult] = useState({
    taxable_value: 100000,
    cgst: 1500,
    sgst: 1500,
    igst: 0,
    total_tax: 3000,
    tcs: 0,
    grand_total: 103000
  });

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    try {
      const r = await fetch(`${API}/gst/summary`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setSummary(d.data);
    } catch { /* silent */ }
  }, []);

  const loadTabData = useCallback(async (currentTab) => {
    setLoading(true);
    try {
      if (currentTab === "overview") {
        const [cRes, hRes] = await Promise.all([
          fetch(`${API}/gst/filing-calendar`, { headers: authHeaders() }),
          fetch(`${API}/gst/hsn-summary`, { headers: authHeaders() })
        ]);
        const [cData, hData] = await Promise.all([cRes.json(), hRes.json()]);
        if (cData.success) setCalendar(cData.data || []);
        if (hData.success) setHsnList(hData.data || []);
      } else if (currentTab === "returns") {
        const [r1Res, r3bRes] = await Promise.all([
          fetch(`${API}/gst/gstr-1`, { headers: authHeaders() }),
          fetch(`${API}/gst/gstr-3b`, { headers: authHeaders() })
        ]);
        const [r1Data, r3bData] = await Promise.all([r1Res.json(), r3bRes.json()]);
        if (r1Data.success) setGstr1(r1Data.data || []);
        if (r3bData.success) setGstr3b(r3bData.data);
      } else if (currentTab === "hsn") {
        const r = await fetch(`${API}/gst/hsn-summary`, { headers: authHeaders() });
        const d = await r.json();
        if (d.success) setHsnList(d.data || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadTabData(tab);
  }, [tab, loadTabData]);

  // ── Calculator Live Trigger ────────────────────────────────────────────────
  useEffect(() => {
    async function runCalc() {
      const val = parseFloat(calcForm.taxable_value);
      if (!val || val <= 0) return;
      try {
        const r = await fetch(`${API}/gst/calculate`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(calcForm)
        });
        const d = await r.json();
        if (d.success) setCalcResult(d.data);
      } catch { /* silent */ }
    }
    runCalc();
  }, [calcForm]);

  // ── Add HSN Code ────────────────────────────────────────────────────────────
  async function submitHsn() {
    if (!hsnForm.hsn_code || !hsnForm.description) {
      alert("HSN Code and Description are required.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/gst/hsn-codes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(hsnForm)
      });
      const d = await r.json();
      if (d.success) {
        alert(d.message);
        setHsnModal(false);
        setHsnForm({
          hsn_code: "",
          description: "",
          category: "Jewellery",
          gst_rate: "3.00",
          cgst_rate: "1.50",
          sgst_rate: "1.50",
          igst_rate: "3.00"
        });
        loadTabData("hsn");
      } else {
        alert(d.message);
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="GST & Taxation Compliance"
        subtitle={`GSTIN: ${summary.gstin} · State: ${summary.state} · Output GST · ITC Credit · GSTR-1 · GSTR-3B · HSN`}
        t={t}
        actions={
          <>
            <BtnOutline t={t} onClick={() => alert("GSTR JSON payload prepared for GST Portal upload.")}>
              Export GSTR JSON
            </BtnOutline>
            <BtnPrimary onClick={() => alert(`GSTR-3B Net Tax Payable: ${fmt(summary.net_tax_payable)} is ready for settlement.`)}>
              Settle GST Liability
            </BtnPrimary>
          </>
        }
      />

      {/* Top StatCards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Output GST (Sales)"     value={fmt(summary.output_gst?.total)}     color={BRAND.blue}   t={t} />
        <StatCard label="Input Tax Credit (ITC)" value={fmt(summary.input_gst?.total)}      color="#2ecc71"      t={t} />
        <StatCard label="Net Tax Payable"        value={fmt(summary.net_tax_payable)}       color="#e74c3c"      t={t} />
        <StatCard label="Taxable Turnover"       value={fmt(summary.output_gst?.taxable_sales)} color={BRAND.purple} t={t} />
        <StatCard label="Last Return Filed"      value={summary.last_filed_date}            color="#f39c12"      t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── TAB 1: OVERVIEW & FILING CALENDAR ──────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card t={t} style={{ marginBottom: 0 }}>
            <CardHeader title="GST Filing Calendar & Status" t={t} />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Return</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Period</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Due Date</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {calendar.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{c.return_type}</td>
                      <td style={{ padding: "10px 12px", color: t.text }}>{c.period}</td>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{c.due_date}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: c.status === "Filed" ? "#2ecc71" : "#f39c12",
                          color: "#fff"
                        }}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card t={t} style={{ marginBottom: 0 }}>
            <CardHeader title="Jewellery HSN Summary & Rate Master" t={t} />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>HSN</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Description</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>GST Rate</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Sales (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {hsnList.slice(0, 5).map((h) => (
                    <tr key={h.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{h.hsn_code}</td>
                      <td style={{ padding: "10px 12px", color: t.text, fontSize: 12 }}>{h.description}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#2ecc71" }}>{Number(h.gst_rate).toFixed(2)}%</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: t.text }}>{fmt(h.total_sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 2: RETURNS (GSTR-1 & GSTR-3B) ───────────────────────────────── */}
      {tab === "returns" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          <Card t={t}>
            <CardHeader title="GSTR-1 — Outward Supplies (Sales Register)" t={t} />
            {loading ? (
              <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading outward supplies...</p>
            ) : gstr1.length === 0 ? (
              <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No sales invoices for this tax period.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <th style={{ textAlign: "left", padding: "8px 10px", color: t.subtext, fontSize: 11 }}>Invoice No</th>
                      <th style={{ textAlign: "left", padding: "8px 10px", color: t.subtext, fontSize: 11 }}>Date</th>
                      <th style={{ textAlign: "left", padding: "8px 10px", color: t.subtext, fontSize: 11 }}>Customer / GSTIN</th>
                      <th style={{ textAlign: "left", padding: "8px 10px", color: t.subtext, fontSize: 11 }}>Taxable (₹)</th>
                      <th style={{ textAlign: "left", padding: "8px 10px", color: t.subtext, fontSize: 11 }}>CGST + SGST</th>
                      <th style={{ textAlign: "left", padding: "8px 10px", color: t.subtext, fontSize: 11 }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstr1.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                        <td style={{ padding: "8px 10px", fontWeight: 700, color: BRAND.blue }}>{inv.invoice_no}</td>
                        <td style={{ padding: "8px 10px", color: t.subtext }}>{fmtDate(inv.invoice_date)}</td>
                        <td style={{ padding: "8px 10px", color: t.text }}>
                          {inv.customer_name}
                          {inv.customer_gstin && <div style={{ fontSize: 10, color: t.subtext }}>{inv.customer_gstin}</div>}
                        </td>
                        <td style={{ padding: "8px 10px", fontWeight: 600 }}>{fmt(inv.taxable_value)}</td>
                        <td style={{ padding: "8px 10px", color: "#2ecc71", fontWeight: 600 }}>{fmt(Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst))}</td>
                        <td style={{ padding: "8px 10px", fontWeight: 700, color: t.text }}>{fmt(inv.total_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card t={t}>
            <CardHeader title="GSTR-3B — Net Tax Liability Summary" t={t} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" }}>
              <div style={{ padding: 12, background: t.card2, borderRadius: 8, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 11, color: t.subtext, textTransform: "uppercase", fontWeight: 700 }}>
                  Table 3.1: Outward Supplies (Output Tax)
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13 }}>
                  <span>Taxable Turnover:</span>
                  <strong>{fmt(gstr3b?.table3_1?.taxable_value)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 13 }}>
                  <span>Output CGST + SGST:</span>
                  <strong style={{ color: BRAND.blue }}>{fmt(gstr3b?.table3_1?.total_tax)}</strong>
                </div>
              </div>

              <div style={{ padding: 12, background: t.card2, borderRadius: 8, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 11, color: t.subtext, textTransform: "uppercase", fontWeight: 700 }}>
                  Table 4: Eligible Input Tax Credit (ITC)
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13 }}>
                  <span>Eligible Inward Purchases:</span>
                  <strong>{fmt(gstr3b?.table4?.taxable_value)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 13 }}>
                  <span>Total ITC Available:</span>
                  <strong style={{ color: "#2ecc71" }}>{fmt(gstr3b?.table4?.total_itc)}</strong>
                </div>
              </div>

              <div style={{ padding: 14, background: "#fdf2f2", borderRadius: 8, border: "1px solid #f8d7da" }}>
                <div style={{ fontSize: 12, color: "#721c24", fontWeight: 700, textTransform: "uppercase" }}>
                  Table 5.1: Net Tax Payable in Cash
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 15, fontWeight: 800, color: "#e74c3c" }}>
                  <span>Net GST Payable:</span>
                  <span>{fmt(gstr3b?.net_liability?.total)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 3: HSN CODES ──────────────────────────────────────────────── */}
      {tab === "hsn" && (
        <Card t={t}>
          <CardHeader
            title="HSN Code & Tax Rates Master"
            t={t}
            actions={<BtnSm t={t} primary onClick={() => setHsnModal(true)}>+ Add / Configure HSN</BtnSm>}
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>HSN Code</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Description</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Category</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>GST Rate</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>CGST</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>SGST</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>IGST</th>
                </tr>
              </thead>
              <tbody>
                {hsnList.map((h) => (
                  <tr key={h.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{h.hsn_code}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>{h.description}</td>
                    <td style={{ padding: "10px 12px", color: t.subtext }}>{h.category}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#2ecc71" }}>{Number(h.gst_rate).toFixed(2)}%</td>
                    <td style={{ padding: "10px 12px", color: t.subtext }}>{Number(h.cgst_rate).toFixed(2)}%</td>
                    <td style={{ padding: "10px 12px", color: t.subtext }}>{Number(h.sgst_rate).toFixed(2)}%</td>
                    <td style={{ padding: "10px 12px", color: t.subtext }}>{Number(h.igst_rate).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── TAB 4: CALCULATOR ─────────────────────────────────────────────── */}
      {tab === "calc" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card t={t}>
            <CardHeader title="Live Jewellery GST & TCS Calculator" t={t} />
            <FormGrid>
              <FormGroup label="Item / Service Type" t={t}>
                <Select
                  t={t}
                  value={calcForm.gst_rate}
                  onChange={(e) => setCalcForm(prev => ({ ...prev, gst_rate: e.target.value }))}
                >
                  <option value="3.00">Gold / Silver / Platinum Jewellery (7113) — 3%</option>
                  <option value="0.25">Unset Diamonds / Gemstones (7102) — 0.25%</option>
                  <option value="5.00">Karigar Job Work & Labour (9988) — 5%</option>
                  <option value="18.00">Appraisal, Hallmark & Testing Services (9983) — 18%</option>
                </Select>
              </FormGroup>

              <FormGroup label="Supply Type" t={t}>
                <Select
                  t={t}
                  value={calcForm.is_interstate ? "INTER" : "INTRA"}
                  onChange={(e) => setCalcForm(prev => ({ ...prev, is_interstate: e.target.value === "INTER" }))}
                >
                  <option value="INTRA">Intra-State (CGST + SGST)</option>
                  <option value="INTER">Inter-State (IGST)</option>
                </Select>
              </FormGroup>

              <FormGroup label="Taxable Value (₹) *" t={t} half>
                <Input
                  t={t}
                  type="number"
                  placeholder="Enter amount before tax"
                  value={calcForm.taxable_value}
                  onChange={(e) => setCalcForm(prev => ({ ...prev, taxable_value: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Tender Payment Mode" t={t} half>
                <Select
                  t={t}
                  value={calcForm.is_cash ? "CASH" : "DIGITAL"}
                  onChange={(e) => setCalcForm(prev => ({ ...prev, is_cash: e.target.value === "CASH" }))}
                >
                  <option value="DIGITAL">Digital (UPI / Card / Bank)</option>
                  <option value="CASH">Cash (&gt; ₹2 Lakh triggers TCS 0.1%)</option>
                </Select>
              </FormGroup>
            </FormGrid>
          </Card>

          <Card t={t}>
            <CardHeader title="Computed Tax Breakdown (Thermal Preview)" t={t} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: t.card2, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: t.subtext, marginBottom: 4 }}>Taxable Value</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{fmt(calcResult.taxable_value)}</div>
              </div>

              <div style={{ background: t.card2, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: t.subtext, marginBottom: 4 }}>CGST ({Number(calcForm.gst_rate) / 2}%)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2ecc71" }}>{calcForm.is_interstate ? "—" : fmt(calcResult.cgst)}</div>
              </div>

              <div style={{ background: t.card2, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: t.subtext, marginBottom: 4 }}>{calcForm.is_interstate ? `IGST (${calcForm.gst_rate}%)` : `SGST (${Number(calcForm.gst_rate) / 2}%)`}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2ecc71" }}>{calcForm.is_interstate ? fmt(calcResult.igst) : fmt(calcResult.sgst)}</div>
              </div>

              <div style={{ background: t.card2, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: t.subtext, marginBottom: 4 }}>TCS Sec 206C(1H)</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: calcResult.tcs > 0 ? "#e74c3c" : t.subtext }}>{fmt(calcResult.tcs)}</div>
              </div>

              <div style={{ gridColumn: "span 2", background: BRAND.cardGrad || t.card2, border: `1px solid ${BRAND.blue}`, borderRadius: 8, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: BRAND.blue, fontWeight: 700, textTransform: "uppercase" }}>Gross Invoice Amount</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: BRAND.blue, marginTop: 4 }}>{fmt(calcResult.grand_total)}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── MODAL: ADD / CONFIGURE HSN ────────────────────────────────────── */}
      <Modal
        open={hsnModal}
        onClose={() => setHsnModal(false)}
        title="Add / Configure Jewelry HSN Code"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setHsnModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitHsn} disabled={saving}>
              {saving ? "Saving…" : "Save HSN Code"}
            </BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="HSN Code *" t={t} half>
            <Input
              t={t}
              placeholder="e.g. 7113"
              value={hsnForm.hsn_code}
              onChange={(e) => setHsnForm(prev => ({ ...prev, hsn_code: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Category" t={t} half>
            <Select
              t={t}
              value={hsnForm.category}
              onChange={(e) => setHsnForm(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="Jewellery">Jewellery Articles</option>
              <option value="Bullion">Gold / Silver Bullion</option>
              <option value="Diamonds">Cut & Polished Diamonds</option>
              <option value="Gemstones">Gemstones</option>
              <option value="Job Work">Karigar Labour (Job Work)</option>
              <option value="Services">Appraisal / Testing Services</option>
            </Select>
          </FormGroup>

          <FormGroup label="Description *" t={t}>
            <Input
              t={t}
              placeholder="e.g. Articles of Jewellery and parts thereof"
              value={hsnForm.description}
              onChange={(e) => setHsnForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="GST Rate % *" t={t} half>
            <Input
              t={t}
              type="number"
              step="0.01"
              value={hsnForm.gst_rate}
              onChange={(e) => {
                const r = parseFloat(e.target.value) || 0;
                setHsnForm(prev => ({
                  ...prev,
                  gst_rate: e.target.value,
                  cgst_rate: (r / 2).toFixed(2),
                  sgst_rate: (r / 2).toFixed(2),
                  igst_rate: r.toFixed(2)
                }));
              }}
            />
          </FormGroup>

          <FormGroup label="CGST Rate %" t={t} half>
            <Input t={t} type="number" readOnly value={hsnForm.cgst_rate} />
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
