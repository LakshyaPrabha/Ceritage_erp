import { useState, useEffect, useCallback } from "react";
import { BRAND } from "../../theme.js";
import { PageHeader, Card, CardHeader, StatCard, DataTable, BtnPrimary, BtnOutline, BtnSm,
         FormGroup, FormGrid, Select, Input, Modal, Tabs, SectionTitle } from "../../components/ui";
import { apiRequest, formatCurrency } from "../../lib/api";

const COMM_TABS = [
  { id:"overview",    label:"Overview & Campaigns" },
  { id:"occasions",   label:"Birthday & Anniversary" },
  { id:"emi_due",     label:"EMI & Due Reminders" },
  { id:"history",     label:"Message History (Logs)" },
  { id:"templates",   label:"Message Templates" },
  { id:"settings",    label:"Provider Settings" },
];

export default function Communication({ t }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Providers Status
  const [providerStatus, setProviderStatus] = useState({
    testMode: true,
    sms: { provider: "MSG91", enabled: false, configured: false },
    whatsapp: { provider: "Meta Cloud API", enabled: false, configured: false }
  });

  // Occasions State
  const [occasionKpis, setOccasionKpis] = useState({});
  const [occasions, setOccasions] = useState([]);
  const [occRange, setOccRange] = useState("7d");
  const [occFilter, setOccFilter] = useState("all");

  // Communication Logs State
  const [logs, setLogs] = useState([]);
  const [logMeta, setLogMeta] = useState({ total: 0, sentToday: 0 });
  const [logChannelFilter, setLogChannelFilter] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("");
  const [logSearch, setLogSearch] = useState("");

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [templateCategory, setTemplateCategory] = useState("");

  // EMI & Dues for reminders
  const [emiList, setEmiList] = useState([]);
  const [duesList, setDuesList] = useState([]);

  // Direct Message Modal
  const [sendModal, setSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    customer_id: "", channel: "SMS", template_code: "BDAY_SMS",
    custom_message: "", coupon_code: ""
  });
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState("");

  // Batch trigger states
  const [batchLoading, setBatchLoading] = useState(false);

  // Load Providers Status
  const loadProviders = useCallback(async () => {
    try {
      const res = await apiRequest("/communications/providers/status");
      if (res?.data) setProviderStatus(res.data);
    } catch (err) {
      console.warn("Provider status error:", err.message);
    }
  }, []);

  // Load Occasion Data
  const loadOccasions = useCallback(async () => {
    try {
      const [kpiRes, occRes] = await Promise.all([
        apiRequest("/customers/occasions/kpis"),
        apiRequest(`/customers/occasions?range=${occRange}&occasion=${occFilter}`),
      ]);
      setOccasionKpis(kpiRes.data || {});
      setOccasions(occRes.data || []);
    } catch (err) {
      console.warn("Occasion error:", err.message);
    }
  }, [occRange, occFilter]);

  // Load Logs
  const loadLogs = useCallback(async () => {
    try {
      let q = "/communications/logs?limit=50";
      if (logChannelFilter) q += `&channel=${logChannelFilter}`;
      if (logStatusFilter) q += `&status=${logStatusFilter}`;
      if (logSearch) q += `&search=${encodeURIComponent(logSearch)}`;
      const res = await apiRequest(q);
      setLogs(res.data || []);
      setLogMeta(res.meta || { total: 0, sentToday: 0 });
    } catch (err) {
      console.warn("Logs error:", err.message);
    }
  }, [logChannelFilter, logStatusFilter, logSearch]);

  // Load Templates
  const loadTemplates = useCallback(async () => {
    try {
      let q = "/communications/templates";
      if (templateCategory) q += `?category=${templateCategory}`;
      const res = await apiRequest(q);
      setTemplates(res.data || []);
    } catch (err) {
      console.warn("Templates error:", err.message);
    }
  }, [templateCategory]);

  // Load EMI & Dues
  const loadEmiAndDues = useCallback(async () => {
    try {
      const [emiRes, duesRes] = await Promise.all([
        apiRequest("/emi/reports/due"),
        apiRequest("/customers/reports/dues"),
      ]);
      setEmiList(emiRes.data || []);
      setDuesList(duesRes.data || []);
    } catch (err) {
      console.warn("EMI/Dues error:", err.message);
    }
  }, []);

  useEffect(() => {
    loadProviders();
    loadOccasions();
    loadLogs();
    loadTemplates();
    loadEmiAndDues();
  }, [loadProviders, loadOccasions, loadLogs, loadTemplates, loadEmiAndDues]);

  // Handle Direct Send
  const handleDirectSend = async (e) => {
    e.preventDefault();
    setSendingMsg(true);
    setSendResultMsg("");
    try {
      const res = await apiRequest("/communications/send", {
        method: "POST",
        body: JSON.stringify({
          customer_id: sendForm.customer_id,
          channel: sendForm.channel,
          template_code: sendForm.template_code,
          variables: {
            coupon_code: sendForm.coupon_code || undefined
          },
          event_type: "MANUAL_DISPATCH"
        })
      });

      if (res.success) {
        setSendResultMsg(res.message || 'Message successfully sent!');
        await loadLogs();
        setTimeout(() => setSendModal(false), 1500);
      } else {
        setSendResultMsg(res.message);
      }
    } catch (err) {
      setSendResultMsg(err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  // Quick Send Occasion Greeting
  const handleQuickSendOccasion = async (occ, channel) => {
    if (!confirm(`Send ${channel} greeting to ${occ.customerName}?`)) return;
    try {
      const res = await apiRequest("/communications/send", {
        method: "POST",
        body: JSON.stringify({
          customer_id: occ.customerId,
          channel,
          template_code: channel === "WHATSAPP" ? (occ.occasionType === "BIRTHDAY" ? "BDAY_WA" : "ANNIV_WA") : (occ.occasionType === "BIRTHDAY" ? "BDAY_SMS" : "ANNIV_SMS"),
          event_type: occ.occasionType,
          event_reference: String(occ.occurrenceYear)
        })
      });

      if (res.success) {
        alert(res.message);
        await loadLogs();
        await loadOccasions();
      } else {
        alert(`Notice: ${res.message}`);
      }
    } catch (err) {
      alert(`Could not send: ${err.message}`);
    }
  };

  // Quick Send EMI Reminder
  const handleQuickSendEmi = async (emi) => {
    try {
      const res = await apiRequest("/communications/send", {
        method: "POST",
        body: JSON.stringify({
          customer_id: emi.customer_id,
          channel: "SMS",
          template_code: "EMI_DUE_SMS",
          variables: {
            due_amount: Number(emi.amount),
            due_date: new Date(emi.due_date).toLocaleDateString("en-IN")
          },
          event_type: "EMI_REMINDER",
          event_reference: String(emi.id)
        })
      });
      alert(res.message);
      await loadLogs();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Trigger automated occasion batch
  const handleRunOccasionBatch = async () => {
    setBatchLoading(true);
    try {
      const res = await apiRequest("/communications/dispatch/occasions", { method: "POST" });
      alert(`Batch Completed: Dispatched: ${res.data.dispatched}, Skipped: ${res.data.skipped}, Evaluated: ${res.data.totalEvaluated}`);
      await loadLogs();
    } catch (err) {
      alert(`Batch execution error: ${err.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Communication & Message Hub"
        subtitle="MSG91 SMS · Configurable WhatsApp API · Automated Occasion Greetings · EMI & Payment Dues Dispatch"
        t={t}
        actions={<>
          <BtnPrimary onClick={() => { setSendResultMsg(""); setSendModal(true); }}>
            + Direct Send Message
          </BtnPrimary>
        </>}
      />

      {/* ── Test Mode Notice Banner ── */}
      {providerStatus.testMode && (
        <div style={{
          background:`${BRAND.blue}15`, border:`1px solid ${BRAND.blue}44`,
          padding:"10px 16px", borderRadius:10, marginBottom:16,
          display:"flex", justifyContent:"space-between", alignItems:"center"
        }}>
          <div style={{ fontSize:13, color:t.text }}>
            <strong>Safe Test Mode Active:</strong> External network calls are safely emulated and logged to <code>communication_logs</code>. No real charges or customer SMS are triggered.
          </div>
          <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", background:BRAND.blue, color:"#fff", borderRadius:6 }}>
            TEST_MODE=true
          </span>
        </div>
      )}

      {/* ── Tabs Navigation ── */}
      <Tabs tabs={COMM_TABS} active={activeTab} onChange={setActiveTab} t={t} />

      {/* ── TAB 1: OVERVIEW & CAMPAIGNS ── */}
      {activeTab === "overview" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:20 }}>
            <StatCard label="Messages Today"   value={logMeta.sentToday ?? 0} color={BRAND.purple} t={t} />
            <StatCard label="Total Logged"     value={logMeta.total ?? 0}     color={BRAND.blue}   t={t} />
            <StatCard label="Birthdays Today" value={occasionKpis.birthdaysToday ?? 0} color="#27ae60" t={t} />
            <StatCard label="Anniversaries Today" value={occasionKpis.anniversariesToday ?? 0} color="#e67e22" t={t} />
            <StatCard label="Active Templates" value={templates.length}       color="#8e44ad"      t={t} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:16, marginBottom:20 }}>
            {/* Quick Automation Dispatch Card */}
            <Card t={t} style={{ marginBottom:0 }}>
              <CardHeader title="Automated Daily Dispatch Jobs" t={t} />
              <div style={{ display:"grid", gap:12, padding:"0 16px 16px 16px" }}>
                <div style={{
                  background:t.card2||t.card, border:`1px solid ${t.borderDash}`,
                  borderRadius:10, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center"
                }}>
                  <div>
                    <strong style={{ fontSize:14 }}>Daily Occasion Greetings (09:00 IST)</strong>
                    <div style={{ fontSize:12, color:t.textMuted, marginTop:2 }}>
                      Scans birthdays & anniversaries today and dispatches personalized greetings via customer's preferred channel.
                    </div>
                  </div>
                  <BtnPrimary
                    style={{ padding:"6px 14px", fontSize:12 }}
                    onClick={handleRunOccasionBatch}
                    disabled={batchLoading}
                  >
                    {batchLoading ? "Running..." : "Run Now"}
                  </BtnPrimary>
                </div>

                <div style={{
                  background:t.card2||t.card, border:`1px solid ${t.borderDash}`,
                  borderRadius:10, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center"
                }}>
                  <div>
                    <strong style={{ fontSize:14 }}>Daily EMI Due Reminders (10:00 IST)</strong>
                    <div style={{ fontSize:12, color:t.textMuted, marginTop:2 }}>
                      Alerts customers with installments due in the next 48 hours.
                    </div>
                  </div>
                  <BtnOutline
                    t={t}
                    style={{ padding:"6px 14px", fontSize:12 }}
                    onClick={async () => {
                      const res = await apiRequest("/communications/dispatch/emi", { method: "POST" });
                      alert(`EMI Batch Finished: Dispatched: ${res.data.dispatched}`);
                      await loadLogs();
                    }}
                  >
                    Run Now
                  </BtnOutline>
                </div>
              </div>
            </Card>

            {/* Provider Connectivity Status */}
            <Card t={t} style={{ marginBottom:0 }}>
              <CardHeader title="Gateway Connectivity Status" t={t} />
              <div style={{ display:"grid", gap:10, padding:"0 16px 16px 16px" }}>
                <div style={{
                  background:t.card2||t.card, border:`1px solid ${t.borderDash}`,
                  borderRadius:8, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center"
                }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>SMS Gateway (MSG91)</div>
                    <div style={{ fontSize:11, color:t.textMuted }}>DLT Template Compliant · Sender ID: {providerStatus.sms?.senderId}</div>
                  </div>
                  <span style={{
                    padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:700,
                    background: providerStatus.testMode ? `${BRAND.blue}22` : (providerStatus.sms?.enabled ? "#2ecc7122" : "#95a5a622"),
                    color: providerStatus.testMode ? BRAND.blue : (providerStatus.sms?.enabled ? "#27ae60" : "#7f8c8d")
                  }}>
                    {providerStatus.testMode ? "Test Mode (Active)" : (providerStatus.sms?.enabled ? "Connected" : "Not Configured")}
                  </span>
                </div>

                <div style={{
                  background:t.card2||t.card, border:`1px solid ${t.borderDash}`,
                  borderRadius:8, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center"
                }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>WhatsApp API ({providerStatus.whatsapp?.provider})</div>
                    <div style={{ fontSize:11, color:t.textMuted }}>Template-based messaging · Phone ID: {providerStatus.whatsapp?.phoneId}</div>
                  </div>
                  <span style={{
                    padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:700,
                    background: providerStatus.testMode ? `${BRAND.blue}22` : (providerStatus.whatsapp?.enabled ? "#2ecc7122" : "#95a5a622"),
                    color: providerStatus.testMode ? BRAND.blue : (providerStatus.whatsapp?.enabled ? "#27ae60" : "#7f8c8d")
                  }}>
                    {providerStatus.testMode ? "Test Mode (Active)" : (providerStatus.whatsapp?.enabled ? "Connected" : "Not Configured")}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: BIRTHDAY & ANNIVERSARY OCCASIONS ── */}
      {activeTab === "occasions" && (
        <Card t={t}>
          <CardHeader
            title="Birthday & Anniversary Celebrations Dispatch"
            t={t}
            actions={<>
              <Select
                t={t}
                style={{ width:150 }}
                value={occRange}
                onChange={(e) => setOccRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="7d">Next 7 Days</option>
                <option value="30d">Next 30 Days</option>
                <option value="month">This Month</option>
              </Select>
              <BtnOutline t={t} onClick={loadOccasions}>Refresh</BtnOutline>
            </>}
          />
          <DataTable
            columns={["Customer", "Occasion", "Celebration Date", "Countdown", "Tier", "Consent Status", "Dispatch Actions"]}
            rows={occasions.map(o => ({
              Customer: (
                <div>
                  <strong>{o.customerName}</strong>
                  <div style={{ fontSize:11, color:t.textMuted }}>{o.custCode} · {o.phone}</div>
                </div>
              ),
              Occasion: (
                <span style={{
                  padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:700,
                  background: o.occasionType === "BIRTHDAY" ? `${BRAND.purple}22` : "#e67e2222",
                  color: o.occasionType === "BIRTHDAY" ? BRAND.purple : "#d35400"
                }}>
                  {o.occasionType === "BIRTHDAY" ? "Birthday" : "Anniversary"}
                </span>
              ),
              "Celebration Date": o.occasionDate ? new Date(o.occasionDate).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "-",
              Countdown: (
                <strong style={{ color: o.daysUntil === 0 ? "#27ae60" : BRAND.purple }}>
                  {o.daysUntil === 0 ? "TODAY!" : `In ${o.daysUntil} days`}
                </strong>
              ),
              Tier: <span style={{ fontWeight:700, color: o.badgeColor || BRAND.purple }}>{o.tier}</span>,
              "Consent Status": (
                <span style={{ fontSize:11, color:t.textMuted }}>
                  WA: {o.preferences.optInWhatsapp ? "Yes" : "No"} | SMS: {o.preferences.optInSms ? "Yes" : "No"}
                </span>
              ),
              "Dispatch Actions": (
                <div style={{ display:"flex", gap:6 }}>
                  <BtnSm t={t} primary onClick={() => handleQuickSendOccasion(o, "SMS")}>
                    Send SMS
                  </BtnSm>
                  <BtnSm t={t} onClick={() => handleQuickSendOccasion(o, "WHATSAPP")}>
                    Send WhatsApp
                  </BtnSm>
                </div>
              )
            }))}
            t={t}
            emptyMsg="No celebrations found for the selected time window"
          />
        </Card>
      )}

      {/* ── TAB 3: EMI & DUE REMINDERS ── */}
      {activeTab === "emi_due" && (
        <div>
          <Card t={t} style={{ marginBottom:16 }}>
            <CardHeader title="Pending Jewellery EMI Installments" t={t} />
            <DataTable
              columns={["Customer", "Plan ID", "Installment #", "Due Date", "Amount (₹)", "Status", "Action"]}
              rows={emiList.map(em => ({
                Customer: <strong>{em.customer_name}</strong>,
                "Plan ID": <code>{em.plan_id}</code>,
                "Installment #": `Inst #${em.installment_no}`,
                "Due Date": em.due_date ? new Date(em.due_date).toLocaleDateString("en-IN") : "-",
                "Amount (₹)": <strong>{formatCurrency(em.amount)}</strong>,
                Status: (
                  <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700, background:"#e74c3c22", color:BRAND.pink }}>
                    {em.status || "PENDING"}
                  </span>
                ),
                Action: (
                  <BtnSm t={t} primary onClick={() => handleQuickSendEmi(em)}>
                    Send EMI SMS
                  </BtnSm>
                )
              }))}
              t={t}
              emptyMsg="No pending EMI installments found requiring reminder dispatch."
            />
          </Card>

          <Card t={t}>
            <CardHeader title="Outstanding Customer Balance Dues" t={t} />
            <DataTable
              columns={["Customer ID", "Customer Name", "Phone", "Outstanding Due (₹)", "Action"]}
              rows={duesList.map(d => ({
                "Customer ID": <code>{d.customer_id || `CUST-${d.id}`}</code>,
                "Customer Name": <strong>{d.full_name}</strong>,
                "Phone": d.phone,
                "Outstanding Due (₹)": <strong style={{ color:BRAND.pink }}>{formatCurrency(d.balance_due)}</strong>,
                Action: (
                  <BtnSm t={t} onClick={async () => {
                    const res = await apiRequest("/communications/send", {
                      method: "POST",
                      body: JSON.stringify({
                        customer_id: d.id,
                        channel: "SMS",
                        template_code: "DUE_REMINDER_SMS",
                        variables: { due_amount: d.balance_due },
                        event_type: "PAYMENT_REMINDER",
                        event_reference: new Date().toISOString().slice(0, 7)
                      })
                    });
                    alert(res.message);
                    await loadLogs();
                  }}>
                    Send Due Reminder
                  </BtnSm>
                )
              }))}
              t={t}
              emptyMsg="No outstanding dues found"
            />
          </Card>
        </div>
      )}

      {/* ── TAB 4: MESSAGE HISTORY (COMMUNICATION LOGS) ── */}
      {activeTab === "history" && (
        <Card t={t}>
          <CardHeader
            title="Communication Audit & Dispatch History"
            t={t}
            actions={<>
              <input
                placeholder="Search recipient, name, message..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                style={{
                  background:t.inputBg, border:`1px solid ${t.inputBorder}`,
                  borderRadius:8, padding:"7px 12px", fontSize:13,
                  color:t.inputColor, outline:"none", fontFamily:"inherit", width:220
                }}
              />
              <Select
                t={t}
                style={{ width:130 }}
                value={logChannelFilter}
                onChange={(e) => setLogChannelFilter(e.target.value)}
              >
                <option value="">All Channels</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </Select>
              <Select
                t={t}
                style={{ width:130 }}
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="SENT">SENT</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="SKIPPED">SKIPPED</option>
                <option value="FAILED">FAILED</option>
              </Select>
              <BtnOutline t={t} onClick={loadLogs}>Refresh</BtnOutline>
            </>}
          />
          <DataTable
            columns={["Timestamp", "Customer", "Channel", "Template", "Message Content", "Status", "Provider Message ID"]}
            rows={logs.map(l => ({
              Timestamp: l.created_at ? new Date(l.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "-",
              Customer: (
                <div>
                  <strong>{l.customer_name}</strong>
                  <div style={{ fontSize:11, color:t.textMuted }}>{l.recipient}</div>
                </div>
              ),
              Channel: (
                <span style={{
                  padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                  background: l.channel === "WHATSAPP" ? "#27ae6022" : "#3498db22",
                  color: l.channel === "WHATSAPP" ? "#27ae60" : "#2980b9"
                }}>
                  {l.channel === "WHATSAPP" ? "WhatsApp" : "SMS"}
                </span>
              ),
              Template: <code>{l.template_code}</code>,
              "Message Content": <div style={{ fontSize:12, maxWidth:320 }}>{l.message_preview}</div>,
              Status: (
                <span style={{
                  padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                  background: l.status === "SENT" || l.status === "DELIVERED" ? "#2ecc7122" : (l.status === "SKIPPED" ? "#f39c1222" : "#e74c3c22"),
                  color: l.status === "SENT" || l.status === "DELIVERED" ? "#27ae60" : (l.status === "SKIPPED" ? "#d35400" : BRAND.pink)
                }}>
                  {l.status}{l.is_test ? " (Test)" : ""}
                </span>
              ),
              "Provider Message ID": <code>{l.provider_message_id || "-"}</code>
            }))}
            t={t}
            emptyMsg="No communication records match the search filter."
          />
        </Card>
      )}

      {/* ── TAB 5: MESSAGE TEMPLATES ── */}
      {activeTab === "templates" && (
        <Card t={t}>
          <CardHeader
            title="Message Templates & DLT Register"
            t={t}
            actions={<>
              <Select
                t={t}
                style={{ width:180 }}
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="BIRTHDAY">Birthdays</option>
                <option value="ANNIVERSARY">Anniversaries</option>
                <option value="EMI_REMINDER">EMI Reminders</option>
                <option value="PAYMENT_REMINDER">Payment Dues</option>
                <option value="REPAIR_READY">Repair Ready</option>
                <option value="ORDER_READY">Order Ready</option>
              </Select>
              <BtnOutline t={t} onClick={loadTemplates}>Refresh</BtnOutline>
            </>}
          />
          <DataTable
            columns={["Code", "Name", "Channel", "Category", "Provider ID / Flow", "Content Template", "Status"]}
            rows={templates.map(tp => ({
              Code: <code>{tp.template_code}</code>,
              Name: <strong>{tp.name}</strong>,
              Channel: (
                <span style={{
                  padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700,
                  background: tp.channel === "WHATSAPP" ? "#27ae6022" : "#3498db22",
                  color: tp.channel === "WHATSAPP" ? "#27ae60" : "#2980b9"
                }}>
                  {tp.channel}
                </span>
              ),
              Category: tp.category,
              "Provider ID / Flow": <code>{tp.provider_template_id || "-"}</code>,
              "Content Template": <div style={{ fontSize:12, maxWidth:300 }}>{tp.content}</div>,
              Status: tp.is_active ? <span style={{ color:"#27ae60", fontWeight:700 }}>Active</span> : <span style={{ color:BRAND.pink }}>Inactive</span>
            }))}
            t={t}
          />
        </Card>
      )}

      {/* ── TAB 6: PROVIDER SETTINGS ── */}
      {activeTab === "settings" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card t={t}>
            <CardHeader title="MSG91 SMS Configuration" t={t} />
            <div style={{ padding:"0 16px 16px 16px", fontSize:13, lineHeight:1.6 }}>
              <p>
                MSG91 is the primary Indian SMS gateway provider for transactional, DLT-compliant, and milestone messaging.
              </p>
              <div style={{ background:t.card2||t.card, padding:12, borderRadius:8, border:`1px solid ${t.borderDash}`, marginBottom:12 }}>
                <div><strong>Status:</strong> {providerStatus.sms?.enabled ? "Enabled" : "Disabled (Controlled via .env)"}</div>
                <div><strong>Sender ID:</strong> <code>{providerStatus.sms?.senderId}</code></div>
                <div><strong>DLT Flow Templates:</strong> Verified</div>
              </div>
              <div style={{ fontSize:12, color:t.textMuted }}>
                To enable live SMS dispatch, configure <code>MSG91_AUTH_KEY</code>, <code>MSG91_SENDER_ID</code>, and set <code>MSG91_ENABLED=true</code> in your backend <code>.env</code>.
              </div>
            </div>
          </Card>

          <Card t={t}>
            <CardHeader title="WhatsApp Cloud API Configuration" t={t} />
            <div style={{ padding:"0 16px 16px 16px", fontSize:13, lineHeight:1.6 }}>
              <p>
                WhatsApp gateway architecture is provider-agnostic and ready for Meta Cloud API or verified Business Service Providers.
              </p>
              <div style={{ background:t.card2||t.card, padding:12, borderRadius:8, border:`1px solid ${t.borderDash}`, marginBottom:12 }}>
                <div><strong>Provider:</strong> {providerStatus.whatsapp?.provider}</div>
                <div><strong>Status:</strong> {providerStatus.whatsapp?.enabled ? "Connected" : "Not Configured / Disabled"}</div>
                <div><strong>Phone Number ID:</strong> <code>{providerStatus.whatsapp?.phoneId}</code></div>
              </div>
              <div style={{ fontSize:12, color:t.textMuted }}>
                To enable WhatsApp messaging, configure <code>WHATSAPP_ACCESS_TOKEN</code> and <code>WHATSAPP_PHONE_NUMBER_ID</code> in your backend <code>.env</code>.
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── DIRECT SEND MESSAGE MODAL ── */}
      <Modal
        open={sendModal}
        onClose={() => setSendModal(false)}
        title="Direct Message Dispatch"
        t={t}
        footer={<>
          <BtnOutline t={t} onClick={() => setSendModal(false)}>Cancel</BtnOutline>
          <BtnPrimary onClick={handleDirectSend} disabled={sendingMsg}>
            {sendingMsg ? "Dispatching..." : "Send Message"}
          </BtnPrimary>
        </>}
      >
        <form onSubmit={handleDirectSend}>
          <FormGrid>
            <FormGroup label="Recipient Customer *" t={t}>
              <Select
                t={t}
                value={sendForm.customer_id}
                onChange={(e) => setSendForm(f => ({ ...f, customer_id: e.target.value }))}
                required
              >
                <option value="">-- Select Customer --</option>
                {occasions.map(o => (
                  <option key={o.customerId} value={o.customerId}>
                    {o.customerName} ({o.phone}) - {o.tier} Tier
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Channel *" t={t} half>
              <Select
                t={t}
                value={sendForm.channel}
                onChange={(e) => setSendForm(f => ({ ...f, channel: e.target.value }))}
              >
                <option value="SMS">SMS (MSG91)</option>
                <option value="WHATSAPP">WhatsApp</option>
              </Select>
            </FormGroup>

            <FormGroup label="Message Template *" t={t} half>
              <Select
                t={t}
                value={sendForm.template_code}
                onChange={(e) => setSendForm(f => ({ ...f, template_code: e.target.value }))}
              >
                {templates.filter(tp => tp.channel === sendForm.channel).map(tp => (
                  <option key={tp.template_code} value={tp.template_code}>
                    {tp.name} ({tp.template_code})
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup label="Gift Voucher Code (Optional)" t={t}>
              <Input
                t={t}
                placeholder="e.g. BDAY-2026-FESTIVE"
                value={sendForm.coupon_code}
                onChange={(e) => setSendForm(f => ({ ...f, coupon_code: e.target.value }))}
              />
            </FormGroup>
          </FormGrid>

          {sendResultMsg && (
            <div style={{ color: sendResultMsg.startsWith("✓") ? "#27ae60" : BRAND.pink, fontSize:13, marginTop:10 }}>
              {sendResultMsg}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
