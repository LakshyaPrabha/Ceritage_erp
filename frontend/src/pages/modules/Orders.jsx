// ─── Ceritage ERP — Custom Jewellery Orders & Advance Booking ───────────────
import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader, Card, CardHeader, StatCard,
  BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid,
  Input, Select, SectionTitle
} from "../../components/ui";

const API = window.__CERITAGE_API__ || "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("ceritage_token") || sessionStorage.getItem("ceritage_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

const STATUS_OPTS = ["ALL", "Pending", "In Karigar", "Ready", "Delivered", "Cancelled"];

const fmt = (v) => "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function Orders({ t }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [kpis, setKpis] = useState({ active_orders: 0, advance_collected: 0, ready_to_deliver: 0, overdue: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal
  const [addModal, setAddModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customer_id: "", item_name: "", metal_type: "Gold", purity: "22K",
    approx_weight: "", estimated_total: "", advance_paid: "", due_date: ""
  });

  const notify = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const loadKpis = useCallback(async () => {
    try {
      const res = await fetch(`${API}/orders/kpis`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data) setKpis(json.data);
    } catch {
      // ignore
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/customers?limit=200`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setCustomers(json.data);
    } catch {
      // ignore
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API}/orders?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setOrders(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadKpis();
    loadCustomers();
    loadOrders();
  }, [loadKpis, loadCustomers, loadOrders]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.customer_id || !orderForm.item_name) {
      alert("Customer and item description are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(orderForm)
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || "Custom order created successfully");
        setAddModal(false);
        setOrderForm({ customer_id: "", item_name: "", metal_type: "Gold", purity: "22K", approx_weight: "", estimated_total: "", advance_paid: "", due_date: "" });
        loadOrders();
        loadKpis();
      } else {
        alert(json.message || "Failed to book order");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        notify(`Order status updated to ${newStatus}`);
        loadOrders();
        loadKpis();
      } else {
        alert(json.message || "Failed to update status");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Custom Jewellery Orders & Advance Booking"
        subtitle="Customer Orders · Design Specifications · Advance Receipts · Delivery Tracking"
        t={t}
        actions={<BtnPrimary onClick={() => setAddModal(true)}>+ Book New Custom Order</BtnPrimary>}
      />

      {successMsg && (
        <div style={{ background: "rgba(46,204,113,0.15)", border: "1px solid #2ecc71", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#2ecc71", fontSize: 13, fontWeight: 600 }}>
          ✓ {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(231,76,60,0.15)", border: "1px solid #e74c3c", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#e74c3c", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI Ribbon */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Active Orders"      value={kpis.active_orders} color={BRAND.purple} t={t} />
        <StatCard label="Advance Collected"  value={fmt(kpis.advance_collected)} color="#f0c040" t={t} />
        <StatCard label="Ready to Deliver"   value={kpis.ready_to_deliver} color="#2ecc71" t={t} />
        <StatCard label="Overdue Orders"     value={kpis.overdue} color={BRAND.pink} t={t} />
      </div>

      <Card t={t}>
        <CardHeader
          title="Custom Orders Register"
          t={t}
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Search order no, customer, item..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                  borderRadius: 8, padding: "7px 12px", fontSize: 13,
                  color: t.inputColor, outline: "none", width: 240
                }}
              />
              <Select t={t} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 140 }}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s === "ALL" ? "All Status" : s}</option>)}
              </Select>
            </div>
          }
        />
        {loading ? (
          <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading custom orders...</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No custom orders booked yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["Order No", "Customer", "Item Description", "Purity", "Approx Wt", "Est. Total", "Advance Paid", "Balance Due", "Due Date", "Status", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "11px 12px", fontFamily: "monospace", fontWeight: 600, color: BRAND.blue }}>{o.order_no}</td>
                    <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>
                      {o.customer_name || "Walk-in"} <br />
                      <span style={{ fontSize: 11, color: t.subtext }}>{o.customer_phone}</span>
                    </td>
                    <td style={{ padding: "11px 12px", color: t.text }}>{o.item_name}</td>
                    <td style={{ padding: "11px 12px", color: t.subtext }}>{o.purity}</td>
                    <td style={{ padding: "11px 12px", color: t.text }}>{o.approx_weight ? `${o.approx_weight}g` : "—"}</td>
                    <td style={{ padding: "11px 12px", fontWeight: 600, color: t.text }}>{fmt(o.estimated_total)}</td>
                    <td style={{ padding: "11px 12px", color: "#2ecc71", fontWeight: 600 }}>{fmt(o.advance_paid)}</td>
                    <td style={{ padding: "11px 12px", color: Number(o.balance_amount) > 0 ? "#e74c3c" : "#2ecc71", fontWeight: 700 }}>
                      {fmt(o.balance_amount)}
                    </td>
                    <td style={{ padding: "11px 12px", color: t.subtext }}>{fmtDate(o.due_date)}</td>
                    <td style={{ padding: "11px 12px" }}>
                      <span style={{
                        background: o.status === "Delivered" ? "rgba(46,204,113,0.15)" : o.status === "Ready" ? "rgba(52,152,219,0.15)" : o.status === "In Karigar" ? "rgba(241,196,15,0.15)" : "rgba(149,165,166,0.15)",
                        color: o.status === "Delivered" ? "#2ecc71" : o.status === "Ready" ? "#3498db" : o.status === "In Karigar" ? "#f1c40f" : "#95a5a6",
                        padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600
                      }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <Select
                        t={t}
                        value={o.status}
                        onChange={e => handleUpdateStatus(o.id, e.target.value)}
                        style={{ fontSize: 11, padding: "4px 8px", height: "auto" }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Karigar">In Karigar</option>
                        <option value="Ready">Ready</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── MODAL: BOOK NEW CUSTOM ORDER ──────────────────────────────── */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Book New Custom Order" t={t} wide>
        <form onSubmit={handleCreateOrder}>
          <SectionTitle t={t}>Customer & Item Details</SectionTitle>
          <FormGrid>
            <FormGroup label="Select Customer *" t={t} half>
              <Select t={t} value={orderForm.customer_id} onChange={e => setOrderForm(p => ({ ...p, customer_id: e.target.value }))} required>
                <option value="">-- Choose Customer --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Item Description *" t={t} half>
              <Input t={t} placeholder="e.g. 22K Custom Bridal Choker" value={orderForm.item_name} onChange={e => setOrderForm(p => ({ ...p, item_name: e.target.value }))} required />
            </FormGroup>
            <FormGroup label="Metal Type" t={t} half>
              <Select t={t} value={orderForm.metal_type} onChange={e => setOrderForm(p => ({ ...p, metal_type: e.target.value }))}>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Platinum">Platinum</option>
              </Select>
            </FormGroup>
            <FormGroup label="Metal Purity" t={t} half>
              <Select t={t} value={orderForm.purity} onChange={e => setOrderForm(p => ({ ...p, purity: e.target.value }))}>
                <option>24K (999)</option><option>22K (916)</option><option>18K (750)</option><option>14K (585)</option><option>925 Silver</option>
              </Select>
            </FormGroup>
            <FormGroup label="Approximate Weight (g)" t={t} half>
              <Input t={t} type="number" step="0.001" placeholder="e.g. 28.500" value={orderForm.approx_weight} onChange={e => setOrderForm(p => ({ ...p, approx_weight: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Estimated Grand Total (₹)" t={t} half>
              <Input t={t} type="number" placeholder="e.g. 175000" value={orderForm.estimated_total} onChange={e => setOrderForm(p => ({ ...p, estimated_total: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Advance Payment Collected (₹)" t={t} half>
              <Input t={t} type="number" placeholder="e.g. 50000" value={orderForm.advance_paid} onChange={e => setOrderForm(p => ({ ...p, advance_paid: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Target Delivery Date" t={t} half>
              <Input t={t} type="date" value={orderForm.due_date} onChange={e => setOrderForm(p => ({ ...p, due_date: e.target.value }))} />
            </FormGroup>
          </FormGrid>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <BtnOutline t={t} onClick={() => setAddModal(false)}>Cancel</BtnOutline>
            <BtnPrimary type="submit" disabled={loading}>{loading ? "Booking..." : "Book Order & Issue Receipt"}</BtnPrimary>
          </div>
        </form>
      </Modal>
    </div>
  );
}
