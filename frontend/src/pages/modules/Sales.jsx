import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
  BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select,
} from "../../components/ui";

const API = "http://localhost:5000/api";
function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
function fmt(n) { return n ? "?" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "?0.00"; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-IN") : "�"; }

const TABS = [
  { id:"register", label:"Sales Register" },
  { id:"retail",   label:"Retail Sales" },
  { id:"wholesale",label:"Wholesale" },
  { id:"online",   label:"Online Sales" },
  { id:"returns",  label:"Sales Returns" },
  { id:"challan",  label:"Delivery Challan" },
  { id:"pending",  label:"Pending Orders" },
  { id:"advance",  label:"Advance Orders" },
];

const EMPTY_SALE = {
  invoice_type: "Retail Invoice", customer_id: "", invoice_date: "",
  payment_mode: "Cash", discount_pct: 0, discount_amt: 0,
  old_gold_exchange: 0, cgst: 0, sgst: 0, igst: 0,
  grand_total: 0, paid_amount: 0, status: "Paid", notes: "",
  items: [{ product_id: "", item_description: "", purity: "", weight_g: 0, rate_per_gram: 0, making_charges: 0, stone_charges: 0, gst_pct: 3, discount_pct: 0, amount: 0 }],
};
const EMPTY_RETURN  = { customer_id: "", invoice_ref: "", item_description: "", reason: "Defective Product", refund_amount: "", refund_mode: "Cash Refund", return_date: "" };
const EMPTY_CHALLAN = { invoice_ref: "", customer_name: "", phone: "", delivery_address: "", items_description: "", quantity: 1, delivery_mode: "Hand Delivery", delivered_by: "" };

export default function Sales({ t }) {
  const [tab, setTab] = useState("register");

  // data
  const [kpis,     setKpis]     = useState({});
  const [sales,    setSales]    = useState([]);
  const [returns,  setReturns]  = useState([]);
  const [challans, setChallans] = useState([]);
  const [pending,  setPending]  = useState([]);
  const [advance,  setAdvance]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");

  // modals
  const [saleModal,    setSaleModal]    = useState(false);
  const [returnModal,  setReturnModal]  = useState(false);
  const [challanModal, setChallanModal] = useState(false);
  const [saving,       setSaving]       = useState(false);

  // forms
  const [saleForm,    setSaleForm]    = useState(EMPTY_SALE);
  const [returnForm,  setReturnForm]  = useState(EMPTY_RETURN);
  const [challanForm, setChallanForm] = useState(EMPTY_CHALLAN);

  // customers for dropdown
  const [customers, setCustomers] = useState([]);

  // -- fetch helpers ------------------------------------------------------------
  const loadKpis = useCallback(async () => {
    try {
      const r = await fetch(`${API}/sales/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data);
    } catch { /* silent */ }
  }, []);

  const loadSales = useCallback(async (type = "") => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: 100 });
      if (type)   q.set("type", type);
      if (search) q.set("search", search);
      const r = await fetch(`${API}/sales?${q}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setSales(d.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [search]);

  const loadReturns = useCallback(async () => {
    try {
      const r = await fetch(`${API}/sales/returns/list`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setReturns(d.data);
    } catch { /* silent */ }
  }, []);

  const loadChallans = useCallback(async () => {
    try {
      const r = await fetch(`${API}/sales/challans`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setChallans(d.data);
    } catch { /* silent */ }
  }, []);

  const loadPending = useCallback(async () => {
    try {
      const r = await fetch(`${API}/sales/orders/pending`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setPending(d.data);
    } catch { /* silent */ }
  }, []);

  const loadAdvance = useCallback(async () => {
    try {
      const r = await fetch(`${API}/sales/orders/advance`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setAdvance(d.data);
    } catch { /* silent */ }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const r = await fetch(`${API}/customers?limit=500`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setCustomers(d.data || []);
    } catch { /* silent */ }
  }, []);

  // -- tab-driven loading -------------------------------------------------------
  useEffect(() => { loadKpis(); }, [loadKpis]);

  useEffect(() => {
    if (["register", "retail", "wholesale", "online"].includes(tab)) {
      const typeMap = { register: "", retail: "retail", wholesale: "wholesale", online: "online" };
      loadSales(typeMap[tab]);
    } else if (tab === "returns")  loadReturns();
    else if (tab === "challan")    loadChallans();
    else if (tab === "pending")    loadPending();
    else if (tab === "advance")    loadAdvance();
  }, [tab, loadSales, loadReturns, loadChallans, loadPending, loadAdvance]);

  // open New Sale ? load customers once
  useEffect(() => { if (saleModal) loadCustomers(); }, [saleModal, loadCustomers]);

  // -- sale item helpers --------------------------------------------------------
  function updateItem(idx, field, value) {
    setSaleForm(prev => {
      const items = prev.items.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, [field]: value };
        const base = (parseFloat(updated.weight_g) || 0) * (parseFloat(updated.rate_per_gram) || 0);
        updated.amount = (base + (parseFloat(updated.making_charges) || 0) + (parseFloat(updated.stone_charges) || 0)) *
          (1 - (parseFloat(updated.discount_pct) || 0) / 100) *
          (1 + (parseFloat(updated.gst_pct) || 3) / 100);
        return updated;
      });
      const subtotal = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
      return { ...prev, items, grand_total: subtotal.toFixed(2), paid_amount: subtotal.toFixed(2) };
    });
  }

  function addItem() {
    setSaleForm(prev => ({
      ...prev,
      items: [...prev.items, { product_id: "", item_description: "", purity: "", weight_g: 0, rate_per_gram: 0, making_charges: 0, stone_charges: 0, gst_pct: 3, discount_pct: 0, amount: 0 }],
    }));
  }

  function removeItem(idx) {
    setSaleForm(prev => {
      const items = prev.items.filter((_, i) => i !== idx);
      const grand_total = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0).toFixed(2);
      return { ...prev, items, grand_total, paid_amount: grand_total };
    });
  }

  // -- submit handlers ----------------------------------------------------------
  async function submitSale() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/sales`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(saleForm),
      });
      const d = await r.json();
      if (d.success) {
        setSaleModal(false);
        setSaleForm(EMPTY_SALE);
        loadKpis();
        loadSales("");
      } else alert(d.message || "Error creating sale");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function submitReturn() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/sales/returns`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(returnForm),
      });
      const d = await r.json();
      if (d.success) {
        setReturnModal(false);
        setReturnForm(EMPTY_RETURN);
        loadReturns();
        loadKpis();
      } else alert(d.message || "Error processing return");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function submitChallan() {
    setSaving(true);
    try {
      const r = await fetch(`${API}/sales/challans`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(challanForm),
      });
      const d = await r.json();
      if (d.success) {
        setChallanModal(false);
        setChallanForm(EMPTY_CHALLAN);
        loadChallans();
      } else alert(d.message || "Error creating challan");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  }

  async function markDelivered(id) {
    try {
      await fetch(`${API}/sales/challans/${id}/status`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify({ status: "Delivered" }),
      });
      loadChallans();
    } catch { /* silent */ }
  }

  // -- status badge -------------------------------------------------------------
  const badge = (s) => {
    const colors = { Paid: "#2ecc71", Partial: "#f39c12", Credit: "#3498db", Returned: BRAND.pink, Draft: "#95a5a6", "EMI Active": BRAND.purple };
    return <span style={{ background: colors[s] || "#aaa", color: "#fff", borderRadius: 6, padding: "2px 9px", fontSize: 11 }}>{s}</span>;
  };

  // -- input style helper -------------------------------------------------------
  const inp = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, color: t.inputColor, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  // -- render -------------------------------------------------------------------
  return (
    <div>
      <PageHeader title="Sales Management"
        subtitle="Retail · Wholesale · Online · Returns · Delivery Challan · Pending & Advance"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={() => setReturnModal(true)}>Sales Return</BtnOutline>
          <BtnOutline t={t} onClick={() => setChallanModal(true)}>Delivery Challan</BtnOutline>
          <BtnPrimary onClick={() => setSaleModal(true)}>+ New Sale</BtnPrimary>
        </>}
      />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Total Net Sales"  value={fmt(kpis.total_net_sales)}  color={BRAND.blue}   t={t} />
        <StatCard label="Total Bills"      value={kpis.total_bills || 0}      color="#2ecc71"      t={t} />
        <StatCard label="Returns Value"    value={fmt(kpis.returns_value)}    color={BRAND.pink}   t={t} />
        <StatCard label="Avg Bill Value"   value={fmt(kpis.avg_bill_value)}   color={BRAND.purple} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* Sales Register / Retail / Wholesale / Online */}
      {["register", "retail", "wholesale", "online"].includes(tab) && (
        <Card t={t}>
          <CardHeader
            title={tab === "register" ? "All Sales" : tab.charAt(0).toUpperCase() + tab.slice(1) + " Sales"}
            t={t}
            actions={<>
              <input
                placeholder="Search invoice, customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadSales(tab === "register" ? "" : tab)}
                style={{ ...inp, width: 200 }}
              />
              <BtnSm t={t} primary onClick={() => loadSales(tab === "register" ? "" : tab)}>Search</BtnSm>
            </>}
          />
          {sales.length === 0 && !loading
            ? <p style={{ textAlign: "center", padding: 36, color: t.textSub, fontSize: 13 }}>No sales found</p>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Invoice No.", "Date", "Customer", "Type", "Amount", "Discount", "Net", "Mode", "Status", "Actions"].map(col => (
                        <th key={col} style={{ textAlign: "left", padding: "9px 12px", color: t.textSub, fontWeight: 600, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.borderDash}`, whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                        <td style={{ padding: "10px 12px", color: t.text, fontWeight: 600 }}>{s.invoice_no}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{fmtDate(s.invoice_date)}</td>
                        <td style={{ padding: "10px 12px", color: t.text }}>{s.customer_name || "Walk-in"}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{s.invoice_type}</td>
                        <td style={{ padding: "10px 12px", color: t.text }}>{fmt(s.grand_total)}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{fmt(s.discount_amt)}</td>
                        <td style={{ padding: "10px 12px", color: t.text, fontWeight: 600 }}>{fmt(s.paid_amount)}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{s.payment_mode}</td>
                        <td style={{ padding: "10px 12px" }}>{badge(s.status)}</td>
                        <td style={{ padding: "10px 12px" }}><BtnSm t={t}>View</BtnSm></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>
      )}

      {tab === "returns" && (
        <Card t={t}>
          <CardHeader title="Sales Returns" t={t}
            actions={<BtnSm t={t} primary onClick={() => setReturnModal(true)}>+ New Return</BtnSm>} />
          {returns.length === 0
            ? <p style={{ textAlign: "center", padding: 36, color: t.textSub, fontSize: 13 }}>No returns found</p>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Return ID", "Date", "Invoice Ref", "Customer", "Item", "Reason", "Refund Amount", "Mode", "Status"].map(col => (
                        <th key={col} style={{ textAlign: "left", padding: "9px 12px", color: t.textSub, fontWeight: 600, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.borderDash}` }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map(r => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                        <td style={{ padding: "10px 12px", color: t.text, fontWeight: 600 }}>{r.return_no}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{fmtDate(r.return_date)}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{r.invoice_ref || "�"}</td>
                        <td style={{ padding: "10px 12px", color: t.text }}>{r.customer_name || "�"}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{r.item_description}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{r.reason}</td>
                        <td style={{ padding: "10px 12px", color: t.text, fontWeight: 600 }}>{fmt(r.refund_amount)}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{r.refund_mode}</td>
                        <td style={{ padding: "10px 12px" }}><span style={{ color: r.status === "Done" ? "#2ecc71" : "#f39c12", fontWeight: 600 }}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>
      )}

      {tab === "challan" && (
        <Card t={t}>
          <CardHeader title="Delivery Challans" t={t}
            actions={<BtnSm t={t} primary onClick={() => setChallanModal(true)}>+ New Challan</BtnSm>} />
          {challans.length === 0
            ? <p style={{ textAlign: "center", padding: 36, color: t.textSub, fontSize: 13 }}>No challans found</p>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["DC No.", "Date", "Invoice", "Customer", "Address", "Mode", "Status", "Actions"].map(col => (
                        <th key={col} style={{ textAlign: "left", padding: "9px 12px", color: t.textSub, fontWeight: 600, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.borderDash}` }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {challans.map(c => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                        <td style={{ padding: "10px 12px", color: t.text, fontWeight: 600 }}>{c.dc_no}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{fmtDate(c.created_at)}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{c.invoice_ref || "�"}</td>
                        <td style={{ padding: "10px 12px", color: t.text }}>{c.customer_name}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{c.delivery_address}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{c.delivery_mode}</td>
                        <td style={{ padding: "10px 12px" }}><span style={{ color: c.status === "Delivered" ? "#2ecc71" : c.status === "In Transit" ? "#f39c12" : "#aaa", fontWeight: 600 }}>{c.status}</span></td>
                        <td style={{ padding: "10px 12px" }}>{c.status !== "Delivered" && <BtnSm t={t} onClick={() => markDelivered(c.id)}>Mark Delivered</BtnSm>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>
      )}

      {tab === "pending" && (
        <Card t={t}>
          <CardHeader title="Pending Orders" t={t} />
          {pending.length === 0
            ? <p style={{ textAlign: "center", padding: 36, color: t.textSub, fontSize: 13 }}>No pending orders</p>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Order ID", "Customer", "Item", "Est. Amount", "Advance", "Balance", "Delivery Date", "Status"].map(col => (
                        <th key={col} style={{ textAlign: "left", padding: "9px 12px", color: t.textSub, fontWeight: 600, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.borderDash}` }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(o => (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                        <td style={{ padding: "10px 12px", color: t.text, fontWeight: 600 }}>{o.order_id}</td>
                        <td style={{ padding: "10px 12px", color: t.text }}>{o.customer_name}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{o.item_description}</td>
                        <td style={{ padding: "10px 12px", color: t.text }}>{fmt(o.estimated_amount)}</td>
                        <td style={{ padding: "10px 12px", color: t.text }}>{fmt(o.advance_amount)}</td>
                        <td style={{ padding: "10px 12px", color: BRAND.pink, fontWeight: 600 }}>{fmt(o.balance)}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{fmtDate(o.delivery_date)}</td>
                        <td style={{ padding: "10px 12px" }}><span style={{ color: o.status === "Ready" ? "#2ecc71" : o.status === "Pending" ? "#f39c12" : BRAND.blue, fontWeight: 600 }}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>
      )}

      {tab === "advance" && (
        <Card t={t}>
          <CardHeader title="Advance Orders" t={t} />
          {advance.length === 0
            ? <p style={{ textAlign: "center", padding: 36, color: t.textSub, fontSize: 13 }}>No advance orders</p>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Order ID", "Customer", "Item", "Est. Amount", "Advance Paid", "Balance", "Delivery Date", "Status"].map(col => (
                        <th key={col} style={{ textAlign: "left", padding: "9px 12px", color: t.textSub, fontWeight: 600, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.borderDash}` }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {advance.map(o => (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                        <td style={{ padding: "10px 12px", color: t.text, fontWeight: 600 }}>{o.order_id}</td>
                        <td style={{ padding: "10px 12px", color: t.text }}>{o.customer_name}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{o.item_description}</td>
                        <td style={{ padding: "10px 12px", color: t.text }}>{fmt(o.estimated_amount)}</td>
                        <td style={{ padding: "10px 12px", color: t.text }}>{fmt(o.advance_amount)}</td>
                        <td style={{ padding: "10px 12px", color: BRAND.pink, fontWeight: 600 }}>{fmt(o.balance)}</td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{fmtDate(o.delivery_date)}</td>
                        <td style={{ padding: "10px 12px" }}><span style={{ color: o.status === "Ready" ? "#2ecc71" : "#f39c12", fontWeight: 600 }}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>
      )}

      {/* -- NEW SALE MODAL --------------------------------------------------- */}
      <Modal open={saleModal} onClose={() => { setSaleModal(false); setSaleForm(EMPTY_SALE); }}
        title="New Sale" t={t} wide
        footer={<>
          <BtnOutline t={t} onClick={() => setSaleModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={submitSale} disabled={saving}>{saving ? "Saving�" : "Create Invoice"}</BtnPrimary>
        </>}>

        <FormGrid>
          <FormGroup label="Invoice Type" t={t} half>
            <Select t={t} value={saleForm.invoice_type} onChange={e => setSaleForm(p => ({ ...p, invoice_type: e.target.value }))}>
              <option>Retail Invoice</option>
              <option>Wholesale Invoice</option>
              <option>Online Invoice</option>
              <option>Tax Invoice</option>
              <option>Exchange Billing</option>
            </Select>
          </FormGroup>
          <FormGroup label="Invoice Date *" t={t} half>
            <Input t={t} type="date" value={saleForm.invoice_date} onChange={e => setSaleForm(p => ({ ...p, invoice_date: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Customer" t={t} half>
            <Select t={t} value={saleForm.customer_id} onChange={e => setSaleForm(p => ({ ...p, customer_id: e.target.value }))}>
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} � {c.phone}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Payment Mode" t={t} half>
            <Select t={t} value={saleForm.payment_mode} onChange={e => setSaleForm(p => ({ ...p, payment_mode: e.target.value }))}>
              <option>Cash</option><option>UPI</option><option>Card</option>
              <option>Cheque</option><option>NEFT/RTGS</option><option>Credit</option><option>EMI</option>
            </Select>
          </FormGroup>
          <FormGroup label="Status" t={t} half>
            <Select t={t} value={saleForm.status} onChange={e => setSaleForm(p => ({ ...p, status: e.target.value }))}>
              <option>Paid</option><option>Partial</option><option>Credit</option><option>EMI Active</option><option>Draft</option>
            </Select>
          </FormGroup>
          <FormGroup label="Old Gold Exchange (?)" t={t} half>
            <Input t={t} type="number" value={saleForm.old_gold_exchange} onChange={e => setSaleForm(p => ({ ...p, old_gold_exchange: e.target.value }))} />
          </FormGroup>
          <FormGroup label="CGST (?)" t={t} half>
            <Input t={t} type="number" value={saleForm.cgst} onChange={e => setSaleForm(p => ({ ...p, cgst: e.target.value }))} />
          </FormGroup>
          <FormGroup label="SGST (?)" t={t} half>
            <Input t={t} type="number" value={saleForm.sgst} onChange={e => setSaleForm(p => ({ ...p, sgst: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Notes" t={t}>
            <Input t={t} value={saleForm.notes} onChange={e => setSaleForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
          </FormGroup>
        </FormGrid>

        {/* Line Items */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ color: t.text, fontSize: 14 }}>Items</strong>
            <BtnSm t={t} primary onClick={addItem}>+ Add Item</BtnSm>
          </div>
          {saleForm.items.map((item, idx) => (
            <div key={idx} style={{ background: t.cardBg, border: `1px solid ${t.borderDash}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: t.textSub, marginBottom: 3, display: "block" }}>Description *</label>
                  <input style={inp} value={item.item_description} placeholder="Item name" onChange={e => updateItem(idx, "item_description", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textSub, marginBottom: 3, display: "block" }}>Purity</label>
                  <input style={inp} value={item.purity} placeholder="e.g. 22K" onChange={e => updateItem(idx, "purity", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textSub, marginBottom: 3, display: "block" }}>Weight (g)</label>
                  <input style={inp} type="number" step="0.001" value={item.weight_g} onChange={e => updateItem(idx, "weight_g", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textSub, marginBottom: 3, display: "block" }}>Rate/gram (?)</label>
                  <input style={inp} type="number" value={item.rate_per_gram} onChange={e => updateItem(idx, "rate_per_gram", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textSub, marginBottom: 3, display: "block" }}>Making Charges (?)</label>
                  <input style={inp} type="number" value={item.making_charges} onChange={e => updateItem(idx, "making_charges", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textSub, marginBottom: 3, display: "block" }}>Stone Charges (?)</label>
                  <input style={inp} type="number" value={item.stone_charges} onChange={e => updateItem(idx, "stone_charges", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textSub, marginBottom: 3, display: "block" }}>GST %</label>
                  <select style={inp} value={item.gst_pct} onChange={e => updateItem(idx, "gst_pct", e.target.value)}>
                    <option value={3}>3%</option><option value={0.25}>0.25%</option><option value={5}>5%</option><option value={18}>18%</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textSub, marginBottom: 3, display: "block" }}>Discount %</label>
                  <input style={inp} type="number" value={item.discount_pct} onChange={e => updateItem(idx, "discount_pct", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: t.textSub, marginBottom: 3, display: "block" }}>Amount (?)</label>
                  <input style={{ ...inp, background: t.rowHover, fontWeight: 700 }} readOnly value={Number(item.amount).toFixed(2)} />
                </div>
              </div>
              {saleForm.items.length > 1 && (
                <div style={{ textAlign: "right" }}>
                  <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: BRAND.pink, cursor: "pointer", fontSize: 12 }}>? Remove</button>
                </div>
              )}
            </div>
          ))}
          <div style={{ textAlign: "right", fontSize: 15, fontWeight: 700, color: t.text, marginTop: 8 }}>
            Grand Total: <span style={{ color: BRAND.blue }}>{fmt(saleForm.grand_total)}</span>
          </div>
        </div>
      </Modal>

      {/* -- RETURN MODAL -------------------------------------------------------- */}
      <Modal open={returnModal} onClose={() => { setReturnModal(false); setReturnForm(EMPTY_RETURN); }}
        title="New Sales Return" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setReturnModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={submitReturn} disabled={saving}>{saving ? "Saving�" : "Process Return"}</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Invoice No. *" t={t} half>
            <Input t={t} placeholder="INV-2026-XXXXX" value={returnForm.invoice_ref} onChange={e => setReturnForm(p => ({ ...p, invoice_ref: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Return Date" t={t} half>
            <Input t={t} type="date" value={returnForm.return_date} onChange={e => setReturnForm(p => ({ ...p, return_date: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Customer" t={t} half>
            <Select t={t} value={returnForm.customer_id} onChange={e => setReturnForm(p => ({ ...p, customer_id: e.target.value }))}>
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Refund Amount (?) *" t={t} half>
            <Input t={t} type="number" value={returnForm.refund_amount} onChange={e => setReturnForm(p => ({ ...p, refund_amount: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Item Description *" t={t}>
            <Input t={t} value={returnForm.item_description} placeholder="Item being returned" onChange={e => setReturnForm(p => ({ ...p, item_description: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Reason *" t={t} half>
            <Select t={t} value={returnForm.reason} onChange={e => setReturnForm(p => ({ ...p, reason: e.target.value }))}>
              <option>Defective Product</option><option>Size Issue</option><option>Wrong Item</option><option>Customer Changed Mind</option><option>Other</option>
            </Select>
          </FormGroup>
          <FormGroup label="Refund Mode" t={t} half>
            <Select t={t} value={returnForm.refund_mode} onChange={e => setReturnForm(p => ({ ...p, refund_mode: e.target.value }))}>
              <option>Cash Refund</option><option>Store Credit</option><option>UPI</option><option>Exchange</option><option>Cheque</option>
            </Select>
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* -- CHALLAN MODAL ------------------------------------------------------- */}
      <Modal open={challanModal} onClose={() => { setChallanModal(false); setChallanForm(EMPTY_CHALLAN); }}
        title="New Delivery Challan" t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setChallanModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={submitChallan} disabled={saving}>{saving ? "Saving�" : "Generate Challan"}</BtnPrimary>
        </>}>
        <FormGrid>
          <FormGroup label="Invoice Reference" t={t} half>
            <Input t={t} placeholder="INV-2026-XXXXX" value={challanForm.invoice_ref} onChange={e => setChallanForm(p => ({ ...p, invoice_ref: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Customer Name *" t={t} half>
            <Input t={t} value={challanForm.customer_name} onChange={e => setChallanForm(p => ({ ...p, customer_name: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Phone" t={t} half>
            <Input t={t} value={challanForm.phone} onChange={e => setChallanForm(p => ({ ...p, phone: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Delivery Address *" t={t}>
            <Input t={t} value={challanForm.delivery_address} onChange={e => setChallanForm(p => ({ ...p, delivery_address: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Items Description *" t={t}>
            <Input t={t} value={challanForm.items_description} onChange={e => setChallanForm(p => ({ ...p, items_description: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Delivery Mode" t={t} half>
            <Select t={t} value={challanForm.delivery_mode} onChange={e => setChallanForm(p => ({ ...p, delivery_mode: e.target.value }))}>
              <option>Hand Delivery</option><option>Courier</option><option>BlueDart</option><option>DTDC</option><option>Self Pickup</option>
            </Select>
          </FormGroup>
          <FormGroup label="Delivered By" t={t} half>
            <Input t={t} value={challanForm.delivered_by} onChange={e => setChallanForm(p => ({ ...p, delivered_by: e.target.value }))} />
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
