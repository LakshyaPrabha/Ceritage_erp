import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
         BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
         Input, Select, SectionTitle } from "../../components/ui";
import { apiRequest, formatCurrency } from "../../lib/api";

// ── Razorpay Checkout helper for EMI installment payment ─────────────────────
const API_BASE = window.__CERITAGE_API__ || "http://localhost:5000/api";

function authHeadersEmi() {
  const token = sessionStorage.getItem("ceritage_token") || localStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function loadRazorpayScriptEmi() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function openRazorpayEmiCheckout({ planId, installmentId, onSuccess, onFailure }) {
  const loaded = await loadRazorpayScriptEmi();
  if (!loaded) { onFailure("Razorpay checkout script failed to load"); return; }

  // Create Razorpay order for this EMI installment
  const orderRes = await fetch(`${API_BASE}/emi/plans/${planId}/online-payment`, {
    method: "POST",
    headers: authHeadersEmi(),
    body: JSON.stringify({ installment_id: installmentId }),
  });
  const orderData = await orderRes.json();
  if (!orderData.success) { onFailure(orderData.message || "Could not create EMI payment order"); return; }

  const { provider_order_id, amount_paise, key_id, gateway_payment_id, installment_no } = orderData.data;

  const rzp = new window.Razorpay({
    key: key_id,
    amount: amount_paise,
    currency: "INR",
    name: "Ceritage Jewelry",
    description: `EMI Installment #${installment_no}`,
    order_id: provider_order_id,
    handler: async function (response) {
      const verifyRes = await fetch(`${API_BASE}/emi/plans/${planId}/online-payment/verify`, {
        method: "POST",
        headers: authHeadersEmi(),
        body: JSON.stringify({
          gateway_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      const vd = await verifyRes.json();
      if (vd.success) { onSuccess(vd.data); }
      else { onFailure(vd.message || "EMI payment verification failed"); }
    },
    modal: { ondismiss: () => onFailure("EMI payment cancelled") },
    theme: { color: "#8B3BC8" },
  });
  rzp.open();
}


const TABS = [
  { id:"credit",  label:"Credit Sales" },
  { id:"plans",   label:"Active EMI Plans" },
  { id:"due",     label:"Due Reminders" },
  { id:"track",   label:"Payment Collection Log" },
  { id:"report",  label:"Outstanding Report" },
];

export default function Emi({ t }) {
  const [tab, setTab] = useState("credit");

  // â”€â”€ Data States â”€â”€
  const [kpis, setKpis] = useState({});
  const [creditSales, setCreditSales] = useState([]);
  const [plans, setPlans] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");

  // Modals
  const [planModal, setPlanModal] = useState(false);
  const [collectModal, setCollectModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [creditPayModal, setCreditPayModal] = useState(false);

  // Active Plan & Selected Data
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCreditInv, setSelectedCreditInv] = useState(null);

  // New EMI Plan Form
  const [newPlanForm, setNewPlanForm] = useState({
    customer_id: "",
    invoice_ref: "",
    item_description: "",
    total_amount: "",
    down_payment: 0,
    num_emis: 6,
    interest_rate: 0,
    first_due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    finance_partner: "In-House",
    payment_method: "MANUAL",
    autopay_provider: "mock",
  });
  const [planSaving, setPlanSaving] = useState(false);
  const [planMsg, setPlanMsg] = useState("");

  // Collect Payment Form
  const [collectForm, setCollectForm] = useState({
    installment_id: "",
    installment_no: 1,
    amount_due: 0,
    amount: "",
    payment_mode: "Cash",
    payment_date: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });
  const [collecting, setCollecting] = useState(false);
  const [collectMsg, setCollectMsg] = useState("");

  // Credit Payment Form
  const [creditPayForm, setCreditPayForm] = useState({
    amount: "",
    payment_mode: "UPI",
    notes: "Credit sale settlement",
    date: new Date().toISOString().slice(0, 10),
  });
  const [creditPaying, setCreditPaying] = useState(false);
  const [creditPayMsg, setCreditPayMsg] = useState("");

  // â”€â”€ Load KPIs â”€â”€
  const loadKpis = useCallback(async () => {
    try {
      const res = await apiRequest("/emi/kpis");
      setKpis(res.data || {});
    } catch (err) {
      console.warn("EMI KPI error:", err.message);
    }
  }, []);

  // â”€â”€ Load Customers (for dropdown) â”€â”€
  const loadCustomers = useCallback(async () => {
    try {
      const res = await apiRequest("/customers?limit=200");
      setCustomers(res.data || []);
    } catch (err) {
      console.warn("Customers error:", err.message);
    }
  }, []);

  // â”€â”€ Load Tab Data â”€â”€
  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "credit") {
        const res = await apiRequest("/emi/credit-sales");
        setCreditSales(res.data || []);
      } else if (tab === "plans") {
        let q = `/emi/plans?`;
        if (search) q += `&search=${encodeURIComponent(search)}`;
        const res = await apiRequest(q);
        setPlans(res.data || []);
      } else if (tab === "due") {
        const res = await apiRequest("/emi/due-reminders");
        setReminders(res.data || []);
      } else if (tab === "track") {
        const res = await apiRequest("/emi/payments?limit=100");
        setPayments(res.data || []);
      } else if (tab === "report") {
        const [pRes, cRes] = await Promise.all([
          apiRequest("/emi/plans"),
          apiRequest("/emi/credit-sales")
        ]);
        setPlans(pRes.data || []);
        setCreditSales(cRes.data || []);
      }
    } catch (err) {
      console.warn("EMI tab load notice:", err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    loadKpis();
    loadCustomers();
  }, [loadKpis, loadCustomers]);

  useEffect(() => {
    loadTabData();
  }, [tab, loadTabData]);

  // â”€â”€ Math Preview for New EMI Plan â”€â”€
  const totalAmt = Number(newPlanForm.total_amount || 0);
  const downPay = Number(newPlanForm.down_payment || 0);
  const loanAmt = Math.max(0, totalAmt - downPay);
  const intRate = Number(newPlanForm.interest_rate || 0);
  const intAmt = loanAmt * (intRate / 100);
  const totalPayable = loanAmt + intAmt;
  const numEmis = parseInt(newPlanForm.num_emis || 6);
  const roundedEmi = numEmis > 0 ? Math.floor(totalPayable / numEmis) : 0;
  const finalEmi = numEmis > 0 ? (totalPayable - (roundedEmi * (numEmis - 1))) : 0;

  // â”€â”€ Open Plan Creation Modal â”€â”€
  const openNewPlanModal = () => {
    setNewPlanForm({
      customer_id: "",
      invoice_ref: "",
      item_description: "",
      total_amount: "",
      down_payment: 0,
      num_emis: 6,
      interest_rate: 0,
      first_due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      finance_partner: "In-House",
      payment_method: "MANUAL",
      autopay_provider: "mock",
    });
    setPlanMsg("");
    setPlanModal(true);
  };

  // â”€â”€ Handle Save Plan â”€â”€
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!newPlanForm.customer_id || totalAmt <= 0) {
      setPlanMsg("Please select a customer and enter a valid total amount.");
      return;
    }
    setPlanSaving(true);
    setPlanMsg("");
    try {
      const created = await apiRequest("/emi/plans", {
        method: "POST",
        body: JSON.stringify(newPlanForm),
      });
      if (newPlanForm.payment_method === "AUTOPAY" && created?.data?.id) {
        await apiRequest(`/emi/plans/${created.data.id}/autopay/setup`, {
          method: "POST",
          body: JSON.stringify({ provider: newPlanForm.autopay_provider || "mock" }),
        });
      }
      setPlanModal(false);
      await loadKpis();
      await loadTabData();
    } catch (err) {
      setPlanMsg(`âœ— ${err.message}`);
    } finally {
      setPlanSaving(false);
    }
  };

  // â”€â”€ Open Collect EMI Modal â”€â”€
  const openCollectModal = async (plan) => {
    try {
      const res = await apiRequest(`/emi/plans/${plan.id}`);
      const fullPlan = res.data;
      setSelectedPlan(fullPlan);

      // Find next pending or partial installment
      const pendingInst = (fullPlan.installments || []).find(i => ["pending", "due", "failed", "partial", "overdue"].includes(String(i.status || "").toLowerCase()));
      if (!pendingInst) {
        alert("All installments for this EMI plan are already fully paid.");
        return;
      }

      const due = Number(pendingInst.amount_due) - Number(pendingInst.amount_paid);
      setCollectForm({
        installment_id: pendingInst.id,
        installment_no: pendingInst.installment_no,
        amount_due: due,
        amount: due,
        payment_mode: "Cash",
        payment_date: new Date().toISOString().slice(0, 10),
        reference: "",
        notes: `Installment #${pendingInst.installment_no}`,
      });
      setCollectMsg("");
      setCollectModal(true);
    } catch (err) {
      alert(`Could not load EMI plan details: ${err.message}`);
    }
  };

  // â”€â”€ Handle Collect Payment Submit â”€â”€
  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!selectedPlan?.id || !collectForm.amount || Number(collectForm.amount) <= 0) {
      setCollectMsg("Please enter a valid collection amount.");
      return;
    }
    setCollecting(true);
    setCollectMsg("");
    try {
      const res = await apiRequest(`/emi/plans/${selectedPlan.id}/collect`, {
        method: "POST",
        body: JSON.stringify(collectForm),
      });
      setCollectModal(false);
      alert(`âœ“ ${res.message}`);
      await loadKpis();
      await loadTabData();
    } catch (err) {
      setCollectMsg(`âœ— ${err.message}`);
    } finally {
      setCollecting(false);
    }
  };

  // â”€â”€ Open Schedule Modal â”€â”€
  const openScheduleModal = async (plan) => {
    try {
      const res = await apiRequest(`/emi/plans/${plan.id}`);
      setSelectedPlan(res.data);
      setScheduleModal(true);
    } catch (err) {
      alert(`Could not load schedule: ${err.message}`);
    }
  };

  // â”€â”€ Open Quick Pay for Credit Sale â”€â”€
  const setupAutopay = async (plan) => {
    try {
      const res = await apiRequest(`/emi/plans/${plan.id}/autopay/setup`, {
        method: "POST",
        body: JSON.stringify({ provider: plan.gateway_provider || "mock" }),
      });
      alert(res.message || "AutoPay setup initiated.");
      await loadKpis();
      await loadTabData();
    } catch (err) {
      alert(`AutoPay setup failed: ${err.message}`);
    }
  };

  const updateAutopay = async (plan, action) => {
    try {
      const res = await apiRequest(`/emi/plans/${plan.id}/autopay/${action}`, { method: "POST" });
      alert(res.message || `AutoPay ${action} request saved.`);
      await loadKpis();
      await loadTabData();
    } catch (err) {
      alert(`AutoPay ${action} failed: ${err.message}`);
    }
  };

  const retryAutopay = async (plan) => {
    try {
      const res = await apiRequest(`/emi/plans/${plan.id}/autopay/retry`, {
        method: "POST",
        body: JSON.stringify({ provider: plan.gateway_provider || "mock" }),
      });
      alert(res.message || "AutoPay retry attempt created.");
      await loadKpis();
      await loadTabData();
    } catch (err) {
      alert(`AutoPay retry failed: ${err.message}`);
    }
  };

  const openCreditPayModal = (inv) => {
    setSelectedCreditInv(inv);
    setCreditPayForm({
      amount: inv.balance_due || (Number(inv.grand_total) - Number(inv.paid_amount || 0)),
      payment_mode: "UPI",
      invoice_no: inv.invoice_no,
      notes: `Settlement for ${inv.invoice_no}`,
      date: new Date().toISOString().slice(0, 10),
    });
    setCreditPayMsg("");
    setCreditPayModal(true);
  };

  const handlePayCreditSale = async (e) => {
    e.preventDefault();
    if (!selectedCreditInv?.customer_id || !creditPayForm.amount) return;
    setCreditPaying(true);
    setCreditPayMsg("");
    try {
      await apiRequest(`/customers/${selectedCreditInv.customer_id}/payments`, {
        method: "POST",
        body: JSON.stringify(creditPayForm),
      });
      setCreditPayModal(false);
      await loadKpis();
      await loadTabData();
    } catch (err) {
      setCreditPayMsg(`âœ— ${err.message}`);
    } finally {
      setCreditPaying(false);
    }
  };

  // CSV Export
  const handleExport = () => {
    if (tab === "credit" && creditSales.length > 0) {
      const cols = ["Invoice No", "Customer", "Invoice Date", "Credit Days", "Due Date", "Grand Total", "Paid Amount", "Balance Due", "Aging"];
      const header = cols.join(",");
      const lines = creditSales.map(c => [
        c.invoice_no, `"${(c.customer_name || '').replace(/"/g, '""')}"`,
        c.invoice_date ? c.invoice_date.slice(0,10) : '',
        c.credit_days || 0, c.credit_due_date ? c.credit_due_date.slice(0,10) : '',
        c.grand_total, c.paid_amount, c.balance_due, `"${c.aging_category}"`
      ].join(","));
      const blob = new Blob([[header, ...lines].join("\n")], { type:"text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `Credit_Sales_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    } else if (tab === "plans" && plans.length > 0) {
      const cols = ["Plan ID", "Customer", "Invoice Ref", "Total", "Down Payment", "Loan Amount", "EMIs", "EMI Amount", "Paid EMIs", "Remaining", "Finance Partner", "Status"];
      const header = cols.join(",");
      const lines = plans.map(p => [
        p.plan_id, `"${(p.customer_name || '').replace(/"/g, '""')}"`,
        p.invoice_ref || '', p.total_amount, p.down_payment, p.loan_amount, p.num_emis,
        p.emi_amount, p.paid_emis, p.remaining_amount, `"${p.finance_partner}"`, p.status
      ].join(","));
      const blob = new Blob([[header, ...lines].join("\n")], { type:"text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `EMI_Plans_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    }
  };

  return (
    <div>
      <PageHeader
        title="Credit Customer & EMI Management"
        subtitle="Credit Sales Â· Server-Side Aging Â· EMI Plan Engine Â· Installment Receipts Â· Auto Ledger Integration"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={handleExport}>â¤“ Export CSV</BtnOutline>
          <BtnPrimary onClick={openNewPlanModal}>+ New EMI Plan</BtnPrimary>
        </>}
      />

      {/* â”€â”€ KPI Stat Cards â”€â”€ */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Active EMI Plans"    value={kpis.activeEmiPlans ?? 0}            color={BRAND.blue}   t={t} />
        <StatCard label="EMI Outstanding"     value={formatCurrency(kpis.totalEmiOutstanding ?? 0)} color="#f0c040"      t={t} />
        <StatCard label="EMI Dues Today"      value={formatCurrency(kpis.duesToday ?? 0)}           color="#f39c12"      t={t} />
        <StatCard label="Overdue Plans"       value={kpis.overduePlans ?? 0}             color="#e74c3c"      t={t} />
        <StatCard label="Active Credit Bills" value={kpis.activeCreditInvoices ?? 0}     color={BRAND.purple} t={t} />
        <StatCard label="Credit Overdue Bills" value={kpis.creditOverdue ?? 0}           color={BRAND.pink}   t={t} />
      </div>

      {/* â”€â”€ Tabs Navigation â”€â”€ */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* â”€â”€ TAB 1: CREDIT SALES REGISTER â”€â”€ */}
      {tab === "credit" && (
        <Card t={t}>
          <CardHeader
            title="Credit Sales & Aging Register"
            t={t}
            actions={<>
              <BtnOutline t={t} onClick={loadTabData}>â†» Refresh</BtnOutline>
            </>}
          />
          <DataTable
            columns={["Invoice No", "Customer", "Invoice Date", "Credit Days", "Due Date", "Grand Total", "Paid Amount", "Balance Due", "Aging Status", "Actions"]}
            rows={creditSales.map(c => ({
              "Invoice No": <strong>{c.invoice_no}</strong>,
              "Customer": (
                <div>
                  <strong>{c.customer_name}</strong>
                  <div style={{ fontSize:11, color:t.textMuted }}>{c.customer_phone}</div>
                </div>
              ),
              "Invoice Date": c.invoice_date ? new Date(c.invoice_date).toLocaleDateString("en-IN") : "-",
              "Credit Days": <span style={{ fontWeight:600 }}>{c.credit_days || 30} days</span>,
              "Due Date": c.credit_due_date ? <code>{new Date(c.credit_due_date).toLocaleDateString("en-IN")}</code> : <span style={{ color:t.textMuted }}>Not Set</span>,
              "Grand Total": formatCurrency(c.grand_total),
              "Paid Amount": <span style={{ color:"#27ae60" }}>{formatCurrency(c.paid_amount)}</span>,
              "Balance Due": <strong style={{ color:BRAND.pink, fontSize:14 }}>{formatCurrency(c.balance_due)}</strong>,
              "Aging Status": (
                <span style={{
                  padding:"3px 9px", borderRadius:6, fontSize:11, fontWeight:700,
                  background: c.aging_category.includes("Overdue") ? "#e74c3c22" : (c.aging_category === "Due Today" ? "#f39c1222" : "#2ecc7122"),
                  color: c.aging_category.includes("Overdue") ? BRAND.pink : (c.aging_category === "Due Today" ? "#d35400" : "#27ae60")
                }}>
                  {c.aging_category}
                </span>
              ),
              "Actions": (
                <div style={{ display:"flex", gap:6 }}>
                  <BtnSm t={t} primary onClick={() => openCreditPayModal(c)}>Collect Payment</BtnSm>
                </div>
              )
            }))}
            t={t}
            emptyMsg={loading ? "Loading credit sales..." : "âœ“ No pending credit sales found"}
          />
        </Card>
      )}

      {/* â”€â”€ TAB 2: ACTIVE EMI PLANS â”€â”€ */}
      {tab === "plans" && (
        <Card t={t}>
          <CardHeader
            title="Active & Closed EMI Plans"
            t={t}
            actions={<>
              <input
                placeholder="Search plan ID, customer, invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                  borderRadius:8, padding:"7px 12px", fontSize:13,
                  color:t.inputColor, outline:"none", fontFamily:"inherit", width:230
                }}
              />
              <BtnOutline t={t} onClick={loadTabData}>â†» Refresh</BtnOutline>
              <BtnPrimary onClick={openNewPlanModal}>+ New Plan</BtnPrimary>
            </>}
          />
          <DataTable
            columns={["Plan ID", "Customer", "Invoice", "Total (â‚¹)", "Down Pay (â‚¹)", "Monthly EMI", "Progress", "Remaining (â‚¹)", "Next Due", "Partner", "Status", "Actions"]}
            rows={plans.map(p => ({
              "Plan ID": <strong>{p.plan_id}</strong>,
              "Customer": (
                <div>
                  <strong>{p.customer_name}</strong>
                  <div style={{ fontSize:11, color:t.textMuted }}>{p.customer_phone}</div>
                </div>
              ),
              "Invoice": p.invoice_ref ? <code>{p.invoice_ref}</code> : <span style={{ color:t.textMuted }}>-</span>,
              "Total (â‚¹)": formatCurrency(p.total_amount),
              "Down Pay (â‚¹)": formatCurrency(p.down_payment || 0),
              "Monthly EMI": <strong style={{ color:BRAND.purple }}>{formatCurrency(p.emi_amount)}</strong>,
              "Progress": (
                <div>
                  <span style={{ fontWeight:700 }}>{p.paid_emis || 0} / {p.num_emis}</span>
                  <div style={{ width:70, height:5, background:t.borderDash, borderRadius:3, marginTop:3, overflow:"hidden" }}>
                    <div style={{ width:`${((p.paid_emis || 0) / (p.num_emis || 1)) * 100}%`, height:"100%", background:"#27ae60" }} />
                  </div>
                </div>
              ),
              "Remaining (â‚¹)": (
                <strong style={{ color: Number(p.remaining_amount) > 0 ? BRAND.pink : "#27ae60" }}>
                  {formatCurrency(p.remaining_amount || 0)}
                </strong>
              ),
              "Next Due": p.next_due_date ? <code>{new Date(p.next_due_date).toLocaleDateString("en-IN")}</code> : <span style={{ color:"#27ae60" }}>âœ“ Settled</span>,
              "Partner": (
                <div>
                  <span style={{ fontSize:11, fontWeight:600 }}>{p.finance_partner}</span>
                  <div style={{ fontSize:10, color:t.textMuted }}>
                    {p.payment_method || "MANUAL"} Â· {p.autopay_status || "NOT_ENABLED"}
                  </div>
                  {p.next_debit_date && (
                    <div style={{ fontSize:10, color:t.textMuted }}>
                      Next debit: {new Date(p.next_debit_date).toLocaleDateString("en-IN")}
                    </div>
                  )}
                </div>
              ),
              "Status": (
                <span style={{
                  padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                  background: p.status === "Active" ? "#2ecc7122" : "#95a5a622",
                  color: p.status === "Active" ? "#27ae60" : "#7f8c8d"
                }}>
                  {p.status}
                </span>
              ),
              "Actions": (
                <div style={{ display:"flex", gap:6 }}>
                  {p.status === "Active" && (
                    <BtnSm t={t} primary onClick={() => openCollectModal(p)}>Collect EMI</BtnSm>
                  )}
                  {p.status === "Active" && (p.payment_method || "MANUAL") !== "AUTOPAY" && (
                    <BtnSm t={t} onClick={() => setupAutopay(p)}>Setup AutoPay</BtnSm>
                  )}
                  {(p.autopay_status === "ACTIVE" || p.autopay_status === "FAILED") && (
                    <BtnSm t={t} onClick={() => updateAutopay(p, "pause")}>Pause</BtnSm>
                  )}
                  {p.autopay_status === "PAUSED" && (
                    <BtnSm t={t} onClick={() => updateAutopay(p, "resume")}>Resume</BtnSm>
                  )}
                  {(p.autopay_status === "ACTIVE" || p.autopay_status === "FAILED") && (
                    <BtnSm t={t} onClick={() => retryAutopay(p)}>Retry</BtnSm>
                  )}
                  {(p.payment_method || "MANUAL") === "AUTOPAY" && p.autopay_status !== "CANCELLED" && (
                    <BtnSm t={t} onClick={() => updateAutopay(p, "cancel")}>Cancel</BtnSm>
                  )}
                  <BtnSm t={t} onClick={() => openScheduleModal(p)}>Schedule</BtnSm>
                </div>
              )
            }))}
            t={t}
            emptyMsg={loading ? "Loading EMI plans..." : "No EMI plans found"}
          />
        </Card>
      )}

      {/* â”€â”€ TAB 3: DUE REMINDERS â”€â”€ */}
      {tab === "due" && (
        <div>
          <div style={{
            background:`rgba(230,59,138,0.08)`, border:`1px solid rgba(230,59,138,0.2)`,
            borderRadius:10, padding:14, marginBottom:16,
            display:"flex", alignItems:"center", gap:14
          }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:t.text, fontSize:15 }}>Upcoming & Overdue Payment Reminders</div>
              <div style={{ fontSize:12, color:t.textMuted, marginTop:2 }}>
                Prioritized automatically: Overdue dues first, followed by today's dues and upcoming installments.
              </div>
            </div>
            <BtnOutline t={t} onClick={loadTabData}>â†» Refresh Reminders</BtnOutline>
          </div>

          <Card t={t}>
            <CardHeader title="Due Reminder Queue" t={t} />
            <DataTable
              columns={["Type", "Customer", "Phone", "Reference / Plan", "Amount Due (â‚¹)", "Due Date", "Urgency Status", "WhatsApp Action"]}
              rows={reminders.map(rem => ({
                "Type": (
                  <span style={{
                    padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                    background: rem.record_type === "EMI" ? `${BRAND.purple}22` : "#f39c1222",
                    color: rem.record_type === "EMI" ? BRAND.purple : "#d35400"
                  }}>
                    {rem.record_type}
                  </span>
                ),
                "Customer": <strong>{rem.customer_name}</strong>,
                "Phone": rem.customer_phone,
                "Reference / Plan": <code>{rem.plan_id}{rem.installment_no ? ` (#${rem.installment_no})` : ''}</code>,
                "Amount Due (â‚¹)": <strong style={{ color:BRAND.pink, fontSize:14 }}>{formatCurrency(rem.amount_due)}</strong>,
                "Due Date": <code>{new Date(rem.due_date).toLocaleDateString("en-IN")}</code>,
                "Urgency Status": (
                  <span style={{
                    padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:700,
                    background: rem.urgency === "OVERDUE" ? "#e74c3c22" : (rem.urgency === "DUE_TODAY" ? "#f39c1222" : "#2ecc7122"),
                    color: rem.urgency === "OVERDUE" ? BRAND.pink : (rem.urgency === "DUE_TODAY" ? "#d35400" : "#27ae60")
                  }}>
                    {rem.urgency === "OVERDUE" ? `âš  Overdue (${rem.days_overdue}d)` : (rem.urgency === "DUE_TODAY" ? "âš¡ Due Today" : "Upcoming")}
                  </span>
                ),
                "WhatsApp Action": (
                  <a
                    href={`https://wa.me/91${rem.customer_phone}?text=${encodeURIComponent(`Dear ${rem.customer_name}, this is a gentle payment reminder from Ceritage Jewellers for your ${rem.record_type} payment of ${formatCurrency(rem.amount_due)} (Ref: ${rem.plan_id}) due on ${new Date(rem.due_date).toLocaleDateString('en-IN')}. Kindly settle via UPI or visit our showroom.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color:BRAND.purple, fontWeight:700, textDecoration:"none", fontSize:12 }}
                  >
                    Send Reminder â†’
                  </a>
                )
              }))}
              t={t}
              emptyMsg={loading ? "Loading reminders..." : "âœ“ No pending dues or overdue installments"}
            />
          </Card>
        </div>
      )}

      {/* â”€â”€ TAB 4: PAYMENT COLLECTION LOG â”€â”€ */}
      {tab === "track" && (
        <Card t={t}>
          <CardHeader
            title="EMI Installment Payment Receipts"
            t={t}
            actions={<>
              <BtnOutline t={t} onClick={loadTabData}>â†» Refresh</BtnOutline>
            </>}
          />
          <DataTable
            columns={["Receipt No", "Plan ID", "Customer", "Date", "Amount (â‚¹)", "Payment Mode", "Installment #", "Reference / Notes", "Collected By"]}
            rows={payments.map(pay => ({
              "Receipt No": <strong>{pay.receipt_no}</strong>,
              "Plan ID": <code>{pay.plan_id}</code>,
              "Customer": (
                <div>
                  <strong>{pay.customer_name}</strong>
                  <div style={{ fontSize:11, color:t.textMuted }}>{pay.customer_phone}</div>
                </div>
              ),
              "Date": pay.payment_date ? new Date(pay.payment_date).toLocaleDateString("en-IN") : "-",
              "Amount (â‚¹)": <strong style={{ color:"#27ae60", fontSize:14 }}>{formatCurrency(pay.amount)}</strong>,
              "Payment Mode": (
                <span style={{ padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:700, background:"#3498db22", color:"#2980b9" }}>
                  {pay.payment_mode}
                </span>
              ),
              "Installment #": <span style={{ fontWeight:700 }}>#{pay.installment_no}</span>,
              "Reference / Notes": pay.notes || pay.reference || "-",
              "Collected By": <span style={{ fontSize:12, color:t.textMuted }}>{pay.performed_by || 'Admin'}</span>,
            }))}
            t={t}
            emptyMsg={loading ? "Loading payment receipts..." : "No EMI payment receipts recorded"}
          />
        </Card>
      )}

      {/* â”€â”€ TAB 5: OUTSTANDING REPORT â”€â”€ */}
      {tab === "report" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Card t={t} style={{ marginBottom:0 }}>
              <CardHeader title="Summary by Finance Partner" t={t} />
              <DataTable
                columns={["Finance Partner", "Active Plans", "Total Disbursed (â‚¹)", "Outstanding Balance (â‚¹)"]}
                rows={["In-House", "Bajaj Finserv", "HDFC Bank", "Tata Capital"].map(partner => {
                  const filtered = plans.filter(p => p.finance_partner === partner);
                  const disbursed = filtered.reduce((s, p) => s + Number(p.total_amount || 0), 0);
                  const out = filtered.reduce((s, p) => s + Number(p.remaining_amount || 0), 0);
                  return {
                    "Finance Partner": <strong>{partner}</strong>,
                    "Active Plans": filtered.length,
                    "Total Disbursed (â‚¹)": formatCurrency(disbursed),
                    "Outstanding Balance (â‚¹)": <strong style={{ color: out > 0 ? BRAND.pink : "#27ae60" }}>{formatCurrency(out)}</strong>
                  };
                })}
                t={t}
              />
            </Card>

            <Card t={t} style={{ marginBottom:0 }}>
              <CardHeader title="Direct Credit Summary" t={t} />
              <div style={{ padding:"16px 20px" }}>
                <div style={{ fontSize:12, color:t.textMuted }}>Total Unsettled Credit Sales</div>
                <div style={{ fontSize:26, fontWeight:800, color:BRAND.pink, marginTop:4 }}>
                  {formatCurrency(creditSales.reduce((s, c) => s + Number(c.balance_due || 0), 0))}
                </div>
                <div style={{ fontSize:13, color:t.textMuted, marginTop:12 }}>
                  Overdue Accounts: <strong>{creditSales.filter(c => c.aging_category.includes("Overdue")).length}</strong>
                </div>
                <div style={{ fontSize:13, color:t.textMuted, marginTop:4 }}>
                  Due Today: <strong>{creditSales.filter(c => c.aging_category === "Due Today").length}</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* â”€â”€ NEW EMI PLAN MODAL â”€â”€ */}
      <Modal
        open={planModal}
        onClose={() => setPlanModal(false)}
        title="Create New EMI Plan"
        t={t}
        wide
        footer={<>
          <BtnOutline t={t} onClick={() => setPlanModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSavePlan} disabled={planSaving}>
            {planSaving ? "Creating Plan..." : "Create & Generate Schedule"}
          </BtnPrimary>
        </>}
      >
        <form onSubmit={handleSavePlan}>
          <FormGrid>
            <FormGroup label="Select Customer *" t={t} half>
              <Select
                t={t}
                value={newPlanForm.customer_id}
                onChange={(e) => setNewPlanForm(f => ({ ...f, customer_id: e.target.value }))}
                required
              >
                <option value="">-- Choose Registered Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone}) - {c.tier} Tier
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Linked Invoice No (Optional)" t={t} half>
              <Input
                t={t}
                placeholder="e.g. INV-2026-0001"
                value={newPlanForm.invoice_ref}
                onChange={(e) => setNewPlanForm(f => ({ ...f, invoice_ref: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Item Purchased Description" t={t}>
              <Input
                t={t}
                placeholder="e.g. 22K Gold Bridal Choker Set"
                value={newPlanForm.item_description}
                onChange={(e) => setNewPlanForm(f => ({ ...f, item_description: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Total Purchase Amount (â‚¹) *" t={t} half>
              <Input
                t={t}
                type="number"
                placeholder="e.g. 120000"
                value={newPlanForm.total_amount}
                onChange={(e) => setNewPlanForm(f => ({ ...f, total_amount: e.target.value }))}
                required
              />
            </FormGroup>

            <FormGroup label="Down Payment Received (â‚¹)" t={t} half>
              <Input
                t={t}
                type="number"
                placeholder="0.00"
                value={newPlanForm.down_payment}
                onChange={(e) => setNewPlanForm(f => ({ ...f, down_payment: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Number of Monthly EMIs *" t={t} half>
              <Select
                t={t}
                value={newPlanForm.num_emis}
                onChange={(e) => setNewPlanForm(f => ({ ...f, num_emis: e.target.value }))}
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="9">9 Months</option>
                <option value="12">12 Months (1 Year)</option>
                <option value="18">18 Months</option>
                <option value="24">24 Months (2 Years)</option>
              </Select>
            </FormGroup>

            <FormGroup label="Interest Rate (% Total)" t={t} half>
              <Input
                t={t}
                type="number"
                step="0.1"
                placeholder="0"
                value={newPlanForm.interest_rate}
                onChange={(e) => setNewPlanForm(f => ({ ...f, interest_rate: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Finance Partner" t={t} half>
              <Select
                t={t}
                value={newPlanForm.finance_partner}
                onChange={(e) => setNewPlanForm(f => ({ ...f, finance_partner: e.target.value }))}
              >
                <option value="In-House">In-House Jeweller EMI</option>
                <option value="Bajaj Finserv">Bajaj Finserv</option>
                <option value="HDFC Bank">HDFC Bank EasyEMI</option>
                <option value="Tata Capital">Tata Capital</option>
              </Select>
            </FormGroup>

            <FormGroup label="First Installment Due Date *" t={t} half>
              <Input
                t={t}
                type="date"
                value={newPlanForm.first_due_date}
                onChange={(e) => setNewPlanForm(f => ({ ...f, first_due_date: e.target.value }))}
                required
              />
            </FormGroup>

            <FormGroup label="Payment Method" t={t} half>
              <Select
                t={t}
                value={newPlanForm.payment_method}
                onChange={(e) => setNewPlanForm(f => ({ ...f, payment_method: e.target.value }))}
              >
                <option value="MANUAL">Manual Collection</option>
                <option value="AUTOPAY">AutoPay Mandate</option>
              </Select>
            </FormGroup>

            {newPlanForm.payment_method === "AUTOPAY" && (
              <FormGroup label="AutoPay Provider" t={t} half>
                <Select
                  t={t}
                  value={newPlanForm.autopay_provider}
                  onChange={(e) => setNewPlanForm(f => ({ ...f, autopay_provider: e.target.value }))}
                >
                  <option value="mock">Mock / Sandbox</option>
                  <option value="razorpay">Razorpay</option>
                </Select>
              </FormGroup>
            )}
          </FormGrid>

          {/* Math Preview Calculation Card */}
          {totalAmt > 0 && (
            <div style={{
              background:t.card2||t.card, border:`1px solid ${t.borderDash}`,
              borderRadius:10, padding:14, marginTop:14
            }}>
              <div style={{ fontSize:12, fontWeight:700, color:BRAND.purple, marginBottom:8 }}>
                ðŸ“Š Deterministic EMI Calculation Breakdown
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10 }}>
                <div>
                  <div style={{ fontSize:11, color:t.textMuted }}>Principal Loan</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{formatCurrency(loanAmt)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:t.textMuted }}>Interest Payable</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{formatCurrency(intAmt)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:t.textMuted }}>Total Payable</div>
                  <div style={{ fontSize:14, fontWeight:700, color:BRAND.pink }}>{formatCurrency(totalPayable)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:t.textMuted }}>Monthly EMI (1 to {numEmis - 1})</div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#27ae60" }}>{formatCurrency(roundedEmi)}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:t.textMuted }}>Final Reconciled EMI</div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#27ae60" }}>{formatCurrency(finalEmi)}</div>
                </div>
              </div>
            </div>
          )}

          {planMsg && (
            <div style={{ color: BRAND.pink, fontSize:13, marginTop:10 }}>
              {planMsg}
            </div>
          )}
        </form>
      </Modal>

      {/* â”€â”€ COLLECT EMI INSTALLMENT MODAL â”€â”€ */}
      <Modal
        open={collectModal}
        onClose={() => setCollectModal(false)}
        title={`Collect EMI: ${selectedPlan?.plan_id || ''} (Installment #${collectForm.installment_no})`}
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setCollectModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleCollectPayment} disabled={collecting}>
            {collecting ? "Processing..." : "Generate Receipt & Credit Ledger"}
          </BtnPrimary>
        </>}
      >
        <form onSubmit={handleCollectPayment}>
          <div style={{
            background:t.card2||t.card, padding:14, borderRadius:8,
            border:`1px solid ${t.borderDash}`, marginBottom:14
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:12, color:t.textMuted }}>Customer:</span>
              <strong>{selectedPlan?.customer_name} ({selectedPlan?.customer_phone})</strong>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:12, color:t.textMuted }}>Plan Outstanding Balance:</span>
              <strong style={{ color:BRAND.pink }}>{formatCurrency(selectedPlan?.remaining_amount || 0)}</strong>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:t.textMuted }}>Installment #{collectForm.installment_no} Due:</span>
              <strong style={{ color:"#27ae60", fontSize:15 }}>{formatCurrency(collectForm.amount_due || 0)}</strong>
            </div>
          </div>

          <FormGrid>
            <FormGroup label="Collection Amount (â‚¹) *" t={t} half>
              <Input
                t={t}
                type="number"
                placeholder="0.00"
                value={collectForm.amount}
                onChange={(e) => setCollectForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </FormGroup>

            <FormGroup label="Payment Mode *" t={t} half>
              <Select
                t={t}
                value={collectForm.payment_mode}
                onChange={(e) => setCollectForm(f => ({ ...f, payment_mode: e.target.value }))}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="Cheque">Cheque</option>
              </Select>
            </FormGroup>

            <FormGroup label="Payment Date" t={t} half>
              <Input
                t={t}
                type="date"
                value={collectForm.payment_date}
                onChange={(e) => setCollectForm(f => ({ ...f, payment_date: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Reference / Transaction ID" t={t} half>
              <Input
                t={t}
                placeholder="UPI Ref / Cheque No"
                value={collectForm.reference}
                onChange={(e) => setCollectForm(f => ({ ...f, reference: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Remarks / Notes" t={t}>
              <Input
                t={t}
                placeholder="Optional collection notes"
                value={collectForm.notes}
                onChange={(e) => setCollectForm(f => ({ ...f, notes: e.target.value }))}
              />
            </FormGroup>
          </FormGrid>

          {collectMsg && (
            <div style={{ color: BRAND.pink, fontSize:13, marginTop:10 }}>
              {collectMsg}
            </div>
          )}
        </form>
      </Modal>

      {/* â”€â”€ VIEW EMI SCHEDULE MODAL â”€â”€ */}
      <Modal
        open={scheduleModal}
        onClose={() => setScheduleModal(false)}
        title={`Installment Schedule: ${selectedPlan?.plan_id || ''} (${selectedPlan?.customer_name || ''})`}
        t={t}
        wide
        footer={<>
          <BtnOutline t={t} onClick={() => setScheduleModal(false)}>Close</BtnOutline>
        </>}
      >
        <div style={{ marginBottom:14, display:"flex", gap:16, fontSize:13 }}>
          <div>Total: <strong>{formatCurrency(selectedPlan?.total_amount || 0)}</strong></div>
          <div>Remaining: <strong style={{ color:BRAND.pink }}>{formatCurrency(selectedPlan?.remaining_amount || 0)}</strong></div>
          <div>Partner: <strong>{selectedPlan?.finance_partner}</strong></div>
          <div>Status: <strong>{selectedPlan?.status}</strong></div>
          <div>AutoPay: <strong>{selectedPlan?.autopay_status || "NOT_ENABLED"}</strong></div>
        </div>
        {(selectedPlan?.mandate_status || selectedPlan?.last_failure_reason || selectedPlan?.last_payment_at) && (
          <div style={{ marginBottom:14, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:8, fontSize:12, color:t.textMuted }}>
            <div>Mandate: <strong>{selectedPlan?.mandate_status || "-"}</strong></div>
            <div>Provider: <strong>{selectedPlan?.gateway_provider || "-"}</strong></div>
            <div>Last Payment: <strong>{selectedPlan?.last_payment_at ? new Date(selectedPlan.last_payment_at).toLocaleString("en-IN") : "-"}</strong></div>
            <div>Failed Payment: <strong>{selectedPlan?.last_failure_reason || "-"}</strong></div>
          </div>
        )}

        <DataTable
          columns={["Installment #", "Due Date", "Amount Due (â‚¹)", "Amount Paid (â‚¹)", "Status", "Receipt No", "Paid Date"]}
          rows={(selectedPlan?.installments || []).map(inst => ({
            "Installment #": <strong>#{inst.installment_no}</strong>,
            "Due Date": <code>{new Date(inst.due_date).toLocaleDateString("en-IN")}</code>,
            "Amount Due (â‚¹)": formatCurrency(inst.amount_due),
            "Amount Paid (â‚¹)": <span style={{ color:"#27ae60", fontWeight:700 }}>{formatCurrency(inst.amount_paid)}</span>,
            "Status": (
              <span style={{
                padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                background: String(inst.status).toLowerCase() === "paid" ? "#2ecc7122" : (String(inst.status).toLowerCase() === "partial" ? "#f39c1222" : "#95a5a622"),
                color: String(inst.status).toLowerCase() === "paid" ? "#27ae60" : (String(inst.status).toLowerCase() === "partial" ? "#d35400" : "#7f8c8d")
              }}>
                {inst.status}
              </span>
            ),
            "Receipt No": inst.receipt_no ? <code>{inst.receipt_no}</code> : "-",
            "Paid Date": inst.paid_date ? new Date(inst.paid_date).toLocaleDateString("en-IN") : "-",
          }))}
          t={t}
          emptyMsg="No schedule installments found"
        />
      </Modal>

      {/* â”€â”€ PAY CREDIT SALE MODAL â”€â”€ */}
      <Modal
        open={creditPayModal}
        onClose={() => setCreditPayModal(false)}
        title={`Settle Credit Invoice: ${selectedCreditInv?.invoice_no || ''}`}
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setCreditPayModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handlePayCreditSale} disabled={creditPaying}>
            {creditPaying ? "Saving..." : "Record Payment (Credit)"}
          </BtnPrimary>
        </>}
      >
        <form onSubmit={handlePayCreditSale}>
          <div style={{ background:t.card2||t.card, padding:12, borderRadius:8, marginBottom:14 }}>
            <div style={{ fontSize:12, color:t.textMuted }}>Customer: {selectedCreditInv?.customer_name}</div>
            <div style={{ fontSize:12, color:t.textMuted, marginTop:2 }}>Outstanding Balance on Invoice:</div>
            <div style={{ fontSize:20, fontWeight:800, color:BRAND.pink, marginTop:2 }}>
              {formatCurrency(selectedCreditInv?.balance_due || 0)}
            </div>
          </div>

          <FormGrid>
            <FormGroup label="Payment Amount (â‚¹) *" t={t} half>
              <Input
                t={t}
                type="number"
                value={creditPayForm.amount}
                onChange={(e) => setCreditPayForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </FormGroup>

            <FormGroup label="Payment Mode *" t={t} half>
              <Select
                t={t}
                value={creditPayForm.payment_mode}
                onChange={(e) => setCreditPayForm(f => ({ ...f, payment_mode: e.target.value }))}
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="Cash">Cash</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </Select>
            </FormGroup>

            <FormGroup label="Payment Date" t={t} half>
              <Input
                t={t}
                type="date"
                value={creditPayForm.date}
                onChange={(e) => setCreditPayForm(f => ({ ...f, date: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Notes / Reference Details" t={t} half>
              <Input
                t={t}
                value={creditPayForm.notes}
                onChange={(e) => setCreditPayForm(f => ({ ...f, notes: e.target.value }))}
              />
            </FormGroup>
          </FormGrid>

          {creditPayMsg && (
            <div style={{ color: BRAND.pink, fontSize:13, marginTop:10 }}>
              {creditPayMsg}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

