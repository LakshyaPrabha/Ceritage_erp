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
  { id: "transactions", label: "High-Value Sales (>₹2L / TCS)" },
  { id: "form60",       label: "Digital Form 60 Registry" },
  { id: "pmla",         label: "PMLA AML Cash Alerts (>₹10L)" },
  { id: "form27eq",     label: "Form 27EQ (Quarterly CA Pack)" },
];

export default function Compliance({ t }) {
  const [tab, setTab] = useState("transactions");
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState({
    tcs_collected_month: 0,
    kyc_verified_count: 0,
    pending_pan_count: 0,
    pmla_flagged_count: 0,
    total_cash_tracked: 0,
    high_value_invoices_count: 0,
  });

  const [logs, setLogs] = useState([]);
  const [form60List, setForm60List] = useState([]);
  const [form27EqData, setForm27EqData] = useState(null);

  // Filters
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [form60Modal, setForm60Modal] = useState(false);
  const [recordModal, setRecordModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form 60 State
  const [f60Form, setF60Form] = useState({
    customer_id: "",
    declarant_name: "",
    father_name: "",
    dob_or_age: "",
    address: "",
    mobile_number: "",
    transaction_amount: "",
    id_proof_type: "Aadhaar",
    id_proof_number: "",
    agricultural_income: false,
    other_income: true,
  });

  // Record TCS Form State
  const [tcsForm, setTcsForm] = useState({
    invoice_no: "",
    invoice_date: new Date().toISOString().split("T")[0],
    customer_name: "",
    customer_phone: "",
    pan_number: "",
    aadhaar_number: "",
    total_invoice_amount: "",
    cash_component: "",
    digital_component: "",
  });

  // ── 1. LOAD DATA ────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const d = await apiRequest("/compliance/kpis");
      if (d.success) setKpis(d.data);
    } catch { /* silent */ }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (sectionFilter !== "ALL") q.append("section", sectionFilter);
      if (search) q.append("search", search);

      const d = await apiRequest(`/compliance/logs?${q.toString()}`);
      if (d.success) setLogs(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [sectionFilter, search]);

  const loadForm60 = useCallback(async () => {
    try {
      const d = await apiRequest("/compliance/form60");
      if (d.success) setForm60List(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadForm27Eq = useCallback(async () => {
    try {
      const d = await apiRequest("/compliance/form27eq");
      if (d.success) setForm27EqData(d.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadKpis();
    loadLogs();
  }, [loadKpis, loadLogs]);

  useEffect(() => {
    if (tab === "form60") loadForm60();
    if (tab === "form27eq") loadForm27Eq();
  }, [tab, loadForm60, loadForm27Eq]);

  // ── 2. SUBMIT FORM 60 ───────────────────────────────────────────────────────
  const handleSubmitForm60 = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const d = await apiRequest("/compliance/form60", {
        method: "POST",
        body: JSON.stringify(f60Form),
      });
      if (d.success) {
        alert(`✓ ${d.message}`);
        setForm60Modal(false);
        setF60Form({
          customer_id: "",
          declarant_name: "",
          father_name: "",
          dob_or_age: "",
          address: "",
          mobile_number: "",
          transaction_amount: "",
          id_proof_type: "Aadhaar",
          id_proof_number: "",
          agricultural_income: false,
          other_income: true,
        });
        loadForm60();
        loadKpis();
      } else {
        alert(d.message || "Failed to submit Form 60");
      }
    } catch (err) {
      alert(err.message || "Error submitting Form 60");
    } finally {
      setProcessing(false);
    }
  };

  // ── 3. RECORD TCS COMPLIANCE LOG ───────────────────────────────────────────
  const handleRecordTcs = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const d = await apiRequest("/compliance/record-tcs", {
        method: "POST",
        body: JSON.stringify(tcsForm),
      });
      if (d.success) {
        alert(`✓ ${d.message}`);
        setRecordModal(false);
        setTcsForm({
          invoice_no: "",
          invoice_date: new Date().toISOString().split("T")[0],
          customer_name: "",
          customer_phone: "",
          pan_number: "",
          aadhaar_number: "",
          total_invoice_amount: "",
          cash_component: "",
          digital_component: "",
        });
        loadLogs();
        loadKpis();
      } else {
        alert(d.message || "Failed to record compliance entry");
      }
    } catch (err) {
      alert(err.message || "Error recording log");
    } finally {
      setProcessing(false);
    }
  };

  // ── 4. EXPORT 27EQ CSV ──────────────────────────────────────────────────────
  const handleExport27EqCsv = () => {
    if (!form27EqData || !form27EqData.records || form27EqData.records.length === 0) {
      alert("No Form 27EQ records available to export.");
      return;
    }
    const headers = ["Invoice No", "Date", "Customer Name", "PAN", "Invoice Amount", "Cash Amount", "TCS Section", "TCS Rate", "TCS Collected"];
    const rows = form27EqData.records.map(r => [
      r.invoice_no,
      r.invoice_date,
      `"${r.customer_name}"`,
      r.pan_number,
      r.total_invoice_amount,
      r.cash_component,
      r.tcs_section,
      `${r.tcs_rate}%`,
      r.tcs_amount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ceritage_Form_27EQ_TCS_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="TCS & PMLA Regulatory Compliance Suite"
        subtitle="Income Tax Sec 206C(1D) 1% Cash TCS · Mandatory PAN/KYC · Digital Form 60 · PMLA ₹10L AML Audit"
        t={t}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <BtnOutline t={t} onClick={() => setForm60Modal(true)}>
              + File Form 60 Declaration
            </BtnOutline>
            <BtnPrimary onClick={() => setRecordModal(true)}>
              + Record High-Value Cash Sale
            </BtnPrimary>
          </div>
        }
      />

      {/* ── Top Summary KPI Cards ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: 12, marginBottom: 20
      }}>
        <StatCard label="TCS Collected (This Month)" value={fmt(kpis.tcs_collected_month)} color={BRAND.blue} t={t} />
        <StatCard label="KYC Verified Customers" value={kpis.kyc_verified_count} color="#2ecc71" t={t} />
        <StatCard
          label="Pending PAN / Form 60"
          value={kpis.pending_pan_count}
          color={kpis.pending_pan_count > 0 ? "#f39c12" : "#2ecc71"}
          t={t}
        />
        <StatCard
          label="PMLA High-Value Flags (>₹10L)"
          value={kpis.pmla_flagged_count}
          color={kpis.pmla_flagged_count > 0 ? BRAND.pink : t.textMuted}
          t={t}
        />
      </div>

      {/* ── Tabs Navigation ── */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: HIGH-VALUE SALES REGISTER                                            */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "transactions" && (
        <Card t={t}>
          <CardHeader
            title="High-Value Sale Register (>₹2 Lakhs & Cash Track)"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Select
                  t={t}
                  value={sectionFilter}
                  onChange={e => setSectionFilter(e.target.value)}
                  style={{ width: 180 }}
                >
                  <option value="ALL">All TCS Sections</option>
                  <option value="206C(1D)">Sec 206C(1D) (Cash &gt; ₹2L)</option>
                  <option value="206C(1H)">Sec 206C(1H) (Sales &gt; ₹50L)</option>
                </Select>
                <Input
                  t={t}
                  placeholder="Search Invoice, Customer, PAN..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: 220 }}
                />
                <BtnOutline t={t} onClick={loadLogs}>Refresh</BtnOutline>
              </div>
            }
          />
          <DataTable
            columns={["Invoice No", "Date", "Customer Name", "PAN / Aadhaar", "Invoice Amount", "Cash Paid", "TCS %", "TCS Collected", "Compliance Status"]}
            rows={logs.map(l => ({
              "Invoice No": <strong>{l.invoice_no}</strong>,
              "Date": fmtDate(l.invoice_date),
              "Customer Name": <span>{l.customer_name}</span>,
              "PAN / Aadhaar": (
                <span>
                  {l.pan_number ? (
                    <strong style={{ color: "#27ae60" }}>{l.pan_number}</strong>
                  ) : l.form60_attached ? (
                    <span style={{ color: BRAND.purple }}>Form 60 Attached</span>
                  ) : (
                    <span style={{ color: BRAND.pink, fontWeight: 700 }}>PAN Missing (Req)</span>
                  )}
                </span>
              ),
              "Invoice Amount": <strong>{fmt(l.total_invoice_amount)}</strong>,
              "Cash Paid": <span style={{ color: l.cash_component >= 200000 ? BRAND.pink : "inherit" }}>{fmt(l.cash_component)}</span>,
              "TCS %": <span>{l.tcs_rate}%</span>,
              "TCS Collected": <strong style={{ color: BRAND.blue }}>{fmt(l.tcs_amount)}</strong>,
              "Compliance Status": (
                <span style={{
                  padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
                  background: l.is_pmla_flagged ? "rgba(230,59,138,0.15)" : l.pan_number ? "rgba(46,204,113,0.15)" : "rgba(243,156,18,0.15)",
                  color: l.is_pmla_flagged ? BRAND.pink : l.pan_number ? "#27ae60" : "#d35400"
                }}>
                  {l.is_pmla_flagged ? "PMLA AUDIT FLAGGED" : l.status.replace(/_/g, " ")}
                </span>
              ),
            }))}
            t={t}
            emptyMsg="No high-value transactions matching filter."
          />
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: DIGITAL FORM 60 REGISTRY                                             */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "form60" && (
        <Card t={t}>
          <CardHeader
            title="Form 60 Declarations (Cash Customers without PAN Card)"
            t={t}
            actions={<BtnPrimary onClick={() => setForm60Modal(true)}>+ New Form 60 Declaration</BtnPrimary>}
          />
          <DataTable
            columns={["Declaration No", "Declarant Name", "Father's Name", "Mobile", "Transaction Amount", "ID Proof Attached", "Filed Date", "Verified By"]}
            rows={form60List.map(f => ({
              "Declaration No": <strong>{f.declaration_no}</strong>,
              "Declarant Name": <span>{f.declarant_name}</span>,
              "Father's Name": <span>{f.father_name || "—"}</span>,
              "Mobile": <span>{f.mobile_number}</span>,
              "Transaction Amount": <strong>{fmt(f.transaction_amount)}</strong>,
              "ID Proof Attached": <span>{f.id_proof_type}: {f.id_proof_number}</span>,
              "Filed Date": fmtDate(f.transaction_date),
              "Verified By": <span>{f.verified_by}</span>,
            }))}
            t={t}
            emptyMsg="No Form 60 declarations filed yet. All high-value customers have valid PAN cards on record."
          />
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: PMLA AML CASH THRESHOLD MONITOR                                      */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "pmla" && (
        <Card t={t}>
          <CardHeader title="Prevention of Money Laundering Act (PMLA) Cash Audit Monitor" t={t} />
          <div style={{
            background: "rgba(230,59,138,0.06)", border: "1px solid rgba(230,59,138,0.2)",
            borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 13, lineHeight: 1.6
          }}>
            <strong>Statutory PMLA Mandate for Jewellers:</strong> Any single cash receipt or series of connected cash transactions exceeding <strong>₹10,00,000 (Rupees Ten Lakhs)</strong> must be logged in the AML register with verified Identity Proof and retained for 5 years for statutory audit inspection.
          </div>

          <DataTable
            columns={["Invoice No", "Date", "Customer Name", "Contact", "Total Bill", "Cash Amount", "AML Severity", "KYC Status"]}
            rows={logs.filter(l => Number(l.cash_component) >= 1000000 || l.is_pmla_flagged).map(l => ({
              "Invoice No": <strong>{l.invoice_no}</strong>,
              "Date": fmtDate(l.invoice_date),
              "Customer Name": <span>{l.customer_name}</span>,
              "Contact": <span>{l.customer_phone}</span>,
              "Total Bill": <strong>{fmt(l.total_invoice_amount)}</strong>,
              "Cash Amount": <strong style={{ color: BRAND.pink }}>{fmt(l.cash_component)}</strong>,
              "AML Severity": <span style={{ color: BRAND.pink, fontWeight: 800 }}>HIGH AUDIT RISK</span>,
              "KYC Status": <span>{l.pan_number ? `PAN: ${l.pan_number}` : "Form 60 Attached"}</span>,
            }))}
            t={t}
            emptyMsg="Clean PMLA status: Zero transactions exceed the ₹10 Lakh statutory cash AML threshold."
          />
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: STATUTORY FORM 27EQ QUARTERLY TCS PACK                               */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "form27eq" && (
        <Card t={t}>
          <CardHeader
            title="Form 27EQ (Quarterly TCS Statutory Statement for Chartered Accountants)"
            t={t}
            actions={
              <BtnPrimary onClick={handleExport27EqCsv}>
                Export Form 27EQ CA Register (.CSV)
              </BtnPrimary>
            }
          />
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12, marginBottom: 16
          }}>
            <StatCard label="Quarter" value="Q2 (July - Sept 2026)" color={BRAND.purple} t={t} />
            <StatCard label="Total TCS Returns Count" value={form27EqData?.records?.length || 0} color={BRAND.blue} t={t} />
            <StatCard label="Total TCS Depositable" value={fmt(form27EqData?.meta?.total_tcs_collected || 0)} color="#2ecc71" t={t} />
          </div>

          <DataTable
            columns={["Invoice No", "Date", "Customer / Buyer Name", "PAN", "Invoice Value", "Cash Collected", "Section", "TCS Rate", "TCS Depositable"]}
            rows={(form27EqData?.records || []).map(r => ({
              "Invoice No": <strong>{r.invoice_no}</strong>,
              "Date": fmtDate(r.invoice_date),
              "Customer / Buyer Name": <span>{r.customer_name}</span>,
              "PAN": <code>{r.pan_number}</code>,
              "Invoice Value": <span>{fmt(r.total_invoice_amount)}</span>,
              "Cash Collected": <span>{fmt(r.cash_component)}</span>,
              "Section": <strong>{r.tcs_section}</strong>,
              "TCS Rate": <span>{r.tcs_rate}%</span>,
              "TCS Depositable": <strong style={{ color: BRAND.blue }}>{fmt(r.tcs_amount)}</strong>,
            }))}
            t={t}
            emptyMsg="No TCS transactions recorded in this period."
          />
        </Card>
      )}

      {/* ── MODAL: FILE FORM 60 DECLARATION ──────────────────────────────────── */}
      <Modal
        open={form60Modal}
        onClose={() => setForm60Modal(false)}
        title="File Digital Form 60 (Declaration for Cash Sale > ₹2 Lakhs without PAN)"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setForm60Modal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={handleSubmitForm60} disabled={processing}>
              {processing ? "Submitting..." : "Verify & File Form 60"}
            </BtnPrimary>
          </>
        }
      >
        <form onSubmit={handleSubmitForm60}>
          <FormGrid>
            <FormGroup label="Declarant Full Name *" t={t} half>
              <Input
                t={t}
                value={f60Form.declarant_name}
                onChange={e => setF60Form(p => ({ ...p, declarant_name: e.target.value }))}
                placeholder="Buyer Name as on ID Proof"
                required
              />
            </FormGroup>
            <FormGroup label="Father's Name" t={t} half>
              <Input
                t={t}
                value={f60Form.father_name}
                onChange={e => setF60Form(p => ({ ...p, father_name: e.target.value }))}
                placeholder="Father's Name"
              />
            </FormGroup>
            <FormGroup label="Mobile Number *" t={t} half>
              <Input
                t={t}
                value={f60Form.mobile_number}
                onChange={e => setF60Form(p => ({ ...p, mobile_number: e.target.value }))}
                placeholder="10-digit mobile"
                required
              />
            </FormGroup>
            <FormGroup label="Transaction Amount (₹) *" t={t} half>
              <Input
                t={t}
                type="number"
                value={f60Form.transaction_amount}
                onChange={e => setF60Form(p => ({ ...p, transaction_amount: e.target.value }))}
                placeholder="₹2,50,000"
                required
              />
            </FormGroup>
            <FormGroup label="ID Proof Type *" t={t} half>
              <Select
                t={t}
                value={f60Form.id_proof_type}
                onChange={e => setF60Form(p => ({ ...p, id_proof_type: e.target.value }))}
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Voter ID">Voter ID Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
              </Select>
            </FormGroup>
            <FormGroup label="ID Proof Number *" t={t} half>
              <Input
                t={t}
                value={f60Form.id_proof_number}
                onChange={e => setF60Form(p => ({ ...p, id_proof_number: e.target.value }))}
                placeholder="e.g. 5489 1234 5678"
                required
              />
            </FormGroup>
            <FormGroup label="Residential Address" t={t}>
              <Input
                t={t}
                value={f60Form.address}
                onChange={e => setF60Form(p => ({ ...p, address: e.target.value }))}
                placeholder="Full residential address"
              />
            </FormGroup>
          </FormGrid>
        </form>
      </Modal>

      {/* ── MODAL: RECORD HIGH VALUE TCS LOG ─────────────────────────────────── */}
      <Modal
        open={recordModal}
        onClose={() => setRecordModal(false)}
        title="Record High-Value Sale & TCS Tracking"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setRecordModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={handleRecordTcs} disabled={processing}>
              {processing ? "Recording..." : "Save Compliance Log"}
            </BtnPrimary>
          </>
        }
      >
        <form onSubmit={handleRecordTcs}>
          <FormGrid>
            <FormGroup label="Invoice No *" t={t} half>
              <Input
                t={t}
                value={tcsForm.invoice_no}
                onChange={e => setTcsForm(p => ({ ...p, invoice_no: e.target.value }))}
                placeholder="INV-2026-XXXX"
                required
              />
            </FormGroup>
            <FormGroup label="Invoice Date" t={t} half>
              <Input
                t={t}
                type="date"
                value={tcsForm.invoice_date}
                onChange={e => setTcsForm(p => ({ ...p, invoice_date: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Customer Full Name *" t={t} half>
              <Input
                t={t}
                value={tcsForm.customer_name}
                onChange={e => setTcsForm(p => ({ ...p, customer_name: e.target.value }))}
                placeholder="Customer Name"
                required
              />
            </FormGroup>
            <FormGroup label="Customer Phone" t={t} half>
              <Input
                t={t}
                value={tcsForm.customer_phone}
                onChange={e => setTcsForm(p => ({ ...p, customer_phone: e.target.value }))}
                placeholder="Mobile number"
              />
            </FormGroup>
            <FormGroup label="Customer PAN Number (Mandatory for >₹2L)" t={t} half>
              <Input
                t={t}
                value={tcsForm.pan_number}
                onChange={e => setTcsForm(p => ({ ...p, pan_number: e.target.value.toUpperCase() }))}
                placeholder="ABCDE1234F"
              />
            </FormGroup>
            <FormGroup label="Total Invoice Amount (₹) *" t={t} half>
              <Input
                t={t}
                type="number"
                value={tcsForm.total_invoice_amount}
                onChange={e => setTcsForm(p => ({ ...p, total_invoice_amount: e.target.value }))}
                placeholder="₹2,50,000"
                required
              />
            </FormGroup>
            <FormGroup label="Cash Component (₹) *" t={t} half>
              <Input
                t={t}
                type="number"
                value={tcsForm.cash_component}
                onChange={e => setTcsForm(p => ({ ...p, cash_component: e.target.value }))}
                placeholder="Cash portion (1% TCS if >= 2L)"
                required
              />
            </FormGroup>
            <FormGroup label="Digital / Bank Component (₹)" t={t} half>
              <Input
                t={t}
                type="number"
                value={tcsForm.digital_component}
                onChange={e => setTcsForm(p => ({ ...p, digital_component: e.target.value }))}
                placeholder="Card / UPI / RTGS portion"
              />
            </FormGroup>
          </FormGrid>
        </form>
      </Modal>
    </div>
  );
}
