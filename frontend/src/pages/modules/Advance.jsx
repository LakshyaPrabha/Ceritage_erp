import { useState, useEffect, useCallback, useMemo } from "react";
import { BRAND } from "../../theme.js";
import {
  PageHeader,
  Card,
  CardHeader,
  StatCard,
  Tabs,
  BtnPrimary,
  BtnOutline,
  BtnSm,
  Modal,
  FormGroup,
  FormGrid,
  Input,
  Select,
} from "../../components/ui";

const API = window.__CERITAGE_API__ || "http://localhost:5000/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");
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
  { id: "active",   label: "Active Rate Locks" },
  { id: "new",      label: "+ Book Rate Lock" },
  { id: "redeemed", label: "Redeemed Register" },
  { id: "expired",  label: "Expired / Cancelled" },
];

const PURITIES = [
  { label: "22K Gold (916)", purity: "22K (916)", metal: "Gold" },
  { label: "24K Gold (999)", purity: "24K (999)", metal: "Gold" },
  { label: "18K Gold (750)", purity: "18K (750)", metal: "Gold" },
  { label: "Silver 999",     purity: "Silver 999", metal: "Silver" },
  { label: "Platinum 950",   purity: "Platinum 950", metal: "Platinum" },
];

export default function Advance({ t }) {
  const [tab, setTab] = useState("active");
  const [kpis, setKpis] = useState({});
  const [locks, setLocks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Modals
  const [topupModal, setTopupModal] = useState(false);
  const [redeemModal, setRedeemModal] = useState(false);
  const [extendModal, setExtendModal] = useState(false);
  const [printModal, setPrintModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedLock, setSelectedLock] = useState(null);

  // Topup Form
  const [topupForm, setTopupForm] = useState({
    amount: "",
    payment_mode: "UPI",
    payment_ref: "",
    payment_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  // Redeem Form
  const [redeemForm, setRedeemForm] = useState({
    invoice_ref: "",
    notes: "",
  });

  // Extend Form
  const [extendForm, setExtendForm] = useState({
    new_valid_till: "",
    notes: "",
  });

  // New Booking Form
  const [bookingForm, setBookingForm] = useState({
    order_id: "",
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    metal_type: "Gold",
    purity: "22K (916)",
    item_description: "",
    locked_rate: "7100",
    weight_g: "",
    advance_paid: "",
    payment_mode: "UPI",
    payment_ref: "",
    lock_date: new Date().toISOString().slice(0, 10),
    valid_till: "",
    validity_days: "30",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // ── 1. LOAD DATA ────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const r = await fetch(`${API}/advance/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) {
        setKpis(d.data);
        if (d.data.live_rates?.rate_22k) {
          setBookingForm((prev) => {
            if (!prev.locked_rate || prev.locked_rate === "7100") {
              return { ...prev, locked_rate: String(d.data.live_rates.rate_22k) };
            }
            return prev;
          });
        }
      }
    } catch { /* silent */ }
  }, []);

  const loadLocks = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append("search", search);
      const r = await fetch(`${API}/advance?${q.toString()}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setLocks(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [search]);

  const loadCustomers = useCallback(async () => {
    try {
      const r = await fetch(`${API}/customers?limit=300`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setCustomers(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const r = await fetch(`${API}/orders?limit=100`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setOrders(d.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadKpis();
    loadLocks();
    loadCustomers();
    loadOrders();
  }, [loadKpis, loadLocks, loadCustomers, loadOrders]);

  // Set default live rate on purity change
  const handlePurityChange = (purityVal) => {
    const matched = PURITIES.find((p) => p.purity === purityVal);
    let rate = "";
    if (kpis.live_rates) {
      if (purityVal === "24K (999)") rate = kpis.live_rates.rate_24k;
      else if (purityVal === "22K (916)") rate = kpis.live_rates.rate_22k;
      else if (purityVal === "18K (750)") rate = kpis.live_rates.rate_18k;
      else if (purityVal === "Silver 999") rate = kpis.live_rates.rate_silver;
    }
    setBookingForm((prev) => ({
      ...prev,
      purity: purityVal,
      metal_type: matched ? matched.metal : "Gold",
      locked_rate: rate || prev.locked_rate,
    }));
  };

  // Auto compute valid_till based on days
  useEffect(() => {
    if (bookingForm.lock_date && bookingForm.validity_days) {
      const d = new Date(bookingForm.lock_date);
      d.setDate(d.getDate() + parseInt(bookingForm.validity_days || 30));
      setBookingForm((prev) => ({ ...prev, valid_till: d.toISOString().slice(0, 10) }));
    }
  }, [bookingForm.lock_date, bookingForm.validity_days]);

  // Computed Values for Booking Form
  const computedLockedValue = useMemo(() => {
    const w = parseFloat(bookingForm.weight_g) || 0;
    const r = parseFloat(bookingForm.locked_rate) || parseFloat(kpis.live_rates?.rate_22k || 7100);
    return (w * r).toFixed(2);
  }, [bookingForm.weight_g, bookingForm.locked_rate, kpis.live_rates]);

  // ── 2. ACTIONS ──────────────────────────────────────────────────────────────

  // Submit New Rate Lock
  const handleCreateLock = async (e) => {
    e.preventDefault();
    if (!bookingForm.locked_rate || !bookingForm.weight_g || !bookingForm.item_description) {
      alert("Please fill in Item Description, Locked Rate, and Weight.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/advance`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(bookingForm),
      });
      const d = await r.json();
      if (d.success) {
        alert(`✓ ${d.message}`);
        setBookingForm({
          order_id: "",
          customer_id: "",
          customer_name: "",
          customer_phone: "",
          metal_type: "Gold",
          purity: "22K (916)",
          item_description: "",
          locked_rate: "",
          weight_g: "",
          advance_paid: "",
          payment_mode: "UPI",
          payment_ref: "",
          lock_date: new Date().toISOString().slice(0, 10),
          valid_till: "",
          validity_days: "30",
          notes: "",
        });
        setTab("active");
        loadLocks();
        loadKpis();
      } else {
        alert(d.message || "Failed to create rate lock");
      }
    } catch (err) {
      alert("Error creating rate lock: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Submit Top-up Advance
  const handleAddTopup = async (e) => {
    e.preventDefault();
    if (!topupForm.amount || !selectedLock) return;
    try {
      const r = await fetch(`${API}/advance/${selectedLock.id}/add-payment`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(topupForm),
      });
      const d = await r.json();
      if (d.success) {
        setTopupModal(false);
        setTopupForm({
          amount: "",
          payment_mode: "UPI",
          payment_ref: "",
          payment_date: new Date().toISOString().slice(0, 10),
          notes: "",
        });
        loadLocks();
        loadKpis();
        alert(`✓ ${d.message}`);
      }
    } catch { /* silent */ }
  };

  // Submit Redeem Lock
  const handleRedeemLock = async (e) => {
    e.preventDefault();
    if (!selectedLock) return;
    try {
      const r = await fetch(`${API}/advance/${selectedLock.id}/redeem`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(redeemForm),
      });
      const d = await r.json();
      if (d.success) {
        setRedeemModal(false);
        setRedeemForm({ invoice_ref: "", notes: "" });
        loadLocks();
        loadKpis();
        alert(`✓ ${d.message}`);
      }
    } catch { /* silent */ }
  };

  // Submit Extend Validity
  const handleExtendValidity = async (e) => {
    e.preventDefault();
    if (!extendForm.new_valid_till || !selectedLock) return;
    try {
      const r = await fetch(`${API}/advance/${selectedLock.id}/extend-validity`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(extendForm),
      });
      const d = await r.json();
      if (d.success) {
        setExtendModal(false);
        loadLocks();
        loadKpis();
        alert(`✓ ${d.message}`);
      }
    } catch { /* silent */ }
  };

  // Filter Locks by Active, Redeemed, Expired
  const activeLocks = useMemo(() => locks.filter((l) => l.status === "Active"), [locks]);
  const redeemedLocks = useMemo(() => locks.filter((l) => l.status === "Redeemed"), [locks]);
  const expiredLocks = useMemo(() => locks.filter((l) => ["Expired", "Cancelled"].includes(l.status)), [locks]);

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="Gold Rate Lock & Advance Booking"
        subtitle="Multi-Metal Rate Lock Engine · Price Fluctuation Hedge · Advance Installment Tracking & Billing Settlement"
        t={t}
        actions={
          <>
            <BtnOutline t={t} onClick={loadLocks}>
              Refresh
            </BtnOutline>
            <BtnPrimary onClick={() => setTab("new")}>+ New Rate Lock Booking</BtnPrimary>
          </>
        }
      />

      {/* ── Live Market Benchmark Ticker Banner ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${BRAND.blue}15 0%, ${BRAND.purple}12 50%, ${BRAND.pink}10 100%)`,
          border: `1.5px solid ${t.border}`,
          borderRadius: 14,
          padding: "16px 22px",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: t.cardShadow,
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>
            Live Showroom Benchmark Rates (Metals.Dev Synced)
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 6, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: 11, color: t.textSub }}>24K Gold: </span>
              <strong style={{ fontSize: 15, color: "#f39c12" }}>
                {fmt(kpis.live_rates?.rate_24k || 7750)}/g
              </strong>
            </div>
            <div>
              <span style={{ fontSize: 11, color: t.textSub }}>22K Gold (916): </span>
              <strong style={{ fontSize: 15, color: BRAND.blue }}>
                {fmt(kpis.live_rates?.rate_22k || 7100)}/g
              </strong>
            </div>
            <div>
              <span style={{ fontSize: 11, color: t.textSub }}>18K Gold: </span>
              <strong style={{ fontSize: 15, color: BRAND.purple }}>
                {fmt(kpis.live_rates?.rate_18k || 5800)}/g
              </strong>
            </div>
            <div>
              <span style={{ fontSize: 11, color: t.textSub }}>Silver 999: </span>
              <strong style={{ fontSize: 15, color: "#95a5a6" }}>
                {fmt(kpis.live_rates?.rate_silver || 92)}/g
              </strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", fontSize: 12, color: t.textSub, maxWidth: 360, lineHeight: 1.5 }}>
          Rate Lock protects customers from future gold price spikes & secures advance cash flow for custom jewelry orders.
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <StatCard label="Active Rate Locks" value={kpis.active_locks || 0} color={BRAND.blue} t={t} />
        <StatCard label="Active Locked Value" value={fmt(kpis.active_locked_value)} color="#f0c040" t={t} />
        <StatCard label="Advance Collected" value={fmt(kpis.active_advance_collected)} color="#2ecc71" t={t} />
        <StatCard label="Locked Gold Weight" value={`${Number(kpis.active_weight_g || 0).toFixed(2)} g`} color={BRAND.purple} t={t} />
        <StatCard label="Redeemed Total" value={kpis.redeemed_locks || 0} color="#3498db" t={t} />
      </div>

      {/* ── Tabs Navigation ── */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: ACTIVE RATE LOCKS                                                    */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "active" && (
        <div>
          {/* Search bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <input
              placeholder="Search Lock #, Customer Name, Phone, Order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: 9,
                padding: "8px 12px",
                fontSize: 13,
                color: t.inputColor,
                outline: "none",
                width: 320,
                fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: 12, color: t.textMuted }}>
              Showing <strong>{activeLocks.length}</strong> active bookings
            </span>
          </div>

          {/* Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {activeLocks.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "50px", color: t.textMuted }}>
                No active rate locks found. Click <strong>+ Book Rate Lock</strong> to create one.
              </div>
            ) : (
              activeLocks.map((lock) => {
                const isPriceHigher = parseFloat(lock.pl_diff_per_gram || 0) > 0;
                const advancePct = parseFloat(lock.advance_percentage || 0);
                const isExpiringSoon =
                  lock.valid_till &&
                  new Date(lock.valid_till) - new Date() < 5 * 24 * 60 * 60 * 1000;

                return (
                  <div
                    key={lock.id}
                    style={{
                      background: t.card,
                      border: `1px solid ${isExpiringSoon ? "rgba(230,59,138,0.4)" : t.border}`,
                      borderRadius: 14,
                      padding: 18,
                      boxShadow: t.cardShadow,
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.blue, letterSpacing: "0.5px" }}>
                          {lock.lock_no} · {lock.purity}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginTop: 2 }}>
                          {lock.customer_name || lock.customer_full_name || "Walk-in Customer"}
                        </div>
                        <div style={{ fontSize: 11, color: t.textMuted }}>
                          {lock.customer_phone || lock.customer_registered_phone || "—"}
                        </div>
                      </div>

                      <span
                        style={{
                          background: "rgba(46,204,113,0.12)",
                          color: "#2ecc71",
                          border: "1px solid rgba(46,204,113,0.3)",
                          borderRadius: 20,
                          padding: "3px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        ● Active Lock
                      </span>
                    </div>

                    {/* Item Description */}
                    <div style={{ fontSize: 12, color: t.textSub, marginBottom: 12 }}>
                      <strong>Item:</strong> {lock.item_description} ({lock.weight_g} g)
                    </div>

                    {/* Price Comparison & Customer Savings */}
                    <div
                      style={{
                        background: t.card2 || t.card,
                        border: `1px solid ${t.borderDash}`,
                        borderRadius: 9,
                        padding: "10px 12px",
                        marginBottom: 12,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase" }}>Locked Rate</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.blue }}>
                          {fmt(lock.locked_rate)}/g
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase" }}>Market Now</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>
                          {fmt(lock.current_live_rate)}/g
                        </div>
                      </div>
                    </div>

                    {/* Customer Savings Highlight */}
                    <div
                      style={{
                        background: isPriceHigher ? "rgba(46,204,113,0.08)" : "rgba(139,59,200,0.06)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: isPriceHigher ? "#2ecc71" : t.textSub,
                        marginBottom: 12,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Customer Savings:</span>
                      <span>
                        {isPriceHigher
                          ? `▲ Saved ₹${lock.customer_total_savings} (₹${lock.pl_diff_per_gram}/g)`
                          : `Rate At Par`}
                      </span>
                    </div>

                    {/* Advance Paid Progress Bar */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: t.textMuted }}>
                          Advance: <strong>{fmt(lock.advance_paid)}</strong>
                        </span>
                        <span style={{ fontWeight: 700, color: "#2ecc71" }}>
                          {advancePct}% of {fmt(lock.locked_value)}
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: t.borderDash, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, advancePct)}%`,
                            background: "linear-gradient(90deg, #2ecc71, #3B55E6)",
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>

                    {/* Validity Alert */}
                    <div style={{ fontSize: 11, color: isExpiringSoon ? BRAND.pink : t.textMuted, marginBottom: 14 }}>
                      Valid Till: <strong>{fmtDate(lock.valid_till)}</strong>{" "}
                      {isExpiringSoon && "(Expiring Soon!)"}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, marginTop: "auto", flexWrap: "wrap" }}>
                      <BtnPrimary
                        style={{ flex: 1, padding: "7px 10px", fontSize: 11 }}
                        onClick={() => {
                          setSelectedLock(lock);
                          setRedeemModal(true);
                        }}
                      >
                        Redeem on Bill
                      </BtnPrimary>
                      <BtnOutline
                        t={t}
                        style={{ padding: "7px 10px", fontSize: 11 }}
                        onClick={() => {
                          setSelectedLock(lock);
                          setTopupModal(true);
                        }}
                      >
                        + Top-up (₹)
                      </BtnOutline>
                      <BtnOutline
                        t={t}
                        style={{ padding: "7px 8px", fontSize: 11 }}
                        onClick={() => {
                          setSelectedLock(lock);
                          setExtendModal(true);
                        }}
                      >
                        Extend
                      </BtnOutline>
                      <BtnOutline
                        t={t}
                        style={{ padding: "7px 8px", fontSize: 11 }}
                        onClick={() => {
                          setSelectedLock(lock);
                          setPrintModal(true);
                        }}
                      >
                        Print Slip
                      </BtnOutline>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: BOOK NEW RATE LOCK FORM                                              */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "new" && (
        <Card t={t} style={{ maxWidth: 760, margin: "0 auto" }}>
          <CardHeader title="Book Gold Rate Lock & Collect Advance" t={t} />

          <form onSubmit={handleCreateLock}>
            {/* Customer & Order */}
            <FormGrid>
              <FormGroup label="Select Customer *" t={t} half>
                <Select
                  t={t}
                  value={bookingForm.customer_id}
                  onChange={(e) => {
                    const cust = customers.find((c) => String(c.id) === e.target.value);
                    setBookingForm((prev) => ({
                      ...prev,
                      customer_id: e.target.value,
                      customer_name: cust ? cust.full_name : "",
                      customer_phone: cust ? cust.phone : "",
                    }));
                  }}
                >
                  <option value="">-- Choose Registered Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} — {c.phone} ({c.tier || "Standard"})
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup label="Link Custom Order (Optional)" t={t} half>
                <Select
                  t={t}
                  value={bookingForm.order_id}
                  onChange={(e) => {
                    const ord = orders.find((o) => o.order_no === e.target.value);
                    setBookingForm((prev) => ({
                      ...prev,
                      order_id: e.target.value,
                      item_description: ord ? ord.item_name || ord.description : prev.item_description,
                    }));
                  }}
                >
                  <option value="">-- None / Direct Rate Booking --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.order_no}>
                      {o.order_no} — {o.item_name} ({o.customer_name})
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>

            {/* Metal & Purity */}
            <FormGrid>
              <FormGroup label="Metal Purity *" t={t} half>
                <Select
                  t={t}
                  value={bookingForm.purity}
                  onChange={(e) => handlePurityChange(e.target.value)}
                >
                  {PURITIES.map((p) => (
                    <option key={p.purity} value={p.purity}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup label="Item Description / Order Purpose *" t={t} half>
                <Input
                  t={t}
                  placeholder="e.g. Bridal Kundan Bangles 50g Order"
                  value={bookingForm.item_description}
                  onChange={(e) => setBookingForm({ ...bookingForm, item_description: e.target.value })}
                />
              </FormGroup>
            </FormGrid>

            {/* Rate & Weight */}
            <FormGrid>
              <FormGroup
                label={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span>Locked Rate (₹/g) *</span>
                    <button
                      type="button"
                      onClick={() => {
                        const r = kpis.live_rates?.rate_22k || 7100;
                        setBookingForm((p) => ({ ...p, locked_rate: String(r) }));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: BRAND.blue,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Use Live: ₹{kpis.live_rates?.rate_22k || 7100}/g
                    </button>
                  </div>
                }
                t={t}
                half
              >
                <Input
                  t={t}
                  type="number"
                  placeholder="e.g. 7100"
                  value={bookingForm.locked_rate}
                  onChange={(e) => setBookingForm({ ...bookingForm, locked_rate: e.target.value })}
                />
              </FormGroup>

              <FormGroup label="Booked Weight (Grams) *" t={t} half>
                <Input
                  t={t}
                  type="number"
                  step="0.001"
                  placeholder="e.g. 50.000 (Enter in grams)"
                  value={bookingForm.weight_g}
                  onChange={(e) => setBookingForm({ ...bookingForm, weight_g: e.target.value })}
                />
              </FormGroup>
            </FormGrid>

            {/* Total Valuation Live Display */}
            <div
              style={{
                background: "rgba(59,85,230,0.06)",
                border: `1.5px dashed ${BRAND.blue}44`,
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase" }}>
                  Total Valuation to Lock
                </span>
                <div style={{ fontSize: 20, fontWeight: 900, color: BRAND.blue }}>
                  {fmt(computedLockedValue)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: t.textSub }}>Quick Advance:</span>
                {[20, 50, 100].map((pct) => {
                  const rateVal = parseFloat(bookingForm.locked_rate) || parseFloat(kpis.live_rates?.rate_22k || 7100);
                  const weightVal = parseFloat(bookingForm.weight_g) || 0;
                  const estimatedTotal = rateVal * weightVal;
                  const previewAmt = (estimatedTotal * (pct / 100)).toFixed(0);

                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        let r = parseFloat(bookingForm.locked_rate);
                        if (!r || isNaN(r)) {
                          r = parseFloat(kpis.live_rates?.rate_22k || 7100);
                        }
                        const w = parseFloat(bookingForm.weight_g) || 0;
                        const total = w * r;
                        const val = (total * (pct / 100)).toFixed(0);
                        setBookingForm((prev) => ({
                          ...prev,
                          locked_rate: String(r),
                          advance_paid: String(val),
                        }));
                      }}
                      style={{
                        background: t.card,
                        border: `1px solid ${t.borderDash}`,
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        color: BRAND.blue,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      {pct}% ({fmt(previewAmt)})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advance Payment & Validity */}
            <FormGrid>
              <FormGroup label="Advance Paid Now (₹)" t={t} half>
                <Input
                  t={t}
                  type="number"
                  placeholder="e.g. 75000"
                  value={bookingForm.advance_paid}
                  onChange={(e) => setBookingForm({ ...bookingForm, advance_paid: e.target.value })}
                />
              </FormGroup>

              <FormGroup label="Payment Mode" t={t} half>
                <Select
                  t={t}
                  value={bookingForm.payment_mode}
                  onChange={(e) => setBookingForm({ ...bookingForm, payment_mode: e.target.value })}
                >
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Debit / Credit Card</option>
                  <option>RTGS / NEFT</option>
                  <option>Cheque</option>
                </Select>
              </FormGroup>
            </FormGrid>

            <FormGrid>
              <FormGroup label="Validity Period" t={t} half>
                <Select
                  t={t}
                  value={bookingForm.validity_days}
                  onChange={(e) => setBookingForm({ ...bookingForm, validity_days: e.target.value })}
                >
                  <option value="15">15 Days</option>
                  <option value="30">30 Days (Standard)</option>
                  <option value="60">60 Days (2 Months)</option>
                  <option value="90">90 Days (Wedding Season)</option>
                </Select>
              </FormGroup>

              <FormGroup label="Valid Till Date" t={t} half>
                <Input
                  t={t}
                  type="date"
                  value={bookingForm.valid_till}
                  onChange={(e) => setBookingForm({ ...bookingForm, valid_till: e.target.value })}
                />
              </FormGroup>
            </FormGrid>

            <FormGroup label="Booking Remarks / Terms" t={t}>
              <Input
                t={t}
                placeholder="e.g. 22K 916 Hallmark rate locked for Navratri collection delivery"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              />
            </FormGroup>

            <BtnPrimary type="submit" disabled={saving} style={{ width: "100%", marginTop: 12 }}>
              {saving ? "Locking Gold Rate..." : "Confirm & Lock Gold Rate"}
            </BtnPrimary>
          </form>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: REDEEMED REGISTER                                                    */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "redeemed" && (
        <Card t={t}>
          <CardHeader title="Redeemed & Invoiced Rate Locks" t={t} />
          {redeemedLocks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: t.textMuted, fontSize: 13 }}>
              No redeemed locks yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Lock No</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Customer</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Item Description</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Locked Rate</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Weight</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Total Value</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Advance Adjusted</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Invoice Ref</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {redeemedLocks.map((l) => (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{l.lock_no}</td>
                      <td style={{ padding: "10px 12px", color: t.text }}>{l.customer_name}</td>
                      <td style={{ padding: "10px 12px", color: t.textSub }}>{l.item_description}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.text }}>{fmt(l.locked_rate)}/g</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: t.text }}>{l.weight_g}g</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: t.text }}>{fmt(l.locked_value)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#2ecc71" }}>{fmt(l.advance_paid)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: BRAND.purple }}>{l.invoice_ref || "Direct Purchase"}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            background: "rgba(59,85,230,0.12)",
                            color: BRAND.blue,
                            borderRadius: 12,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          ✓ Redeemed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: EXPIRED / CANCELLED LOCKS                                            */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "expired" && (
        <Card t={t}>
          <CardHeader title="Expired & Cancelled Rate Locks" t={t} />
          {expiredLocks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: t.textMuted, fontSize: 13 }}>
              No expired or cancelled locks.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Lock No</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Customer</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Item Description</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Advance Held</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Expired Date</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Status</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredLocks.map((l) => (
                    <tr key={l.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{l.lock_no}</td>
                      <td style={{ padding: "10px 12px", color: t.text }}>{l.customer_name}</td>
                      <td style={{ padding: "10px 12px", color: t.textSub }}>{l.item_description}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#2ecc71" }}>{fmt(l.advance_paid)}</td>
                      <td style={{ padding: "10px 12px", color: BRAND.pink }}>{fmtDate(l.valid_till)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            background: "rgba(230,59,138,0.12)",
                            color: BRAND.pink,
                            borderRadius: 12,
                            padding: "2px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <BtnSm
                          t={t}
                          primary
                          onClick={() => {
                            setSelectedLock(l);
                            setExtendModal(true);
                          }}
                        >
                          Extend Validity
                        </BtnSm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: TOP-UP ADVANCE DEPOSIT                                               */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={topupModal}
        onClose={() => setTopupModal(false)}
        title={`Record Top-up Advance — ${selectedLock?.lock_no || ""}`}
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setTopupModal(false)}>
              Cancel
            </BtnOutline>
            <BtnPrimary onClick={handleAddTopup}>Record Deposit</BtnPrimary>
          </>
        }
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: t.textSub }}>
            Customer: <strong>{selectedLock?.customer_name}</strong> · Locked Total:{" "}
            <strong>{fmt(selectedLock?.locked_value)}</strong>
          </div>
          <div style={{ fontSize: 13, color: "#2ecc71", marginTop: 2 }}>
            Currently Paid: <strong>{fmt(selectedLock?.advance_paid)}</strong>
          </div>
        </div>

        <FormGroup label="Additional Deposit Amount (₹) *" t={t}>
          <Input
            t={t}
            type="number"
            placeholder="e.g. 25000"
            value={topupForm.amount}
            onChange={(e) => setTopupForm({ ...topupForm, amount: e.target.value })}
          />
        </FormGroup>

        <FormGrid>
          <FormGroup label="Payment Mode" t={t} half>
            <Select
              t={t}
              value={topupForm.payment_mode}
              onChange={(e) => setTopupForm({ ...topupForm, payment_mode: e.target.value })}
            >
              <option>UPI</option>
              <option>Cash</option>
              <option>Card</option>
              <option>RTGS</option>
            </Select>
          </FormGroup>
          <FormGroup label="Payment Ref / UTR" t={t} half>
            <Input
              t={t}
              placeholder="e.g. UPI-91823719"
              value={topupForm.payment_ref}
              onChange={(e) => setTopupForm({ ...topupForm, payment_ref: e.target.value })}
            />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: REDEEM RATE LOCK ON BILLING                                          */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={redeemModal}
        onClose={() => setRedeemModal(false)}
        title={`Redeem Rate Lock — ${selectedLock?.lock_no || ""}`}
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setRedeemModal(false)}>
              Cancel
            </BtnOutline>
            <BtnPrimary onClick={handleRedeemLock}>Confirm Redemption</BtnPrimary>
          </>
        }
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: t.textSub }}>
            Customer: <strong>{selectedLock?.customer_name}</strong>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#2ecc71", marginTop: 4 }}>
            Total Advance to Deduct from Invoice: {fmt(selectedLock?.advance_paid)}
          </div>
        </div>

        <FormGroup label="Retail Billing Invoice Ref (Optional)" t={t}>
          <Input
            t={t}
            placeholder="e.g. INV-2026-0089"
            value={redeemForm.invoice_ref}
            onChange={(e) => setRedeemForm({ ...redeemForm, invoice_ref: e.target.value })}
          />
        </FormGroup>

        <FormGroup label="Redemption Notes" t={t}>
          <Input
            t={t}
            placeholder="e.g. Adjusted against Bridal Set Invoice"
            value={redeemForm.notes}
            onChange={(e) => setRedeemForm({ ...redeemForm, notes: e.target.value })}
          />
        </FormGroup>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: EXTEND VALIDITY                                                      */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={extendModal}
        onClose={() => setExtendModal(false)}
        title={`Extend Validity — ${selectedLock?.lock_no || ""}`}
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setExtendModal(false)}>
              Cancel
            </BtnOutline>
            <BtnPrimary onClick={handleExtendValidity}>Extend Validity</BtnPrimary>
          </>
        }
      >
        <FormGroup label="New Expiry Date *" t={t}>
          <Input
            t={t}
            type="date"
            value={extendForm.new_valid_till}
            onChange={(e) => setExtendForm({ ...extendForm, new_valid_till: e.target.value })}
          />
        </FormGroup>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: PRINT RATE LOCK GUARANTEE CERTIFICATE                                */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={printModal}
        onClose={() => setPrintModal(false)}
        title="Rate Lock Booking Guarantee Certificate"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setPrintModal(false)}>
              Close
            </BtnOutline>
            <BtnPrimary onClick={() => window.print()}>Print Slip</BtnPrimary>
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
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1.5, color: BRAND.purple }}>
              CERITAGE JEWELS SHOWROOM
            </div>
            <div style={{ fontSize: 11, fontStyle: "italic" }}>
              Official Gold Rate Lock & Advance Guarantee Certificate
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, marginBottom: 14 }}>
            <div><strong>Booking No:</strong> {selectedLock?.lock_no}</div>
            <div><strong>Date:</strong> {fmtDate(selectedLock?.lock_date)}</div>
            <div><strong>Customer Name:</strong> {selectedLock?.customer_name}</div>
            <div><strong>Phone:</strong> {selectedLock?.customer_phone || "—"}</div>
          </div>

          <div style={{ border: "1px solid #444", borderRadius: 4, padding: 10, marginBottom: 14, fontSize: 13 }}>
            <div><strong>Item Ordered:</strong> {selectedLock?.item_description}</div>
            <div><strong>Purity:</strong> {selectedLock?.purity}</div>
            <div><strong>Locked Rate:</strong> ₹{selectedLock?.locked_rate} / gram</div>
            <div><strong>Weight Locked:</strong> {selectedLock?.weight_g} grams</div>
            <div><strong>Total Value Guaranteed:</strong> {fmt(selectedLock?.locked_value)}</div>
            <div style={{ color: "#27ae60", fontWeight: "bold" }}>
              <strong>Advance Paid:</strong> {fmt(selectedLock?.advance_paid)}
            </div>
            <div><strong>Valid Till:</strong> {fmtDate(selectedLock?.valid_till)}</div>
          </div>

          <div style={{ fontSize: 10, fontStyle: "italic", color: "#555", lineHeight: 1.4, marginBottom: 16 }}>
            * Terms: Rate lock is guaranteed until the expiry date. In case gold price rises, customer pays the locked rate.
            Advance amount will be fully adjusted on the final tax invoice upon delivery.
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 12 }}>
            <div>_______________________<br />Customer Signature</div>
            <div>_______________________<br />Authorized Signatory</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
