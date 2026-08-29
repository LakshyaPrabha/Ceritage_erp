﻿// ─── Ceritage ERP — Billing & GST Invoice ────────────────────────────────────
import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
  BtnPrimary, BtnOutline, BtnSm, Modal,
  FormGroup, FormGrid, Input, Select, SectionTitle,
} from "../../components/ui";

const API = window.__CERITAGE_API__ || "/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "new",     label: "New Invoice" },
  { id: "list",    label: "All Bills" },
  { id: "receipt", label: "Receipt" },
  { id: "notes",   label: "Credit / Debit Notes" },
  { id: "returns", label: "Returns & Refunds" },
];

const INV_TYPES = [
  "Retail Invoice", "Wholesale Invoice", "Tax Invoice",
  "Estimate", "Quotation", "Exchange Billing",
];

const PAY_MODES = [
  "Cash", "Card", "UPI", "Bank Transfer",
  "Cheque", "EMI", "Exchange+Cash", "Credit",
];

// ── GST Rules (real jewellery rates) ─────────────────────────────────────────
// HSN 7113 → Jewellery: 3% (CGST 1.5% + SGST 1.5%)
// HSN 7102 → Diamonds:  0.25%
// HSN 9988 → Services/Making: 5%
const GST_RATES = {
  "7113": 3,
  "7114": 3,
  "7116": 3,
  "7102": 0.25,
  "7103": 0.25,
  "9988": 5,
};

function getGSTRate(hsn) {
  return GST_RATES[String(hsn).trim()] ?? 3;
}

// ── Empty item template ───────────────────────────────────────────────────────
const EMPTY_ITEM = {
  product_id:   "",
  description:  "",
  hsn:          "7113",
  purity:       "",
  weight:       "",
  rate:         "",
  making:       "",
  stone:        "",
  gst_pct:      3,
  discount_pct: 0,
  amount:       0,
};

// ── Compute single item amount ────────────────────────────────────────────────
function computeItemAmount(item) {
  const weight  = parseFloat(item.weight)       || 0;
  const rate    = parseFloat(item.rate)         || 0;
  const making  = parseFloat(item.making)       || 0;
  const stone   = parseFloat(item.stone)        || 0;
  const gstPct  = parseFloat(item.gst_pct)      || 0;
  const discPct = parseFloat(item.discount_pct) || 0;

  const metalValue   = weight * rate;
  const subtotal     = metalValue + making + stone;
  const afterDisc    = subtotal * (1 - discPct / 100);
  const gstAmount    = afterDisc * (gstPct / 100);
  return parseFloat((afterDisc + gstAmount).toFixed(2));
}

