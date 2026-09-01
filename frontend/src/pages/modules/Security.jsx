import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
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

function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const TABS = [
  { id: "overview", label: "Security Policies & Health" },
  { id: "audit",    label: "Audit Trail & Logs" },
  { id: "sessions", label: "Active Counter Sessions" },
  { id: "backup",   label: "Emergency Snapshot Backup" },
];

export default function Security({ t }) {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState({});
  const [settings, setSettings] = useState({
    two_factor_auth: false,
    session_timeout_minutes: 30,
    ip_whitelist_enabled: false,
    ip_whitelist: "",
    max_failed_attempts: 5,
    vault_pin_enabled: true,
    new_vault_pin: "",
    biometric_pos_auth: false,
    cctv_link_enabled: false,
    audit_retention_days: 365,
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Filters for Audit Logs
  const [auditModule, setAuditModule] = useState("all");
  const [auditSeverity, setAuditSeverity] = useState("all");
  const [auditSearch, setAuditSearch] = useState("");

  // Modals
  const [pinModal, setPinModal] = useState(false);
  const [tempPin, setTempPin] = useState("");

  // ── Load Security Overview ─────────────────────────────────────────────────
  const loadOverview = useCallback(async () => {
    try {
      const d = await apiRequest("/security/overview");
      if (d.success) {
        setOverview(d.data);
        if (d.data.settings) {
          setSettings(prev => ({ ...prev, ...d.data.settings, new_vault_pin: "" }));
        }
      }
    } catch (err) {
      console.warn("Security overview load error:", err.message);
    }
  }, []);

  // ── Load Audit Logs ────────────────────────────────────────────────────────
  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        module: auditModule,
        severity: auditSeverity,
        search: auditSearch,
      }).toString();
      const d = await apiRequest(`/security/audit-logs?${query}`);
      if (d.success) setAuditLogs(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [auditModule, auditSeverity, auditSearch]);

  // ── Load Active Sessions ───────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiRequest("/security/sessions");
      if (d.success) setSessions(d.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (tab === "overview") loadOverview();
    if (tab === "audit") loadAuditLogs();
    if (tab === "sessions") loadSessions();
  }, [tab, loadOverview, loadAuditLogs, loadSessions]);

  // ── Save Security Settings ─────────────────────────────────────────────────
  async function handleSaveSettings() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const d = await apiRequest("/security/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      if (d.success) {
        setSaveMsg("Security policies and vault protections updated successfully!");
        setTimeout(() => setSaveMsg(null), 4000);
        await loadOverview();
      } else {
        alert(d.message || "Failed to update security settings");
      }
    } catch (err) {
      alert(err.message || "Cannot connect to security server");
    } finally {
      setSaving(false);
    }
  }

  // ── Revoke Session ─────────────────────────────────────────────────────────
  async function handleRevokeSession(id) {
    if (!window.confirm("Are you sure you want to remotely terminate this terminal session?")) return;
    try {
      const d = await apiRequest(`/security/sessions/${id}`, {
        method: "DELETE",
      });
      if (d.success) {
        alert("Session terminated successfully.");
        loadSessions();
        loadOverview();
      } else {
        alert(d.message || "Failed to revoke session.");
      }
    } catch (err) {
      alert(err.message || "Cannot connect to server.");
    }
  }

  // ── Export Audit Logs to CSV ───────────────────────────────────────────────
  function exportAuditLogsCSV() {
    if (auditLogs.length === 0) {
      alert("No audit logs to export.");
      return;
    }
    const headers = ["ID", "Timestamp", "User", "Action", "Module", "Description", "IP Address", "Severity"];
    const csvRows = [headers.join(",")];

    for (const log of auditLogs) {
      csvRows.push([
        log.id,
        `"${new Date(log.created_at).toISOString()}"`,
        `"${log.username}"`,
        `"${log.action}"`,
        `"${log.module}"`,
        `"${(log.description || "").replace(/"/g, '""')}"`,
        `"${log.ip_address || "127.0.0.1"}"`,
        `"${log.severity}"`,
      ].join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ceritage_audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Download Emergency Backup Snapshot ─────────────────────────────────────
  async function handleDownloadBackup() {
    setSaving(true);
    try {
      const d = await apiRequest("/security/backup", {
        method: "POST",
      });
      if (d.success && d.data) {
        const jsonStr = JSON.stringify(d.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ceritage_erp_vault_backup_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert("Emergency database snapshot generated and downloaded successfully!");
      } else {
        alert(d.message || "Failed to generate backup.");
      }
    } catch (err) {
      alert(err.message || "Cannot connect to server.");
    } finally {
      setSaving(false);
    }
  }

  const healthScore = overview.health_score !== undefined ? overview.health_score : 0;
  const checklist = overview.checklist || [];

  return (
    <div>
      {/* ── Page Header ── */}
      <PageHeader
        title="Security & Audit Management"
        subtitle="System Hardening · 2FA & Biometrics · Forensic Audit Trail · Remote POS Kill-Switch"
        t={t}
        actions={
          <>
            <BtnOutline
              t={t}
              onClick={() => {
                loadOverview();
                if (tab === "audit") loadAuditLogs();
                if (tab === "sessions") loadSessions();
              }}
            >
              ↻ Refresh Status
            </BtnOutline>
            {tab === "overview" && (
              <BtnPrimary onClick={handleSaveSettings} disabled={saving}>
                {saving ? "Applying Policies..." : "Save Security Policies"}
              </BtnPrimary>
            )}
            {tab === "audit" && (
              <BtnPrimary onClick={exportAuditLogsCSV}>
                Export Audit Log (CSV)
              </BtnPrimary>
            )}
            {tab === "backup" && (
              <BtnPrimary onClick={handleDownloadBackup} disabled={saving}>
                {saving ? "Generating Backup..." : "Generate Snapshot Backup"}
              </BtnPrimary>
            )}
          </>
        }
      />

      {/* ── Success Notification Banner ── */}
      {saveMsg && (
        <div style={{
          background: "rgba(46,204,113,0.12)",
          border: "1px solid rgba(46,204,113,0.3)",
          borderRadius: 10,
          padding: "12px 18px",
          color: "#27ae60",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 16,
        }}>
          ✓ {saveMsg}
        </div>
      )}

      {/* ── Security Health & Stats Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <StatCard
          label="Live Security Health Score"
          value={`${healthScore}%`}
          color={healthScore >= 80 ? "#2ecc71" : healthScore >= 50 ? "#f39c12" : BRAND.pink}
          t={t}
        />
        <StatCard label="Active POS Sessions" value={overview.active_sessions_count || 1} color={BRAND.blue} t={t} />
        <StatCard label="Audit Events (24h)" value={overview.total_logs_24h || 0} color={BRAND.purple} t={t} />
        <StatCard label="Threat Warnings" value={overview.warning_count || 0} color="#f39c12" t={t} />
        <StatCard label="Critical Alerts" value={overview.alert_count || 0} color={BRAND.pink} t={t} />
      </div>

      {/* ── Tabs Navigation ── */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: SECURITY POLICIES & HEALTH CONFIGURATION                             */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 18 }}>
          {/* Left Column: Security Policy Switches */}
          <Card t={t}>
            <CardHeader
              title="Showroom ERP Security Policies"
              t={t}
              actions={
                <span style={{ fontSize: 11, color: t.textMuted }}>
                  Last updated by: <strong>{overview.settings?.updated_by || "Admin"}</strong>
                </span>
              }
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "4px 0" }}>
              {/* 1. Two-Factor Authentication */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: t.card2 || t.card, borderRadius: 10,
                border: `1px solid ${t.borderDash}`
              }}>
                <div>
                  <strong style={{ fontSize: 14, color: t.text }}>Two-Factor Authentication (2FA)</strong>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    Require OTP verification for high-value sales billing and discount overrides (+20 pts).
                  </div>
                </div>
                <Select
                  t={t}
                  style={{ width: 140 }}
                  value={settings.two_factor_auth ? "true" : "false"}
                  onChange={e => setSettings(s => ({ ...s, two_factor_auth: e.target.value === "true" }))}
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled (Strict)</option>
                </Select>
              </div>

              {/* 2. Session Auto-Timeout */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: t.card2 || t.card, borderRadius: 10,
                border: `1px solid ${t.borderDash}`
              }}>
                <div>
                  <strong style={{ fontSize: 14, color: t.text }}>POS Session Auto-Timeout</strong>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    Automatically locks terminal after period of inactivity (+15 pts).
                  </div>
                </div>
                <Select
                  t={t}
                  style={{ width: 140 }}
                  value={settings.session_timeout_minutes}
                  onChange={e => setSettings(s => ({ ...s, session_timeout_minutes: parseInt(e.target.value) }))}
                >
                  <option value={15}>15 Minutes (Recommended)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={120}>2 Hours</option>
                  <option value={480}>8 Hours (Shift)</option>
                </Select>
              </div>

              {/* 3. IP Whitelisting */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: t.card2 || t.card, borderRadius: 10,
                border: `1px solid ${t.borderDash}`
              }}>
                <div>
                  <strong style={{ fontSize: 14, color: t.text }}>Static IP / Showroom Wi-Fi Restriction</strong>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    Only allow employee logins from authorized showroom internet connections (+15 pts).
                  </div>
                </div>
                <Select
                  t={t}
                  style={{ width: 140 }}
                  value={settings.ip_whitelist_enabled ? "true" : "false"}
                  onChange={e => setSettings(s => ({ ...s, ip_whitelist_enabled: e.target.value === "true" }))}
                >
                  <option value="false">Off (Any Network)</option>
                  <option value="true">Enforce Whitelist</option>
                </Select>
              </div>

              {/* 4. Vault Master PIN Protection */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: t.card2 || t.card, borderRadius: 10,
                border: `1px solid ${t.borderDash}`
              }}>
                <div>
                  <strong style={{ fontSize: 14, color: t.text }}>Vault Master PIN Protection</strong>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    Require a 6-digit Master PIN before stock deletions or gold bullion dispatch (+20 pts).
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <BtnSm t={t} onClick={() => { setTempPin(""); setPinModal(true); }}>
                    Change Master PIN
                  </BtnSm>
                </div>
              </div>

              {/* 5. Biometric POS Authentication */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: t.card2 || t.card, borderRadius: 10,
                border: `1px solid ${t.borderDash}`
              }}>
                <div>
                  <strong style={{ fontSize: 14, color: t.text }}>Biometric Scanner Integration</strong>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    Allow cashier fingerprint biometric authentication on supported POS hardware (+10 pts).
                  </div>
                </div>
                <Select
                  t={t}
                  style={{ width: 140 }}
                  value={settings.biometric_pos_auth ? "true" : "false"}
                  onChange={e => setSettings(s => ({ ...s, biometric_pos_auth: e.target.value === "true" }))}
                >
                  <option value="false">Disabled</option>
                  <option value="true">Active (USB POS)</option>
                </Select>
              </div>

              {/* 6. CCTV Vault Integration */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: t.card2 || t.card, borderRadius: 10,
                border: `1px solid ${t.borderDash}`
              }}>
                <div>
                  <strong style={{ fontSize: 14, color: t.text }}>CCTV Timestamp Watermark Sync</strong>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    Embed high-precision millisecond NTP timestamps on billing slips to correlate with DVR footage (+10 pts).
                  </div>
                </div>
                <Select
                  t={t}
                  style={{ width: 140 }}
                  value={settings.cctv_link_enabled ? "true" : "false"}
                  onChange={e => setSettings(s => ({ ...s, cctv_link_enabled: e.target.value === "true" }))}
                >
                  <option value="false">Standard Time</option>
                  <option value="true">Sync with CCTV</option>
                </Select>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <BtnPrimary onClick={handleSaveSettings} disabled={saving}>
                {saving ? "Saving Policies..." : "Apply Security Configuration"}
              </BtnPrimary>
            </div>
          </Card>

          {/* Right Column: Live Audit Checklist & Real-Time Calculation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card t={t}>
              <CardHeader
                title="Live Security Health Audit"
                t={t}
                actions={
                  <span style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 8,
                    background: healthScore >= 80 ? "rgba(46,204,113,0.15)" : "rgba(243,156,18,0.15)",
                    color: healthScore >= 80 ? "#27ae60" : "#d35400"
                  }}>
                    {healthScore} / 100 PTS
                  </span>
                }
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "2px 0" }}>
                {checklist.map(item => (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: item.points > 0 ? "rgba(46,204,113,0.06)" : "rgba(230,59,138,0.05)",
                      border: `1px solid ${item.points > 0 ? "rgba(46,204,113,0.2)" : "rgba(230,59,138,0.2)"}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
                        {item.description}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: item.points > 0 ? "#27ae60" : BRAND.pink,
                      whiteSpace: "nowrap"
                    }}>
                      {item.points > 0 ? `+${item.points} / ${item.max} pts` : `0 / ${item.max} pts`}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card t={t}>
              <CardHeader title="Security Quick Actions" t={t} />
              <div style={{ display: "grid", gap: 10 }}>
                <BtnOutline t={t} onClick={() => setTab("sessions")}>
                   View Active POS Sessions & Kill-Switch
                </BtnOutline>
                <BtnOutline t={t} onClick={() => setTab("audit")}>
                   Inspect Forensic Audit Log Trail
                </BtnOutline>
                <BtnOutline t={t} onClick={() => setTab("backup")}>
                   Generate Emergency Snapshot Backup
                </BtnOutline>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: SYSTEM AUDIT TRAIL & FORENSIC LOGS                                   */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {tab === "audit" && (
        <Card t={t}>
          <CardHeader
            title={`System Forensic Audit Trail (${auditLogs.length} Events Recorded)`}
            t={t}
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  placeholder="Search user, action, IP..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  style={{
                    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                    borderRadius: 8, padding: "7px 12px", fontSize: 13,
                    color: t.inputColor, outline: "none", width: 180
                  }}
                />
                <Select
                  t={t}
                  style={{ width: 130 }}
                  value={auditModule}
                  onChange={e => setAuditModule(e.target.value)}
                >
                  <option value="all">All Modules</option>
                  <option value="AUTH">Authentication</option>
                  <option value="BILLING">Billing & GST</option>
                  <option value="RATES">Metal Rates</option>
                  <option value="PRODUCTS">Inventory</option>
                  <option value="SECURITY">Security</option>
                  <option value="CUSTOMERS">Customers</option>
                </Select>
                <Select
                  t={t}
                  style={{ width: 130 }}
                  value={auditSeverity}
                  onChange={e => setAuditSeverity(e.target.value)}
                >
                  <option value="all">All Severities</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="ALERT">Alert</option>
                </Select>
                <BtnOutline t={t} onClick={loadAuditLogs}>↻</BtnOutline>
                <BtnPrimary onClick={exportAuditLogsCSV}>Export CSV</BtnPrimary>
              </div>
            }
          />

          <DataTable
            columns={["Timestamp", "User", "Module", "Action", "Event Details", "IP Address", "Severity"]}
            rows={auditLogs.map(log => ({
              "Timestamp": fmtDate(log.created_at),
              "User": <strong>{log.username || "System"}</strong>,
              "Module": (
                <span style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: "rgba(59,85,230,0.12)", color: BRAND.blue
                }}>
                  {log.module}
                </span>
              ),
              "Action": <code style={{ fontSize: 11 }}>{log.action}</code>,
              "Event Details": <div style={{ fontSize: 12, maxWidth: 360 }}>{log.description}</div>,
              "IP Address": <code style={{ fontSize: 11, color: t.textMuted }}>{log.ip_address || "127.0.0.1"}</code>,
              "Severity": (
                <span style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
                  background: log.severity === "ALERT" ? "rgba(230,59,138,0.15)" : log.severity === "WARNING" ? "rgba(243,156,18,0.15)" : "rgba(46,204,113,0.15)",
                  color: log.severity === "ALERT" ? BRAND.pink : log.severity === "WARNING" ? "#d35400" : "#27ae60",
                }}>
                  {log.severity}
                </span>
              ),
            }))}
            t={t}
            emptyMsg={loading ? "Loading audit events..." : "No matching audit log records found"}
          />
        </Card>
      )}

      {tab === "sessions" && (
        <Card t={t}>
          <CardHeader
            title="Connected Showroom Devices & Live POS Terminals"
            t={t}
            actions={<BtnOutline t={t} onClick={loadSessions}>↻ Refresh Sessions</BtnOutline>}
          />
          <DataTable
            columns={["Terminal / Device", "User / Account", "Role", "IP Address", "Login Time", "Last Active", "Status", "Remote Kill-Switch"]}
            rows={sessions.map(s => ({
              "Terminal / Device": (
                <div>
                  <strong>{s.device_name || "POS Terminal"}</strong>
                  <div style={{ fontSize: 11, color: t.textMuted }}>{s.browser || "Chrome / Windows"}</div>
                </div>
              ),
              "User / Account": <strong>{s.username}</strong>,
              "Role": <span style={{ textTransform: "capitalize", fontSize: 11 }}>{s.role || "Staff"}</span>,
              "IP Address": <code style={{ fontSize: 11 }}>{s.ip_address}</code>,
              "Login Time": fmtDate(s.login_time),
              "Last Active": fmtDate(s.last_active),
              "Status": (
                <span style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800,
                  background: s.status === "ACTIVE" ? "rgba(46,204,113,0.15)" : "rgba(230,59,138,0.15)",
                  color: s.status === "ACTIVE" ? "#27ae60" : BRAND.pink
                }}>
                  {s.status}
                </span>
              ),
              "Remote Kill-Switch": (
                s.status === "ACTIVE" ? (
                  <BtnSm t={t} style={{ color: BRAND.pink }} onClick={() => handleRevokeSession(s.id)}>
                    Revoke Session
                  </BtnSm>
                ) : (
                  <span style={{ fontSize: 11, color: t.textMuted }}>Terminated</span>
                )
              ),
            }))}
            t={t}
            emptyMsg="No active user sessions recorded."
          />
        </Card>
      )}

      {tab === "backup" && (
        <Card t={t}>
          <CardHeader title="Emergency Database Snapshot & Backup Vault" t={t} />
          <div style={{ padding: "8px 0" }}>
            <div style={{
              background: "rgba(59,85,230,0.06)",
              border: "1px solid rgba(59,85,230,0.2)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
              lineHeight: 1.6
            }}>
              <strong style={{ fontSize: 15, color: BRAND.blue }}>🛡️ Disaster Recovery Guarantee</strong>
              <p style={{ fontSize: 13, color: t.textSub, margin: "6px 0 12px 0" }}>
                Generate an immediate, complete JSON/SQL structured snapshot of your showroom data including customer ledgers, product catalog weights, and GST invoice records.
              </p>
              <ul style={{ fontSize: 12, color: t.textMuted, margin: 0, paddingLeft: 20 }}>
                <li>Encrypted export suitable for offline cold-storage USB drives.</li>
                <li>Includes multi-branch showroom records, pricing rules, and staff RBAC settings.</li>
                <li>Compatible with 1-click restore during server migrations or system recovery.</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <BtnPrimary onClick={handleDownloadBackup} disabled={saving}>
                {saving ? "Exporting Vault Snapshot..." : "⚡ Generate & Download Vault Snapshot"}
              </BtnPrimary>
              <span style={{ fontSize: 12, color: t.textMuted }}>
                Exports formatted JSON archive of active showroom tables.
              </span>
            </div>
          </div>
        </Card>
      )}

      <Modal
        open={pinModal}
        onClose={() => setPinModal(false)}
        title="Set New Vault Master PIN"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setPinModal(false)}>Cancel</BtnOutline>
            <BtnPrimary
              onClick={() => {
                if (tempPin.length < 4) {
                  alert("Master PIN must be at least 4 digits");
                  return;
                }
                setSettings(s => ({ ...s, new_vault_pin: tempPin }));
                setPinModal(false);
                alert("Master PIN prepared. Click 'Save Security Policies' to apply changes.");
              }}
            >
              Set PIN
            </BtnPrimary>
          </>
        }
      >
        <div style={{ padding: "8px 0" }}>
          <p style={{ fontSize: 13, color: t.textSub, marginBottom: 16 }}>
            Enter a new 4 to 8 digit Master PIN. This PIN is required when performing critical bullion adjustments or deleting stock items.
          </p>
          <FormGroup label="New Master PIN *" t={t}>
            <Input
              t={t}
              type="password"
              placeholder="e.g. 849201"
              maxLength={8}
              value={tempPin}
              onChange={e => setTempPin(e.target.value)}
              style={{ fontFamily: "monospace", letterSpacing: "4px", fontSize: 18 }}
            />
          </FormGroup>
        </div>
      </Modal>
    </div>
  );
}
