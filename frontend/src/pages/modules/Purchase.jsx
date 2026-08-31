import { BRAND } from "../../theme.js";
import { useState, useEffect } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs, DataTable,
  BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select
} from "../../components/ui";

const API_BASE = window.__CERITAGE_API__ || "http://localhost:5000/api";

function authHeader() {
  const token = localStorage.getItem("ceritage_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

const TABS = [
  { id: "po",         label: "Purchase Orders" },
  { id: "grn",        label: "Goods Received (GRN)" },
  { id: "sup-ledger", label: "Supplier Ledger" },
  { id: "sup-pay",    label: "Payments & Payables" },
  { id: "old-metal",  label: "Old Metal Purchases" }
];

export default function Purchase({ t }) {
  const [tab, setTab] = useState("po");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // KPIs
  const [kpis, setKpis] = useState({
    total_orders: 0,
    total_order_value: 0,
    draft_orders: 0,
    confirmed_orders: 0,
    partial_orders: 0,
    completed_orders: 0,
    total_grns: 0,
    total_grn_value: 0,
    total_outstanding: 0,
    total_purchased: 0
  });

  // Suppliers & Products for dropdowns
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  // Purchase Orders State
  const [poList, setPoList] = useState([]);
  const [poSearch, setPoSearch] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState("ALL");
  const [poDetailModal, setPoDetailModal] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);

  // New PO Modal State
  const [createPoModal, setCreatePoModal] = useState(false);
  const [poForm, setPoForm] = useState({
    supplier_id: "",
    purchase_date: new Date().toISOString().split("T")[0],
    expected_delivery: "",
    payment_mode: "Credit",
    remarks: "",
    items: [
      { product_id: "", item_name: "", category: "Gold", purity: "22K (916)", ordered_qty: 1, weight_g: 0, rate: 0, making_charge: 0, gst_pct: 3 }
    ]
  });

  // GRN State
  const [grnList, setGrnList] = useState([]);
  const [grnSearch, setGrnSearch] = useState("");
  const [createGrnModal, setCreateGrnModal] = useState(false);
  const [grnDetailModal, setGrnDetailModal] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [grnForm, setGrnForm] = useState({
    po_id: "",
    supplier_id: "",
    received_date: new Date().toISOString().split("T")[0],
    invoice_ref: "",
    condition_status: "Good",
    notes: "",
    items: []
  });

  // Supplier Ledger State
  const [selectedLedgerSupplier, setSelectedLedgerSupplier] = useState("");
  const [supplierLedgerData, setSupplierLedgerData] = useState({ outstanding: 0, total_purchased: 0, entries: [] });

  // Supplier Payment State
  const [payables, setPayables] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    supplier_id: "",
    amount: "",
    payment_mode: "Bank Transfer",
    reference: "",
    po_ref: "",
    remark: ""
  });

  // Old Metal State
  const [oldMetalList, setOldMetalList] = useState([]);
  const [oldMetalModal, setOldMetalModal] = useState(false);
  const [oldMetalForm, setOldMetalForm] = useState({
    metal_type: "Gold",
    gross_weight: "",
    stone_deduction: "0",
    purity: "0.9167",
    rate: "",
    payment_mode: "Cash"
  });

  // Flash message helper
  const notify = (msg, isErr = false) => {
    if (isErr) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchKpis();
    fetchSuppliers();
    fetchProducts();
    fetchPOs();
    fetchGRNs();
    fetchPayables();
    fetchPayments();
    fetchOldMetal();
  }, []);

  async function fetchKpis() {
    try {
      const res = await fetch(`${API_BASE}/purchases/kpis`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) setKpis(json.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchSuppliers() {
    try {
      const res = await fetch(`${API_BASE}/suppliers?limit=200`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) setSuppliers(json.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE}/products?limit=200`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) setProducts(json.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchPOs() {
    setLoading(true);
    try {
      let url = `${API_BASE}/purchases/orders?limit=100`;
      if (poStatusFilter && poStatusFilter !== "ALL") url += `&status=${poStatusFilter}`;
      if (poSearch) url += `&search=${encodeURIComponent(poSearch)}`;
      const res = await fetch(url, { headers: authHeader() });
      const json = await res.json();
      if (json.success) setPoList(json.data || []);
    } catch (e) {
      notify("Failed to fetch purchase orders", true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGRNs() {
    try {
      let url = `${API_BASE}/purchases/grn?limit=100`;
      if (grnSearch) url += `&search=${encodeURIComponent(grnSearch)}`;
      const res = await fetch(url, { headers: authHeader() });
      const json = await res.json();
      if (json.success) setGrnList(json.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchPayables() {
    try {
      const res = await fetch(`${API_BASE}/purchases/outstanding`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) setPayables(json.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchPayments() {
    try {
      const res = await fetch(`${API_BASE}/suppliers/payments?limit=100`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) setPaymentsList(json.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchOldMetal() {
    try {
      const res = await fetch(`${API_BASE}/purchases/old-metal`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) setOldMetalList(json.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSupplierLedger(supId) {
    if (!supId) return;
    try {
      const res = await fetch(`${API_BASE}/suppliers/${supId}/ledger`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) {
        setSupplierLedgerData(json.data);
      }
    } catch (e) {
      notify("Failed to load supplier ledger", true);
    }
  }

  async function openPoDetails(id) {
    try {
      const res = await fetch(`${API_BASE}/purchases/orders/${id}`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) {
        setSelectedPo(json.data);
        setPoDetailModal(true);
      }
    } catch (e) {
      notify("Failed to load PO details", true);
    }
  }

  async function openGrnDetails(id) {
    try {
      const res = await fetch(`${API_BASE}/purchases/grn/${id}`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) {
        setSelectedGrn(json.data);
        setGrnDetailModal(true);
      }
    } catch (e) {
      notify("Failed to load GRN details", true);
    }
  }

  async function handlePoStatusChange(id, newStatus) {
    try {
      const res = await fetch(`${API_BASE}/purchases/orders/${id}/status`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        notify(`PO status updated to ${newStatus}`);
        fetchPOs();
        fetchKpis();
        if (selectedPo && selectedPo.id === id) {
          setSelectedPo({ ...selectedPo, status: newStatus });
        }
      } else {
        notify(json.message || "Failed to update status", true);
      }
    } catch (e) {
      notify("Network error updating PO status", true);
    }
  }

  // Handle PO Line Item Changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...poForm.items];
    newItems[index][field] = value;

    // Auto-fill from product if selected
    if (field === "product_id" && value) {
      const prod = products.find(p => String(p.id) === String(value));
      if (prod) {
        newItems[index].item_name = prod.name;
        newItems[index].category = prod.jewellery_category || prod.product_category || "Gold";
        newItems[index].purity = prod.purity || "22K (916)";
        newItems[index].weight_g = parseFloat(prod.gross_weight || prod.net_weight || 0);
        newItems[index].rate = parseFloat(prod.purchase_price || 0);
      }
    }

    setPoForm({ ...poForm, items: newItems });
  };

  const addItemRow = () => {
    setPoForm({
      ...poForm,
      items: [
        ...poForm.items,
        { product_id: "", item_name: "", category: "Gold", purity: "22K (916)", ordered_qty: 1, weight_g: 0, rate: 0, making_charge: 0, gst_pct: 3 }
      ]
    });
  };

  const removeItemRow = (index) => {
    if (poForm.items.length <= 1) return;
    const newItems = poForm.items.filter((_, i) => i !== index);
    setPoForm({ ...poForm, items: newItems });
  };

  // Submit New PO
  async function submitCreatePo() {
    if (!poForm.supplier_id) {
      notify("Please select a supplier", true);
      return;
    }
    if (poForm.items.some(i => !i.item_name || i.ordered_qty <= 0)) {
      notify("Please enter valid item names and quantities", true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/purchases/orders`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify(poForm)
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || "PO Created successfully!");
        setCreatePoModal(false);
        fetchPOs();
        fetchKpis();
        setPoForm({
          supplier_id: "",
          purchase_date: new Date().toISOString().split("T")[0],
          expected_delivery: "",
          payment_mode: "Credit",
          remarks: "",
          items: [
            { product_id: "", item_name: "", category: "Gold", purity: "22K (916)", ordered_qty: 1, weight_g: 0, rate: 0, making_charge: 0, gst_pct: 3 }
          ]
        });
      } else {
        notify(json.message || "Failed to create PO", true);
      }
    } catch (e) {
      notify("Network error creating PO", true);
    }
  }

  // Open Receive GRN Modal for a specific PO
  async function initReceiveGrn(po) {
    try {
      const res = await fetch(`${API_BASE}/purchases/orders/${po.id}/pending-items`, { headers: authHeader() });
      const json = await res.json();
      if (json.success && json.data.pending_items.length > 0) {
        const grnItems = json.data.pending_items.map(p => ({
          po_item_id: p.id,
          product_id: p.product_id,
          item_name: p.item_name,
          ordered_qty: p.ordered_qty,
          received_qty: p.pending_qty,
          accepted_qty: p.pending_qty,
          rejected_qty: 0,
          weight_g: parseFloat(p.weight_g || 0),
          rate: parseFloat(p.rate || 0),
          making_charge: parseFloat(p.making_charge || 0),
          gst_pct: parseFloat(p.gst_pct || 3),
          rejection_reason: ""
        }));

        setGrnForm({
          po_id: po.id,
          supplier_id: po.supplier_id,
          received_date: new Date().toISOString().split("T")[0],
          invoice_ref: "",
          condition_status: "Good",
          notes: `Goods received against ${po.po_no}`,
          items: grnItems
        });
        setCreateGrnModal(true);
      } else {
        notify("No pending items to receive for this PO.", true);
      }
    } catch (e) {
      notify("Failed to load PO pending items", true);
    }
  }

  // Handle GRN Item quantity edits
  const handleGrnItemChange = (idx, field, value) => {
    const items = [...grnForm.items];
    items[idx][field] = value;
    if (field === "received_qty") {
      const rec = parseInt(value || 0);
      items[idx].accepted_qty = rec;
      items[idx].rejected_qty = 0;
    } else if (field === "accepted_qty") {
      const acc = parseInt(value || 0);
      const rec = parseInt(items[idx].received_qty || 0);
      items[idx].rejected_qty = Math.max(0, rec - acc);
    }
    setGrnForm({ ...grnForm, items });
  };

  // Submit GRN
  async function submitCreateGrn() {
    if (!grnForm.items || grnForm.items.length === 0) {
      notify("No items specified in GRN", true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/purchases/grn`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify(grnForm)
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || "GRN created successfully!");
        setCreateGrnModal(false);
        fetchGRNs();
        fetchPOs();
        fetchKpis();
        fetchPayables();
        fetchProducts();
      } else {
        notify(json.message || "Failed to create GRN", true);
      }
    } catch (e) {
      notify("Network error creating GRN", true);
    }
  }

  // Submit Supplier Payment
  async function submitPayment() {
    if (!paymentForm.supplier_id || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      notify("Please enter a valid supplier and positive payment amount", true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/suppliers/${paymentForm.supplier_id}/payments`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify(paymentForm)
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || "Payment recorded successfully!");
        setPaymentModal(false);
        fetchPayments();
        fetchPayables();
        fetchKpis();
        if (selectedLedgerSupplier === String(paymentForm.supplier_id)) {
          loadSupplierLedger(paymentForm.supplier_id);
        }
        setPaymentForm({
          supplier_id: "",
          amount: "",
          payment_mode: "Bank Transfer",
          reference: "",
          po_ref: "",
          remark: ""
        });
      } else {
        notify(json.message || "Payment recording failed", true);
      }
    } catch (e) {
      notify("Network error recording payment", true);
    }
  }

  // Submit Old Metal Entry
  async function submitOldMetal() {
    if (!oldMetalForm.gross_weight || !oldMetalForm.rate) {
      notify("Please enter gross weight and rate", true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/purchases/old-metal`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify(oldMetalForm)
      });
      const json = await res.json();
      if (json.success) {
        notify("Old metal purchase recorded successfully!");
        setOldMetalModal(false);
        fetchOldMetal();
        setOldMetalForm({
          metal_type: "Gold",
          gross_weight: "",
          stone_deduction: "0",
          purity: "0.9167",
          rate: "",
          payment_mode: "Cash"
        });
      } else {
        notify(json.message || "Failed to record old metal entry", true);
      }
    } catch (e) {
      notify("Network error recording old metal purchase", true);
    }
  }

  // Helper status color
  const getStatusBadge = (st) => {
    switch (st?.toUpperCase()) {
      case "RECEIVED":
        return <span style={{ padding: "4px 8px", borderRadius: 4, background: "#e8f8f5", color: "#27ae60", fontWeight: "bold", fontSize: 11 }}>RECEIVED</span>;
      case "PARTIALLY_RECEIVED":
      case "PARTIAL":
        return <span style={{ padding: "4px 8px", borderRadius: 4, background: "#fef9e7", color: "#f39c12", fontWeight: "bold", fontSize: 11 }}>PARTIAL</span>;
      case "CONFIRMED":
        return <span style={{ padding: "4px 8px", borderRadius: 4, background: "#ebf5fb", color: "#2980b9", fontWeight: "bold", fontSize: 11 }}>CONFIRMED</span>;
      case "DRAFT":
      case "PENDING":
        return <span style={{ padding: "4px 8px", borderRadius: 4, background: "#f4f6f7", color: "#7f8c8d", fontWeight: "bold", fontSize: 11 }}>DRAFT</span>;
      case "CANCELLED":
        return <span style={{ padding: "4px 8px", borderRadius: 4, background: "#fdedec", color: "#e74c3c", fontWeight: "bold", fontSize: 11 }}>CANCELLED</span>;
      default:
        return <span style={{ padding: "4px 8px", borderRadius: 4, background: "#eee", color: "#555", fontSize: 11 }}>{st}</span>;
    }
  };

  return (
    <div>
      <PageHeader
        title="Purchase & Supply Chain Management"
        subtitle="Purchase Orders · Goods Received (GRN) · Automatic Inventory Ingestion · Supplier Ledger & Payables"
        t={t}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <BtnOutline t={t} onClick={() => setPaymentModal(true)}>Record Payment</BtnOutline>
            <BtnPrimary onClick={() => setCreatePoModal(true)}>+ New Purchase Order</BtnPrimary>
          </div>
        }
      />

      {/* Notifications */}
      {successMsg && (
        <div style={{ background: "#e8f8f5", color: "#27ae60", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontWeight: 500 }}>
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: "#fdedec", color: "#e74c3c", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Executive Stat Ribbon */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Total PO Value" val={`₹${(kpis.total_order_value || 0).toLocaleString("en-IN")}`} color={BRAND.blue} t={t} />
        <StatCard label="Total Inward Value" val={`₹${(kpis.total_grn_value || 0).toLocaleString("en-IN")}`} color="#2ecc71" t={t} />
        <StatCard label="Supplier Outstanding" val={`₹${(kpis.total_outstanding || 0).toLocaleString("en-IN")}`} color={BRAND.pink} t={t} />
        <StatCard label="Active POs" val={kpis.confirmed_orders + kpis.partial_orders} color={BRAND.purple} t={t} />
        <StatCard label="Completed GRNs" val={kpis.total_grns} color="#e67e22" t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── TAB 1: PURCHASE ORDERS REGISTER ─────────────────────────────────── */}
      {tab === "po" && (
        <Card t={t}>
          <CardHeader
            title="Purchase Orders Register"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Input
                  t={t}
                  placeholder="Search PO / Supplier..."
                  value={poSearch}
                  onChange={(e) => setPoSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchPOs()}
                  style={{ width: 220 }}
                />
                <Select
                  t={t}
                  value={poStatusFilter}
                  onChange={(e) => {
                    setPoStatusFilter(e.target.value);
                    setTimeout(fetchPOs, 50);
                  }}
                  style={{ width: 140 }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PARTIALLY_RECEIVED">Partial</option>
                  <option value="RECEIVED">Received</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
                <BtnSm t={t} primary onClick={fetchPOs}>Search</BtnSm>
                <BtnSm t={t} primary onClick={() => setCreatePoModal(true)}>+ Create PO</BtnSm>
              </div>
            }
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                  <th style={{ padding: "12px 14px" }}>PO No.</th>
                  <th style={{ padding: "12px 14px" }}>Date</th>
                  <th style={{ padding: "12px 14px" }}>Supplier</th>
                  <th style={{ padding: "12px 14px" }}>Items</th>
                  <th style={{ padding: "12px 14px" }}>Ordered Qty</th>
                  <th style={{ padding: "12px 14px" }}>Received Qty</th>
                  <th style={{ padding: "12px 14px" }}>Total Amount</th>
                  <th style={{ padding: "12px 14px" }}>Status</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {poList.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 24, textAlign: "center", color: "#888" }}>
                      {loading ? "Loading purchase orders..." : "No purchase orders found."}
                    </td>
                  </tr>
                ) : (
                  poList.map((po) => (
                    <tr key={po.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "bold", color: BRAND.blue }}>{po.po_no}</td>
                      <td style={{ padding: "12px 14px" }}>{po.purchase_date ? po.purchase_date.split("T")[0] : "-"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600 }}>{po.supplier_name || "Direct Supplier"}</div>
                        <div style={{ fontSize: 11, color: "#777" }}>{po.supplier_city || po.supplier_phone || ""}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>{po.items_count || 1} line item(s)</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{po.total_ordered_qty || po.total_qty || 1}</td>
                      <td style={{ padding: "12px 14px", color: po.total_received_qty > 0 ? "#27ae60" : "#888", fontWeight: 600 }}>
                        {po.total_received_qty || 0}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: "bold" }}>₹{parseFloat(po.total || 0).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 14px" }}>{getStatusBadge(po.status)}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <BtnSm t={t} onClick={() => openPoDetails(po.id)}>Details</BtnSm>
                          {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
                            <BtnSm t={t} primary onClick={() => initReceiveGrn(po)}>Receive Goods</BtnSm>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── TAB 2: GOODS RECEIVED NOTE (GRN REGISTER) ───────────────────────── */}
      {tab === "grn" && (
        <Card t={t}>
          <CardHeader
            title="Goods Received Notes (GRN Inward Register)"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Input
                  t={t}
                  placeholder="Search GRN / Supplier..."
                  value={grnSearch}
                  onChange={(e) => setGrnSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchGRNs()}
                  style={{ width: 220 }}
                />
                <BtnSm t={t} primary onClick={fetchGRNs}>Search</BtnSm>
              </div>
            }
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                  <th style={{ padding: "12px 14px" }}>GRN No.</th>
                  <th style={{ padding: "12px 14px" }}>Received Date</th>
                  <th style={{ padding: "12px 14px" }}>PO Reference</th>
                  <th style={{ padding: "12px 14px" }}>Supplier</th>
                  <th style={{ padding: "12px 14px" }}>Invoice Ref</th>
                  <th style={{ padding: "12px 14px" }}>Items Received</th>
                  <th style={{ padding: "12px 14px" }}>Total Weight</th>
                  <th style={{ padding: "12px 14px" }}>Total Amount</th>
                  <th style={{ padding: "12px 14px" }}>Condition</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grnList.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: 24, textAlign: "center", color: "#888" }}>
                      No goods received notes found.
                    </td>
                  </tr>
                ) : (
                  grnList.map((g) => (
                    <tr key={g.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "bold", color: "#27ae60" }}>{g.grn_display_no || g.grn_id}</td>
                      <td style={{ padding: "12px 14px" }}>{g.received_date ? g.received_date.split("T")[0] : "-"}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 500, color: BRAND.blue }}>{g.po_no || "-"}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{g.supplier_name || "-"}</td>
                      <td style={{ padding: "12px 14px" }}>{g.invoice_ref || "-"}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{g.total_items || 1} units</td>
                      <td style={{ padding: "12px 14px" }}>{parseFloat(g.total_weight || 0).toFixed(3)} g</td>
                      <td style={{ padding: "12px 14px", fontWeight: "bold" }}>₹{parseFloat(g.total_amount || 0).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 4, background: "#e8f8f5", color: "#27ae60", fontSize: 11, fontWeight: "bold" }}>
                          {g.condition_status || "Good"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <BtnSm t={t} onClick={() => openGrnDetails(g.id)}>View Items</BtnSm>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── TAB 3: SUPPLIER LEDGER STATEMENT ────────────────────────────────── */}
      {tab === "sup-ledger" && (
        <Card t={t}>
          <CardHeader
            title="Supplier Account Ledger & Statement"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Select
                  t={t}
                  style={{ width: 280 }}
                  value={selectedLedgerSupplier}
                  onChange={(e) => {
                    setSelectedLedgerSupplier(e.target.value);
                    loadSupplierLedger(e.target.value);
                  }}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.company_name} (Outstanding: ₹{parseFloat(s.outstanding || 0).toLocaleString("en-IN")})
                    </option>
                  ))}
                </Select>
                <BtnSm t={t} primary onClick={() => selectedLedgerSupplier && loadSupplierLedger(selectedLedgerSupplier)}>
                  Refresh Statement
                </BtnSm>
              </div>
            }
          />

          {/* Supplier Balance Summary Bar */}
          {selectedLedgerSupplier && (
            <div style={{ display: "flex", gap: 20, padding: "12px 16px", background: "#f8f9fa", borderRadius: 8, margin: "10px 16px 16px" }}>
              <div>
                <span style={{ fontSize: 12, color: "#666" }}>Total Purchases: </span>
                <span style={{ fontWeight: "bold", color: BRAND.blue }}>₹{parseFloat(supplierLedgerData.total_purchased || 0).toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "#666" }}>Current Outstanding: </span>
                <span style={{ fontWeight: "bold", color: "#e74c3c" }}>₹{parseFloat(supplierLedgerData.outstanding || 0).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <BtnSm
                  t={t}
                  primary
                  onClick={() => {
                    setPaymentForm({ ...paymentForm, supplier_id: selectedLedgerSupplier });
                    setPaymentModal(true);
                  }}
                >
                  + Record Payment to Supplier
                </BtnSm>
              </div>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                  <th style={{ padding: "12px 14px" }}>Date</th>
                  <th style={{ padding: "12px 14px" }}>Particulars</th>
                  <th style={{ padding: "12px 14px" }}>Reference</th>
                  <th style={{ padding: "12px 14px", color: "#e74c3c" }}>Debit (Purchases)</th>
                  <th style={{ padding: "12px 14px", color: "#27ae60" }}>Credit (Payments)</th>
                  <th style={{ padding: "12px 14px", fontWeight: "bold" }}>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {!selectedLedgerSupplier ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#888" }}>
                      Please select a supplier from above to view their chronological double-entry ledger.
                    </td>
                  </tr>
                ) : supplierLedgerData.entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#888" }}>
                      No ledger transactions found for this supplier.
                    </td>
                  </tr>
                ) : (
                  supplierLedgerData.entries.map((row, idx) => (
                    <tr key={row.id || idx} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px 14px" }}>{row.date ? String(row.date).split("T")[0] : "-"}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 500 }}>{row.particulars || "-"}</td>
                      <td style={{ padding: "12px 14px", color: "#555" }}>{row.reference || row.po_no || "-"}</td>
                      <td style={{ padding: "12px 14px", color: row.debit > 0 ? "#e74c3c" : "#aaa", fontWeight: row.debit > 0 ? 600 : 400 }}>
                        {row.debit > 0 ? `₹${parseFloat(row.debit).toLocaleString("en-IN")}` : "-"}
                      </td>
                      <td style={{ padding: "12px 14px", color: row.credit > 0 ? "#27ae60" : "#aaa", fontWeight: row.credit > 0 ? 600 : 400 }}>
                        {row.credit > 0 ? `₹${parseFloat(row.credit).toLocaleString("en-IN")}` : "-"}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: "bold", color: row.running_balance > 0 ? "#c0392b" : "#27ae60" }}>
                        ₹{parseFloat(row.running_balance || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── TAB 4: PAYMENTS & PAYABLES ───────────────────────────────────────── */}
      {tab === "sup-pay" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Active Payables */}
          <Card t={t}>
            <CardHeader
              title="Supplier Payables & Outstanding"
              t={t}
              actions={<BtnSm t={t} primary onClick={() => setPaymentModal(true)}>+ Pay Supplier</BtnSm>}
            />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                    <th style={{ padding: "10px 12px" }}>Supplier</th>
                    <th style={{ padding: "10px 12px" }}>City</th>
                    <th style={{ padding: "10px 12px" }}>Outstanding</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#888" }}>
                        No pending payables. All suppliers are settled!
                      </td>
                    </tr>
                  ) : (
                    payables.map((p) => (
                      <tr key={p.supplier_id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.company_name}</td>
                        <td style={{ padding: "10px 12px", color: "#666" }}>{p.city || "-"}</td>
                        <td style={{ padding: "10px 12px", fontWeight: "bold", color: "#e74c3c" }}>
                          ₹{parseFloat(p.outstanding || 0).toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <BtnSm
                            t={t}
                            primary
                            onClick={() => {
                              setPaymentForm({ ...paymentForm, supplier_id: p.supplier_id });
                              setPaymentModal(true);
                            }}
                          >
                            Pay Now
                          </BtnSm>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Payment History */}
          <Card t={t}>
            <CardHeader title="Recent Supplier Payments" t={t} />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                    <th style={{ padding: "10px 12px" }}>Pay ID</th>
                    <th style={{ padding: "10px 12px" }}>Date</th>
                    <th style={{ padding: "10px 12px" }}>Supplier</th>
                    <th style={{ padding: "10px 12px" }}>Mode</th>
                    <th style={{ padding: "10px 12px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#888" }}>
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    paymentsList.map((sp) => (
                      <tr key={sp.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "10px 12px", fontWeight: "bold", color: BRAND.blue }}>{sp.pay_id}</td>
                        <td style={{ padding: "10px 12px" }}>{sp.created_at ? sp.created_at.split("T")[0] : "-"}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 500 }}>{sp.supplier_name || "-"}</td>
                        <td style={{ padding: "10px 12px" }}>{sp.payment_mode}</td>
                        <td style={{ padding: "10px 12px", fontWeight: "bold", color: "#27ae60" }}>
                          ₹{parseFloat(sp.amount || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 5: OLD METAL PURCHASES ───────────────────────────────────────── */}
      {tab === "old-metal" && (
        <Card t={t}>
          <CardHeader
            title="Old Gold & Silver Purchase Register (Scrap & Exchange)"
            t={t}
            actions={<BtnSm t={t} primary onClick={() => setOldMetalModal(true)}>+ New Old Metal Purchase</BtnSm>}
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                  <th style={{ padding: "12px 14px" }}>ID</th>
                  <th style={{ padding: "12px 14px" }}>Date</th>
                  <th style={{ padding: "12px 14px" }}>Metal</th>
                  <th style={{ padding: "12px 14px" }}>Gross Wt</th>
                  <th style={{ padding: "12px 14px" }}>Stone Deduction</th>
                  <th style={{ padding: "12px 14px" }}>Net Wt</th>
                  <th style={{ padding: "12px 14px" }}>Fine Wt</th>
                  <th style={{ padding: "12px 14px" }}>Rate / g</th>
                  <th style={{ padding: "12px 14px" }}>Amount Paid</th>
                  <th style={{ padding: "12px 14px" }}>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {oldMetalList.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: 24, textAlign: "center", color: "#888" }}>
                      No old metal scrap purchases recorded yet.
                    </td>
                  </tr>
                ) : (
                  oldMetalList.map((om) => (
                    <tr key={om.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "bold" }}>OMP-{om.id}</td>
                      <td style={{ padding: "12px 14px" }}>{om.created_at ? om.created_at.split("T")[0] : "-"}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{om.metal_type}</td>
                      <td style={{ padding: "12px 14px" }}>{parseFloat(om.gross_weight || 0).toFixed(3)} g</td>
                      <td style={{ padding: "12px 14px" }}>{parseFloat(om.stone_deduction || 0).toFixed(3)} g</td>
                      <td style={{ padding: "12px 14px" }}>{parseFloat(om.net_weight || 0).toFixed(3)} g</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#d35400" }}>{parseFloat(om.fine_weight || 0).toFixed(3)} g</td>
                      <td style={{ padding: "12px 14px" }}>₹{parseFloat(om.rate || 0).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 14px", fontWeight: "bold", color: "#27ae60" }}>
                        ₹{parseFloat(om.amount_paid || 0).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 14px" }}>{om.payment_mode}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── MODAL: CREATE PURCHASE ORDER ────────────────────────────────────── */}
      <Modal
        open={createPoModal}
        onClose={() => setCreatePoModal(false)}
        title="Create New Purchase Order (Multi-Item)"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setCreatePoModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitCreatePo}>Create Purchase Order</BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Supplier *" t={t} half>
            <Select
              t={t}
              value={poForm.supplier_id}
              onChange={(e) => setPoForm({ ...poForm, supplier_id: e.target.value })}
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.company_name} ({s.city || "India"})</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Purchase Date" t={t} half>
            <Input
              t={t}
              type="date"
              value={poForm.purchase_date}
              onChange={(e) => setPoForm({ ...poForm, purchase_date: e.target.value })}
            />
          </FormGroup>

          <FormGroup label="Expected Delivery Date" t={t} half>
            <Input
              t={t}
              type="date"
              value={poForm.expected_delivery}
              onChange={(e) => setPoForm({ ...poForm, expected_delivery: e.target.value })}
            />
          </FormGroup>

          <FormGroup label="Payment Terms" t={t} half>
            <Select
              t={t}
              value={poForm.payment_mode}
              onChange={(e) => setPoForm({ ...poForm, payment_mode: e.target.value })}
            >
              <option value="Credit">Credit (Payable upon GRN)</option>
              <option value="Advance">Advance Paid</option>
              <option value="Bank Transfer">Bank Transfer (Immediate)</option>
            </Select>
          </FormGroup>
        </FormGrid>

        {/* Dynamic Line Items Section */}
        <div style={{ marginTop: 18, borderTop: "1px solid #eee", paddingTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: "bold" }}>PO Line Items</h4>
            <BtnSm t={t} primary onClick={addItemRow}>+ Add Item</BtnSm>
          </div>

          {poForm.items.map((item, idx) => (
            <div key={idx} style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#666" }}>Select Catalog Product (Optional)</label>
                  <Select
                    t={t}
                    value={item.product_id}
                    onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                  >
                    <option value="">-- Custom Jewellery Item --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#666" }}>Item Name *</label>
                  <Input
                    t={t}
                    placeholder="e.g. 22K Gold Antique Choker"
                    value={item.item_name}
                    onChange={(e) => handleItemChange(idx, "item_name", e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#666" }}>Category & Purity</label>
                  <Input
                    t={t}
                    placeholder="e.g. Gold 22K (916)"
                    value={item.purity}
                    onChange={(e) => handleItemChange(idx, "purity", e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "center" }}>
                <div>
                  <label style={{ fontSize: 11, color: "#666" }}>Ordered Qty</label>
                  <Input
                    t={t}
                    type="number"
                    min="1"
                    value={item.ordered_qty}
                    onChange={(e) => handleItemChange(idx, "ordered_qty", e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#666" }}>Weight (g)</label>
                  <Input
                    t={t}
                    type="number"
                    step="0.001"
                    value={item.weight_g}
                    onChange={(e) => handleItemChange(idx, "weight_g", e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#666" }}>Rate / g or Unit (₹)</label>
                  <Input
                    t={t}
                    type="number"
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#666" }}>Making (₹)</label>
                  <Input
                    t={t}
                    type="number"
                    value={item.making_charge}
                    onChange={(e) => handleItemChange(idx, "making_charge", e.target.value)}
                  />
                </div>
                <div>
                  {poForm.items.length > 1 && (
                    <button
                      onClick={() => removeItemRow(idx)}
                      style={{ marginTop: 14, background: "#fdedec", color: "#e74c3c", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <FormGroup label="Remarks / Procurement Notes" t={t}>
            <Input
              t={t}
              placeholder="e.g. For Diwali Exhibition Stock"
              value={poForm.remarks}
              onChange={(e) => setPoForm({ ...poForm, remarks: e.target.value })}
            />
          </FormGroup>
        </div>
      </Modal>

      {/* ── MODAL: CREATE GRN (RECEIVE GOODS) ────────────────────────────────── */}
      <Modal
        open={createGrnModal}
        onClose={() => setCreateGrnModal(false)}
        title="Receive Goods Note (GRN Inward Inspection)"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setCreateGrnModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitCreateGrn}>Confirm & Ingest to Stock</BtnPrimary>
          </>
        }
      >
        <div style={{ background: "#ebf5fb", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, color: "#2980b9" }}>
          ℹ️ Submitting this GRN will automatically increment inventory product stock, create auditable stock movement logs, and post a double-entry debit to the supplier's ledger.
        </div>

        <FormGrid>
          <FormGroup label="Received Date" t={t} half>
            <Input
              t={t}
              type="date"
              value={grnForm.received_date}
              onChange={(e) => setGrnForm({ ...grnForm, received_date: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Supplier Delivery Invoice No." t={t} half>
            <Input
              t={t}
              placeholder="e.g. INV-2026-9901"
              value={grnForm.invoice_ref}
              onChange={(e) => setGrnForm({ ...grnForm, invoice_ref: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Condition Status" t={t} half>
            <Select
              t={t}
              value={grnForm.condition_status}
              onChange={(e) => setGrnForm({ ...grnForm, condition_status: e.target.value })}
            >
              <option value="Good">Good — 100% Quality Passed</option>
              <option value="Partial Damage">Partial Damage</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </FormGroup>
          <FormGroup label="Inspection Remarks" t={t} half>
            <Input
              t={t}
              placeholder="e.g. Weight verified with digital scale"
              value={grnForm.notes}
              onChange={(e) => setGrnForm({ ...grnForm, notes: e.target.value })}
            />
          </FormGroup>
        </FormGrid>

        <div style={{ marginTop: 14 }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: "bold" }}>Inward Inspection Items</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "8px 10px" }}>Item Name</th>
                <th style={{ padding: "8px 10px" }}>Ordered</th>
                <th style={{ padding: "8px 10px" }}>Received Qty</th>
                <th style={{ padding: "8px 10px" }}>Accepted Qty</th>
                <th style={{ padding: "8px 10px" }}>Rejected Qty</th>
                <th style={{ padding: "8px 10px" }}>Weight (g)</th>
                <th style={{ padding: "8px 10px" }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {grnForm.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>{item.item_name}</td>
                  <td style={{ padding: "8px 10px" }}>{item.ordered_qty}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <Input
                      t={t}
                      type="number"
                      min="1"
                      value={item.received_qty}
                      onChange={(e) => handleGrnItemChange(idx, "received_qty", e.target.value)}
                      style={{ width: 70 }}
                    />
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <Input
                      t={t}
                      type="number"
                      min="0"
                      value={item.accepted_qty}
                      onChange={(e) => handleGrnItemChange(idx, "accepted_qty", e.target.value)}
                      style={{ width: 70 }}
                    />
                  </td>
                  <td style={{ padding: "8px 10px", color: item.rejected_qty > 0 ? "#e74c3c" : "#888" }}>
                    {item.rejected_qty}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <Input
                      t={t}
                      type="number"
                      step="0.001"
                      value={item.weight_g}
                      onChange={(e) => handleGrnItemChange(idx, "weight_g", e.target.value)}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    ₹{item.rate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ── MODAL: PO DETAILS ────────────────────────────────────────────────── */}
      {selectedPo && (
        <Modal
          open={poDetailModal}
          onClose={() => setPoDetailModal(false)}
          title={`Purchase Order Details — ${selectedPo.po_no}`}
          t={t}
          footer={
            <>
              {selectedPo.status !== "CANCELLED" && selectedPo.status !== "RECEIVED" && (
                <button
                  onClick={() => handlePoStatusChange(selectedPo.id, "CANCELLED")}
                  style={{ background: "#fdedec", color: "#e74c3c", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer", marginRight: "auto" }}
                >
                  Cancel PO
                </button>
              )}
              <BtnOutline t={t} onClick={() => setPoDetailModal(false)}>Close</BtnOutline>
              {selectedPo.status !== "RECEIVED" && selectedPo.status !== "CANCELLED" && (
                <BtnPrimary
                  onClick={() => {
                    setPoDetailModal(false);
                    initReceiveGrn(selectedPo);
                  }}
                >
                  Receive Goods (GRN)
                </BtnPrimary>
              )}
            </>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: "#777" }}>Supplier</div>
              <div style={{ fontWeight: "bold", fontSize: 14 }}>{selectedPo.supplier_name}</div>
              <div style={{ fontSize: 12, color: "#555" }}>{selectedPo.supplier_phone} · {selectedPo.supplier_city}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#777" }}>PO Date & Status</div>
              <div style={{ fontWeight: 600 }}>{selectedPo.purchase_date?.split("T")[0]}</div>
              <div style={{ marginTop: 4 }}>{getStatusBadge(selectedPo.status)}</div>
            </div>
          </div>

          <h4 style={{ margin: "14px 0 8px 0", fontSize: 13 }}>Line Items</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 14 }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "8px 10px" }}>Item</th>
                <th style={{ padding: "8px 10px" }}>Purity</th>
                <th style={{ padding: "8px 10px" }}>Ordered</th>
                <th style={{ padding: "8px 10px" }}>Received</th>
                <th style={{ padding: "8px 10px" }}>Weight (g)</th>
                <th style={{ padding: "8px 10px" }}>Rate</th>
                <th style={{ padding: "8px 10px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedPo.items?.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>{item.item_name}</td>
                  <td style={{ padding: "8px 10px" }}>{item.purity}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>{item.ordered_qty}</td>
                  <td style={{ padding: "8px 10px", color: item.received_qty > 0 ? "#27ae60" : "#888", fontWeight: 600 }}>
                    {item.received_qty}
                  </td>
                  <td style={{ padding: "8px 10px" }}>{parseFloat(item.weight_g || 0).toFixed(3)}</td>
                  <td style={{ padding: "8px 10px" }}>₹{parseFloat(item.rate || 0).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "8px 10px", fontWeight: "bold" }}>₹{parseFloat(item.amount || 0).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: "right", fontSize: 14, fontWeight: "bold", borderTop: "1px solid #eee", paddingTop: 10 }}>
            Grand Total: ₹{parseFloat(selectedPo.total || 0).toLocaleString("en-IN")}
          </div>
        </Modal>
      )}

      {/* ── MODAL: GRN DETAILS ────────────────────────────────────────────────── */}
      {selectedGrn && (
        <Modal
          open={grnDetailModal}
          onClose={() => setGrnDetailModal(false)}
          title={`GRN Details — ${selectedGrn.grn_display_no || selectedGrn.grn_id}`}
          t={t}
          footer={<BtnOutline t={t} onClick={() => setGrnDetailModal(false)}>Close</BtnOutline>}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: "#777" }}>Supplier</div>
              <div style={{ fontWeight: "bold", fontSize: 14 }}>{selectedGrn.supplier_name}</div>
              <div style={{ fontSize: 12, color: "#555" }}>PO Ref: {selectedGrn.po_no || "-"}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#777" }}>Received Date & Condition</div>
              <div style={{ fontWeight: 600 }}>{selectedGrn.received_date?.split("T")[0]}</div>
              <div style={{ color: "#27ae60", fontWeight: "bold", fontSize: 12 }}>{selectedGrn.condition_status || "Good"}</div>
            </div>
          </div>

          <h4 style={{ margin: "14px 0 8px 0", fontSize: 13 }}>Received Items</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 14 }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "8px 10px" }}>Item Name</th>
                <th style={{ padding: "8px 10px" }}>Received</th>
                <th style={{ padding: "8px 10px" }}>Accepted</th>
                <th style={{ padding: "8px 10px" }}>Rejected</th>
                <th style={{ padding: "8px 10px" }}>Weight (g)</th>
                <th style={{ padding: "8px 10px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {selectedGrn.items?.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>{item.item_name}</td>
                  <td style={{ padding: "8px 10px" }}>{item.received_qty}</td>
                  <td style={{ padding: "8px 10px", color: "#27ae60", fontWeight: "bold" }}>{item.accepted_qty}</td>
                  <td style={{ padding: "8px 10px", color: item.rejected_qty > 0 ? "#e74c3c" : "#888" }}>{item.rejected_qty}</td>
                  <td style={{ padding: "8px 10px" }}>{parseFloat(item.weight_g || 0).toFixed(3)}</td>
                  <td style={{ padding: "8px 10px", fontWeight: "bold" }}>₹{parseFloat(item.amount || 0).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}

      {/* ── MODAL: RECORD SUPPLIER PAYMENT ───────────────────────────────────── */}
      <Modal
        open={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Record Supplier Payment"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setPaymentModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitPayment}>Record Payment</BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Supplier *" t={t} half>
            <Select
              t={t}
              value={paymentForm.supplier_id}
              onChange={(e) => setPaymentForm({ ...paymentForm, supplier_id: e.target.value })}
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company_name} (Due: ₹{parseFloat(s.outstanding || 0).toLocaleString("en-IN")})
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Payment Amount (₹) *" t={t} half>
            <Input
              t={t}
              type="number"
              min="1"
              placeholder="0.00"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
          </FormGroup>

          <FormGroup label="Payment Mode" t={t} half>
            <Select
              t={t}
              value={paymentForm.payment_mode}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
            >
              <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="UPI">UPI / QR</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </Select>
          </FormGroup>

          <FormGroup label="Bank Reference / UTR No." t={t} half>
            <Input
              t={t}
              placeholder="e.g. UTR-AXIS-99210"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
            />
          </FormGroup>

          <FormGroup label="Payment Remarks" t={t}>
            <Input
              t={t}
              placeholder="e.g. Full settlement for GRN-2026-0001"
              value={paymentForm.remark}
              onChange={(e) => setPaymentForm({ ...paymentForm, remark: e.target.value })}
            />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ── MODAL: OLD METAL SCRAP PURCHASE ─────────────────────────────────── */}
      <Modal
        open={oldMetalModal}
        onClose={() => setOldMetalModal(false)}
        title="Old Metal Scrap / Exchange Purchase"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setOldMetalModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitOldMetal}>Save Old Metal Entry</BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Metal Type" t={t} half>
            <Select
              t={t}
              value={oldMetalForm.metal_type}
              onChange={(e) => setOldMetalForm({ ...oldMetalForm, metal_type: e.target.value })}
            >
              <option value="Gold">Gold (Old Jewellery / Scrap)</option>
              <option value="Silver">Silver</option>
              <option value="Platinum">Platinum</option>
            </Select>
          </FormGroup>

          <FormGroup label="Gross Weight (g) *" t={t} half>
            <Input
              t={t}
              type="number"
              step="0.001"
              placeholder="0.000"
              value={oldMetalForm.gross_weight}
              onChange={(e) => setOldMetalForm({ ...oldMetalForm, gross_weight: e.target.value })}
            />
          </FormGroup>

          <FormGroup label="Stone / Dust Deduction (g)" t={t} half>
            <Input
              t={t}
              type="number"
              step="0.001"
              value={oldMetalForm.stone_deduction}
              onChange={(e) => setOldMetalForm({ ...oldMetalForm, stone_deduction: e.target.value })}
            />
          </FormGroup>

          <FormGroup label="Purity Factor" t={t} half>
            <Select
              t={t}
              value={oldMetalForm.purity}
              onChange={(e) => setOldMetalForm({ ...oldMetalForm, purity: e.target.value })}
            >
              <option value="0.9167">22K (91.67% Fine)</option>
              <option value="0.7500">18K (75.00% Fine)</option>
              <option value="0.5833">14K (58.33% Fine)</option>
              <option value="0.9990">24K (99.90% Fine)</option>
            </Select>
          </FormGroup>

          <FormGroup label="Purchase Rate / g (₹) *" t={t} half>
            <Input
              t={t}
              type="number"
              placeholder="Current scrap rate"
              value={oldMetalForm.rate}
              onChange={(e) => setOldMetalForm({ ...oldMetalForm, rate: e.target.value })}
            />
          </FormGroup>

          <FormGroup label="Payment Mode" t={t} half>
            <Select
              t={t}
              value={oldMetalForm.payment_mode}
              onChange={(e) => setOldMetalForm({ ...oldMetalForm, payment_mode: e.target.value })}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Invoice Adjustment">Adjust in Sales Invoice</option>
            </Select>
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