// ── Compute invoice totals ────────────────────────────────────────────────────
function computeTotals(items, discPct, discAmt, oldGold, isSameState = true) {
  let subtotal    = 0;
  let totalGST    = 0;

  for (const item of items) {
    const weight  = parseFloat(item.weight)       || 0;
    const rate    = parseFloat(item.rate)         || 0;
    const making  = parseFloat(item.making)       || 0;
    const stone   = parseFloat(item.stone)        || 0;
    const gstPct  = parseFloat(item.gst_pct)      || 0;
    const itemDisc = parseFloat(item.discount_pct) || 0;

    const metalValue = weight * rate;
    const base       = metalValue + making + stone;
    const afterDisc  = base * (1 - itemDisc / 100);
    const gst        = afterDisc * (gstPct / 100);

    subtotal  += afterDisc;
    totalGST  += gst;
  }

  // Invoice-level discount
  const invDiscAmt  = discAmt
     ? parseFloat(discAmt)
    : subtotal * (parseFloat(discPct) / 100 || 0);

  const taxableAmt  = subtotal - invDiscAmt;
  const cgst        = isSameState  ? totalGST / 2 : 0;
  const sgst        = isSameState  ? totalGST / 2 : 0;
  const igst        = !isSameState  ? totalGST : 0;

  // TCS: 1% on cash txns > ₹2 lakh (as per Income Tax Act)
  const grandBeforeTCS = taxableAmt + totalGST - (parseFloat(oldGold) || 0);
  const tcs = grandBeforeTCS > 200000  ? parseFloat((grandBeforeTCS * 0.01).toFixed(2)) : 0;

  const grandTotal = parseFloat((grandBeforeTCS + tcs).toFixed(2));

  return {
    subtotal:    parseFloat(subtotal.toFixed(2)),
    invDiscAmt:  parseFloat(invDiscAmt.toFixed(2)),
    taxableAmt:  parseFloat(taxableAmt.toFixed(2)),
    cgst:        parseFloat(cgst.toFixed(2)),
    sgst:        parseFloat(sgst.toFixed(2)),
    igst:        parseFloat(igst.toFixed(2)),
    tcs,
    grandTotal,
    totalGST:    parseFloat(totalGST.toFixed(2)),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function Billing({ t }) {
  // ── Tab & UI state ──────────────────────────────────────────────────────
  const [tab,      setTab]      = useState("new");

  // ── KPIs ────────────────────────────────────────────────────────────────
  const [kpis,     setKpis]     = useState({});

  // ── Invoice form state ───────────────────────────────────────────────────
  const [invType,      setInvType]      = useState("Retail Invoice");
  const [invoiceDate,  setInvoiceDate]  = useState(new Date().toISOString().split("T")[0]);
  const [customerId,   setCustomerId]   = useState("");
  const [customerGST,  setCustomerGST]  = useState("");
  const [salesperson,  setSalesperson]  = useState("");
  const [hsnCode,      setHsnCode]      = useState("7113");
  const [isSameState,  setIsSameState]  = useState(true);

  // Items
  const [items,        setItems]        = useState([{ ...EMPTY_ITEM }]);

  // Discounts
  const [discPct,      setDiscPct]      = useState("0");
  const [discAmt,      setDiscAmt]      = useState("0");
  const [couponCode,   setCouponCode]   = useState("");
  const [giftVoucher,  setGiftVoucher]  = useState("");
  const [oldGold,      setOldGold]      = useState("0");

  // Payment
  const [payMode,      setPayMode]      = useState("Cash");
  const [amtReceived,  setAmtReceived]  = useState("");
  const [upiTxnId,     setUpiTxnId]     = useState("");
  const [upiApp,       setUpiApp]       = useState("Google Pay");
  const [cardType,     setCardType]     = useState("Visa");
  const [cardLast4,    setCardLast4]    = useState("");
  const [bankName,     setBankName]     = useState("");
  const [approvalCode, setApprovalCode] = useState("");
  const [emiDown,      setEmiDown]      = useState("");
  const [emiMonths,    setEmiMonths]    = useState("6");
  const [emiRate,      setEmiRate]      = useState("0");
  const [emiFirstDue,  setEmiFirstDue]  = useState("");
  const [notes,        setNotes]        = useState("");

  // Saving
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState("");

  // ── All bills list ───────────────────────────────────────────────────────
  const [invoices,     setInvoices]     = useState([]);
  const [invoiceSearch,setInvoiceSearch]= useState("");
  const [invoiceFilter,setInvoiceFilter]= useState("");
  const [listLoading,  setListLoading]  = useState(false);

  // ── Receipt ─────────────────────────────────────────────────────────────
  const [receiptInv,   setReceiptInv]   = useState(null);
  const [receiptId,    setReceiptId]    = useState("");

  // ── Credit/Debit Notes ───────────────────────────────────────────────────
  const [notes_list,   setNotesList]    = useState([]);
  const [noteType,     setNoteType]     = useState("Credit");
  const [noteCustomer, setNoteCustomer] = useState("");
  const [noteAgainst,  setNoteAgainst]  = useState("");
  const [noteReason,   setNoteReason]   = useState("Return of Goods");
  const [noteAmount,   setNoteAmount]   = useState("");
  const [noteDesc,     setNoteDesc]     = useState("");
  const [noteSaving,   setNoteSaving]   = useState(false);

  // ── Returns ──────────────────────────────────────────────────────────────
  const [returns,      setReturns]      = useState([]);
  const [retModal,     setRetModal]     = useState(false);
  const [retForm,      setRetForm]      = useState({
    customer_id: "", invoice_ref: "", item_description: "",
    reason: "Customer Request", refund_amount: "",
    refund_mode: "Cash", item_condition: "Good",
  });
  const [retSaving,    setRetSaving]    = useState(false);

  // ── Customer & employee lists ─────────────────────────────────────────
  const [customers,    setCustomers]    = useState([]);
  const [employees,    setEmployees]    = useState([]);

  // ── Computed totals ───────────────────────────────────────────────────
  const totals = computeTotals(items, discPct, discAmt, oldGold, isSameState);
  const change = parseFloat(amtReceived || 0) - totals.grandTotal;

  // ── Fetch helpers ─────────────────────────────────────────────────────
  async function fetchKpis() {
    try {
      const r = await fetch(`${API}/billing/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data);
    } catch {}
  }

  async function fetchCustomers() {
    try {
      const r = await fetch(`${API}/customers?limit=200`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setCustomers(d.data || []);
    } catch {}
  }

  async function fetchEmployees() {
    try {
      const r = await fetch(`${API}/employees?limit=100`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setEmployees(d.data || []);
    } catch {}
  }

  async function fetchInvoices() {
    setListLoading(true);
    try {
      const p = new URLSearchParams({ limit: 100, _t: Date.now() });
      if (invoiceSearch)  p.append("search", invoiceSearch);
      if (invoiceFilter)  p.append("status", invoiceFilter);
      const r = await fetch(`${API}/billing?${p}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setInvoices(d.data || []);
    } catch {}
    setListLoading(false);
  }

  async function fetchNotes() {
    try {
      const r = await fetch(`${API}/billing/notes`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setNotesList(d.data || []);
    } catch {}
  }

  async function fetchReturns() {
    try {
      const r = await fetch(`${API}/billing/returns`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setReturns(d.data || []);
    } catch {}
  }

  async function fetchReceipt(id) {
    try {
      const r = await fetch(`${API}/billing/${id}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setReceiptInv(d.data);
    } catch {}
  }

  // ── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchKpis();
    fetchCustomers();
    fetchEmployees();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (tab === "list")    fetchInvoices();
    if (tab === "notes")   fetchNotes();
    if (tab === "returns") fetchReturns();
  }, [tab]); // eslint-disable-line

  useEffect(() => {
    const timer = setTimeout(() => { if (tab === "list") fetchInvoices(); }, 400);
    return () => clearTimeout(timer);
  }, [invoiceSearch, invoiceFilter]); // eslint-disable-line

  // ── Item handlers ─────────────────────────────────────────────────────
  function updateItem(idx, key, val) {
    setItems(prev => {
      const updated = prev.map((item, i) => {
        if (i !== idx) return item;
        const newItem = { ...item, [key]: val };
        // Auto-update GST rate when HSN changes
        if (key === "hsn") newItem.gst_pct = getGSTRate(val);
        newItem.amount = computeItemAmount(newItem);
        return newItem;
      });
      return updated;
    });
  }

  function addItem() {
    setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  // Auto-fill item from product search
  async function fillProductItem(idx, productId) {
    if (!productId) { updateItem(idx, "product_id", ""); return; }
    try {
      const r = await fetch(`${API}/products/${productId}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) {
        const p = d.data;
        setItems(prev => prev.map((item, i) => {
          if (i !== idx) return item;
          const newItem = {
            ...item,
            product_id:  p.id,
            description: p.name,
            hsn:         p.hsn_code || "7113",
            purity:      p.purity || "",
            weight:      p.gross_weight || "",
            making:      p.making_charges || "",
            stone:       p.stone_charges || "0",
            gst_pct:     getGSTRate(p.hsn_code || "7113"),
          };
          newItem.amount = computeItemAmount(newItem);
          return newItem;
        }));
      }
    } catch {}
  }

  // ── Save invoice ─────────────────────────────────────────────────────
  async function handleSave(status = "Paid") {
    if (!customerId)       { setSaveError("Please select a customer."); return; }
    if (items.length === 0){ setSaveError("Add at least one item."); return; }
    if (items.some(i => !i.description.trim())) {
      setSaveError("All items must have a description."); return;
    }

    setSaving(true); setSaveError("");

    const payload = {
      invoice_type:       invType,
      customer_id:        customerId,
      invoice_date:       invoiceDate,
      salesperson_id:     salesperson || null,
      hsn_code:           hsnCode,
      payment_mode:       payMode,
      discount_pct:       parseFloat(discPct)  || 0,
      discount_amt:       parseFloat(discAmt)  || 0,
      coupon_code:        couponCode  || null,
      gift_voucher:       giftVoucher || null,
      old_gold_exchange:  parseFloat(oldGold)  || 0,
      cgst:               totals.cgst,
      sgst:               totals.sgst,
      igst:               totals.igst,
      tcs:                totals.tcs,
      grand_total:        totals.grandTotal,
      paid_amount:        status === "Paid"  ? totals.grandTotal : parseFloat(amtReceived) || 0,
      notes:              notes || null,
      status,
      items: items.map(item => ({
        product_id:   item.product_id || null,
        description:  item.description,
        hsn:          item.hsn || "7113",
        purity:       item.purity || null,
        weight:       parseFloat(item.weight)  || 0,
        rate:         parseFloat(item.rate)    || 0,
        making:       parseFloat(item.making)  || 0,
        stone:        parseFloat(item.stone)   || 0,
        gst_pct:      parseFloat(item.gst_pct) || 3,
        discount_pct: parseFloat(item.discount_pct) || 0,
        amount:       item.amount,
      })),
    };

    try {
      const r = await fetch(`${API}/billing`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) { setSaveError(d.message || "Failed to save invoice."); setSaving(false); return; }

      // Success — show receipt
      await fetchReceipt(d.data.id);
      setTab("receipt");
      fetchKpis();
      resetForm();
    } catch (err) {
      setSaveError("Cannot connect to server.");
    }
    setSaving(false);
  }

  function resetForm() {
    setInvType("Retail Invoice"); setInvoiceDate(new Date().toISOString().split("T")[0]);
    setCustomerId(""); setCustomerGST(""); setSalesperson(""); setHsnCode("7113");
    setItems([{ ...EMPTY_ITEM }]);
    setDiscPct("0"); setDiscAmt("0"); setCouponCode(""); setGiftVoucher(""); setOldGold("0");
    setPayMode("Cash"); setAmtReceived(""); setUpiTxnId(""); setCardLast4(""); setNotes("");
    setSaveError("");
  }

  // ── Save Credit/Debit Note ────────────────────────────────────────────
  async function handleSaveNote() {
    if (!noteCustomer || !noteAmount) { return; }
    setNoteSaving(true);
    try {
      const r = await fetch(`${API}/billing/notes`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          note_type:       noteType,
          customer_id:     noteCustomer,
          against_invoice: noteAgainst || null,
          reason:          noteReason,
          amount:          parseFloat(noteAmount),
          description:     noteDesc || null,
        }),
      });
      const d = await r.json();
      if (d.success) {
        fetchNotes();
        setNoteCustomer(""); setNoteAgainst(""); setNoteAmount(""); setNoteDesc("");
      }
    } catch {}
    setNoteSaving(false);
  }

  // ── Save Return ───────────────────────────────────────────────────────
  async function handleSaveReturn() {
    if (!retForm.item_description || !retForm.refund_amount) return;
    setRetSaving(true);
    try {
      const r = await fetch(`${API}/billing/returns`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify(retForm),
      });
      const d = await r.json();
      if (d.success) { setRetModal(false); fetchReturns(); }
    } catch {}
    setRetSaving(false);
  }

  // ── Print Invoice ─────────────────────────────────────────────────────
  function printInvoice(inv) {
    if (!inv) return;
    const custName  = inv.customer_name || "Walk-in Customer";
    const items_html = (inv.items || []).map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.item_description || "—"}</td>
        <td>${item.hsn_code || "7113"}</td>
        <td>${item.purity || "—"}</td>
        <td>${parseFloat(item.weight_g || 0).toFixed(3)}g</td>
        <td>₹${parseFloat(item.rate_per_gram || 0).toLocaleString("en-IN")}</td>
        <td>₹${parseFloat(item.making_charges || 0).toLocaleString("en-IN")}</td>
        <td>${item.gst_pct || 3}%</td>
        <td style="font-weight:700">₹${parseFloat(item.amount || 0).toLocaleString("en-IN")}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Invoice ${inv.invoice_no}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; }
  .header { display:flex; justify-content:space-between; border-bottom: 2px solid #8B3BC8; padding-bottom: 12px; margin-bottom: 16px; }
  .logo { font-size:22px; font-weight:800; color:#8B3BC8; }
  table { width:100%; border-collapse:collapse; margin: 12px 0; }
  th { background:#f3f0ff; color:#333; padding:7px 8px; text-align:left; border: 1px solid #ddd; font-size:11px; }
  td { padding: 6px 8px; border: 1px solid #eee; }
  .totals { float:right; width:280px; margin-top: 8px; }
  .totals-row { display:flex; justify-content:space-between; padding: 3px 0; font-size:12px; }
  .grand { font-weight:800; font-size:14px; color:#8B3BC8; border-top:2px solid #8B3BC8; padding-top:6px; margin-top:4px; }
  .footer { text-align:center; margin-top:24px; font-size:11px; color:#999; border-top:1px solid #eee; padding-top:10px; }
  @media print { body { padding:8px; } }
</style></head><body>
<div class="header">
  <div>
    <div class="logo">CERITAGE JEWELRY</div>
    <div style="font-size:11px;color:#777">GST Invoice · HSN 7113</div>
  </div>
  <div style="text-align:right">
    <div style="font-weight:700;font-size:14px">${inv.invoice_type || "TAX INVOICE"}</div>
    <div>Invoice No: <b>${inv.invoice_no}</b></div>
    <div>Date: ${new Date(inv.invoice_date).toLocaleDateString("en-IN")}</div>
  </div>
</div>
<div style="display:flex;justify-content:space-between;margin-bottom:14px">
  <div style="background:#f9f6ff;padding:10px;border-radius:6px;min-width:200px">
    <div style="font-weight:700;margin-bottom:4px">Bill To:</div>
    <div>${custName}</div>
    <div style="font-size:11px;color:#777">${inv.phone || ""}</div>
    ${inv.gst_number  ? `<div style="font-size:11px">GSTIN: ${inv.gst_number}</div>` : ""}
  </div>
  <div style="font-size:11px;color:#777;text-align:right">
    Payment: <b>${inv.payment_mode || "—"}</b><br/>
    Status: <b style="color:#2ecc71">${inv.status || "Paid"}</b>
  </div>
</div>
<table>
  <thead><tr>
    <th>#</th><th>Description</th><th>HSN</th><th>Purity</th>
    <th>Weight</th><th>Rate/g</th><th>Making</th><th>GST%</th><th>Amount</th>
  </tr></thead>
  <tbody>${items_html}</tbody>
</table>
<div class="totals">
  <div class="totals-row"><span>Subtotal</span><span>₹${parseFloat(inv.subtotal || 0).toLocaleString("en-IN")}</span></div>
  ${parseFloat(inv.discount_amt || 0) > 0  ? `<div class="totals-row"><span>Discount</span><span>- ₹${parseFloat(inv.discount_amt).toLocaleString("en-IN")}</span></div>` : ""}
  ${parseFloat(inv.cgst || 0) > 0  ? `<div class="totals-row"><span>CGST (1.5%)</span><span>₹${parseFloat(inv.cgst).toLocaleString("en-IN")}</span></div>` : ""}
  ${parseFloat(inv.sgst || 0) > 0  ? `<div class="totals-row"><span>SGST (1.5%)</span><span>₹${parseFloat(inv.sgst).toLocaleString("en-IN")}</span></div>` : ""}
  ${parseFloat(inv.igst || 0) > 0  ? `<div class="totals-row"><span>IGST (3%)</span><span>₹${parseFloat(inv.igst).toLocaleString("en-IN")}</span></div>` : ""}
  ${parseFloat(inv.old_gold_exchange || 0) > 0  ? `<div class="totals-row"><span>Old Gold Exchange</span><span>- ₹${parseFloat(inv.old_gold_exchange).toLocaleString("en-IN")}</span></div>` : ""}
  ${parseFloat(inv.tcs || 0) > 0  ? `<div class="totals-row"><span>TCS (1%)</span><span>₹${parseFloat(inv.tcs).toLocaleString("en-IN")}</span></div>` : ""}
  <div class="totals-row grand"><span>Grand Total</span><span>₹${parseFloat(inv.grand_total || 0).toLocaleString("en-IN")}</span></div>
</div>
<div style="clear:both"></div>
<div class="footer">
  Thank you for shopping at Ceritage Jewelry · This is a computer-generated invoice
</div>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1200);}</script>
</body></html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (w) { w.document.write(html); w.document.close(); }
  }

  // ── Selected customer info ────────────────────────────────────────────
  const selCustomer = customers.find(c => String(c.id) === String(customerId));

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <PageHeader
        title="Billing & GST Invoice"
        subtitle="Retail · Wholesale · Tax Invoice · GST 3% · TCS · Old Gold Exchange"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={() => { setNoteType("Credit"); setTab("notes"); }}>Credit Note</BtnOutline>
          <BtnOutline t={t} onClick={() => { setNoteType("Debit");  setTab("notes"); }}>Debit Note</BtnOutline>
          <BtnPrimary onClick={() => { resetForm(); setTab("new"); }}>+ New Invoice</BtnPrimary>
        </>}
      />

      {/* KPI Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Today's Billing"  value={kpis.today_billing     ? `₹${parseFloat(kpis.today_billing).toLocaleString("en-IN")}` : "₹0"}  color={BRAND.blue}   t={t} />
        <StatCard label="Bills Today"      value={kpis.bills_today      ?? 0}                                                                      color="#2ecc71"      t={t} />
        <StatCard label="Pending Payments" value={kpis.pending_payments  ? `₹${parseFloat(kpis.pending_payments).toLocaleString("en-IN")}` : "₹0"} color={BRAND.purple} t={t} />
        <StatCard label="Returns Today"    value={kpis.returns_today    ?? 0}                                                                      color={BRAND.pink}   t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ══════════════════════════════════════════════════════════════════
          NEW INVOICE TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "new" && (
        <div>
          {/* Invoice Type Pills */}
          <Card t={t}>
            <CardHeader title="Invoice Type" t={t} />
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {INV_TYPES.map(type => (
                <button key={type} onClick={() => setInvType(type)}
                  style={{
                    padding:"6px 14px", borderRadius:20, cursor:"pointer",
                    fontSize:12, fontWeight:600, fontFamily:"inherit",
                    background: invType === type  ? BRAND.gradBtn : "transparent",
                    color:      invType === type ? "#fff" : t.textSub,
                    border:     invType === type ? "none" : `1px solid ${t.borderDash}`,
                    boxShadow:  invType === type ? "0 2px 10px rgba(59,85,230,0.25)" : "none",
                  }}>
                  {type}
                </button>
              ))}
            </div>
          </Card>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16 }}>
            {/* ── Left column ─────────────────────────────────────────── */}
            <div>

              {/* Invoice Details */}
              <Card t={t}>
                <CardHeader title="Invoice Details" t={t}
                  actions={
                    <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:t.textSub, cursor:"pointer" }}>
                      <input type="checkbox" checked={isSameState} onChange={e => setIsSameState(e.target.checked)}
                        style={{ accentColor: BRAND.purple }} />
                      Same State (CGST+SGST)
                    </label>
                  } />
                <FormGrid>
                  <FormGroup label="Invoice No" t={t} half>
                    <Input t={t} value="Auto-generated" readOnly style={{ opacity:0.5, fontFamily:"monospace" }} />
                  </FormGroup>
                  <FormGroup label="Date *" t={t} half>
                    <Input t={t} type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                  </FormGroup>
                  <FormGroup label="Customer *" t={t} half>
                    <Select t={t} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                      <option value="">-- Select Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup label="Customer GSTIN" t={t} half>
                    <Input t={t} placeholder="For B2B / Wholesale"
                      value={customerGST || selCustomer?.gst_number || ""}
                      onChange={e => setCustomerGST(e.target.value)} />
                  </FormGroup>
                  <FormGroup label="Salesperson" t={t} half>
                    <Select t={t} value={salesperson} onChange={e => setSalesperson(e.target.value)}>
                      <option value="">-- Select --</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.full_name}</option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup label="HSN Code" t={t} half>
                    <Input t={t} value={hsnCode} onChange={e => setHsnCode(e.target.value)} maxLength={6} />
                  </FormGroup>
                </FormGrid>
              </Card>

              {/* Items Table */}
              <Card t={t}>
                <CardHeader title={`Items (${items.length})`} t={t}
                  actions={
                    <button onClick={addItem}
                      style={{ background: BRAND.gradBtn, border:"none", borderRadius:7, color:"#fff",
                        fontSize:12, fontWeight:700, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>
                      + Add Item
                    </button>
                  } />

                {items.map((item, idx) => (
                  <div key={idx} style={{
                    background: t.card2 || t.card, border:`1px solid ${t.borderDash}`,
                    borderRadius:10, padding:"14px 14px 10px", marginBottom:10,
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:BRAND.purple }}>Item {idx + 1}</span>
                      {items.length > 1 && (
                        <button onClick={() => removeItem(idx)}
                          style={{ background:"none", border:"none", color:BRAND.pink,
                            cursor:"pointer", fontSize:16, lineHeight:1, fontFamily:"inherit" }}>×</button>
                      )}
                    </div>
                    <FormGrid>
                      <FormGroup label="Product (optional)" t={t} half>
                        <Select t={t} value={item.product_id}
                          onChange={e => fillProductItem(idx, e.target.value)}>
                          <option value="">-- Select Product --</option>
                          {customers.length > 0 && (
                            <option disabled style={{ color: t.textFaint }}>── Products ──</option>
                          )}
                        </Select>
                      </FormGroup>
                      <FormGroup label="Description *" t={t} half>
                        <Input t={t} placeholder="e.g. 22K Gold Ring"
                          value={item.description}
                          onChange={e => updateItem(idx, "description", e.target.value)} />
                      </FormGroup>
                      <FormGroup label="HSN Code" t={t} half>
                        <Select t={t} value={item.hsn}
                          onChange={e => updateItem(idx, "hsn", e.target.value)}>
                          <option value="7113">7113 — Gold/Silver Jewellery (3%)</option>
                          <option value="7114">7114 — Articles of Precious Metal (3%)</option>
                          <option value="7102">7102 — Diamonds (0.25%)</option>
                          <option value="7103">7103 — Precious Stones (0.25%)</option>
                          <option value="9988">9988 — Making Charges (5%)</option>
                        </Select>
                      </FormGroup>
                      <FormGroup label={`GST: ${item.gst_pct}%`} t={t} half>
                        <Input t={t} value={`CGST ${item.gst_pct/2}% + SGST ${item.gst_pct/2}%`}
                          readOnly style={{ opacity:0.6, fontSize:11, fontFamily:"monospace" }} />
                      </FormGroup>
                      <FormGroup label="Purity" t={t} half>
                        <Input t={t} placeholder="e.g. 22K (916)"
                          value={item.purity}
                          onChange={e => updateItem(idx, "purity", e.target.value)} />
                      </FormGroup>
                      <FormGroup label="Weight (g)" t={t} half>
                        <Input t={t} type="number" step="0.001" placeholder="0.000"
                          value={item.weight}
                          onChange={e => updateItem(idx, "weight", e.target.value)} />
                      </FormGroup>
                      <FormGroup label="Gold Rate (₹/g)" t={t} half>
                        <Input t={t} type="number" step="1" placeholder="e.g. 7100"
                          value={item.rate}
                          onChange={e => updateItem(idx, "rate", e.target.value)} />
                      </FormGroup>
                      <FormGroup label="Making Charges (₹)" t={t} half>
                        <Input t={t} type="number" step="0.01" placeholder="0.00"
                          value={item.making}
                          onChange={e => updateItem(idx, "making", e.target.value)} />
                      </FormGroup>
                      <FormGroup label="Stone/Other Charges (₹)" t={t} half>
                        <Input t={t} type="number" step="0.01" placeholder="0.00"
                          value={item.stone}
                          onChange={e => updateItem(idx, "stone", e.target.value)} />
                      </FormGroup>
                      <FormGroup label="Item Discount (%)" t={t} half>
                        <Input t={t} type="number" step="0.1" placeholder="0"
                          value={item.discount_pct}
                          onChange={e => updateItem(idx, "discount_pct", e.target.value)} />
                      </FormGroup>
                    </FormGrid>
                    <div style={{ textAlign:"right", marginTop:6, fontSize:14, fontWeight:700, color:BRAND.purple }}>
                      Item Total: ₹{item.amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}

                {/* Invoice Totals */}
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
                  <div style={{ width:300, background: t.card2||t.card,
                    border:`1px solid ${t.borderDash}`, borderRadius:10, padding:"14px 16px" }}>
                    {[
                      ["Subtotal",             `₹${totals.subtotal.toLocaleString("en-IN")}`],
                      ["Discount",             `- ₹${totals.invDiscAmt.toLocaleString("en-IN")}`],
                      ["Taxable Amount",       `₹${totals.taxableAmt.toLocaleString("en-IN")}`],
                      ...(isSameState
                         ? [["CGST (1.5%)", `₹${totals.cgst.toLocaleString("en-IN")}`],
                           ["SGST (1.5%)", `₹${totals.sgst.toLocaleString("en-IN")}`]]
                        : [["IGST (3%)",   `₹${totals.igst.toLocaleString("en-IN")}`]]),
                      ...(parseFloat(oldGold) > 0
                         ? [["Old Gold Exchange", `- ₹${parseFloat(oldGold).toLocaleString("en-IN")}`]] : []),
                      ...(totals.tcs > 0
                         ? [["TCS (1%) — Cash >₹2L", `₹${totals.tcs.toLocaleString("en-IN")}`]] : []),
                    ].map(([k, v]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between",
                        padding:"4px 0", fontSize:13, color:t.textSub, borderBottom:`1px dashed ${t.borderDash}` }}>
                        <span>{k}</span><span style={{ fontFamily:"monospace" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between",
                      paddingTop:10, marginTop:6, fontSize:16, fontWeight:800, color:BRAND.purple }}>
                      <span>Grand Total</span>
                      <span>₹{totals.grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Discount & Adjustments */}
              <Card t={t}>
                <CardHeader title="Discount · Coupon · Adjustments" t={t} />
                <FormGrid>
                  <FormGroup label="Invoice Discount (%)" t={t} half>
                    <Input t={t} type="number" step="0.1" placeholder="0"
                      value={discPct} onChange={e => { setDiscPct(e.target.value); setDiscAmt("0"); }} />
                  </FormGroup>
                  <FormGroup label="Invoice Discount (₹)" t={t} half>
                    <Input t={t} type="number" step="0.01" placeholder="0.00"
                      value={discAmt} onChange={e => { setDiscAmt(e.target.value); setDiscPct("0"); }} />
                  </FormGroup>
                  <FormGroup label="Coupon Code" t={t} half>
                    <Input t={t} placeholder="e.g. DIWALI10" value={couponCode}
                      onChange={e => setCouponCode(e.target.value)} />
                  </FormGroup>
                  <FormGroup label="Gift Voucher No." t={t} half>
                    <Input t={t} placeholder="GV-XXXX" value={giftVoucher}
                      onChange={e => setGiftVoucher(e.target.value)} />
                  </FormGroup>
                  <FormGroup label="Old Gold Exchange (₹)" t={t} half>
                    <Input t={t} type="number" step="0.01" placeholder="0.00"
                      value={oldGold} onChange={e => setOldGold(e.target.value)} />
                    <div style={{ fontSize:10, color:t.textFaint, marginTop:3 }}>
                      Deducted from grand total
                    </div>
                  </FormGroup>
                  <FormGroup label="Notes" t={t} half>
                    <Input t={t} placeholder="Any remarks..." value={notes}
                      onChange={e => setNotes(e.target.value)} />
                  </FormGroup>
                </FormGrid>
              </Card>

              {/* Payment Mode */}
              <Card t={t}>
                <CardHeader title="Payment Mode" t={t} />
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                  {PAY_MODES.map(m => (
                    <button key={m} onClick={() => setPayMode(m)}
                      style={{
                        padding:"6px 14px", borderRadius:20, cursor:"pointer",
                        fontSize:12, fontWeight:600, fontFamily:"inherit",
                        background: payMode === m  ? BRAND.gradBtn : "transparent",
                        color:      payMode === m ? "#fff" : t.textSub,
                        border:     payMode === m ? "none" : `1px solid ${t.borderDash}`,
                      }}>
                      {m}
                    </button>
                  ))}
                </div>

                {payMode === "Cash" && (
                  <FormGrid>
                    <FormGroup label="Amount Received (₹)" t={t} half>
                      <Input t={t} type="number" placeholder="0.00"
                        value={amtReceived} onChange={e => setAmtReceived(e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Balance / Change (₹)" t={t} half>
                      <Input t={t} readOnly
                        value={amtReceived  ? `₹${change >= 0  ? change.toLocaleString("en-IN") : "Insufficient"}` : "—"}
                        style={{ color: change >= 0 ? "#2ecc71" : BRAND.pink, fontWeight:700 }} />
                    </FormGroup>
                  </FormGrid>
                )}
                {payMode === "UPI" && (
                  <FormGrid>
                    <FormGroup label="UPI App" t={t} half>
                      <Select t={t} value={upiApp} onChange={e => setUpiApp(e.target.value)}>
                        <option>Google Pay</option><option>PhonePe</option>
                        <option>Paytm</option><option>BHIM</option><option>Other</option>
                      </Select>
                    </FormGroup>
                    <FormGroup label="UTR / Transaction ID" t={t} half>
                      <Input t={t} placeholder="12-digit UTR" value={upiTxnId}
                        onChange={e => setUpiTxnId(e.target.value)} />
                    </FormGroup>
                  </FormGrid>
                )}
                {payMode === "Card" && (
                  <FormGrid>
                    <FormGroup label="Card Type" t={t} half>
                      <Select t={t} value={cardType} onChange={e => setCardType(e.target.value)}>
                        <option>Visa</option><option>Mastercard</option>
                        <option>Rupay</option><option>Amex</option>
                      </Select>
                    </FormGroup>
                    <FormGroup label="Last 4 Digits" t={t} half>
                      <Input t={t} placeholder="XXXX" maxLength={4}
                        value={cardLast4} onChange={e => setCardLast4(e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Bank Name" t={t} half>
                      <Input t={t} placeholder="e.g. HDFC Bank"
                        value={bankName} onChange={e => setBankName(e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Approval Code" t={t} half>
                      <Input t={t} placeholder="Auth code"
                        value={approvalCode} onChange={e => setApprovalCode(e.target.value)} />
                    </FormGroup>
                  </FormGrid>
                )}
                {payMode === "EMI" && (
                  <FormGrid>
                    <FormGroup label="Down Payment (₹)" t={t} half>
                      <Input t={t} type="number" placeholder="0.00"
                        value={emiDown} onChange={e => setEmiDown(e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Installments" t={t} half>
                      <Select t={t} value={emiMonths} onChange={e => setEmiMonths(e.target.value)}>
                        <option>3</option><option>6</option><option>9</option>
                        <option>12</option><option>18</option><option>24</option>
                      </Select>
                    </FormGroup>
                    <FormGroup label="Interest Rate (% p.a.)" t={t} half>
                      <Input t={t} type="number" placeholder="0"
                        value={emiRate} onChange={e => setEmiRate(e.target.value)} />
                    </FormGroup>
                    <FormGroup label="First EMI Date" t={t} half>
                      <Input t={t} type="date" value={emiFirstDue}
                        onChange={e => setEmiFirstDue(e.target.value)} />
                    </FormGroup>
                    {emiDown && emiMonths && (
                      <div style={{ gridColumn:"1/-1", background:`rgba(59,85,230,0.06)`,
                        border:`1px solid rgba(59,85,230,0.15)`, borderRadius:8, padding:"10px 14px",
                        fontSize:12, color:t.textSub }}>
                        EMI Amount: <strong style={{ color:BRAND.blue }}>
                          ₹{(((totals.grandTotal - parseFloat(emiDown||0)) *
                            (1 + parseFloat(emiRate||0)/100)) / parseInt(emiMonths)).toFixed(2)}
                        </strong> × {emiMonths} months
                      </div>
                    )}
                  </FormGrid>
                )}

                {/* Action Buttons */}
                {saveError && (
                  <div style={{ color:BRAND.pink, fontSize:13, marginBottom:10, padding:"8px 12px",
                    background:"rgba(230,59,138,0.08)", borderRadius:8, border:`1px solid rgba(230,59,138,0.2)` }}>
                    {saveError}
                  </div>
                )}
                <div style={{ display:"flex", gap:10, marginTop:16, justifyContent:"flex-end" }}>
                  <BtnOutline t={t} onClick={() => handleSave("Draft")}>Save Draft</BtnOutline>
                  <BtnPrimary onClick={() => handleSave("Paid")} disabled={saving}>
                    {saving ? "Saving..." : "Finalize & Print"}
                  </BtnPrimary>
                </div>
              </Card>
            </div>

            {/* ── Right: Live Preview ─────────────────────────────────── */}
            <div>
              <Card t={t} style={{ position:"sticky", top:80 }}>
                <CardHeader title="Live Preview" t={t} />
                <div style={{ background:"#fff", borderRadius:8, padding:14, color:"#333",
                  fontSize:11, border:`1px solid ${t.borderDash}`, lineHeight:1.6 }}>
                  {/* Header */}
                  <div style={{ textAlign:"center", paddingBottom:8,
                    borderBottom:`2px solid ${BRAND.purple}`, marginBottom:8 }}>
                    <div style={{ fontWeight:800, color:BRAND.purple, fontSize:14 }}>CERITAGE JEWELRY</div>
                    <div style={{ fontSize:10, color:"#888" }}>GST Invoice · HSN 7113</div>
                  </div>
                  {/* Invoice meta */}
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div><b>{invType.toUpperCase()}</b></div>
                    <div style={{ color:"#777", fontSize:10 }}>
                      {invoiceDate  ? new Date(invoiceDate).toLocaleDateString("en-IN") : "—"}
                    </div>
                  </div>
                  {/* Customer */}
                  <div style={{ background:"#f9f6ff", padding:"6px 8px", borderRadius:5, marginBottom:8 }}>
                    <b>Bill To:</b> {selCustomer  ? selCustomer.full_name : "—"}
                    {selCustomer && <span style={{ color:"#888" }}> · {selCustomer.phone}</span>}
                  </div>
                  {/* Items */}
                  {items.filter(i => i.description).map((item, i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between",
                      padding:"3px 0", borderBottom:"1px solid #f0f0f0", fontSize:11 }}>
                      <div style={{ flex:1 }}>
                        {item.description}
                        {item.purity && <span style={{ color:"#888" }}> ({item.purity})</span>}
                        {item.weight && <span style={{ color:"#888" }}> {item.weight}g</span>}
                      </div>
                      <div style={{ fontWeight:700, marginLeft:8 }}>
                        ₹{item.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                  {/* Totals */}
                  <div style={{ marginTop:8, paddingTop:6, borderTop:"1px solid #eee" }}>
                    {totals.invDiscAmt > 0 && (
                      <div style={{ display:"flex", justifyContent:"space-between", color:"#888", fontSize:10 }}>
                        <span>Discount</span><span>- ₹{totals.invDiscAmt.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {isSameState  ? (
                      <>
                        <div style={{ display:"flex", justifyContent:"space-between", color:"#888", fontSize:10 }}>
                          <span>CGST 1.5%</span><span>₹{totals.cgst.toLocaleString("en-IN")}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", color:"#888", fontSize:10 }}>
                          <span>SGST 1.5%</span><span>₹{totals.sgst.toLocaleString("en-IN")}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display:"flex", justifyContent:"space-between", color:"#888", fontSize:10 }}>
                        <span>IGST 3%</span><span>₹{totals.igst.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {totals.tcs > 0 && (
                      <div style={{ display:"flex", justifyContent:"space-between", color:BRAND.pink, fontSize:10 }}>
                        <span>TCS 1%</span><span>₹{totals.tcs.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {parseFloat(oldGold) > 0 && (
                      <div style={{ display:"flex", justifyContent:"space-between", color:"#2ecc71", fontSize:10 }}>
                        <span>Old Gold Exchange</span><span>- ₹{parseFloat(oldGold).toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between",
                      fontWeight:800, fontSize:14, color:BRAND.purple,
                      borderTop:`1px solid ${BRAND.purple}`, paddingTop:6, marginTop:4 }}>
                      <span>Total</span>
                      <span>₹{totals.grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:"center", marginTop:8, fontSize:10, color:"#aaa" }}>
                    Thank you for shopping at Ceritage
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <a href={selCustomer  ? `https://wa.me/91${selCustomer.phone}?text=${encodeURIComponent(`Your invoice of ₹${totals.grandTotal} is ready at Ceritage Jewelry. Thank you!`)}` : "#"}
                    target="_blank" rel="noreferrer"
                    style={{ flex:1, textAlign:"center", background:"#25d366", color:"#fff",
                      borderRadius:7, padding:"7px 0", fontSize:12, fontWeight:600,
                      textDecoration:"none", display:"block" }}>
                    WhatsApp
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ALL BILLS TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "list" && (
        <Card t={t}>
          <CardHeader title={`All Invoices ${invoices.length > 0  ? `(${invoices.length})` : ""}`} t={t}
            actions={<>
              <div style={{ position:"relative" }}>
                <input placeholder="Search invoice, customer..."
                  value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)}
                  style={{ background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                    borderRadius:8, padding:"7px 12px 7px 32px", fontSize:13,
                    color:t.inputColor, outline:"none", fontFamily:"inherit", width:200 }} />
                <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:t.textMuted, fontSize:14 }}>⌕</span>
              </div>
              <select value={invoiceFilter} onChange={e => setInvoiceFilter(e.target.value)}
                style={{ background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                  borderRadius:8, padding:"7px 12px", fontSize:13, color:t.inputColor,
                  outline:"none", fontFamily:"inherit" }}>
                <option value="">All Status</option>
                <option>Paid</option><option>Partial</option>
                <option>Credit</option><option>Draft</option><option>Returned</option>
              </select>
            </>} />
          {listLoading
             ? <div style={{ textAlign:"center", padding:32, color:t.textFaint }}>Loading invoices...</div>
            : <DataTable
                columns={["Invoice No","Type","Date","Customer","Total","GST","Payment","Status","Actions"]}
                rows={invoices.map(inv => ({
                  "Invoice No": <span style={{ fontFamily:"monospace", fontWeight:700, color:BRAND.purple }}>{inv.invoice_no}</span>,
                  "Type":       inv.invoice_type,
                  "Date":       new Date(inv.invoice_date).toLocaleDateString("en-IN"),
                  "Customer":   inv.customer_name || "Walk-in",
                  "Total":      `₹${parseFloat(inv.grand_total).toLocaleString("en-IN")}`,
                  "GST":        `₹${(parseFloat(inv.cgst||0)+parseFloat(inv.sgst||0)+parseFloat(inv.igst||0)).toLocaleString("en-IN")}`,
                  "Payment":    inv.payment_mode,
                  "Status": (
                    <span style={{
                      background: inv.status==="Paid" ? "rgba(46,204,113,0.12)" : inv.status==="Draft"  ? `rgba(59,85,230,0.1)` : "rgba(243,156,18,0.12)",
                      color:      inv.status==="Paid" ? "#2ecc71" : inv.status==="Draft"  ? BRAND.blue : "#f39c12",
                      border:`1px solid ${inv.status==="Paid" ? "rgba(46,204,113,0.3)" : "rgba(243,156,18,0.3)"}`,
                      borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:600,
                    }}>{inv.status}</span>
                  ),
                  "Actions": (
                    <div style={{ display:"flex", gap:5 }}>
                      <button onClick={() => { setReceiptInv(inv); setTab("receipt"); }}
                        style={{ background:"none", border:`1px solid ${BRAND.blue}`, borderRadius:6,
                          color:BRAND.blue, fontSize:11, padding:"3px 9px", cursor:"pointer" }}>
                        View
                      </button>
                      <button onClick={() => fetchReceipt(inv.id).then(() => printInvoice(receiptInv || inv))}
                        style={{ background:BRAND.gradBtn, border:"none", borderRadius:6,
                          color:"#fff", fontSize:11, padding:"3px 9px", cursor:"pointer" }}>
                        Print
                      </button>
                    </div>
                  ),
                }))}
                t={t} emptyMsg="No invoices yet. Create your first invoice from the New Invoice tab." />
          }
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          RECEIPT TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "receipt" && (
        <Card t={t}>
          <CardHeader title="Invoice Receipt" t={t}
            actions={
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input placeholder="Invoice ID..."
                  value={receiptId} onChange={e => setReceiptId(e.target.value)}
                  style={{ background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                    borderRadius:7, padding:"6px 10px", fontSize:12,
                    color:t.inputColor, outline:"none", fontFamily:"monospace", width:120 }} />
                <button onClick={() => receiptId && fetchReceipt(receiptId)}
                  style={{ background:BRAND.gradBtn, border:"none", borderRadius:7, color:"#fff",
                    fontSize:12, fontWeight:600, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>
                  Load
                </button>
              </div>
            } />
          {receiptInv  ? (
            <div style={{ overflowX:"auto" }}>
              <div style={{ background:"#fff", color:"#333", border:`1px solid ${t.borderDash}`,
                borderRadius:10, padding:28, maxWidth:760, margin:"0 auto", fontSize:12 }}>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between",
                  borderBottom:`2px solid ${BRAND.purple}`, paddingBottom:12, marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:20, fontWeight:800, color:BRAND.purple }}>CERITAGE JEWELRY</div>
                    <div style={{ fontSize:11, color:"#777" }}>GST Registered · HSN 7113</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{receiptInv.invoice_type || "TAX INVOICE"}</div>
                    <div>No: <b style={{ color:BRAND.purple }}>{receiptInv.invoice_no}</b></div>
                    <div style={{ color:"#777" }}>Date: {receiptInv.invoice_date  ? new Date(receiptInv.invoice_date).toLocaleDateString("en-IN") : "—"}</div>
                  </div>
                </div>
                {/* Bill To */}
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ background:"#f9f6ff", padding:"10px 14px", borderRadius:8, minWidth:200 }}>
                    <b>Bill To:</b>
                    <div style={{ marginTop:4 }}>{receiptInv.customer_name || "Walk-in Customer"}</div>
                    {receiptInv.phone && <div style={{ color:"#777" }}>{receiptInv.phone}</div>}
                    {receiptInv.gst_number && <div style={{ color:"#777", fontFamily:"monospace", fontSize:11 }}>GSTIN: {receiptInv.gst_number}</div>}
                  </div>
                  <div style={{ textAlign:"right", fontSize:11, color:"#777" }}>
                    Payment: <b>{receiptInv.payment_mode}</b><br/>
                    Status: <b style={{ color:"#2ecc71" }}>{receiptInv.status}</b>
                  </div>
                </div>
                {/* Items Table */}
                <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:14, fontSize:11 }}>
                  <thead>
                    <tr style={{ background:"#f3f0ff" }}>
                      {["#","Description","HSN","Purity","Weight","Rate/g","Making","GST%","Amount"].map(h => (
                        <th key={h} style={{ padding:"6px 8px", textAlign:"left",
                          border:"1px solid #ddd", fontWeight:700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(receiptInv.items || []).map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding:"5px 8px", border:"1px solid #eee" }}>{i+1}</td>
                        <td style={{ padding:"5px 8px", border:"1px solid #eee" }}>{item.item_description}</td>
                        <td style={{ padding:"5px 8px", border:"1px solid #eee", fontFamily:"monospace" }}>{item.hsn_code}</td>
                        <td style={{ padding:"5px 8px", border:"1px solid #eee" }}>{item.purity || "—"}</td>
                        <td style={{ padding:"5px 8px", border:"1px solid #eee" }}>{parseFloat(item.weight_g||0).toFixed(3)}g</td>
                        <td style={{ padding:"5px 8px", border:"1px solid #eee" }}>₹{parseFloat(item.rate_per_gram||0).toLocaleString("en-IN")}</td>
                        <td style={{ padding:"5px 8px", border:"1px solid #eee" }}>₹{parseFloat(item.making_charges||0).toLocaleString("en-IN")}</td>
                        <td style={{ padding:"5px 8px", border:"1px solid #eee" }}>{item.gst_pct}%</td>
                        <td style={{ padding:"5px 8px", border:"1px solid #eee", fontWeight:700 }}>₹{parseFloat(item.amount||0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Totals */}
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <div style={{ width:280 }}>
                    {[
                      ["CGST (1.5%)",  `₹${parseFloat(receiptInv.cgst||0).toLocaleString("en-IN")}`],
                      ["SGST (1.5%)",  `₹${parseFloat(receiptInv.sgst||0).toLocaleString("en-IN")}`],
                      ...(parseFloat(receiptInv.igst||0) > 0  ? [["IGST (3%)", `₹${parseFloat(receiptInv.igst).toLocaleString("en-IN")}`]] : []),
                      ...(parseFloat(receiptInv.discount_amt||0) > 0  ? [["Discount", `- ₹${parseFloat(receiptInv.discount_amt).toLocaleString("en-IN")}`]] : []),
                      ...(parseFloat(receiptInv.tcs||0) > 0  ? [["TCS (1%)", `₹${parseFloat(receiptInv.tcs).toLocaleString("en-IN")}`]] : []),
                    ].map(([k,v]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between",
                        padding:"3px 0", fontSize:12, color:"#777", borderBottom:"1px dashed #eee" }}>
                        <span>{k}</span><span style={{ fontFamily:"monospace" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between",
                      fontWeight:800, fontSize:16, color:BRAND.purple, borderTop:`2px solid ${BRAND.purple}`, paddingTop:8, marginTop:4 }}>
                      <span>Grand Total</span>
                      <span>₹{parseFloat(receiptInv.grand_total||0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"center", marginTop:20, color:"#aaa", fontSize:11,
                  borderTop:"1px solid #eee", paddingTop:10 }}>
                  Thank you for shopping at Ceritage Jewelry · Computer Generated Invoice
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"40px 24px", color:t.textFaint, fontSize:13 }}>
              No invoice loaded. Select an invoice from "All Bills" or enter an Invoice ID above.
            </div>
          )}
          <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:16 }}>
            <button onClick={() => printInvoice(receiptInv)}
              disabled={!receiptInv}
              style={{ background: receiptInv  ? BRAND.gradBtn : t.card, border:"none", borderRadius:8,
                color: receiptInv ? "#fff" : t.textFaint, fontSize:13, fontWeight:700,
                padding:"9px 24px", cursor: receiptInv ? "pointer" : "not-allowed", fontFamily:"inherit" }}>
              Print Invoice
            </button>
            {receiptInv && (
              <a href={`https://wa.me/91${receiptInv.customer_phone || ""}?text=${encodeURIComponent(`Your invoice ${receiptInv.invoice_no} of ₹${parseFloat(receiptInv.grand_total).toLocaleString()} is ready. Thank you - Ceritage Jewelry`)}`}
                target="_blank" rel="noreferrer"
                style={{ background:"#25d366", color:"#fff", borderRadius:8, padding:"9px 20px",
                  fontSize:13, fontWeight:700, textDecoration:"none", display:"inline-block" }}>
                WhatsApp
              </a>
            )}
          </div>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CREDIT / DEBIT NOTES TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "notes" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {/* Form */}
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Issue Credit / Debit Note" t={t} />
            <div style={{ display:"flex", gap:0, border:`1px solid ${t.inputBorder}`, borderRadius:9, overflow:"hidden", marginBottom:14 }}>
              {["Credit","Debit"].map(nt => (
                <button key={nt} onClick={() => setNoteType(nt)}
                  style={{ flex:1, background: noteType===nt  ? BRAND.gradBtn : "transparent",
                    color: noteType===nt ? "#fff" : t.textSub, border:"none",
                    padding:"8px 0", fontSize:13, fontWeight:600,
                    cursor:"pointer", fontFamily:"inherit" }}>
                  {nt} Note
                </button>
              ))}
            </div>
            <FormGrid>
              <FormGroup label="Customer *" t={t} half>
                <Select t={t} value={noteCustomer} onChange={e => setNoteCustomer(e.target.value)}>
                  <option value="">-- Select --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Against Invoice" t={t} half>
                <Input t={t} placeholder="INV-2026-XXXX" value={noteAgainst}
                  onChange={e => setNoteAgainst(e.target.value)} />
              </FormGroup>
              <FormGroup label="Reason" t={t} half>
                <Select t={t} value={noteReason} onChange={e => setNoteReason(e.target.value)}>
                  <option>Return of Goods</option>
                  <option>Price Correction</option>
                  <option>Discount Adjustment</option>
                  <option>Short Payment</option>
                  <option>Additional Charges</option>
                </Select>
              </FormGroup>
              <FormGroup label="Amount (₹) *" t={t} half>
                <Input t={t} type="number" step="0.01" placeholder="0.00"
                  value={noteAmount} onChange={e => setNoteAmount(e.target.value)} />
              </FormGroup>
              <FormGroup label="Description" t={t}>
                <Input t={t} placeholder="Optional description..."
                  value={noteDesc} onChange={e => setNoteDesc(e.target.value)} />
              </FormGroup>
            </FormGrid>
            <BtnPrimary onClick={handleSaveNote} disabled={noteSaving}
              style={{ width:"100%", marginTop:8 }}>
              {noteSaving ? "Issuing..." : `Issue ${noteType} Note`}
            </BtnPrimary>
          </Card>

          {/* List */}
          <Card t={t} style={{ marginBottom:0 }}>
            <CardHeader title="Recent Notes" t={t} />
            <DataTable
              columns={["Note No.","Type","Customer","Reason","Amount","Status"]}
              rows={notes_list.map(n => ({
                "Note No.":  <span style={{ fontFamily:"monospace", fontSize:11, color:BRAND.purple }}>{n.note_no}</span>,
                "Type":      <span style={{ color: n.note_type==="Credit" ? "#2ecc71" : BRAND.pink, fontWeight:600 }}>{n.note_type}</span>,
                "Customer":  n.customer_name || "—",
                "Reason":    n.reason || "—",
                "Amount":    `₹${parseFloat(n.amount).toLocaleString("en-IN")}`,
                "Status":    n.status || "Pending",
              }))}
              t={t} emptyMsg="No credit/debit notes yet." />
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          RETURNS TAB
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "returns" && (
        <Card t={t}>
          <CardHeader title="Returns & Refunds" t={t}
            actions={
              <button onClick={() => setRetModal(true)}
                style={{ background:BRAND.gradBtn, border:"none", borderRadius:7, color:"#fff",
                  fontSize:12, fontWeight:700, padding:"6px 16px", cursor:"pointer", fontFamily:"inherit" }}>
                + New Return
              </button>
            } />
          <DataTable
            columns={["Return No.","Date","Customer","Invoice","Reason","Refund Amt","Mode","Status"]}
            rows={returns.map(r => ({
              "Return No.": <span style={{ fontFamily:"monospace", fontSize:11, color:BRAND.purple }}>{r.return_no}</span>,
              "Date":       new Date(r.return_date || r.created_at).toLocaleDateString("en-IN"),
              "Customer":   r.customer_name || "—",
              "Invoice":    r.invoice_ref || "—",
              "Reason":     r.reason || "—",
              "Refund Amt": `₹${parseFloat(r.refund_amount||0).toLocaleString("en-IN")}`,
              "Mode":       r.refund_mode || "—",
              "Status":     <span style={{ color:"#2ecc71", fontWeight:600, fontSize:11 }}>{r.status || "Done"}</span>,
            }))}
            t={t} emptyMsg="No returns yet." />
        </Card>
      )}

      {/* ── Return Modal ─────────────────────────────────────────────── */}
      <Modal open={retModal} onClose={() => setRetModal(false)}
        title="New Return / Refund" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setRetModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleSaveReturn} disabled={retSaving}>
            {retSaving ? "Processing..." : "Submit Return"}
          </BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Customer" t={t} half>
            <Select t={t} value={retForm.customer_id}
              onChange={e => setRetForm(p => ({ ...p, customer_id: e.target.value }))}>
              <option value="">-- Select --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Original Invoice No." t={t} half>
            <Input t={t} placeholder="INV-2026-XXXX" value={retForm.invoice_ref}
              onChange={e => setRetForm(p => ({ ...p, invoice_ref: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Item Description *" t={t}>
            <Input t={t} placeholder="e.g. 22K Gold Ring returned"
              value={retForm.item_description}
              onChange={e => setRetForm(p => ({ ...p, item_description: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Reason" t={t} half>
            <Select t={t} value={retForm.reason}
              onChange={e => setRetForm(p => ({ ...p, reason: e.target.value }))}>
              <option>Customer Request</option>
              <option>Defective Item</option>
              <option>Wrong Item</option>
              <option>Size Issue</option>
              <option>Quality Issue</option>
            </Select>
          </FormGroup>
          <FormGroup label="Item Condition" t={t} half>
            <Select t={t} value={retForm.item_condition}
              onChange={e => setRetForm(p => ({ ...p, item_condition: e.target.value }))}>
              <option>Good</option><option>Partial Damage</option><option>Damaged</option>
            </Select>
          </FormGroup>
          <FormGroup label="Refund Amount (₹) *" t={t} half>
            <Input t={t} type="number" step="0.01" placeholder="0.00"
              value={retForm.refund_amount}
              onChange={e => setRetForm(p => ({ ...p, refund_amount: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Refund Mode" t={t} half>
            <Select t={t} value={retForm.refund_mode}
              onChange={e => setRetForm(p => ({ ...p, refund_mode: e.target.value }))}>
              <option>Cash</option><option>UPI</option><option>Bank Transfer</option>
              <option>Wallet Credit</option><option>Exchange</option>
            </Select>
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
