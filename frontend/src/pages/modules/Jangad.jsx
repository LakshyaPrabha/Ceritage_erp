import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback, useMemo } from "react";
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
  { id: "active",    label: "Active Approval Register" },
  { id: "issue",     label: "Issue Jangad Challan" },
  { id: "stock",     label: "Stock on Approval (Isolated)" },
  { id: "converted", label: "Converted Sales History" },
];

export default function Jangad({ t }) {
  const [tab, setTab] = useState("active");
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState({ active_jangads: 0, total_items_out: 0, total_value_at_risk: 0, overdue_count: 0 });

  // List States
  const [jangads, setJangads] = useState([]);
  const [isolatedStock, setIsolatedStock] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [viewModal, setViewModal] = useState(false);
  const [selectedJangad, setSelectedJangad] = useState(null);
  const [returnModal, setReturnModal] = useState(false);
  const [convertModal, setConvertModal] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [processing, setProcessing] = useState(false);

  // New Issue Form State
  const [issueForm, setIssueForm] = useState({
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    agent_name: "",
    salesperson: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    security_deposit: "",
    deposit_mode: "None",
    notes: "",
  });

  const [challanItems, setChallanItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");

  // ── 1. LOAD DATA ────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const d = await apiRequest("/jangad/kpis");
      if (d.success) setKpis(d.data);
    } catch { /* silent */ }
  }, []);

  const loadJangads = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== "ALL") q.append("status", statusFilter);
      if (search) q.append("search", search);

      const d = await apiRequest(`/jangad?${q.toString()}`);
      if (d.success) setJangads(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  const loadStockIsolated = useCallback(async () => {
    try {
      const d = await apiRequest("/jangad/stock-isolated");
      if (d.success) setIsolatedStock(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadCatalogHelpers = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        apiRequest("/customers?limit=300"),
        apiRequest("/products?limit=300"),
      ]);
      if (cRes.success) setCustomers(cRes.data || []);
      if (pRes.success) setProducts(pRes.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadKpis();
    loadJangads();
    loadCatalogHelpers();
  }, [loadKpis, loadJangads, loadCatalogHelpers]);

  useEffect(() => {
    if (tab === "stock") loadStockIsolated();
  }, [tab, loadStockIsolated]);

  // ── 2. VIEW JANGAD DETAILS ──────────────────────────────────────────────────
  const handleInspectJangad = async (jId) => {
    try {
      const d = await apiRequest(`/jangad/${jId}`);
      if (d.success) {
        setSelectedJangad(d.data);
        setViewModal(true);
      }
    } catch (err) {
      alert(err.message || "Failed to load Jangad details.");
    }
  };

  // ── 3. ADD ITEM TO ISSUE CHALLAN ───────────────────────────────────────────
  const handleAddItemToChallan = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => String(p.id) === String(selectedProduct));
    if (!prod) return;

    // Check if already in cart
    if (challanItems.some(it => String(it.product_id) === String(prod.id))) {
      alert("This item is already added to the Jangad cart.");
      return;
    }

    const newItem = {
      product_id: prod.id,
      barcode: prod.barcode || prod.sku || `BAR-${prod.id}`,
      huid: prod.huid || prod.huid_no || "—",
      item_name: prod.name || prod.product_name,
      metal_type: prod.metal_type || "Gold",
      purity: prod.purity || "22K",
      gross_weight: Number(prod.gross_weight || prod.weight || 0),
      net_weight: Number(prod.net_weight || prod.gross_weight || 0),
      diamond_carat: Number(prod.diamond_carat || 0),
      estimated_rate: Number(prod.selling_price || prod.mrp || 0),
      estimated_value: Number(prod.mrp || prod.selling_price || 0),
    };

    setChallanItems(prev => [...prev, newItem]);
    setSelectedProduct("");
  };

  const handleRemoveItem = (index) => {
    setChallanItems(prev => prev.filter((_, i) => i !== index));
  };

  // ── 4. SUBMIT / ISSUE JANGAD ────────────────────────────────────────────────
  const handleCreateJangad = async (e) => {
    e.preventDefault();
    if (!issueForm.customer_name || !issueForm.customer_phone) {
      alert("Customer Name and Phone are required.");
      return;
    }
    if (challanItems.length === 0) {
      alert("Please add at least one jewelry item to the approval challan.");
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        ...issueForm,
        items: challanItems,
      };

      const d = await apiRequest("/jangad", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (d.success) {
        alert(`✓ ${d.message}`);
        setIssueForm({
          customer_id: "",
          customer_name: "",
          customer_phone: "",
          customer_address: "",
          agent_name: "",
          salesperson: "",
          issue_date: new Date().toISOString().split("T")[0],
          due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          security_deposit: "",
          deposit_mode: "None",
          notes: "",
        });
        setChallanItems([]);
        setTab("active");
        loadJangads();
        loadKpis();
      } else {
        alert(d.message || "Failed to create Jangad.");
      }
    } catch (err) {
      alert(err.message || "Failed to connect to server.");
    } finally {
      setProcessing(false);
    }
  };

  // ── 5. RETURN JANGAD ITEMS ──────────────────────────────────────────────────
  const handleProcessReturn = async () => {
    if (!selectedJangad || selectedItemIds.length === 0) {
      alert("Please select at least one item to return.");
      return;
    }

    setProcessing(true);
    try {
      const d = await apiRequest(`/jangad/${selectedJangad.id}/return`, {
        method: "POST",
        body: JSON.stringify({ returned_item_ids: selectedItemIds }),
      });

      if (d.success) {
        alert(`✓ ${d.message}`);
        setReturnModal(false);
        setViewModal(false);
        setSelectedItemIds([]);
        loadJangads();
        loadKpis();
      } else {
        alert(d.message || "Return failed.");
      }
    } catch (err) {
      alert(err.message || "Error processing return.");
    } finally {
      setProcessing(false);
    }
  };

  // ── 6. 1-CLICK CONVERT TO GST TAX INVOICE ────────────────────────────────────
  const handleProcessConversion = async () => {
    if (!selectedJangad) return;

    setProcessing(true);
    try {
      const d = await apiRequest(`/jangad/${selectedJangad.id}/convert-to-invoice`, {
        method: "POST",
        body: JSON.stringify({
          payment_mode: paymentMode,
          selected_item_ids: selectedItemIds.length > 0 ? selectedItemIds : undefined,
        }),
      });

      if (d.success) {
        alert(`✓ ${d.message}`);
        setConvertModal(false);
        setViewModal(false);
        setSelectedItemIds([]);
        loadJangads();
        loadKpis();
      } else {
        alert(d.message || "Conversion failed.");
      }
    } catch (err) {
      alert(err.message || "Error converting to invoice.");
    } finally {
      setProcessing(false);
    }
  };

  // ── 7. WHATSAPP REMINDER GENERATOR ──────────────────────────────────────────
  const handleSendWhatsAppReminder = (j) => {
    const text = `Namaste ${j.customer_name} ji,\n\nThis is a gentle reminder from Ceritage Fine Jewels regarding Jewelry Approval Challan #${j.jangad_no} issued on ${fmtDate(j.issue_date)}.\n\nTotal Items: ${j.total_items} Pcs (Est. Value: ${fmt(j.total_estimated_value)}).\nScheduled Return Date: ${fmtDate(j.due_date)}.\n\nPlease let us know your selection so we can prepare your final GST invoice or arrange collection.\n\nThank you!`;
    const encoded = encodeURIComponent(text);
    const phone = j.customer_phone.replace(/\D/g, "");
    window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${encoded}`, "_blank");
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="Jangad & Approval Management"
        subtitle="Home Selection · VIP Consignment · Real-Time Stock Isolation · 1-Click GST Conversion"
        t={t}
        actions={
          <BtnPrimary onClick={() => setTab("issue")}>
            + Issue Jangad Challan
          </BtnPrimary>
        }
      />

      {/* ── Top Summary KPI Cards ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
        gap: 12, marginBottom: 20
      }}>
        <StatCard label="Active Approval Challans" value={kpis.active_jangads} color={BRAND.blue} t={t} />
        <StatCard label="Jewelry Pieces Out" value={kpis.total_items_out} color={BRAND.purple} t={t} />
        <StatCard label="Total Value at Risk" value={fmt(kpis.total_value_at_risk)} color="#f39c12" t={t} />
        <StatCard
          label="Overdue Returns"
          value={kpis.overdue_count}
          color={kpis.overdue_count > 0 ? BRAND.pink : "#2ecc71"}
          t={t}
        />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {tab === "active" && (
        <Card t={t}>
          <CardHeader
            title="Jewellery Approval & Home Selection Register"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Select
                  t={t}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ width: 150 }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="OVERDUE">Overdue Only</option>
                  <option value="PARTIALLY_RETURNED">Partially Returned</option>
                  <option value="CONVERTED_TO_SALE">Converted to Sale</option>
                  <option value="RETURNED">Fully Returned</option>
                </Select>
                <Input
                  t={t}
                  placeholder="Search Challan No, Customer, Phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: 220 }}
                />
                <BtnOutline t={t} onClick={loadJangads}>Refresh</BtnOutline>
              </div>
            }
          />
          <DataTable
            columns={["Challan No", "Customer Name", "Contact", "Items", "Gross Wt", "Est. Value", "Issue Date", "Return Due", "Status", "Actions"]}
            rows={jangads.map(j => ({
              "Challan No": <strong>{j.jangad_no}</strong>,
              "Customer Name": <span>{j.customer_name}</span>,
              "Contact": <span>{j.customer_phone}</span>,
              "Items": <span>{j.total_items} Pcs</span>,
              "Gross Wt": <span>{Number(j.total_gross_weight).toFixed(3)}g</span>,
              "Est. Value": <strong>{fmt(j.total_estimated_value)}</strong>,
              "Issue Date": fmtDate(j.issue_date),
              "Return Due": (
                <span style={{
                  color: j.live_status === "OVERDUE" ? BRAND.pink : "inherit",
                  fontWeight: j.live_status === "OVERDUE" ? 800 : "normal"
                }}>
                  {fmtDate(j.due_date)} {j.live_status === "OVERDUE" && "(OVERDUE)"}
                </span>
              ),
              "Status": (
                <span style={{
                  padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
                  background: j.live_status === "CONVERTED_TO_SALE" ? "rgba(46,204,113,0.15)" : j.live_status === "OVERDUE" ? "rgba(230,59,138,0.15)" : "rgba(59,85,230,0.12)",
                  color: j.live_status === "CONVERTED_TO_SALE" ? "#27ae60" : j.live_status === "OVERDUE" ? BRAND.pink : BRAND.blue
                }}>
                  {j.live_status.replace(/_/g, " ")}
                </span>
              ),
              "Actions": (
                <div style={{ display: "flex", gap: 6 }}>
                  <BtnSm t={t} onClick={() => handleInspectJangad(j.id)}>Inspect</BtnSm>
                  {j.status !== "CONVERTED_TO_SALE" && j.status !== "RETURNED" && (
                    <BtnSm t={t} onClick={() => handleSendWhatsAppReminder(j)}>Reminder</BtnSm>
                  )}
                </div>
              ),
            }))}
            t={t}
            emptyMsg="No Jangad approval records found in database."
          />
        </Card>
      )}

      {tab === "issue" && (
        <Card t={t}>
          <CardHeader title="Issue Jewellery on Approval (Home Selection Challan)" t={t} />
          <form onSubmit={handleCreateJangad}>
            <FormGrid>
              {/* Customer Selection */}
              <FormGroup label="Existing VIP Customer (Optional)" t={t} half>
                <Select
                  t={t}
                  value={issueForm.customer_id}
                  onChange={e => {
                    const cId = e.target.value;
                    const cust = customers.find(c => String(c.id) === String(cId));
                    if (cust) {
                      setIssueForm(prev => ({
                        ...prev,
                        customer_id: cust.id,
                        customer_name: cust.full_name,
                        customer_phone: cust.phone,
                        customer_address: cust.city ? `${cust.city}, ${cust.state || ""}` : "",
                      }));
                    } else {
                      setIssueForm(prev => ({ ...prev, customer_id: "" }));
                    }
                  }}
                >
                  <option value="">-- Select Existing Customer or Type Below --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup label="Customer Full Name *" t={t} half>
                <Input
                  t={t}
                  value={issueForm.customer_name}
                  onChange={e => setIssueForm(p => ({ ...p, customer_name: e.target.value }))}
                  placeholder="e.g. Smt. Meenakshi Sharma"
                  required
                />
              </FormGroup>

              <FormGroup label="Phone / Mobile Number *" t={t} half>
                <Input
                  t={t}
                  value={issueForm.customer_phone}
                  onChange={e => setIssueForm(p => ({ ...p, customer_phone: e.target.value }))}
                  placeholder="e.g. 9820011223"
                  required
                />
              </FormGroup>

              <FormGroup label="Agent / Referrer (Optional)" t={t} half>
                <Input
                  t={t}
                  value={issueForm.agent_name}
                  onChange={e => setIssueForm(p => ({ ...p, agent_name: e.target.value }))}
                  placeholder="e.g. Anand Jewellers Agent"
                />
              </FormGroup>

              <FormGroup label="Issue Date" t={t} half>
                <Input
                  t={t}
                  type="date"
                  value={issueForm.issue_date}
                  onChange={e => setIssueForm(p => ({ ...p, issue_date: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Return Due Date *" t={t} half>
                <Input
                  t={t}
                  type="date"
                  value={issueForm.due_date}
                  onChange={e => setIssueForm(p => ({ ...p, due_date: e.target.value }))}
                  required
                />
              </FormGroup>

              <FormGroup label="Security Deposit Amount (₹)" t={t} half>
                <Input
                  t={t}
                  type="number"
                  placeholder="₹0.00"
                  value={issueForm.security_deposit}
                  onChange={e => setIssueForm(p => ({ ...p, security_deposit: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Deposit Payment Mode" t={t} half>
                <Select
                  t={t}
                  value={issueForm.deposit_mode}
                  onChange={e => setIssueForm(p => ({ ...p, deposit_mode: e.target.value }))}
                >
                  <option value="None">None (VIP Privilege)</option>
                  <option value="Cash">Cash Deposit</option>
                  <option value="UPI">UPI / Instant Transfer</option>
                  <option value="Cheque">Security Cheque</option>
                  <option value="Old Gold">Old Gold Holding</option>
                </Select>
              </FormGroup>

              <FormGroup label="Salesperson / Witness" t={t} half>
                <Input
                  t={t}
                  placeholder="Staff handling approval"
                  value={issueForm.salesperson}
                  onChange={e => setIssueForm(p => ({ ...p, salesperson: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Delivery Address / Notes" t={t} half>
                <Input
                  t={t}
                  placeholder="Delivery address or special instructions"
                  value={issueForm.customer_address}
                  onChange={e => setIssueForm(p => ({ ...p, customer_address: e.target.value }))}
                />
              </FormGroup>
            </FormGrid>

            {/* ── Jewelry Items Selector ── */}
            <div style={{
              background: t.card2 || t.card, border: `1px solid ${t.borderDash}`,
              borderRadius: 12, padding: 18, marginTop: 14, marginBottom: 20
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: t.text, margin: "0 0 12px 0" }}>
                Select Jewelry Pieces for Approval (Stock Isolation)
              </h3>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
                <Select
                  t={t}
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  style={{ flex: 1, minWidth: 260 }}
                >
                  <option value="">-- Choose Piece from Showroom Catalog --</option>
                  {products.filter(p => p.status !== "Sold" && p.status !== "On Jangad").map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.product_name} · {p.purity || "22K"} · {Number(p.gross_weight || 0).toFixed(3)}g · {fmt(p.mrp || p.selling_price)}
                    </option>
                  ))}
                </Select>
                <BtnOutline t={t} type="button" onClick={handleAddItemToChallan}>
                  + Add to Jangad Cart
                </BtnOutline>
              </div>

              {/* Items Table */}
              <DataTable
                columns={["Barcode / SKU", "HUID", "Item Description", "Purity", "Gross Wt", "Net Wt", "Est. Value", "Remove"]}
                rows={challanItems.map((it, idx) => ({
                  "Barcode / SKU": <code>{it.barcode}</code>,
                  "HUID": <code>{it.huid}</code>,
                  "Item Description": <strong>{it.item_name}</strong>,
                  "Purity": <span>{it.purity}</span>,
                  "Gross Wt": <span>{it.gross_weight.toFixed(3)}g</span>,
                  "Net Wt": <span>{it.net_weight.toFixed(3)}g</span>,
                  "Est. Value": <strong>{fmt(it.estimated_value)}</strong>,
                  "Remove": (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{
                        background: "rgba(230,59,138,0.1)", color: BRAND.pink,
                        border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer",
                        fontWeight: 700, fontSize: 11
                      }}
                    >
                      Delete
                    </button>
                  ),
                }))}
                t={t}
                emptyMsg="No jewelry items selected yet. Choose pieces from catalog above."
              />

              {challanItems.length > 0 && (
                <div style={{
                  display: "flex", justifyContent: "flex-end", gap: 20, marginTop: 14,
                  fontSize: 13, fontWeight: 700, color: t.text
                }}>
                  <span>Total Items: <strong>{challanItems.length} Pcs</strong></span>
                  <span>Total Gross Wt: <strong>{challanItems.reduce((a, b) => a + b.gross_weight, 0).toFixed(3)}g</strong></span>
                  <span style={{ color: BRAND.blue }}>Total Est. Value: <strong>{fmt(challanItems.reduce((a, b) => a + b.estimated_value, 0))}</strong></span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <BtnOutline t={t} type="button" onClick={() => setTab("active")}>Cancel</BtnOutline>
              <BtnPrimary type="submit" disabled={processing}>
                {processing ? "Generating Challan..." : "Issue Jangad & Lock Stock"}
              </BtnPrimary>
            </div>
          </form>
        </Card>
      )}

      {tab === "stock" && (
        <Card t={t}>
          <CardHeader
            title="Stock on Approval (Locked from Counter POS)"
            t={t}
            actions={<BtnOutline t={t} onClick={loadStockIsolated}>Refresh Isolated Stock</BtnOutline>}
          />
          <DataTable
            columns={["Barcode / SKU", "HUID", "Item Description", "Purity", "Gross Wt", "Est. Value", "Challan No", "With Customer", "Days Out", "Return Due"]}
            rows={isolatedStock.map(it => ({
              "Barcode / SKU": <code>{it.barcode}</code>,
              "HUID": <code>{it.huid}</code>,
              "Item Description": <strong>{it.item_name}</strong>,
              "Purity": <span>{it.purity}</span>,
              "Gross Wt": <span>{Number(it.gross_weight).toFixed(3)}g</span>,
              "Est. Value": <strong>{fmt(it.estimated_value)}</strong>,
              "Challan No": <span>{it.jangad_no}</span>,
              "With Customer": <span>{it.customer_name} ({it.customer_phone})</span>,
              "Days Out": <span>{it.days_out} Days</span>,
              "Return Due": fmtDate(it.due_date),
            }))}
            t={t}
            emptyMsg="✓ No jewelry items currently out on approval. Full showroom stock is available in vault."
          />
        </Card>
      )}

      {tab === "converted" && (
        <Card t={t}>
          <CardHeader title="Jangad Converted to Official GST Sales" t={t} />
          <DataTable
            columns={["Challan No", "Official GST Invoice", "Customer Name", "Total Items", "Gross Value", "Security Adjusted", "Conversion Date"]}
            rows={jangads.filter(j => j.status === "CONVERTED_TO_SALE").map(j => ({
              "Challan No": <strong>{j.jangad_no}</strong>,
              "Official GST Invoice": <strong style={{ color: BRAND.purple }}>{j.invoice_no || `INV-${j.invoice_id}`}</strong>,
              "Customer Name": <span>{j.customer_name}</span>,
              "Total Items": <span>{j.total_items} Pcs</span>,
              "Gross Value": <strong>{fmt(j.total_estimated_value)}</strong>,
              "Security Adjusted": <span>{fmt(j.security_deposit)}</span>,
              "Conversion Date": fmtDate(j.updated_at),
            }))}
            t={t}
            emptyMsg="No Jangad sales conversion records yet."
          />
        </Card>
      )}

      <Modal
        open={viewModal}
        onClose={() => setViewModal(false)}
        title={`Jangad Approval Challan #${selectedJangad?.jangad_no || ""}`}
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setViewModal(false)}>Close</BtnOutline>
            {selectedJangad?.status !== "CONVERTED_TO_SALE" && selectedJangad?.status !== "RETURNED" && (
              <>
                <BtnOutline
                  t={t}
                  onClick={() => {
                    setSelectedItemIds(selectedJangad.items.filter(it => it.item_status === "ISSUED").map(it => it.id));
                    setReturnModal(true);
                  }}
                >
                  Return Items
                </BtnOutline>
                <BtnPrimary
                  onClick={() => {
                    setSelectedItemIds(selectedJangad.items.filter(it => it.item_status === "ISSUED").map(it => it.id));
                    setConvertModal(true);
                  }}
                >
                  Convert to GST Sale Bill
                </BtnPrimary>
              </>
            )}
          </>
        }
      >
        {selectedJangad && (
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div><strong>Customer:</strong> {selectedJangad.customer_name}</div>
              <div><strong>Phone:</strong> {selectedJangad.customer_phone}</div>
              <div><strong>Issue Date:</strong> {fmtDate(selectedJangad.issue_date)}</div>
              <div><strong>Return Due:</strong> {fmtDate(selectedJangad.due_date)}</div>
              <div><strong>Security Deposit:</strong> {fmt(selectedJangad.security_deposit)} ({selectedJangad.deposit_mode})</div>
              <div><strong>Salesperson:</strong> {selectedJangad.salesperson}</div>
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 800, margin: "14px 0 8px 0" }}>Issued Jewelry Pieces</h4>
            <DataTable
              columns={["Item Name", "Purity", "Gross Wt", "Net Wt", "Est. Value", "Status"]}
              rows={(selectedJangad.items || []).map(it => ({
                "Item Name": <strong>{it.item_name}</strong>,
                "Purity": <span>{it.purity}</span>,
                "Gross Wt": <span>{Number(it.gross_weight).toFixed(3)}g</span>,
                "Net Wt": <span>{Number(it.net_weight).toFixed(3)}g</span>,
                "Est. Value": <strong>{fmt(it.estimated_value)}</strong>,
                "Status": (
                  <span style={{
                    padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 800,
                    background: it.item_status === "SOLD" ? "rgba(46,204,113,0.15)" : it.item_status === "RETURNED" ? "rgba(139,59,200,0.15)" : "rgba(59,85,230,0.12)",
                    color: it.item_status === "SOLD" ? "#27ae60" : it.item_status === "RETURNED" ? BRAND.purple : BRAND.blue
                  }}>
                    {it.item_status}
                  </span>
                ),
              }))}
              t={t}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={returnModal}
        onClose={() => setReturnModal(false)}
        title="Process Jewellery Return"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setReturnModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={handleProcessReturn} disabled={processing}>
              {processing ? "Processing Return..." : "Confirm Return & Restock"}
            </BtnPrimary>
          </>
        }
      >
        <p style={{ fontSize: 13, color: t.textSub, margin: "0 0 12px 0" }}>
          Select the jewelry items returned by the customer. Returned items will automatically be released back to active showroom inventory:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(selectedJangad?.items || []).filter(it => it.item_status === "ISSUED").map(it => (
            <label key={it.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              background: t.card2 || t.card, borderRadius: 8, border: `1px solid ${t.borderDash}`,
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={selectedItemIds.includes(it.id)}
                onChange={e => {
                  if (e.target.checked) setSelectedItemIds(prev => [...prev, it.id]);
                  else setSelectedItemIds(prev => prev.filter(id => id !== it.id));
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{it.item_name}</span>
              <span style={{ fontSize: 12, color: t.textMuted }}>({Number(it.gross_weight).toFixed(3)}g · {fmt(it.estimated_value)})</span>
            </label>
          ))}
        </div>
      </Modal>

      <Modal
        open={convertModal}
        onClose={() => setConvertModal(false)}
        title="1-Click Convert to Official GST Invoice"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setConvertModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={handleProcessConversion} disabled={processing}>
              {processing ? "Generating Invoice..." : "Generate Official GST Bill"}
            </BtnPrimary>
          </>
        }
      >
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          <p style={{ color: t.textSub, margin: "0 0 14px 0" }}>
            This will generate an official GST Invoice (1.5% CGST + 1.5% SGST on HSN 7113), adjust the security deposit, and mark the inventory sold.
          </p>

          <FormGroup label="Payment Mode for Remaining Balance" t={t}>
            <Select t={t} value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              <option value="UPI">UPI / QR Code</option>
              <option value="Cash">Cash Counter</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="Net Banking">RTGS / Bank Transfer</option>
            </Select>
          </FormGroup>

          <div style={{
            background: "rgba(59,85,230,0.06)", border: "1px solid rgba(59,85,230,0.2)",
            borderRadius: 8, padding: "12px 14px", marginTop: 14
          }}>
            <div>Security Deposit to Adjust: <strong>{fmt(selectedJangad?.security_deposit)}</strong></div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
              * Deposit will be automatically credited towards the invoice total.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
