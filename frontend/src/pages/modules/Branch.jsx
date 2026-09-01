import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
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

const API = window.__CERITAGE_API__ || "http://localhost:5000/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token") || localStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
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
  { id: "branches",     label: "My Showroom Network" },
  { id: "sub_branches", label: "Sub-Branches Directory" },
  { id: "transfers",    label: "Inter-Branch Stock Transfers" },
];

export default function Branch({ t }) {
  const [tab, setTab] = useState("branches");
  const [kpis, setKpis] = useState({});
  const [branches, setBranches] = useState([]);
  const [subBranches, setSubBranches] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [userBranchId, setUserBranchId] = useState(1);
  const [userBranchName, setUserBranchName] = useState("Main Showroom");
  const [transferScope, setTransferScope] = useState("all");
  const [loading, setLoading] = useState(false);

  // Modals
  const [branchModal, setBranchModal] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [transferModal, setTransferModal] = useState(false);
  const [slipModal, setSlipModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [branchForm, setBranchForm] = useState({
    name: "",
    city: "",
    address: "",
    manager_id: "",
    phone: "",
    gstin: "",
    status: "Active",
  });

  const [transferForm, setTransferForm] = useState({
    from_branch_id: "1",
    to_branch_id: "",
    sku: "",
    quantity: "1",
    transport_mode: "Armored Van - Secure Logistics",
    dispatch_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // ── Load Data ──────────────────────────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const r = await fetch(`${API}/branch/kpis`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) {
        setKpis(d.data);
        if (d.data.user_branch_id) {
          setUserBranchId(d.data.user_branch_id);
          setUserBranchName(d.data.user_branch_name || `Branch #${d.data.user_branch_id}`);
          setTransferForm((prev) => ({ ...prev, from_branch_id: String(d.data.user_branch_id) }));
        }
      }
    } catch { /* silent */ }
  }, []);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/branch`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) {
        setBranches(d.data || []);
        if (d.user_branch_id) setUserBranchId(d.user_branch_id);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  const loadSubBranches = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/branch/sub-branches`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) {
        setSubBranches(d.data || []);
      }
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
    loadKpis();
    loadBranches();
    loadSubBranches();
  }, [loadKpis, loadBranches, loadSubBranches]);

  useEffect(() => {
    if (tab === "transfers") loadTransfers();
    if (tab === "sub_branches") loadSubBranches();
    if (tab === "branches") loadBranches();
  }, [tab, loadTransfers, loadSubBranches, loadBranches]);

  // ── Submit Branch / Sub-Branch ─────────────────────────────────────────────
  async function submitBranch() {
    if (!branchForm.name) {
      alert("Sub-Branch Name is required.");
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!editBranch;
      const url = isEdit ? `${API}/branch/sub-branches/${editBranch.id}` : `${API}/branch/sub-branches`;
      const method = isEdit ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(branchForm),
      });
      const d = await r.json();
      if (d.success) {
        alert(d.message || "Sub-Branch saved to your showroom network successfully!");
        setBranchModal(false);
        setEditBranch(null);
        setBranchForm({ name: "", city: "", address: "", manager_id: "", phone: "", gstin: "", status: "Active" });
        loadBranches();
        loadSubBranches();
        loadKpis();
      } else {
        alert(d.message || "Failed to save branch.");
      }
    } catch {
      alert("Cannot connect to server.");
    }
    setSaving(false);
  }

  // ── Delete Sub-Branch ──────────────────────────────────────────────────────
  async function deleteSubBranch(id, name) {
    if (!window.confirm(`Are you sure you want to archive sub-branch "${name}"?`)) return;
    try {
      const r = await fetch(`${API}/branch/sub-branches/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const d = await r.json();
      if (d.success) {
        alert("Sub-Branch archived successfully.");
        loadBranches();
        loadSubBranches();
        loadKpis();
      } else {
        alert(d.message || "Failed to archive sub-branch.");
      }
    } catch {
      alert("Cannot connect to server.");
    }
  }

  // ── Submit Transfer ────────────────────────────────────────────────────────
  async function submitTransfer() {
    if (!transferForm.to_branch_id || !transferForm.sku) {
      alert("Destination Branch and Product SKU are required.");
      return;
    }
    if (String(transferForm.from_branch_id) === String(transferForm.to_branch_id)) {
      alert("Source and Destination branches cannot be the same store.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/branch/transfers`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(transferForm),
      });
      const d = await r.json();
      if (d.success) {
        alert(d.message || "Stock Transfer memo created!");
        setTransferModal(false);
        setTransferForm({
          from_branch_id: String(userBranchId),
          to_branch_id: "",
          sku: "",
          quantity: "1",
          transport_mode: "Armored Van - Secure Logistics",
          dispatch_date: new Date().toISOString().split("T")[0],
          notes: "",
        });
        loadTransfers();
        loadKpis();
      } else {
        alert(d.message || "Failed to create transfer.");
      }
    } catch {
      alert("Cannot connect to server.");
    }
    setSaving(false);
  }

  // ── Update Transfer Status ─────────────────────────────────────────────────
  async function updateStatus(id, newStatus) {
    try {
      const r = await fetch(`${API}/branch/transfers/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await r.json();
      if (d.success) {
        loadTransfers();
        loadKpis();
      } else {
        alert(d.message || "Failed to update status.");
      }
    } catch {
      alert("Cannot connect to server.");
    }
  }

  // ── Print Transit Delivery Challan ─────────────────────────────────────────
  function printTransferSlip(tr) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Transit Challan - ${tr.transfer_id || tr.transfer_no}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #1e293b; background: #fff; line-height: 1.5; font-size: 13px; }
          .header { text-align: center; border-bottom: 2px solid #3b55e6; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 800; color: #3b55e6; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .meta-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; }
          .meta-value { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #3b55e6; color: #fff; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          .security-seal { border: 1.5px dashed #3b55e6; padding: 12px; border-radius: 6px; margin-bottom: 30px; font-size: 11px; background: #eff6ff; }
          .sign-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; margin-top: 40px; }
          .sign-line { border-top: 1px solid #000; padding-top: 6px; font-weight: bold; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">CERITAGE JEWELRY ERP</div>
          <div class="subtitle">Official Inter-Branch Stock Transit Delivery Challan · Secure Vault Transfer</div>
        </div>
        <div class="meta-grid">
          <div>
            <div class="meta-label">Transfer Challan No</div>
            <div class="meta-value">${tr.transfer_id || tr.transfer_no}</div>
            <div class="meta-label" style="margin-top:8px;">Dispatch Date</div>
            <div class="meta-value">${fmtDate(tr.dispatch_date || tr.transfer_date || tr.created_at)}</div>
          </div>
          <div>
            <div class="meta-label">Origin Showroom</div>
            <div class="meta-value"> ${tr.from_branch} (${tr.from_city || "Main Store"})</div>
            <div class="meta-label" style="margin-top:8px;">Destination Showroom</div>
            <div class="meta-value"> ${tr.to_branch} (${tr.to_city || "Sub-Branch"})</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product SKU / Tag</th>
              <th>Transfer Quantity</th>
              <th>Transport Mode</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>${tr.sku}</strong></td>
              <td><strong>${parseFloat(tr.quantity || tr.qty || 1).toFixed(3)} Units</strong></td>
              <td>${tr.transport_mode || "Armored Logistics"}</td>
              <td><span style="font-weight:700; color:#3b55e6;">${tr.status}</span></td>
            </tr>
          </tbody>
        </table>
        <div class="security-seal">
           <strong>Tamper-Proof Verification Notice:</strong> This precious metal consignment is dispatched in barcoded security lockboxes. Inspect vault seals upon arrival at destination branch before acknowledging receipt on Ceritage ERP.
        </div>
        <div class="sign-grid">
          <div><div class="sign-line">Dispatch Vault Custodian</div></div>
          <div><div class="sign-line">Armored Courier Agent</div></div>
          <div><div class="sign-line">Receiving Store Manager</div></div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    const w = window.open("", "_blank", "width=850,height=750");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  const filteredTransfers = transfers.filter((tr) => {
    if (transferScope === "outgoing") return tr.is_outgoing;
    if (transferScope === "incoming") return tr.is_incoming;
    return true;
  });

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="Multi-Branch & Store Network"
        subtitle="Main Showroom Headquarters · Sub-Branches Directory · Inter-Branch Stock Movement"
        t={t}
        actions={
          <>
            <BtnOutline
              t={t}
              onClick={() => {
                if (tab === "transfers") loadTransfers();
                else if (tab === "sub_branches") loadSubBranches();
                else loadBranches();
                loadKpis();
              }}
            >
              ↻ Refresh
            </BtnOutline>
            {branches.length > 1 && (
              <BtnOutline t={t} onClick={() => setTransferModal(true)}>
                + Create Stock Transfer
              </BtnOutline>
            )}
            <BtnPrimary
              onClick={() => {
                setEditBranch(null);
                setBranchForm({ name: "", city: "", address: "", manager_id: "", phone: "", gstin: "", status: "Active" });
                setBranchModal(true);
              }}
            >
              + Add Sub-Branch
            </BtnPrimary>
          </>
        }
      />

      {/* ── Logged-in Branch Context Banner ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${BRAND.blue}15 0%, ${BRAND.purple}12 100%)`,
          border: `1.5px solid ${BRAND.blue}44`,
          borderRadius: 12,
          padding: "14px 20px",
          marginBottom: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Your Business Showroom Network
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.blue, marginTop: 2 }}>
             {userBranchName} <span style={{ fontSize: 12, color: t.textSub }}>(Current Store · ID: #{userBranchId})</span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: t.textSub }}>
          Total Registered Branches in your network: <strong>{branches.length} Store(s)</strong> (Main HQ + {subBranches.length} Sub-Branches)
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
        <StatCard label="Total Network Stores" value={branches.length} color={BRAND.blue} t={t} />
        <StatCard label="Sub-Branches Count" value={subBranches.length} color={BRAND.purple} t={t} />
        <StatCard label="Active Outlets" value={branches.filter((b) => b.status === "Active").length} color="#2ecc71" t={t} />
        <StatCard label="Outgoing In-Transit" value={kpis.my_outgoing_transfers || 0} color="#f39c12" t={t} />
        <StatCard label="Incoming In-Transit" value={kpis.my_incoming_transfers || 0} color={BRAND.blue} t={t} />
      </div>

      {/* ── Tabs Navigation ── */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: MY SHOWROOM NETWORK CARDS                                            */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "branches" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {branches.map((b) => {
              const isHomeBranch = b.id === userBranchId;

              return (
                <div
                  key={b.id}
                  style={{
                    background: isHomeBranch ? "rgba(59,85,230,0.05)" : t.card,
                    border: `1.5px solid ${isHomeBranch ? BRAND.blue : t.border}`,
                    borderRadius: 14,
                    padding: 18,
                    boxShadow: isHomeBranch ? "0 4px 20px rgba(59,85,230,0.15)" : t.cardShadow,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: BRAND.blue, fontWeight: 600 }}>
                        {b.city ? `${b.city} Showroom` : "Showroom Branch"} · ID: #{b.id}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      {b.is_main_branch ? (
                        <span
                          style={{
                            background: "linear-gradient(135deg, #f39c12, #e67e22)",
                            color: "#fff",
                            borderRadius: 20,
                            padding: "3px 10px",
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: "0.5px",
                          }}
                        >
                           HEADQUARTERS (MAIN)
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "rgba(59,85,230,0.12)",
                            color: BRAND.blue,
                            borderRadius: 20,
                            padding: "3px 9px",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                           SUB-BRANCH OUTLET
                        </span>
                      )}

                      {isHomeBranch && (
                        <span
                          style={{
                            background: "rgba(46,204,113,0.15)",
                            color: "#27ae60",
                            border: "1px solid rgba(46,204,113,0.3)",
                            borderRadius: 20,
                            padding: "2px 8px",
                            fontSize: 9,
                            fontWeight: 800,
                          }}
                        >
                           ACTIVE LOGIN STORE
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: t.textSub, marginBottom: 14, lineHeight: 1.5 }}>
                    <div> {b.address || "Address not specified"}</div>
                    <div> {b.phone || "—"}</div>
                    <div> GSTIN: <strong style={{ fontFamily: "monospace" }}>{b.gstin || "N/A"}</strong></div>
                  </div>

                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: b.is_main_branch ? "#f39c12" : BRAND.blue, fontWeight: 700 }}>
                      {b.is_main_branch ? "★ Primary Head Office" : "🏢 Network Sub-Store"}
                    </span>
                    {!b.is_main_branch && (
                      <BtnSm
                        t={t}
                        onClick={() => {
                          setEditBranch(b);
                          setBranchForm({
                            name: b.name,
                            city: b.city || "",
                            address: b.address || "",
                            manager_id: b.manager_id || "",
                            phone: b.phone || "",
                            gstin: b.gstin || "",
                            status: b.status || "Active",
                          });
                          setBranchModal(true);
                        }}
                      >
                        Edit Branch
                      </BtnSm>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 24,
              padding: "16px 20px",
              background: t.card2 || t.card,
              border: `1px dashed ${t.borderDash}`,
              borderRadius: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <strong style={{ fontSize: 14, color: t.text }}>Have multiple showroom locations or a central workshop?</strong>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                Click <strong>+ Add Sub-Branch</strong> to add your 2nd or 3rd branch and enable inter-branch stock transfers!
              </div>
            </div>
            <BtnPrimary
              onClick={() => {
                setEditBranch(null);
                setBranchForm({ name: "", city: "", address: "", manager_id: "", phone: "", gstin: "", status: "Active" });
                setBranchModal(true);
              }}
            >
              + Add Sub-Branch
            </BtnPrimary>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: SUB-BRANCHES DIRECTORY (Live from sub_branches table)                */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "sub_branches" && (
        <Card t={t}>
          <CardHeader
            title={`Sub-Branches Directory (${subBranches.length} Outlets under Main Headquarters)`}
            t={t}
            actions={
              <BtnPrimary
                onClick={() => {
                  setEditBranch(null);
                  setBranchForm({ name: "", city: "", address: "", manager_id: "", phone: "", gstin: "", status: "Active" });
                  setBranchModal(true);
                }}
              >
                + Register New Sub-Branch
              </BtnPrimary>
            }
          />
          <DataTable
            columns={["Sub-Branch Name", "City", "Linked Main Store", "Phone / Contact", "GSTIN", "Status", "Actions"]}
            rows={subBranches.map((sb) => ({
              "Sub-Branch Name": (
                <div>
                  <strong>{sb.name}</strong>
                  <div style={{ fontSize: 11, color: t.textMuted }}>{sb.address || "Address not specified"}</div>
                </div>
              ),
              "City": <strong>{sb.city || "—"}</strong>,
              "Linked Main Store": (
                <span style={{
                  padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: "rgba(243,156,18,0.15)", color: "#d35400"
                }}>
                  ★ {sb.main_branch_name || "Headquarters"} (#{sb.main_branch_id})
                </span>
              ),
              "Phone / Contact": sb.phone || "—",
              "GSTIN": <code style={{ fontSize: 11 }}>{sb.gstin || "—"}</code>,
              "Status": (
                <span
                  style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: sb.status === "Active" ? "rgba(46,204,113,0.15)" : "rgba(230,59,138,0.15)",
                    color: sb.status === "Active" ? "#27ae60" : BRAND.pink,
                  }}
                >
                  {sb.status}
                </span>
              ),
              "Actions": (
                <div style={{ display: "flex", gap: 6 }}>
                  <BtnSm
                    t={t}
                    onClick={() => {
                      setEditBranch(sb);
                      setBranchForm({
                        name: sb.name,
                        city: sb.city || "",
                        address: sb.address || "",
                        manager_id: sb.manager_id || "",
                        phone: sb.phone || "",
                        gstin: sb.gstin || "",
                        status: sb.status || "Active",
                      });
                      setBranchModal(true);
                    }}
                  >
                    Edit
                  </BtnSm>
                  <BtnSm
                    t={t}
                    style={{ color: BRAND.pink }}
                    onClick={() => deleteSubBranch(sb.id, sb.name)}
                  >
                    Archive
                  </BtnSm>
                </div>
              ),
            }))}
            t={t}
            emptyMsg="No sub-branches registered yet under your Main Headquarters. Click '+ Add Sub-Branch' to link your first showroom outlet!"
          />
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: INTER-BRANCH STOCK TRANSFERS                                         */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "transfers" && (
        <Card t={t}>
          <CardHeader
            title="Inter-Branch Transit Logistics & Stock Challans"
            t={t}
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Select
                  t={t}
                  style={{ width: 160 }}
                  value={transferScope}
                  onChange={(e) => setTransferScope(e.target.value)}
                >
                  <option value="all">All Transfers</option>
                  <option value="outgoing">My Outgoing ({kpis.my_outgoing_transfers || 0})</option>
                  <option value="incoming">My Incoming ({kpis.my_incoming_transfers || 0})</option>
                </Select>
                <BtnPrimary onClick={() => setTransferModal(true)}>+ New Transfer</BtnPrimary>
              </div>
            }
          />
          <DataTable
            columns={["Challan No", "Date", "Source Store", "Destination Store", "Product SKU", "Quantity", "Status", "Actions"]}
            rows={filteredTransfers.map((tr) => ({
              "Challan No": <strong style={{ fontFamily: "monospace", color: BRAND.blue }}>{tr.transfer_id || tr.transfer_no}</strong>,
              "Date": fmtDate(tr.dispatch_date || tr.transfer_date || tr.created_at),
              "Source Store": <span> {tr.from_branch}</span>,
              "Destination Store": <span> {tr.to_branch}</span>,
              "Product SKU": <code>{tr.sku}</code>,
              "Quantity": <strong>{parseFloat(tr.quantity || tr.qty || 1).toFixed(3)} Units</strong>,
              "Status": (
                <span
                  style={{
                    padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: tr.status === "RECEIVED" ? "rgba(46,204,113,0.15)" : tr.status === "IN_TRANSIT" ? "rgba(243,156,18,0.15)" : "rgba(230,59,138,0.15)",
                    color: tr.status === "RECEIVED" ? "#27ae60" : tr.status === "IN_TRANSIT" ? "#d35400" : BRAND.pink,
                  }}
                >
                  {tr.status}
                </span>
              ),
              "Actions": (
                <div style={{ display: "flex", gap: 6 }}>
                  <BtnSm t={t} onClick={() => printTransferSlip(tr)}>Print Slip</BtnSm>
                  {tr.status === "IN_TRANSIT" && tr.is_incoming && (
                    <BtnSm t={t} primary onClick={() => updateStatus(tr.id, "RECEIVED")}>Receive</BtnSm>
                  )}
                  {tr.status === "IN_TRANSIT" && tr.is_outgoing && (
                    <BtnSm t={t} style={{ color: BRAND.pink }} onClick={() => updateStatus(tr.id, "CANCELLED")}>Cancel</BtnSm>
                  )}
                </div>
              ),
            }))}
            t={t}
            emptyMsg="No stock transfers recorded yet."
          />
        </Card>
      )}

      {/* ── MODAL: ADD / EDIT SUB-BRANCH ────────────────────────────────────── */}
      <Modal
        open={branchModal}
        onClose={() => setBranchModal(false)}
        title={editBranch ? `Edit Sub-Branch: ${editBranch.name}` : "Register New Sub-Branch"}
        t={t}
        wide
        footer={
          <>
            <BtnOutline t={t} onClick={() => setBranchModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitBranch} disabled={saving}>
              {saving ? "Saving..." : editBranch ? "Save Changes" : "Create & Link Sub-Branch"}
            </BtnPrimary>
          </>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); submitBranch(); }}>
          <div style={{
            background: "rgba(59,85,230,0.06)",
            border: "1px solid rgba(59,85,230,0.2)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 12,
            color: t.textSub
          }}>
             <strong>Sub-Branch Linkage:</strong> This new showroom branch will be automatically linked under your primary business account. It will have independent billing, vault stock, and user accounts while synchronizing with central analytics.
          </div>

          <FormGrid>
            <FormGroup label="Sub-Branch Name *" t={t} half>
              <Input
                t={t}
                placeholder="e.g. Singarghar - Krishna Nagar Branch"
                value={branchForm.name}
                onChange={(e) => setBranchForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="City / Region *" t={t} half>
              <Input
                t={t}
                placeholder="e.g. Mathura"
                value={branchForm.city}
                onChange={(e) => setBranchForm((f) => ({ ...f, city: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="Showroom Full Address" t={t}>
              <Input
                t={t}
                placeholder="e.g. Shop No. 12, Krishna Nagar Main Market, Mathura - 281004"
                value={branchForm.address}
                onChange={(e) => setBranchForm((f) => ({ ...f, address: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Phone / Mobile Number" t={t} half>
              <Input
                t={t}
                placeholder="e.g. 9820011223"
                value={branchForm.phone}
                onChange={(e) => setBranchForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="GSTIN (Showroom Specific)" t={t} half>
              <Input
                t={t}
                placeholder="15-character GSTIN"
                value={branchForm.gstin}
                onChange={(e) => setBranchForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
              />
            </FormGroup>
            <FormGroup label="Status" t={t} half>
              <Select
                t={t}
                value={branchForm.status}
                onChange={(e) => setBranchForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="Active">Active Showroom</option>
                <option value="Inactive">Inactive / Renovation</option>
              </Select>
            </FormGroup>
          </FormGrid>
        </form>
      </Modal>

      {/* ── MODAL: CREATE STOCK TRANSFER ────────────────────────────────────── */}
      <Modal
        open={transferModal}
        onClose={() => setTransferModal(false)}
        title="Create Inter-Branch Stock Transfer"
        t={t}
        wide
        footer={
          <>
            <BtnOutline t={t} onClick={() => setTransferModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitTransfer} disabled={saving}>
              {saving ? "Generating..." : "Generate Transit Challan"}
            </BtnPrimary>
          </>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); submitTransfer(); }}>
          <FormGrid>
            <FormGroup label="Origin Showroom (Source) *" t={t} half>
              <Select
                t={t}
                value={transferForm.from_branch_id}
                onChange={(e) => setTransferForm((f) => ({ ...f, from_branch_id: e.target.value }))}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city || "Main Store"}) {b.id === userBranchId ? "· (Current Store)" : ""}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup label="Destination Showroom *" t={t} half>
              <Select
                t={t}
                value={transferForm.to_branch_id}
                onChange={(e) => setTransferForm((f) => ({ ...f, to_branch_id: e.target.value }))}
                required
              >
                <option value="">-- Select Destination Store --</option>
                {branches
                  .filter((b) => String(b.id) !== String(transferForm.from_branch_id))
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city || "Branch"}) · ID: #{b.id}
                    </option>
                  ))}
              </Select>
            </FormGroup>
            <FormGroup label="Product SKU / Barcode *" t={t} half>
              <Input
                t={t}
                placeholder="e.g. RING-SOL-001 or BR-GLD-004"
                value={transferForm.sku}
                onChange={(e) => setTransferForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                required
              />
            </FormGroup>
            <FormGroup label="Quantity / Item Units *" t={t} half>
              <Input
                t={t}
                type="number"
                step="0.001"
                placeholder="e.g. 1"
                value={transferForm.quantity}
                onChange={(e) => setTransferForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup label="Secure Transport Mode" t={t} half>
              <Select
                t={t}
                value={transferForm.transport_mode}
                onChange={(e) => setTransferForm((f) => ({ ...f, transport_mode: e.target.value }))}
              >
                <option value="Armored Van - Secure Logistics">Armored Van - Secure Logistics</option>
                <option value="Hand Carried - Authorized Vault Officer">Hand Carried - Authorized Vault Officer</option>
                <option value="Insured Registered Courier">Insured Registered Courier</option>
                <option value="Direct Store Staff Delivery">Direct Store Staff Delivery</option>
              </Select>
            </FormGroup>
            <FormGroup label="Dispatch Date" t={t} half>
              <Input
                t={t}
                type="date"
                value={transferForm.dispatch_date}
                onChange={(e) => setTransferForm((f) => ({ ...f, dispatch_date: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Transfer Notes / Transit Security Seals" t={t}>
              <Input
                t={t}
                placeholder="e.g. Vault Seal #SEC-8912, Kundan sets for Diwali exhibition"
                value={transferForm.notes}
                onChange={(e) => setTransferForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </FormGroup>
          </FormGrid>
        </form>
      </Modal>
    </div>
  );
}
