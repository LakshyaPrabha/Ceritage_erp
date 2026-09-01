import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs,
  BtnPrimary, BtnOutline, BtnSm, FormGroup, FormGrid, Input, Select, Modal
} from "../../components/ui";

const API = "http://localhost:5000/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token") || localStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function fmtGrams(n) {
  return n ? Number(n).toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " g" : "0.000 g";
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "—";
}

const TABS = [
  { id: "ledger",   label: "Fine Metal Movement Ledger" },
  { id: "karigars", label: "Karigar Gold Holding Matrix" },
  { id: "vault",    label: "Vault Metal Breakdown" }
];

export default function Tunch({ t }) {
  const [tab, setTab] = useState("ledger");

  // Summary state
  const [summary, setSummary] = useState({
    fine_gold_balance: 0,
    fine_silver_balance: 0,
    inventory_fine_gold: 0,
    karigar_issued_fine: 0,
    karigar_received_fine: 0,
    karigar_holding_fine: 0,
    total_wastage_fine: 0,
    scrap_gold_fine: 0,
    exchange_gold_fine: 0
  });

  // Tab Data states
  const [movements, setMovements] = useState([]);
  const [karigars, setKarigars] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [metalFilter, setMetalFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal
  const [metalModal, setMetalModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metalForm, setMetalForm] = useState({
    transaction_type: "MANUAL_ENTRY",
    metal_type: "Gold",
    purity: "24K",
    gross_weight: "",
    wastage: "0",
    flow: "INWARD",
    party_type: "Store",
    party_name: "Store Vault / Treasury",
    narration: ""
  });

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    try {
      const r = await fetch(`${API}/tunch/summary`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setSummary(d.data);
    } catch { /* silent */ }
  }, []);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (metalFilter !== "ALL") query.append("metal_type", metalFilter);
      if (search) query.append("search", search);

      const r = await fetch(`${API}/tunch/ledger?${query.toString()}`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setMovements(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [metalFilter, search]);

  const loadKarigars = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/tunch/karigar-balances`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setKarigars(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (tab === "ledger") loadMovements();
    else if (tab === "karigars") loadKarigars();
  }, [tab, loadMovements, loadKarigars]);

  // ── Record Movement Submit ──────────────────────────────────────────────────
  async function submitMovement() {
    const gw = parseFloat(metalForm.gross_weight);
    if (!gw || gw <= 0) {
      alert("Please enter a valid positive gross metal weight.");
      return;
    }

    setSaving(true);
    try {
      const r = await fetch(`${API}/tunch/record`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(metalForm)
      });
      const d = await r.json();
      if (d.success) {
        alert(d.message);
        setMetalModal(false);
        setMetalForm({
          transaction_type: "MANUAL_ENTRY",
          metal_type: "Gold",
          purity: "24K",
          gross_weight: "",
          wastage: "0",
          flow: "INWARD",
          party_type: "Store",
          party_name: "Store Vault / Treasury",
          narration: ""
        });
        loadSummary();
        if (tab === "ledger") loadMovements();
      } else {
        alert(d.message);
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  // Live Fine Weight computation preview in form
  const getPurityRatio = (p) => {
    if (p === "24K") return 0.999;
    if (p === "22K") return 0.9167;
    if (p === "18K") return 0.750;
    if (p === "14K") return 0.585;
    if (p === "92.5%") return 0.925;
    return 0.9167;
  };
  const liveFinePreview = ((parseFloat(metalForm.gross_weight) || 0) - (parseFloat(metalForm.wastage) || 0)) * getPurityRatio(metalForm.purity);

  return (
    <div>
      <PageHeader
        title="Fine Metal Ledger & Tunch Traceability"
        subtitle="Pure Metal Accounting (24K/999, 22K/916, 18K/750) · Karigar Metal Balances · Bullion Inward · Scrap Reconciliation"
        t={t}
        actions={
          <BtnPrimary onClick={() => setMetalModal(true)}>
            + Record Bullion / Metal Inward
          </BtnPrimary>
        }
      />

      {/* Top StatCards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Fine Gold Balance"       value={fmtGrams(summary.fine_gold_balance)}   color="#f0c040"      t={t} />
        <StatCard label="Fine Silver Balance"     value={fmtGrams(summary.fine_silver_balance)} color="#95a5a6"      t={t} />
        <StatCard label="Karigars Gold Holding"   value={fmtGrams(summary.karigar_holding_fine)} color={BRAND.pink}   t={t} />
        <StatCard label="Finished Products Gold"  value={fmtGrams(summary.inventory_fine_gold)} color={BRAND.blue}   t={t} />
        <StatCard label="Scrap / Exchange Gold"   value={fmtGrams(summary.scrap_gold_fine + summary.exchange_gold_fine)} color="#2ecc71" t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── TAB 1: MOVEMENT LEDGER ────────────────────────────────────────── */}
      {tab === "ledger" && (
        <Card t={t}>
          <CardHeader
            title="Unified Fine Metal Movement Log"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Select
                  t={t}
                  value={metalFilter}
                  onChange={(e) => setMetalFilter(e.target.value)}
                  style={{ width: 130, padding: "4px 8px", fontSize: 12 }}
                >
                  <option value="ALL">All Metals</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Platinum">Platinum</option>
                </Select>
                <Input
                  t={t}
                  placeholder="Search voucher / party / type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 220, padding: "4px 8px", fontSize: 12 }}
                />
              </div>
            }
          />

          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading metal ledger entries...</p>
          ) : movements.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No fine metal movements recorded yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Voucher / Ref</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Date</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Transaction Type</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Party</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Metal / Purity</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Gross Wt</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Fine Wt (g)</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Flow</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{m.voucher_no}</td>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{fmtDate(m.date)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>{m.type}</td>
                      <td style={{ padding: "10px 12px", color: t.text }}>{m.party_name}</td>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{m.metal_type} · {m.purity}</td>
                      <td style={{ padding: "10px 12px" }}>{Number(m.gross_weight).toFixed(3)} g</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: m.flow === "INWARD" ? "#2ecc71" : "#e74c3c" }}>
                        {m.flow === "INWARD" ? "+ " : "- "}{Number(m.fine_weight).toFixed(3)} g
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: m.flow === "INWARD" ? "#2ecc71" : "#e74c3c",
                          color: "#fff"
                        }}>
                          {m.flow}
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

      {/* ── TAB 2: KARIGARS METAL MATRIX ──────────────────────────────────── */}
      {tab === "karigars" && (
        <Card t={t}>
          <CardHeader title="Karigar Fine Gold Holding & Wastage Position" t={t} />
          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading karigar metal balances...</p>
          ) : karigars.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No active karigar metal records.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Karigar Name</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Specialization</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Total Issued (Fine)</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Total Received (Fine)</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Wastage Allowed</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Current Holding Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {karigars.map((k) => (
                    <tr key={k.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: t.text }}>{k.name}</td>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{k.specialization || "General Goldsmith"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: BRAND.pink }}>{fmtGrams(k.total_issued_fine)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#2ecc71" }}>{fmtGrams(k.total_received_fine)}</td>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{fmtGrams(k.total_wastage)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 800, color: k.current_holding_fine > 0 ? "#f39c12" : "#2ecc71" }}>
                        {fmtGrams(k.current_holding_fine)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 3: VAULT BREAKDOWN ────────────────────────────────────────── */}
      {tab === "vault" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card t={t}>
            <CardHeader title="Gold Distribution Across Channels" t={t} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: `1px solid ${t.border}`, paddingBottom: 8 }}>
                <span>Finished Products (Showroom Stock):</span>
                <strong>{fmtGrams(summary.inventory_fine_gold)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: `1px solid ${t.border}`, paddingBottom: 8 }}>
                <span>In-Transit with Karigars (Job Work):</span>
                <strong style={{ color: BRAND.pink }}>{fmtGrams(summary.karigar_holding_fine)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: `1px solid ${t.border}`, paddingBottom: 8 }}>
                <span>Old Scrap & Customer Exchange Gold:</span>
                <strong style={{ color: "#2ecc71" }}>{fmtGrams(summary.scrap_gold_fine + summary.exchange_gold_fine)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, paddingTop: 6 }}>
                <span>Total Fine Gold Assets:</span>
                <strong style={{ color: "#f0c040" }}>{fmtGrams(summary.fine_gold_balance)}</strong>
              </div>
            </div>
          </Card>

          <Card t={t}>
            <CardHeader title="Purity / Tunch Conversion Standard" t={t} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
              {[
                ["24K (999 Pure Bullion)", "Fine Fraction: 0.999 (99.9% pure gold)"],
                ["22K / 916 (Standard BIS Hallmark)", "Fine Fraction: 0.9167 (91.67% pure gold)"],
                ["18K / 750 (Diamond Jewellery)", "Fine Fraction: 0.750 (75.0% pure gold)"],
                ["14K / 585 (Lightweight Jewellery)", "Fine Fraction: 0.585 (58.5% pure gold)"],
                ["Silver 925 (Sterling Silver)", "Fine Fraction: 0.925 (92.5% pure silver)"]
              ].map(([k, desc]) => (
                <div key={k} style={{ padding: "10px 12px", background: t.card2, borderRadius: 8, border: `1px solid ${t.border}` }}>
                  <div style={{ fontWeight: 700, color: BRAND.blue, fontSize: 13 }}>{k}</div>
                  <div style={{ fontSize: 11, color: t.subtext, marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── MODAL: RECORD METAL INWARD / ADJUSTMENT ────────────────────────── */}
      <Modal
        open={metalModal}
        onClose={() => setMetalModal(false)}
        title="Record Fine Metal Movement / Bullion Inward"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setMetalModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitMovement} disabled={saving}>
              {saving ? "Saving…" : "Save Metal Movement"}
            </BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Transaction Type *" t={t} half>
            <Select
              t={t}
              value={metalForm.transaction_type}
              onChange={(e) => setMetalForm(prev => ({ ...prev, transaction_type: e.target.value }))}
            >
              <option value="MANUAL_ENTRY">Direct Raw Bullion Inward</option>
              <option value="MELTING_ADJUSTMENT">Tunch / Melting Adjustment</option>
              <option value="PURITY_UPGRADE">Purity Refining / Upgrade</option>
              <option value="PURITY_DOWNGRADE">Purity Conversion / Alloy Mix</option>
            </Select>
          </FormGroup>

          <FormGroup label="Movement Flow *" t={t} half>
            <Select
              t={t}
              value={metalForm.flow}
              onChange={(e) => setMetalForm(prev => ({ ...prev, flow: e.target.value }))}
            >
              <option value="INWARD">INWARD (+ Pure Metal Added to Vault)</option>
              <option value="OUTWARD">OUTWARD (- Pure Metal Removed from Vault)</option>
            </Select>
          </FormGroup>

          <FormGroup label="Metal Type *" t={t} half>
            <Select
              t={t}
              value={metalForm.metal_type}
              onChange={(e) => setMetalForm(prev => ({ ...prev, metal_type: e.target.value }))}
            >
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Platinum">Platinum</option>
            </Select>
          </FormGroup>

          <FormGroup label="Purity / Tunch *" t={t} half>
            <Select
              t={t}
              value={metalForm.purity}
              onChange={(e) => setMetalForm(prev => ({ ...prev, purity: e.target.value }))}
            >
              <option value="24K">24K (999 Pure)</option>
              <option value="22K">22K (916 Standard)</option>
              <option value="18K">18K (750 Diamond)</option>
              <option value="14K">14K (585)</option>
              <option value="92.5%">92.5% (Sterling Silver)</option>
            </Select>
          </FormGroup>

          <FormGroup label="Gross Weight (Grams) *" t={t} half>
            <Input
              t={t}
              type="number"
              step="0.001"
              placeholder="0.000"
              value={metalForm.gross_weight}
              onChange={(e) => setMetalForm(prev => ({ ...prev, gross_weight: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Wastage / Loss (Grams)" t={t} half>
            <Input
              t={t}
              type="number"
              step="0.001"
              placeholder="0.000"
              value={metalForm.wastage}
              onChange={(e) => setMetalForm(prev => ({ ...prev, wastage: e.target.value }))}
            />
          </FormGroup>

          {/* Live Fine Weight Preview */}
          <div style={{ gridColumn: "span 2", background: t.card2, padding: "10px 14px", borderRadius: 8, border: `1px solid ${t.border}`, fontSize: 13 }}>
            Computed Pure Fine Metal Weight: <strong style={{ color: "#2ecc71", fontSize: 15 }}>{liveFinePreview.toFixed(3)} g</strong>
            <span style={{ fontSize: 11, color: t.subtext, marginLeft: 8 }}>(Gross {metalForm.gross_weight || 0}g × {getPurityRatio(metalForm.purity)})</span>
          </div>

          <FormGroup label="Party / Source Name" t={t} half>
            <Input
              t={t}
              placeholder="e.g. MMTC Bullion Refinery or Store Vault"
              value={metalForm.party_name}
              onChange={(e) => setMetalForm(prev => ({ ...prev, party_name: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Narration / Purpose" t={t} half>
            <Input
              t={t}
              placeholder="e.g. 24K bar purchase added to vault"
              value={metalForm.narration}
              onChange={(e) => setMetalForm(prev => ({ ...prev, narration: e.target.value }))}
            />
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
