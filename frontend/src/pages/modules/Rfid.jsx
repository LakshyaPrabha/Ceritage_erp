import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BRAND } from "../../theme.js";
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
  Modal,
  FormGroup,
  FormGrid,
  Input,
  Select,
  SectionTitle,
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
    return dt.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const TABS = [
  { id: "showcase",  label: "Showcase & Trays" },
  { id: "scanner",   label: "RFID Live Audit" },
  { id: "slots",     label: "Tray Slot Matrix" },
  { id: "encoding",  label: "Tag Encoding" },
  { id: "history",   label: "Audit Logs" },
];

const COUNTERS = ["All", "Counter 1", "Counter 2", "Counter 3", "Vault"];
const CATEGORIES = ["Gold Jewellery", "Diamond Jewellery", "Silver Jewellery", "Platinum Jewellery", "Gemstone Jewellery"];

export default function Rfid({ t }) {
  const [tab, setTab] = useState("showcase");
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState({});
  const [trays, setTrays] = useState([]);
  const [counterFilter, setCounterFilter] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");

  // Modals
  const [newTrayModal, setNewTrayModal] = useState(false);
  const [trayDetailModal, setTrayDetailModal] = useState(false);
  const [lookupModal, setLookupModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [sessionDetailModal, setSessionDetailModal] = useState(false);

  // Selected State
  const [selectedTray, setSelectedTray] = useState(null);
  const [selectedTrayData, setSelectedTrayData] = useState(null);
  const [selectedSessionData, setSelectedSessionData] = useState(null);
  const [unassignedProducts, setUnassignedProducts] = useState([]);

  // New Tray Form
  const [newTrayForm, setNewTrayForm] = useState({
    tray_code: "",
    name: "",
    category: "Gold Jewellery",
    counter: "Counter 1",
    capacity: 24,
    rfid_tag_id: "",
    status: "In Showcase",
    notes: "",
  });

  // Lookup Query
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState("");

  // Tag Encoding Form
  const [encodingForm, setEncodingForm] = useState({
    product_id: "",
    rfid_epc: "",
    sku: "",
    huid: "",
    tag_type: "JEWELRY_TAG",
  });
  const [encodingSuccess, setEncodingSuccess] = useState("");

  // ── AUDIT SCANNER WORKBENCH STATE ──
  const [auditTrayId, setAuditTrayId] = useState("");
  const [auditType, setAuditType] = useState("TRAY_AUDIT");
  const [scannedTagsText, setScannedTagsText] = useState("");
  const [auditorRemarks, setAuditorRemarks] = useState("");
  const [auditResult, setAuditResult] = useState(null);
  const [auditRunning, setAuditRunning] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  const scanInputRef = useRef(null);

  // ── 1. LOAD DATA ────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const r = await fetch(`${API}/rfid/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKpis(d.data);
    } catch { /* silent */ }
  }, []);

  const loadTrays = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (counterFilter !== "All") q.append("counter", counterFilter);
      const r = await fetch(`${API}/rfid/trays?${q.toString()}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setTrays(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [counterFilter]);

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`${API}/rfid/audit/history?limit=30`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setHistoryList(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadUnassignedProducts = useCallback(async () => {
    try {
      const r = await fetch(`${API}/products?limit=200`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setUnassignedProducts(d.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadKpis();
    loadTrays();
  }, [loadKpis, loadTrays]);

  useEffect(() => {
    if (tab === "history") loadHistory();
    if (tab === "slots" || tab === "encoding") loadUnassignedProducts();
  }, [tab, loadHistory, loadUnassignedProducts]);

  // Load single tray detail
  const fetchTrayDetails = async (trayId) => {
    try {
      const r = await fetch(`${API}/rfid/trays/${trayId}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) {
        setSelectedTrayData(d.data);
      }
    } catch { /* silent */ }
  };

  // ── 2. ACTIONS ──────────────────────────────────────────────────────────────

  // Create Tray
  const handleCreateTray = async (e) => {
    e.preventDefault();
    if (!newTrayForm.tray_code || !newTrayForm.name) return;
    try {
      const r = await fetch(`${API}/rfid/trays`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newTrayForm),
      });
      const d = await r.json();
      if (d.success) {
        setNewTrayModal(false);
        setNewTrayForm({
          tray_code: "",
          name: "",
          category: "Gold Jewellery",
          counter: "Counter 1",
          capacity: 24,
          rfid_tag_id: "",
          status: "In Showcase",
          notes: "",
        });
        loadTrays();
        loadKpis();
      }
    } catch { /* silent */ }
  };

  // Bulk Transfer Location (Day Closing / Day Opening)
  const handleBulkTransfer = async (targetStatus) => {
    const isClosing = targetStatus === "In Vault";
    const msg = isClosing
      ? "Execute Day Closing? All showcase trays will be transferred and locked in the Secure Vault."
      : "Execute Day Opening? All trays will be transferred to Showroom Counters for display.";
    if (!window.confirm(msg)) return;

    try {
      const r = await fetch(`${API}/rfid/trays/transfer-location`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ target_status: targetStatus }),
      });
      const d = await r.json();
      if (d.success) {
        alert(`✓ ${d.message} (Session: ${d.session_no})`);
        loadTrays();
        loadKpis();
      }
    } catch { /* silent */ }
  };

  // Instant Tag / SKU Lookup
  const handleLookup = async () => {
    if (!lookupQuery.trim()) return;
    setLookupError("");
    setLookupResult(null);
    try {
      const r = await fetch(`${API}/rfid/lookup/${encodeURIComponent(lookupQuery.trim())}`, {
        headers: authHeaders(),
      });
      const d = await r.json();
      if (d.success) {
        setLookupResult(d.data);
      } else {
        setLookupError(d.message || "Item not found");
      }
    } catch {
      setLookupError("Error connecting to RFID service");
    }
  };

  // Pair RFID Tag
  const handlePairTag = async (e) => {
    e.preventDefault();
    if (!encodingForm.rfid_epc || !encodingForm.product_id) return;
    setEncodingSuccess("");
    try {
      const r = await fetch(`${API}/rfid/pair-tag`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(encodingForm),
      });
      const d = await r.json();
      if (d.success) {
        setEncodingSuccess(`✓ ${d.message}`);
        loadKpis();
        loadUnassignedProducts();
      }
    } catch { /* silent */ }
  };

  // ── 3. REAL-TIME RFID RECONCILIATION ENGINE ─────────────────────────────────

  const handleStartAuditForTray = (tray) => {
    setAuditTrayId(tray.id);
    setSelectedTray(tray);
    setAuditResult(null);
    setScannedTagsText("");
    setTab("scanner");
  };

  // Simulate hardware RFID Reader Pad scan
  const handleSimulateScan = async (scenario = "100_MATCH") => {
    if (!auditTrayId) {
      alert("Please select a target Tray first!");
      return;
    }
    setAuditRunning(true);
    setAuditResult(null);

    try {
      // 1. Fetch expected items for this tray
      const trRes = await fetch(`${API}/rfid/trays/${auditTrayId}`, { headers: authHeaders() });
      const trData = await trRes.json();
      const items = trData.data?.items || [];

      let epcList = items.map((i) => i.rfid_epc || i.sku).filter(Boolean);

      if (scenario === "MISSING_ONE" && epcList.length > 0) {
        // Remove 1 item to simulate theft or misplaced item
        epcList = epcList.slice(1);
      } else if (scenario === "MISPLACED_FOREIGN") {
        // Add an item from a different tray / counter
        const [otherProd] = unassignedProducts.filter((p) => !items.some((it) => it.product_id === p.id));
        if (otherProd) {
          epcList.push(`EPC-${otherProd.sku ? otherProd.sku.replace(/[^A-Za-z0-9]/g, "") : "PRD"}-${otherProd.id}`);
        } else {
          epcList.push("EPC-FOREIGN-DIAMOND-999");
        }
      }

      setScannedTagsText(epcList.join("\n"));

      // Process scan immediately
      const r = await fetch(`${API}/rfid/audit/process-scan`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          tray_id: auditTrayId,
          scanned_epcs: epcList,
          audit_type: auditType,
          remarks: auditorRemarks || `Simulated Reader Pad Scan (${scenario})`,
        }),
      });

      const d = await r.json();
      if (d.success) {
        setAuditResult(d.data);
        loadKpis();
        loadTrays();
      }
    } catch { /* silent */ } finally {
      setAuditRunning(false);
    }
  };

  // Manual / Hardware Gun Stream Execute
  const handleExecuteRealScan = async () => {
    if (!auditTrayId) {
      alert("Please select a target Tray first!");
      return;
    }
    const lines = scannedTagsText
      .split(/[\n,\r\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setAuditRunning(true);
    setAuditResult(null);

    try {
      const r = await fetch(`${API}/rfid/audit/process-scan`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          tray_id: auditTrayId,
          scanned_epcs: lines,
          audit_type: auditType,
          remarks: auditorRemarks || "Hardware RFID Gun Scan",
        }),
      });

      const d = await r.json();
      if (d.success) {
        setAuditResult(d.data);
        loadKpis();
        loadTrays();
      }
    } catch { /* silent */ } finally {
      setAuditRunning(false);
    }
  };

  // Filtered Trays for Showcase View
  const filteredTrays = useMemo(() => {
    return trays.filter((t) => {
      if (counterFilter !== "All" && t.counter !== counterFilter) return false;
      if (searchFilter) {
        const s = searchFilter.toLowerCase();
        return (
          t.name?.toLowerCase().includes(s) ||
          t.tray_code?.toLowerCase().includes(s) ||
          t.category?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [trays, counterFilter, searchFilter]);

  // Selected tray for slot matrix
  const currentSlotTray = useMemo(() => {
    return trays.find((t) => String(t.id) === String(selectedTray?.id || auditTrayId)) || trays[0];
  }, [trays, selectedTray, auditTrayId]);

  return (
    <div>
      {/* ── Page Header with Day Opening/Closing Master Controls ── */}
      <PageHeader
        title="RFID & Showcase Tray Audit"
        subtitle="UHF Gen-2 RFID Scanner · Showcase vs Vault Reconciler · Instant Misplaced & Missing Discrepancy Detection"
        t={t}
        actions={
          <>
            <BtnOutline
              t={t}
              onClick={() => {
                setLookupQuery("");
                setLookupResult(null);
                setLookupError("");
                setLookupModal(true);
              }}
            >
              Scan Tag / Gun Search
            </BtnOutline>
            <BtnOutline
              t={t}
              style={{ borderColor: "#2ecc71", color: "#2ecc71" }}
              onClick={() => handleBulkTransfer("In Showcase")}
            >
              Day Opening (All to Showcase)
            </BtnOutline>
            <BtnOutline
              t={t}
              style={{ borderColor: BRAND.pink, color: BRAND.pink }}
              onClick={() => handleBulkTransfer("In Vault")}
            >
              Day Closing (All to Vault)
            </BtnOutline>
            <BtnPrimary onClick={() => setNewTrayModal(true)}>+ New Tray</BtnPrimary>
          </>
        }
      />

      {/* ── 1. KPI Cards Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <StatCard
          label="Active Showcase Trays"
          value={`${kpis.showcase_trays || 0} / ${kpis.active_trays || 0}`}
          color={BRAND.blue}
          t={t}
        />
        <StatCard
          label="RFID Tagged Items"
          value={kpis.total_tagged || 0}
          color="#2ecc71"
          t={t}
        />
        <StatCard
          label="On Display Valuation"
          value={fmt(kpis.total_valuation)}
          color={BRAND.purple}
          t={t}
        />
        <StatCard
          label="Today's Audits"
          value={kpis.audits_today || 0}
          color="#3498db"
          t={t}
        />
        <StatCard
          label="Missing Discrepancies"
          value={kpis.missing_items_today || 0}
          color={kpis.missing_items_today > 0 ? BRAND.pink : "#2ecc71"}
          t={t}
        />
      </div>

      {/* ── 2. Navigation Tabs ── */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: SHOWCASE & TRAY GRID (LIVE FLOOR VIEW)                               */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "showcase" && (
        <div>
          {/* Floor & Counter Filters */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COUNTERS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCounterFilter(c)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    background: counterFilter === c ? BRAND.gradBtn : t.card,
                    color: counterFilter === c ? "#fff" : t.textSub,
                    border: counterFilter === c ? "none" : `1px solid ${t.borderDash}`,
                    boxShadow: counterFilter === c ? "0 2px 8px rgba(59,85,230,0.25)" : "none",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Search Tray, SKU, Category..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  background: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  borderRadius: 9,
                  padding: "7px 12px",
                  fontSize: 13,
                  color: t.inputColor,
                  outline: "none",
                  width: 220,
                  fontFamily: "inherit",
                }}
              />
              <BtnSm t={t} onClick={loadTrays}>
                Refresh
              </BtnSm>
            </div>
          </div>

          {/* Tray Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {filteredTrays.map((tray) => {
              const count = Number(tray.current_items || 0);
              const cap = Number(tray.capacity || 24);
              const pct = Math.min(100, Math.round((count / cap) * 100));
              const isVault = tray.status === "In Vault";

              return (
                <div
                  key={tray.id}
                  style={{
                    background: t.card,
                    border: `1px solid ${isVault ? "rgba(139,59,200,0.3)" : t.border}`,
                    borderRadius: 14,
                    padding: 18,
                    boxShadow: t.cardShadow,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                  }}
                >
                  {/* Tray Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.blue, letterSpacing: "0.5px" }}>
                        {tray.tray_code} · {tray.counter}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginTop: 2 }}>
                        {tray.name}
                      </div>
                    </div>
                    <span
                      style={{
                        background: isVault ? "rgba(139,59,200,0.12)" : "rgba(46,204,113,0.12)",
                        color: isVault ? BRAND.purple : "#2ecc71",
                        border: `1px solid ${isVault ? "rgba(139,59,200,0.3)" : "rgba(46,204,113,0.3)"}`,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {isVault ? "In Vault" : "Showcase"}
                    </span>
                  </div>

                  {/* Category Tag */}
                  <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 14 }}>
                    {tray.category}
                  </div>

                  {/* Capacity Bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: t.textSub }}>Capacity & Occupancy</span>
                      <span style={{ fontWeight: 700, color: count >= cap ? BRAND.pink : BRAND.blue }}>
                        {count} / {cap} slots ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: t.borderDash, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: count >= cap ? BRAND.pink : BRAND.gradBtn,
                          borderRadius: 3,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Weight & Value Metrics */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      background: t.card2 || t.card,
                      border: `1px solid ${t.borderDash}`,
                      borderRadius: 9,
                      padding: "10px 12px",
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase" }}>Gross Weight</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                        {Number(tray.total_weight_g || 0).toFixed(3)} g
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase" }}>Total Valuation</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2ecc71" }}>
                        {fmt(tray.total_valuation)}
                      </div>
                    </div>
                  </div>

                  {/* Tray Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <BtnPrimary
                      style={{ flex: 1, padding: "7px 10px", fontSize: 12 }}
                      onClick={() => handleStartAuditForTray(tray)}
                    >
                      Audit Tray
                    </BtnPrimary>
                    <BtnOutline
                      t={t}
                      style={{ padding: "7px 10px", fontSize: 12 }}
                      onClick={() => {
                        setSelectedTray(tray);
                        fetchTrayDetails(tray.id);
                        setTrayDetailModal(true);
                      }}
                    >
                      Items ({count})
                    </BtnOutline>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: REAL-TIME RFID SCANNER & 3-WAY RECONCILER                            */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "scanner" && (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 18 }}>
          {/* Left: Scan Controller Panel */}
          <div>
            <Card t={t} style={{ marginBottom: 16 }}>
              <CardHeader title="RFID Audit Controller" t={t} />

              <FormGroup label="1. Select Target Showcase Tray *" t={t}>
                <Select
                  t={t}
                  value={auditTrayId}
                  onChange={(e) => {
                    setAuditTrayId(e.target.value);
                    setAuditResult(null);
                  }}
                >
                  <option value="">-- Choose Tray to Audit --</option>
                  {trays.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.tray_code} — {tr.name} ({tr.current_items || 0} items)
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup label="2. Audit Session Type" t={t}>
                <Select t={t} value={auditType} onChange={(e) => setAuditType(e.target.value)}>
                  <option value="TRAY_AUDIT">Single Tray Spot Check</option>
                  <option value="DAY_OPENING">Morning Day Opening Audit</option>
                  <option value="DAY_CLOSING">Evening Day Closing Audit</option>
                  <option value="COUNTER_AUDIT">Counter Showcase Audit</option>
                </Select>
              </FormGroup>

              <FormGroup label="3. Hardware Gun / Reader Scan Stream" t={t}>
                <textarea
                  ref={scanInputRef}
                  rows={5}
                  placeholder="Scan tags with RFID handheld gun or paste EPC codes (one per line)..."
                  value={scannedTagsText}
                  onChange={(e) => setScannedTagsText(e.target.value)}
                  style={{
                    width: "100%",
                    background: t.inputBg,
                    border: `1.5px solid ${t.inputBorder}`,
                    borderRadius: 9,
                    padding: "10px 12px",
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: t.inputColor,
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </FormGroup>

              <FormGroup label="Auditor Remarks" t={t}>
                <Input
                  t={t}
                  placeholder="e.g. Regular 2 PM spot check on Counter 1"
                  value={auditorRemarks}
                  onChange={(e) => setAuditorRemarks(e.target.value)}
                />
              </FormGroup>

              {/* Hardware Scanner & Simulation Triggers */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                <BtnPrimary
                  onClick={handleExecuteRealScan}
                  disabled={auditRunning || !auditTrayId}
                  style={{ width: "100%" }}
                >
                  {auditRunning ? "Scanning & Reconciling..." : "Execute RFID Verification"}
                </BtnPrimary>

                <div style={{ textAlign: "center", fontSize: 11, color: t.textMuted, margin: "4px 0" }}>
                  — OR SIMULATE RFID PAD SCAN —
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <BtnOutline
                    t={t}
                    style={{ fontSize: 11, borderColor: "#2ecc71", color: "#2ecc71" }}
                    onClick={() => handleSimulateScan("100_MATCH")}
                    disabled={auditRunning || !auditTrayId}
                  >
                    100% Match
                  </BtnOutline>
                  <BtnOutline
                    t={t}
                    style={{ fontSize: 11, borderColor: BRAND.pink, color: BRAND.pink }}
                    onClick={() => handleSimulateScan("MISSING_ONE")}
                    disabled={auditRunning || !auditTrayId}
                  >
                    1 Missing Tag
                  </BtnOutline>
                </div>
                <BtnOutline
                  t={t}
                  style={{ fontSize: 11, borderColor: "#f39c12", color: "#f39c12" }}
                  onClick={() => handleSimulateScan("MISPLACED_FOREIGN")}
                  disabled={auditRunning || !auditTrayId}
                >
                  Misplaced Foreign Item
                </BtnOutline>
              </div>
            </Card>
          </div>

          {/* Right: Real-Time 3-Way Reconciliation Results */}
          <div>
            {!auditResult ? (
              <Card t={t} style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>
                  Ready to Reconcile Tray
                </div>
                <div style={{ fontSize: 13, color: t.textSub, maxWidth: 420, margin: "0 auto" }}>
                  Select a tray on the left and scan tags using your RFID reader gun or click <strong>1-Click Simulate</strong> to see live instant verification.
                </div>
              </Card>
            ) : (
              <div>
                {/* Audit Result Status Banner */}
                <div
                  style={{
                    background: auditResult.is_clean_audit
                      ? "rgba(46,204,113,0.12)"
                      : "rgba(230,59,138,0.12)",
                    border: `1.5px solid ${auditResult.is_clean_audit ? "#2ecc71" : BRAND.pink}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: auditResult.is_clean_audit ? "#2ecc71" : BRAND.pink,
                      }}
                    >
                      {auditResult.is_clean_audit
                        ? "TRAY AUDIT PASSED: 100% VERIFIED"
                        : "DISCREPANCY DETECTED IN TRAY"}
                    </div>
                    <div style={{ fontSize: 12, color: t.textSub, marginTop: 3 }}>
                      Session #{auditResult.session_no} · {auditResult.tray?.name}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                      {auditResult.is_clean_audit ? "All items present" : `${auditResult.missing_items?.length || 0} missing`}
                    </div>
                  </div>
                </div>

                {/* 3 Result Sections: Matched, Missing, Misplaced */}

                {/* 1. Missing Items (Alert Priority) */}
                {auditResult.missing_items?.length > 0 && (
                  <Card t={t} style={{ border: `1.5px solid ${BRAND.pink}`, marginBottom: 16 }}>
                    <CardHeader
                      title={`Missing Items (${auditResult.missing_items.length})`}
                      t={t}
                      actions={
                        <span style={{ color: BRAND.pink, fontWeight: 700, fontSize: 12 }}>
                          Missing Value: {fmt(auditResult.summary?.missing_valuation)}
                        </span>
                      }
                    />
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: BRAND.pink }}>SKU / HUID</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: BRAND.pink }}>Item Description</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: BRAND.pink }}>Category</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", color: BRAND.pink }}>Weight</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", color: BRAND.pink }}>MRP Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditResult.missing_items.map((it) => (
                            <tr key={it.product_id} style={{ borderBottom: `1px solid ${t.borderDash}`, background: "rgba(230,59,138,0.04)" }}>
                              <td style={{ padding: "9px 10px", fontWeight: 700, color: t.text }}>
                                {it.sku} {it.huid ? `(${it.huid})` : ""}
                              </td>
                              <td style={{ padding: "9px 10px", color: t.textSub }}>{it.name}</td>
                              <td style={{ padding: "9px 10px", color: t.textMuted }}>{it.jewellery_category}</td>
                              <td style={{ padding: "9px 10px", textAlign: "right", color: t.text }}>{it.gross_weight}g</td>
                              <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: BRAND.pink }}>{fmt(it.mrp)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* 2. Misplaced Foreign Items */}
                {auditResult.misplaced_items?.length > 0 && (
                  <Card t={t} style={{ border: "1.5px solid #f39c12", marginBottom: 16 }}>
                    <CardHeader
                      title={`🟡 Misplaced / Foreign Items Detected (${auditResult.misplaced_items.length})`}
                      t={t}
                    />
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: "#f39c12" }}>SKU</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: "#f39c12" }}>Item Name</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: "#f39c12" }}>Correct Assigned Location</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", color: "#f39c12" }}>Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditResult.misplaced_items.map((it) => (
                            <tr key={it.product_id} style={{ borderBottom: `1px solid ${t.borderDash}`, background: "rgba(243,156,18,0.04)" }}>
                              <td style={{ padding: "9px 10px", fontWeight: 700, color: t.text }}>{it.sku}</td>
                              <td style={{ padding: "9px 10px", color: t.textSub }}>{it.name}</td>
                              <td style={{ padding: "9px 10px", fontWeight: 700, color: "#f39c12" }}>
                                ➜ {it.expected_tray_name} ({it.expected_counter})
                              </td>
                              <td style={{ padding: "9px 10px", textAlign: "right", color: t.text }}>{it.gross_weight}g</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* 3. Matched & Verified Items */}
                <Card t={t}>
                  <CardHeader
                    title={`Matched & Verified Items (${auditResult.matched_items?.length || 0})`}
                    t={t}
                  />
                  {auditResult.matched_items?.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: t.textMuted, fontSize: 13 }}>
                      No items matched.
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>SKU</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>Item Name</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>Purity</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", color: t.textMuted }}>Weight</th>
                            <th style={{ padding: "8px 10px", textAlign: "right", color: t.textMuted }}>Valuation</th>
                            <th style={{ padding: "8px 10px", textAlign: "center", color: t.textMuted }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditResult.matched_items.map((it) => (
                            <tr key={it.product_id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                              <td style={{ padding: "9px 10px", fontWeight: 600, color: BRAND.blue }}>{it.sku}</td>
                              <td style={{ padding: "9px 10px", color: t.text }}>{it.name}</td>
                              <td style={{ padding: "9px 10px", color: t.textSub }}>{it.purity || "22K"}</td>
                              <td style={{ padding: "9px 10px", textAlign: "right", color: t.text }}>{it.gross_weight}g</td>
                              <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 600, color: "#2ecc71" }}>
                                {fmt(it.mrp)}
                              </td>
                              <td style={{ padding: "9px 10px", textAlign: "center", color: "#2ecc71", fontWeight: 700 }}>
                                OK
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: TRAY SLOT MATRIX & ALLOCATION                                        */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "slots" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Select Tray:</span>
              <Select
                t={t}
                value={selectedTray?.id || trays[0]?.id || ""}
                onChange={(e) => {
                  const tr = trays.find((t) => String(t.id) === e.target.value);
                  setSelectedTray(tr);
                  if (tr) fetchTrayDetails(tr.id);
                }}
                style={{ width: 300 }}
              >
                {trays.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.tray_code} — {tr.name} ({tr.current_items || 0} / {tr.capacity} slots)
                  </option>
                ))}
              </Select>
            </div>

            <BtnPrimary
              onClick={() => {
                if (currentSlotTray) {
                  fetchTrayDetails(currentSlotTray.id);
                  setAssignModal(true);
                }
              }}
            >
              + Assign Jewelry to Tray
            </BtnPrimary>
          </div>

          {/* Velvet Tray Grid Representation */}
          <Card t={t}>
            <CardHeader
              title={`${currentSlotTray?.name || "Showcase Tray"} (${currentSlotTray?.capacity || 24} Slots Layout)`}
              t={t}
              actions={
                <span style={{ fontSize: 12, color: t.textSub }}>
                  Location: <strong>{currentSlotTray?.counter}</strong> · Status: <strong>{currentSlotTray?.status}</strong>
                </span>
              }
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: 12,
                padding: "8px 0",
              }}
            >
              {Array.from({ length: currentSlotTray?.capacity || 24 }).map((_, idx) => {
                const slotNo = idx + 1;
                const item = selectedTrayData?.items?.find((it) => it.slot_no === slotNo) || selectedTrayData?.items?.[idx];

                return (
                  <div
                    key={slotNo}
                    style={{
                      background: item ? (t.card2 || t.card) : "rgba(139,59,200,0.03)",
                      border: `1.5px dashed ${item ? BRAND.blue : t.borderDash}`,
                      borderRadius: 10,
                      padding: 12,
                      minHeight: 110,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.textMuted }}>
                        Slot #{slotNo}
                      </span>
                      {item && (
                        <span style={{ fontSize: 10, color: "#2ecc71", fontWeight: 700 }}>
                          ● Placed
                        </span>
                      )}
                    </div>

                    {item ? (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 10, color: BRAND.blue, fontWeight: 600 }}>
                          {item.sku}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#2ecc71", marginTop: 2 }}>
                          {fmt(item.mrp)}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", color: t.textFaint, fontSize: 11, margin: "auto 0" }}>
                        Empty Slot
                      </div>
                    )}

                    {item && (
                      <button
                        onClick={async () => {
                          if (window.confirm(`Remove ${item.name} from slot #${slotNo}?`)) {
                            await fetch(`${API}/rfid/trays/${currentSlotTray.id}/remove`, {
                              method: "POST",
                              headers: authHeaders(),
                              body: JSON.stringify({ product_id: item.product_id }),
                            });
                            fetchTrayDetails(currentSlotTray.id);
                            loadTrays();
                          }
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: BRAND.pink,
                          fontSize: 10,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textAlign: "right",
                          padding: 0,
                        }}
                      >
                        Remove ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: RFID TAG ENCODING & PAIRING                                          */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "encoding" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* Pair Tag Form */}
          <Card t={t}>
            <CardHeader title="Encode & Pair RFID Jewelry Tag" t={t} />

            {encodingSuccess && (
              <div
                style={{
                  background: "rgba(46,204,113,0.12)",
                  color: "#2ecc71",
                  border: "1px solid rgba(46,204,113,0.3)",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 14,
                  fontWeight: 600,
                }}
              >
                {encodingSuccess}
              </div>
            )}

            <form onSubmit={handlePairTag}>
              <FormGroup label="Select Product to Tag *" t={t}>
                <Select
                  t={t}
                  value={encodingForm.product_id}
                  onChange={(e) => {
                    const p = unassignedProducts.find((it) => String(it.id) === e.target.value);
                    setEncodingForm({
                      ...encodingForm,
                      product_id: e.target.value,
                      sku: p?.sku || "",
                      huid: p?.huid || "",
                      rfid_epc: p ? `EPC-${p.sku ? p.sku.replace(/[^A-Za-z0-9]/g, "") : "PRD"}-${p.id}`.toUpperCase() : "",
                    });
                  }}
                >
                  <option value="">-- Choose Showroom Inventory Product --</option>
                  {unassignedProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name} ({p.purity || "22K"}, {p.gross_weight}g)
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGrid>
                <FormGroup label="RFID EPC Hex Tag *" t={t} half>
                  <Input
                    t={t}
                    placeholder="e.g. EPC-NK-GOLD-001"
                    value={encodingForm.rfid_epc}
                    onChange={(e) => setEncodingForm({ ...encodingForm, rfid_epc: e.target.value })}
                  />
                </FormGroup>
                <FormGroup label="Tag Type" t={t} half>
                  <Select
                    t={t}
                    value={encodingForm.tag_type}
                    onChange={(e) => setEncodingForm({ ...encodingForm, tag_type: e.target.value })}
                  >
                    <option value="JEWELRY_TAG">UHF Jewelry Flag Tag (Gen 2)</option>
                    <option value="TRAY_TAG">Showcase Tray Tag</option>
                    <option value="BOX_TAG">Vault Box Tag</option>
                  </Select>
                </FormGroup>
              </FormGrid>

              <FormGrid>
                <FormGroup label="SKU Code" t={t} half>
                  <Input t={t} value={encodingForm.sku} readOnly />
                </FormGroup>
                <FormGroup label="BIS HUID Number" t={t} half>
                  <Input t={t} value={encodingForm.huid || "—"} readOnly />
                </FormGroup>
              </FormGrid>

              <BtnPrimary type="submit" style={{ width: "100%", marginTop: 8 }}>
                Encode & Save Tag Pairing
              </BtnPrimary>
            </form>
          </Card>

          {/* Printable Tag Preview */}
          <Card t={t}>
            <CardHeader title="RFID Jewelry Hangtag Preview" t={t} />
            <div
              style={{
                background: "#ffffff",
                color: "#111",
                border: "2px solid #ddd",
                borderRadius: 8,
                padding: "16px 20px",
                width: 260,
                margin: "20px auto",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                fontFamily: "monospace",
              }}
            >
              <div style={{ textAlign: "center", fontWeight: 800, fontSize: 13, letterSpacing: "1px", color: BRAND.purple }}>
                CERITAGE JEWELS
              </div>
              <hr style={{ border: "0.5px solid #eee", margin: "8px 0" }} />
              <div style={{ fontSize: 11, marginBottom: 3 }}>
                <strong>SKU:</strong> {encodingForm.sku || "NK-GOLD-22K-001"}
              </div>
              <div style={{ fontSize: 11, marginBottom: 3 }}>
                <strong>HUID:</strong> {encodingForm.huid || "KG8821"}
              </div>
              <div style={{ fontSize: 11, marginBottom: 3 }}>
                <strong>RFID EPC:</strong> {encodingForm.rfid_epc || "EPC-GOLD-NK-001"}
              </div>
              <div style={{ fontSize: 10, color: "#666", marginTop: 8, textAlign: "center" }}>
                |||||||||||||||||||||||||||||||||||||||||||||
              </div>
              <div style={{ fontSize: 9, textAlign: "center", color: "#888", marginTop: 4 }}>
                UHF RFID 865-868 MHz ISO 18000-6C
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: AUDIT LOGS & DISCREPANCY HISTORY                                     */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "history" && (
        <Card t={t}>
          <CardHeader
            title="Showroom Audit Session History"
            t={t}
            actions={
              <BtnSm t={t} onClick={loadHistory}>
                Refresh Logs
              </BtnSm>
            }
          />
          {historyList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: t.textMuted, fontSize: 13 }}>
              No audit sessions recorded yet. Run a Tray Audit to see history.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Session No</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Date & Time</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Tray / Counter</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: t.textMuted }}>Audit Type</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Verified / Expected</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Missing</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Misplaced</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", color: t.textMuted }}>Result</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: t.textMuted }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((h) => {
                    const isClean = h.missing_count === 0 && h.misplaced_count === 0;
                    return (
                      <tr key={h.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>
                          {h.session_no}
                        </td>
                        <td style={{ padding: "10px 12px", color: t.textSub }}>{fmtDate(h.created_at)}</td>
                        <td style={{ padding: "10px 12px", color: t.text, fontWeight: 600 }}>
                          {h.tray_name || h.tray_code || "Showroom Trays"}
                        </td>
                        <td style={{ padding: "10px 12px", color: t.textMuted }}>{h.audit_type}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: t.text }}>
                          {h.matched_count} / {h.expected_count}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            textAlign: "center",
                            fontWeight: 700,
                            color: h.missing_count > 0 ? BRAND.pink : t.textMuted,
                          }}
                        >
                          {h.missing_count}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            textAlign: "center",
                            fontWeight: 700,
                            color: h.misplaced_count > 0 ? "#f39c12" : t.textMuted,
                          }}
                        >
                          {h.misplaced_count}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span
                            style={{
                              background: isClean ? "rgba(46,204,113,0.12)" : "rgba(230,59,138,0.12)",
                              color: isClean ? "#2ecc71" : BRAND.pink,
                              border: `1px solid ${isClean ? "rgba(46,204,113,0.3)" : "rgba(230,59,138,0.3)"}`,
                              borderRadius: 12,
                              padding: "2px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {isClean ? "PASS" : "ALERT"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <BtnSm
                            t={t}
                            onClick={async () => {
                              const r = await fetch(`${API}/rfid/audit/${h.id}`, { headers: authHeaders() });
                              const d = await r.json();
                              if (d.success) {
                                setSelectedSessionData(d.data);
                                setSessionDetailModal(true);
                              }
                            }}
                          >
                            Drilldown
                          </BtnSm>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE NEW SHOWCASE TRAY                                             */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={newTrayModal}
        onClose={() => setNewTrayModal(false)}
        title="Add New Showcase Display Tray"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setNewTrayModal(false)}>
              Cancel
            </BtnOutline>
            <BtnPrimary onClick={handleCreateTray}>Create Tray</BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Tray Code *" t={t} half>
            <Input
              t={t}
              placeholder="e.g. TRAY-D1"
              value={newTrayForm.tray_code}
              onChange={(e) => setNewTrayForm({ ...newTrayForm, tray_code: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Tray Name *" t={t} half>
            <Input
              t={t}
              placeholder="e.g. Bridal Kundan Bangles Tray"
              value={newTrayForm.name}
              onChange={(e) => setNewTrayForm({ ...newTrayForm, name: e.target.value })}
            />
          </FormGroup>
        </FormGrid>

        <FormGrid>
          <FormGroup label="Category *" t={t} half>
            <Select
              t={t}
              value={newTrayForm.category}
              onChange={(e) => setNewTrayForm({ ...newTrayForm, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Showroom Counter / Zone" t={t} half>
            <Select
              t={t}
              value={newTrayForm.counter}
              onChange={(e) => setNewTrayForm({ ...newTrayForm, counter: e.target.value })}
            >
              <option>Counter 1</option>
              <option>Counter 2</option>
              <option>Counter 3</option>
              <option>Vault</option>
            </Select>
          </FormGroup>
        </FormGrid>

        <FormGrid>
          <FormGroup label="Capacity (Slots)" t={t} half>
            <Input
              t={t}
              type="number"
              value={newTrayForm.capacity}
              onChange={(e) => setNewTrayForm({ ...newTrayForm, capacity: Number(e.target.value) })}
            />
          </FormGroup>
          <FormGroup label="Tray RFID Tag ID (Optional)" t={t} half>
            <Input
              t={t}
              placeholder="e.g. EPC-TRAY-D1"
              value={newTrayForm.rfid_tag_id}
              onChange={(e) => setNewTrayForm({ ...newTrayForm, rfid_tag_id: e.target.value })}
            />
          </FormGroup>
        </FormGrid>

        <FormGroup label="Location Notes" t={t}>
          <Input
            t={t}
            placeholder="e.g. Right corner of Main Showcase Counter 1"
            value={newTrayForm.notes}
            onChange={(e) => setNewTrayForm({ ...newTrayForm, notes: e.target.value })}
          />
        </FormGroup>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: TRAY DETAILS & ITEMS LIST                                            */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={trayDetailModal}
        onClose={() => setTrayDetailModal(false)}
        title={`Tray Items — ${selectedTrayData?.tray?.name || ""}`}
        t={t}
        wide
        footer={
          <BtnOutline t={t} onClick={() => setTrayDetailModal(false)}>
            Close
          </BtnOutline>
        }
      >
        <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 13, color: t.textSub }}>
              Counter: <strong>{selectedTrayData?.tray?.counter}</strong> · Capacity:{" "}
              <strong>
                {selectedTrayData?.items?.length || 0} / {selectedTrayData?.tray?.capacity}
              </strong>
            </span>
          </div>
          <BtnPrimary
            style={{ fontSize: 12, padding: "6px 12px" }}
            onClick={() => {
              setTrayDetailModal(false);
              handleStartAuditForTray(selectedTrayData.tray);
            }}
          >
            Audit This Tray Now
          </BtnPrimary>
        </div>

        <div style={{ overflowX: "auto", maxHeight: 360 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>Slot</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>SKU</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>Product Name</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>HUID</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>RFID EPC</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: t.textMuted }}>Gross Wt</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: t.textMuted }}>MRP</th>
              </tr>
            </thead>
            <tbody>
              {selectedTrayData?.items?.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: "center", color: t.textMuted }}>
                    No items in this tray.
                  </td>
                </tr>
              ) : (
                selectedTrayData?.items?.map((it) => (
                  <tr key={it.product_id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: BRAND.purple }}>#{it.slot_no}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 600, color: BRAND.blue }}>{it.sku}</td>
                    <td style={{ padding: "8px 10px", color: t.text }}>{it.name}</td>
                    <td style={{ padding: "8px 10px", fontFamily: "monospace", color: t.textSub }}>{it.huid || "—"}</td>
                    <td style={{ padding: "8px 10px", fontFamily: "monospace", color: t.textMuted, fontSize: 11 }}>
                      {it.rfid_epc || "—"}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: t.text }}>{it.gross_weight}g</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#2ecc71" }}>
                      {fmt(it.mrp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ASSIGN PRODUCTS TO TRAY                                              */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title={`Assign Products to ${currentSlotTray?.name}`}
        t={t}
        wide
        footer={
          <BtnOutline t={t} onClick={() => setAssignModal(false)}>
            Close
          </BtnOutline>
        }
      >
        <div style={{ fontSize: 13, color: t.textSub, marginBottom: 12 }}>
          Click <strong>[+ Place in Tray]</strong> to assign any showroom jewelry item to an open slot in this tray:
        </div>

        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>SKU</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>Product Name</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>Category</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: t.textMuted }}>Weight</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: t.textMuted }}>MRP</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: t.textMuted }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {unassignedProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600, color: BRAND.blue }}>{p.sku}</td>
                  <td style={{ padding: "8px 10px", color: t.text }}>{p.name}</td>
                  <td style={{ padding: "8px 10px", color: t.textSub }}>{p.jewellery_category}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: t.text }}>{p.gross_weight}g</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: "#2ecc71", fontWeight: 600 }}>
                    {fmt(p.mrp)}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>
                    <BtnSm
                      t={t}
                      primary
                      onClick={async () => {
                        await fetch(`${API}/rfid/trays/${currentSlotTray.id}/assign`, {
                          method: "POST",
                          headers: authHeaders(),
                          body: JSON.stringify({ product_ids: [p.id] }),
                        });
                        fetchTrayDetails(currentSlotTray.id);
                        loadTrays();
                        loadKpis();
                        alert(`✓ ${p.name} placed into ${currentSlotTray.name}`);
                      }}
                    >
                      + Place in Tray
                    </BtnSm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: RFID HANDHELD GUN LOOKUP                                             */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={lookupModal}
        onClose={() => setLookupModal(false)}
        title="RFID Handheld Gun / Tag Lookup"
        t={t}
        footer={
          <BtnOutline t={t} onClick={() => setLookupModal(false)}>
            Close
          </BtnOutline>
        }
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Input
            t={t}
            placeholder="Scan RFID EPC Tag or enter SKU / HUID..."
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          />
          <BtnPrimary onClick={handleLookup}>Lookup</BtnPrimary>
        </div>

        {lookupError && (
          <div style={{ color: BRAND.pink, fontSize: 13, padding: "8px 0" }}>{lookupError}</div>
        )}

        {lookupResult && (
          <div
            style={{
              background: t.card2 || t.card,
              border: `1px solid ${BRAND.blue}44`,
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{lookupResult.name}</div>
                <div style={{ fontSize: 12, color: BRAND.blue, fontWeight: 700, marginTop: 2 }}>
                  SKU: {lookupResult.sku} · HUID: {lookupResult.huid || "—"}
                </div>
              </div>
              <span
                style={{
                  background: "rgba(46,204,113,0.15)",
                  color: "#2ecc71",
                  borderRadius: 12,
                  padding: "3px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {lookupResult.tray_status || "In Showcase"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginTop: 12 }}>
              <div>
                <span style={{ color: t.textMuted }}>Current Location:</span>
                <div style={{ fontWeight: 700, color: t.text, marginTop: 2 }}>
                  {lookupResult.tray_name ? `➜ ${lookupResult.tray_name} (${lookupResult.tray_counter})` : "Unassigned / Vault"}
                </div>
              </div>
              <div>
                <span style={{ color: t.textMuted }}>Gross Weight:</span>
                <div style={{ fontWeight: 700, color: t.text, marginTop: 2 }}>
                  {lookupResult.gross_weight} g ({lookupResult.purity || "22K"})
                </div>
              </div>
              <div>
                <span style={{ color: t.textMuted }}>RFID EPC Tag:</span>
                <div style={{ fontWeight: 700, fontFamily: "monospace", color: BRAND.purple, marginTop: 2 }}>
                  {lookupResult.rfid_epc || "—"}
                </div>
              </div>
              <div>
                <span style={{ color: t.textMuted }}>MRP Valuation:</span>
                <div style={{ fontWeight: 800, color: "#2ecc71", marginTop: 2 }}>
                  {fmt(lookupResult.mrp)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: HISTORICAL AUDIT SESSION DRILLDOWN                                   */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={sessionDetailModal}
        onClose={() => setSessionDetailModal(false)}
        title={`Audit Breakdown — ${selectedSessionData?.session?.session_no || ""}`}
        t={t}
        wide
        footer={
          <BtnOutline t={t} onClick={() => setSessionDetailModal(false)}>
            Close
          </BtnOutline>
        }
      >
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: t.textSub }}>
            Auditor: <strong>{selectedSessionData?.session?.auditor_name}</strong> · Date:{" "}
            <strong>{fmtDate(selectedSessionData?.session?.created_at)}</strong> · Tray:{" "}
            <strong>{selectedSessionData?.session?.tray_name}</strong>
          </span>
        </div>

        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>SKU</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>Item Name</th>
                <th style={{ padding: "8px 10px", textAlign: "left", color: t.textMuted }}>Category</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: t.textMuted }}>Weight</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: t.textMuted }}>MRP</th>
                <th style={{ padding: "8px 10px", textAlign: "center", color: t.textMuted }}>Audit Result</th>
              </tr>
            </thead>
            <tbody>
              {selectedSessionData?.items?.map((it) => (
                <tr key={it.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600, color: BRAND.blue }}>{it.sku}</td>
                  <td style={{ padding: "8px 10px", color: t.text }}>{it.item_name}</td>
                  <td style={{ padding: "8px 10px", color: t.textSub }}>{it.category}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: t.text }}>{it.gross_weight}g</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: "#2ecc71", fontWeight: 600 }}>
                    {fmt(it.mrp)}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <span
                      style={{
                        background:
                          it.result === "MATCHED"
                            ? "rgba(46,204,113,0.12)"
                            : it.result === "MISSING"
                            ? "rgba(230,59,138,0.12)"
                            : "rgba(243,156,18,0.12)",
                        color:
                          it.result === "MATCHED"
                            ? "#2ecc71"
                            : it.result === "MISSING"
                            ? BRAND.pink
                            : "#f39c12",
                        borderRadius: 10,
                        padding: "2px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {it.result === "MATCHED"
                        ? "Matched"
                        : it.result === "MISSING"
                        ? "Missing"
                        : "Misplaced"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
