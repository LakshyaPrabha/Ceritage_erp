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

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "—";
}

const TABS = [
  { id: "branches",  label: "Store Branches Directory" },
  { id: "transfers", label: "Inter-Branch Stock Transfers" }
];

export default function Branch({ t }) {
  const [tab, setTab] = useState("branches");

  // Data states
  const [branches, setBranches] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [branchModal, setBranchModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms
  const [branchForm, setBranchForm] = useState({
    name: "",
    city: "",
    address: "",
    manager_id: "",
    phone: "",
    gstin: "",
    status: "Active"
  });

  const [transferForm, setTransferForm] = useState({
    from_branch_id: "",
    to_branch_id: "",
    sku: "",
    quantity: "1",
    transport_mode: "Armored Vehicle / Courier",
    dispatch_date: new Date().toISOString().split("T")[0],
    notes: ""
  });

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, uRes] = await Promise.all([
        fetch(`${API}/branch`, { headers: authHeaders() }),
        fetch(`${API}/users`, { headers: authHeaders() })
      ]);
      const [bData, uData] = await Promise.all([bRes.json(), uRes.json()]);
      if (bData.success) setBranches(bData.data || []);
      if (uData.success) setUsers(uData.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/branch/transfers`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setTransfers(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    if (tab === "transfers") loadTransfers();
  }, [tab, loadTransfers]);

  // ── Submit Branch ──────────────────────────────────────────────────────────
  async function submitBranch() {
    if (!branchForm.name) {
      alert("Store Branch Name is required.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/branch`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(branchForm)
      });
      const d = await r.json();
      if (d.success) {
        alert("Branch created successfully!");
        setBranchModal(false);
        setBranchForm({ name: "", city: "", address: "", manager_id: "", phone: "", gstin: "", status: "Active" });
        loadBranches();
      } else {
        alert(d.message || "Failed to create branch.");
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Submit Transfer ────────────────────────────────────────────────────────
  async function submitTransfer() {
    if (!transferForm.from_branch_id || !transferForm.to_branch_id) {
      alert("Please select both source and destination branches.");
      return;
    }
    if (transferForm.from_branch_id === transferForm.to_branch_id) {
      alert("Source and Destination branches cannot be the same.");
      return;
    }
    if (!transferForm.sku) {
      alert("Product SKU / Code is required for stock transfer.");
      return;
    }

    setSaving(true);
    try {
      const r = await fetch(`${API}/branch/transfers`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(transferForm)
      });
      const d = await r.json();
      if (d.success) {
        alert(`Stock Transfer ${d.data?.transfer_id || ''} created successfully!`);
        setTransferModal(false);
        setTransferForm({
          from_branch_id: "",
          to_branch_id: "",
          sku: "",
          quantity: "1",
          transport_mode: "Armored Vehicle / Courier",
          dispatch_date: new Date().toISOString().split("T")[0],
          notes: ""
        });
        loadTransfers();
      } else {
        alert(d.message || "Failed to create transfer.");
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Multi-Branch Management & Network"
        subtitle="Manage retail showroom locations, store managers, inter-branch stock transfers & consolidated inventory"
        t={t}
        actions={
          <>
            <BtnOutline t={t} onClick={() => setTransferModal(true)}>
              + Inter-Branch Transfer
            </BtnOutline>
            <BtnPrimary onClick={() => setBranchModal(true)}>
              + Add Store Branch
            </BtnPrimary>
          </>
        }
      />

      {/* Top StatCards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Total Branches"       value={branches.length}            color={BRAND.blue}   t={t} />
        <StatCard label="Active Stores"        value={branches.filter(b => b.status === "Active").length} color="#2ecc71" t={t} />
        <StatCard label="Inter-Branch Transfers" value={transfers.length}         color={BRAND.purple} t={t} />
        <StatCard label="Central Treasury"     value="Main Store"                color="#f39c12"      t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── TAB 1: BRANCH DIRECTORY ────────────────────────────────────────── */}
      {tab === "branches" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {branches.map((b) => (
              <div
                key={b.id}
                style={{
                  background: t.card,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text, margin: 0 }}>{b.name}</h3>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: b.status === "Active" ? "#2ecc71" : "#e74c3c",
                      color: "#fff"
                    }}>
                      {b.status || "Active"}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: t.subtext, marginBottom: 4 }}>
                    📍 {b.city ? `${b.city} — ${b.address || ''}` : b.address || "Store Address"}
                  </div>
                  <div style={{ fontSize: 12, color: t.text, marginTop: 8 }}>
                    <strong>Manager:</strong> {b.manager_name || "Assigned Manager"}
                  </div>
                  {b.phone && (
                    <div style={{ fontSize: 12, color: t.subtext, marginTop: 2 }}>
                      📞 {b.phone}
                    </div>
                  )}
                  {b.gstin && (
                    <div style={{ fontSize: 11, color: BRAND.blue, fontWeight: 600, marginTop: 4 }}>
                      GSTIN: {b.gstin}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${t.borderDash}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: t.subtext }}>Store ID: #{b.id}</span>
                  <BtnSm t={t} onClick={() => { setTransferForm(prev => ({ ...prev, from_branch_id: b.id })); setTransferModal(true); }}>
                    Transfer Stock
                  </BtnSm>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: STOCK TRANSFERS ────────────────────────────────────────── */}
      {tab === "transfers" && (
        <Card t={t}>
          <CardHeader
            title="Inter-Branch Stock Transfer Register"
            t={t}
            actions={<BtnSm t={t} primary onClick={() => setTransferModal(true)}>+ New Transfer</BtnSm>}
          />
          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading transfer records...</p>
          ) : transfers.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No inter-branch transfers recorded yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Transfer ID</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>From Store</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>To Store</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>SKU / Items</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Quantity</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Dispatch Date</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Transport Mode</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((tr) => (
                    <tr key={tr.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{tr.transfer_id}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>{tr.from_branch || `Store #${tr.from_branch_id}`}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>{tr.to_branch || `Store #${tr.to_branch_id}`}</td>
                      <td style={{ padding: "10px 12px", color: t.text }}>{tr.sku}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#2ecc71" }}>{tr.quantity} pcs</td>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{fmtDate(tr.dispatch_date)}</td>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{tr.transport_mode}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: tr.status === "Received" ? "#2ecc71" : "#f39c12",
                          color: "#fff"
                        }}>
                          {tr.status}
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

      {/* ── MODAL: ADD BRANCH ─────────────────────────────────────────────── */}
      <Modal
        open={branchModal}
        onClose={() => setBranchModal(false)}
        title="Add New Store Branch"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setBranchModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitBranch} disabled={saving}>
              {saving ? "Saving…" : "Create Branch"}
            </BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Branch / Showroom Name *" t={t} half>
            <Input
              t={t}
              placeholder="e.g. Ceritage Jewellers - Surat Branch"
              value={branchForm.name}
              onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="City *" t={t} half>
            <Input
              t={t}
              placeholder="e.g. Surat"
              value={branchForm.city}
              onChange={(e) => setBranchForm(prev => ({ ...prev, city: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Store Address" t={t}>
            <Input
              t={t}
              placeholder="e.g. Shop 102, Diamond World Market"
              value={branchForm.address}
              onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Store Manager" t={t} half>
            <Select
              t={t}
              value={branchForm.manager_id}
              onChange={(e) => setBranchForm(prev => ({ ...prev, manager_id: e.target.value }))}
            >
              <option value="">-- Choose Manager --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Phone / Helpline" t={t} half>
            <Input
              t={t}
              placeholder="+91 98765 43210"
              value={branchForm.phone}
              onChange={(e) => setBranchForm(prev => ({ ...prev, phone: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Branch GSTIN" t={t} half>
            <Input
              t={t}
              placeholder="24AAACG1234F1Z5"
              value={branchForm.gstin}
              onChange={(e) => setBranchForm(prev => ({ ...prev, gstin: e.target.value }))}
            />
          </FormGroup>
        </FormGrid>
      </Modal>

      {/* ── MODAL: INTER-BRANCH TRANSFER ──────────────────────────────────── */}
      <Modal
        open={transferModal}
        onClose={() => setTransferModal(false)}
        title="New Inter-Branch Stock Transfer"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setTransferModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitTransfer} disabled={saving}>
              {saving ? "Dispatching…" : "Dispatch Stock Transfer"}
            </BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Source Branch (From) *" t={t} half>
            <Select
              t={t}
              value={transferForm.from_branch_id}
              onChange={(e) => setTransferForm(prev => ({ ...prev, from_branch_id: e.target.value }))}
            >
              <option value="">-- Select Source Store --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.city || 'Store'})</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Destination Branch (To) *" t={t} half>
            <Select
              t={t}
              value={transferForm.to_branch_id}
              onChange={(e) => setTransferForm(prev => ({ ...prev, to_branch_id: e.target.value }))}
            >
              <option value="">-- Select Destination Store --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.city || 'Store'})</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Product SKU / Barcode *" t={t} half>
            <Input
              t={t}
              placeholder="e.g. CJ-RING-001"
              value={transferForm.sku}
              onChange={(e) => setTransferForm(prev => ({ ...prev, sku: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Quantity (Pieces) *" t={t} half>
            <Input
              t={t}
              type="number"
              value={transferForm.quantity}
              onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Transport / Transit Mode" t={t} half>
            <Input
              t={t}
              placeholder="e.g. Armored Vehicle / Courier"
              value={transferForm.transport_mode}
              onChange={(e) => setTransferForm(prev => ({ ...prev, transport_mode: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Dispatch Date *" t={t} half>
            <Input
              t={t}
              type="date"
              value={transferForm.dispatch_date}
              onChange={(e) => setTransferForm(prev => ({ ...prev, dispatch_date: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Transfer Notes" t={t}>
            <Input
              t={t}
              placeholder="e.g. Festival exhibition stock transfer"
              value={transferForm.notes}
              onChange={(e) => setTransferForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
