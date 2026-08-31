﻿import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Card, CardHeader, StatCard, BtnPrimary, BtnOutline, BtnSm } from "../../components/ui";

const API = "http://localhost:5000/api";
function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}
function fmt(n) { return n != null ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0 }) : "₹0"; }

// Tray config — jeweller sets these up
const TRAY_CONFIG = [
  { id: "A1", name: "Tray A1", category: "Gold Jewellery",     counter: "Counter 1" },
  { id: "A2", name: "Tray A2", category: "Gold Jewellery",     counter: "Counter 1" },
  { id: "B1", name: "Tray B1", category: "Diamond Jewellery",  counter: "Counter 2" },
  { id: "B2", name: "Tray B2", category: "Diamond Jewellery",  counter: "Counter 2" },
  { id: "C1", name: "Tray C1", category: "Silver Jewellery",   counter: "Counter 3" },
  { id: "C2", name: "Tray C2", category: "Silver Jewellery",   counter: "Counter 3" },
  { id: "V1", name: "Vault-1", category: "Platinum Jewellery", counter: "Vault" },
  { id: "V2", name: "Vault-2", category: "Gemstone Jewellery", counter: "Vault" },
];

export default function Rfid({ t }) {
  const [trayData,     setTrayData]     = useState([]);
  const [kpis,         setKpis]         = useState({});
  const [scanLog,      setScanLog]      = useState([]);
  const [selectedTray, setSelectedTray] = useState(null);
  const [trayItems,    setTrayItems]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [lastAudit,    setLastAudit]    = useState(null);

  // ── load tray data from products ─────────────────────────────────────────────
  const loadTrayData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/inventory/live?limit=500`, { headers: authHeaders() });
      const d = await r.json();
      if (!d.success) return;

      const products = d.data;
      // Map products to trays based on category
      const enriched = TRAY_CONFIG.map(tray => {
        const items = products.filter(p =>
          p.jewellery_category === tray.category && p.stock_qty > 0
        );
        const totalItems = items.length;
        const totalValue = items.reduce((s, p) => s + parseFloat(p.stock_value || 0), 0);
        const lowStock   = items.filter(p => p.stock_status !== "In Stock").length;
        return { ...tray, items, totalItems, totalValue, lowStock, ok: lowStock === 0 };
      });

      setTrayData(enriched);

      // KPIs
      const allItems   = products.filter(p => p.stock_qty > 0);
      const huidTagged = products.filter(p => p.huid && p.huid !== "").length;
      const missing    = products.filter(p => !p.huid || p.huid === "").length;

      setKpis({
        total_tagged:  huidTagged,
        active_trays:  TRAY_CONFIG.length,
        missing_tags:  missing,
        total_items:   allItems.length,
        total_value:   allItems.reduce((s, p) => s + parseFloat(p.stock_value || 0), 0),
      });

      // Mock scan log from recent adjustments / sales
      const logRes = await fetch(`${API}/inventory/movement?limit=20`, { headers: authHeaders() });
      const logData = await logRes.json();
      if (logData.success) setScanLog(logData.data.slice(0, 15));

      setLastAudit(new Date().toLocaleDateString("en-IN"));
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTrayData(); }, [loadTrayData]);

  function openTray(tray) {
    setSelectedTray(tray);
    setTrayItems(tray.items || []);
  }

  const TH = ({ c }) => (
    <th style={{ textAlign: "left", padding: "9px 12px", color: t.textMuted, fontWeight: 600,
      fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.borderDash}`,
      whiteSpace: "nowrap" }}>{c}</th>
  );
  const TD = ({ v, bold, color }) => (
    <td style={{ padding: "10px 12px", color: color || (bold ? t.text : t.textSub),
      fontWeight: bold ? 600 : 400 }}>{v ?? "—"}</td>
  );

  return (
    <div>
      <PageHeader title="RFID & Tray Audit"
        subtitle="Live tray tracking · Counter audit · Stock location management"
        t={t}
        actions={<>
          <BtnOutline t={t} onClick={loadTrayData}>{loading ? "Scanning…" : "Refresh Scan"}</BtnOutline>
          <BtnPrimary onClick={loadTrayData}>Start Audit</BtnPrimary>
        </>} />

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="HUID Tagged"   value={kpis.total_tagged || 0}                          color="#2ecc71"      t={t} />
        <StatCard label="Active Trays"  value={kpis.active_trays || 0}                          color={BRAND.blue}   t={t} />
        <StatCard label="Untagged Items" value={kpis.missing_tags || 0}                         color={BRAND.pink}   t={t} />
        <StatCard label="Stock Value"   value={fmt(kpis.total_value)}                           color={BRAND.purple} t={t} />
        <StatCard label="Last Audit"    value={lastAudit || "—"}                                color="#2ecc71"      t={t} />
      </div>

      {/* Tray Grid */}
      <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.borderDash}`, padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Tray Status — Live View</span>
          <span style={{ fontSize: 12, color: t.textMuted }}>
            {loading ? "Scanning…" : `${trayData.filter(t => t.ok).length}/${trayData.length} trays OK`}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
          {trayData.map(tray => (
            <div key={tray.id}
              onClick={() => openTray(tray)}
              style={{
                background: t.card2 || t.card,
                border: `2px solid ${tray.ok ? "rgba(46,204,113,0.4)" : "rgba(230,59,138,0.4)"}`,
                borderRadius: 12, padding: 16, cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: selectedTray?.id === tray.id ? `0 0 0 3px ${BRAND.blue}66` : "none",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              {/* Tray header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: tray.ok ? BRAND.blue : BRAND.pink }}>{tray.name}</div>
                <span style={{
                  background: tray.ok ? "rgba(46,204,113,0.15)" : "rgba(230,59,138,0.15)",
                  color: tray.ok ? "#2ecc71" : BRAND.pink,
                  border: `1px solid ${tray.ok ? "rgba(46,204,113,0.3)" : "rgba(230,59,138,0.3)"}`,
                  borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700,
                }}>
                  {tray.ok ? "✓ OK" : "⚠ Alert"}
                </span>
              </div>

              {/* Category */}
              <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 10 }}>{tray.category}</div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div style={{ background: t.card, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{tray.totalItems}</div>
                  <div style={{ fontSize: 10, color: t.textMuted }}>Items</div>
                </div>
                <div style={{ background: t.card, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.blue }}>{fmt(tray.totalValue)}</div>
                  <div style={{ fontSize: 10, color: t.textMuted }}>Value</div>
                </div>
              </div>

              {tray.lowStock > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#f39c12", fontWeight: 600 }}>
                  ⚠ {tray.lowStock} item{tray.lowStock > 1 ? "s" : ""} low/out of stock
                </div>
              )}

              <div style={{ marginTop: 8, fontSize: 10, color: t.textMuted }}>{tray.counter}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Tray Items */}
      {selectedTray && (
        <div style={{ background: t.card, borderRadius: 12, border: `2px solid ${BRAND.blue}44`, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.borderDash}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: `linear-gradient(135deg,${BRAND.blue}10,${BRAND.purple}08)` }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 14, color: BRAND.blue }}>{selectedTray.name}</span>
              <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 10 }}>{selectedTray.category} · {selectedTray.counter}</span>
            </div>
            <BtnSm t={t} onClick={() => setSelectedTray(null)}>Close ✕</BtnSm>
          </div>
          {trayItems.length === 0
            ? <p style={{ padding: 24, textAlign: "center", color: t.textMuted }}>No items in this tray</p>
            : <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr>
                    {["SKU","Item","Purity","Gross Wt","Net Wt","Qty","MRP","HUID","Status"].map(c => <TH key={c} c={c} />)}
                  </tr></thead>
                  <tbody>
                    {trayItems.map(p => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                        <TD v={p.sku} bold />
                        <TD v={p.name} />
                        <TD v={p.purity} />
                        <TD v={p.gross_weight + "g"} />
                        <TD v={p.net_weight + "g"} />
                        <TD v={p.stock_qty} bold color={p.stock_qty <= 0 ? "#e74c3c" : "#2ecc71"} />
                        <TD v={fmt(p.mrp)} bold />
                        <td style={{ padding: "10px 12px" }}>
                          {p.huid
                            ? <span style={{ fontFamily: "monospace", color: "#2ecc71", fontWeight: 700, fontSize: 12 }}>{p.huid}</span>
                            : <span style={{ color: "#f39c12", fontSize: 11 }}>Not tagged</span>}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: p.stock_status === "In Stock" ? "rgba(46,204,113,0.15)" : "rgba(230,59,138,0.15)",
                            color: p.stock_status === "In Stock" ? "#2ecc71" : BRAND.pink,
                            borderRadius: 6, padding: "2px 9px", fontSize: 11 }}>{p.stock_status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {/* Scan Activity Log */}
      <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.borderDash}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.borderDash}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Recent Stock Activity</span>
          <span style={{ fontSize: 11, color: t.textMuted }}>Last 15 movements</span>
        </div>
        {scanLog.length === 0
          ? <p style={{ padding: 30, textAlign: "center", color: t.textMuted }}>No activity recorded yet</p>
          : <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>
                  {["Time","SKU","Item","Action","Qty","Reference","By"].map(c => <TH key={c} c={c} />)}
                </tr></thead>
                <tbody>
                  {scanLog.map((log, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                      <TD v={log.date ? new Date(log.date).toLocaleString("en-IN") : "—"} />
                      <TD v={log.sku || "—"} bold />
                      <TD v={log.item || "—"} />
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: log.move_type === "Sale" ? "rgba(59,85,230,0.15)" : "rgba(46,204,113,0.15)",
                          color: log.move_type === "Sale" ? BRAND.blue : "#2ecc71",
                          borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>{log.move_type || "—"}</span>
                      </td>
                      <TD v={log.qty_change} bold color={log.qty_change < 0 ? BRAND.pink : "#2ecc71"} />
                      <TD v={log.reference || "—"} />
                      <TD v={log.by_user || "System"} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}
