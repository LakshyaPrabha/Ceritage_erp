import { BRAND } from "../../theme.js";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader, Card, CardHeader, StatCard, Tabs,
  BtnPrimary, BtnOutline, BtnSm, Modal, FormGroup, FormGrid, Input, Select
} from "../../components/ui";

const API = "http://localhost:5000/api";

function authHeaders() {
  const token = sessionStorage.getItem("ceritage_token") || localStorage.getItem("ceritage_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function fmt(n) {
  return n ? "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "₹0.00";
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "—";
}

const TABS = [
  { id: "cashbook", label: "Cash Book" },
  { id: "bankbook", label: "Bank Book" },
  { id: "journal",  label: "Journal Entries" },
  { id: "tb",       label: "Trial Balance" },
  { id: "pl",       label: "Profit & Loss (P&L)" },
  { id: "bs",       label: "Balance Sheet" },
  { id: "coa",      label: "Chart of Accounts" }
];

export default function Accounting({ t }) {
  const [tab, setTab] = useState("cashbook");

  // Summary KPIs
  const [summary, setSummary] = useState({
    cash_in_hand: 0,
    bank_balance: 0,
    receivables: 0,
    payables: 0,
    revenue: 0,
    net_profit: 0,
    total_assets: 0,
    gst_payable: 0,
    stock_valuation: 0
  });

  // Tab Data States
  const [cashbook, setCashbook] = useState([]);
  const [bankbook, setBankbook] = useState([]);
  const [journal, setJournal] = useState([]);
  const [trialBalance, setTrialBalance] = useState({ data: [], totals: { total_debit: 0, total_credit: 0, balanced: true } });
  const [pl, setPl] = useState(null);
  const [bs, setBs] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Voucher Modal
  const [voucherModal, setVoucherModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    voucher_type: "JOURNAL",
    entry_date: new Date().toISOString().split("T")[0],
    debit_account_id: "",
    credit_account_id: "",
    amount: "",
    narration: ""
  });

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    try {
      const r = await fetch(`${API}/accounting/summary`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setSummary(d.data);
    } catch { /* silent */ }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const r = await fetch(`${API}/accounting/accounts`, { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setAccounts(d.data || []);
    } catch { /* silent */ }
  }, []);

  const loadTabData = useCallback(async (currentTab) => {
    setLoading(true);
    try {
      if (currentTab === "cashbook") {
        const r = await fetch(`${API}/accounting/cashbook`, { headers: authHeaders() });
        const d = await r.json();
        if (d.success) setCashbook(d.data || []);
      } else if (currentTab === "bankbook") {
        const r = await fetch(`${API}/accounting/bankbook`, { headers: authHeaders() });
        const d = await r.json();
        if (d.success) setBankbook(d.data || []);
      } else if (currentTab === "journal") {
        const r = await fetch(`${API}/accounting/journal`, { headers: authHeaders() });
        const d = await r.json();
        if (d.success) setJournal(d.data || []);
      } else if (currentTab === "tb") {
        const r = await fetch(`${API}/accounting/trial-balance`, { headers: authHeaders() });
        const d = await r.json();
        if (d.success) setTrialBalance(d);
      } else if (currentTab === "pl") {
        const r = await fetch(`${API}/accounting/pl`, { headers: authHeaders() });
        const d = await r.json();
        if (d.success) setPl(d.data);
      } else if (currentTab === "bs") {
        const r = await fetch(`${API}/accounting/balance-sheet`, { headers: authHeaders() });
        const d = await r.json();
        if (d.success) setBs(d.data);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
    loadAccounts();
  }, [loadSummary, loadAccounts]);

  useEffect(() => {
    loadTabData(tab);
  }, [tab, loadTabData]);

  // ── Voucher Submission ──────────────────────────────────────────────────────
  async function submitVoucher() {
    const amt = parseFloat(voucherForm.amount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid, positive voucher amount.");
      return;
    }
    if (!voucherForm.debit_account_id || !voucherForm.credit_account_id) {
      alert("Please select both Debit and Credit accounts.");
      return;
    }
    if (voucherForm.debit_account_id === voucherForm.credit_account_id) {
      alert("Debit and Credit accounts cannot be the same.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        voucher_type: voucherForm.voucher_type,
        entry_date: voucherForm.entry_date,
        narration: voucherForm.narration,
        lines: [
          { account_id: parseInt(voucherForm.debit_account_id), debit: amt, credit: 0, narration: voucherForm.narration },
          { account_id: parseInt(voucherForm.credit_account_id), debit: 0, credit: amt, narration: voucherForm.narration }
        ]
      };

      const r = await fetch(`${API}/accounting/vouchers`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (d.success) {
        alert(d.message || "Voucher posted successfully!");
        setVoucherModal(false);
        setVoucherForm({
          voucher_type: "JOURNAL",
          entry_date: new Date().toISOString().split("T")[0],
          debit_account_id: "",
          credit_account_id: "",
          amount: "",
          narration: ""
        });
        loadSummary();
        loadTabData(tab);
      } else {
        alert(d.message || "Failed to post voucher.");
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
        title="Double-Entry Accounting & Books"
        subtitle="Cash Book · Bank Book · Journal Vouchers · Trial Balance · Profit & Loss · Balance Sheet · Chart of Accounts"
        t={t}
        actions={
          <>
            <BtnOutline t={t} onClick={() => { setVoucherModal(true); loadAccounts(); }}>
              + Journal Voucher
            </BtnOutline>
            <BtnPrimary onClick={() => { setVoucherModal(true); loadAccounts(); }}>
              + New Voucher
            </BtnPrimary>
          </>
        }
      />

      {/* Top StatCards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard label="Cash in Hand"     value={fmt(summary.cash_in_hand)}  color="#2ecc71"      t={t} />
        <StatCard label="Bank / UPI Float" value={fmt(summary.bank_balance)}  color={BRAND.blue}   t={t} />
        <StatCard label="Receivables"      value={fmt(summary.receivables)}   color="#f39c12"      t={t} />
        <StatCard label="Payables (Dues)"  value={fmt(summary.payables)}      color={BRAND.pink}   t={t} />
        <StatCard label="Net Profit"       value={fmt(summary.net_profit)}    color="#27ae60"      t={t} />
        <StatCard label="Total Assets"     value={fmt(summary.total_assets)}  color={BRAND.purple} t={t} />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} t={t} />

      {/* ── TAB 1: CASH BOOK ──────────────────────────────────────────────── */}
      {tab === "cashbook" && (
        <Card t={t}>
          <CardHeader title="Cash Book Register" t={t} />
          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading cash book entries...</p>
          ) : cashbook.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No cash book entries recorded yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Date</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Particulars</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Voucher / Ref</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Type</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Debit (Receipt)</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Credit (Payment)</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {cashbook.map((c, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{fmtDate(c.date)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>{c.particulars}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{c.voucher_no}</td>
                      <td style={{ padding: "10px 12px", color: t.subtext, fontSize: 11 }}>{c.type}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#2ecc71" }}>{c.debit > 0 ? fmt(c.debit) : "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#e74c3c" }}>{c.credit > 0 ? fmt(c.credit) : "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: t.text }}>{fmt(c.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 2: BANK BOOK ──────────────────────────────────────────────── */}
      {tab === "bankbook" && (
        <Card t={t}>
          <CardHeader title="Bank Book & Digital Settlements (UPI / Card POS / RTGS)" t={t} />
          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading bank book entries...</p>
          ) : bankbook.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No bank book entries recorded yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Date</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Particulars</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Voucher / Ref</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Bank Account</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Debit (Inflow)</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Credit (Outflow)</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {bankbook.map((b, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{fmtDate(b.date)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>{b.particulars}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{b.voucher_no}</td>
                      <td style={{ padding: "10px 12px", color: t.subtext }}>{b.bank}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#2ecc71" }}>{b.debit > 0 ? fmt(b.debit) : "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#e74c3c" }}>{b.credit > 0 ? fmt(b.credit) : "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: t.text }}>{fmt(b.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 3: JOURNAL ENTRIES ────────────────────────────────────────── */}
      {tab === "journal" && (
        <Card t={t}>
          <CardHeader title="General Journal Registry" t={t} />
          {loading ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>Loading journal entries...</p>
          ) : journal.length === 0 ? (
            <p style={{ textAlign: "center", padding: 36, color: t.subtext }}>No journal entries posted yet. Click '+ Journal Voucher' above.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {journal.map((j) => (
                <div key={j.id} style={{ background: t.card2, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, borderBottom: `1px solid ${t.border}`, paddingBottom: 6 }}>
                    <div>
                      <strong style={{ color: BRAND.blue, fontSize: 14 }}>{j.voucher_no}</strong>
                      <span style={{ marginLeft: 10, fontSize: 12, color: t.subtext }}>Date: {fmtDate(j.entry_date)}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#2ecc71" }}>Total: {fmt(j.total_debit)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: t.text, marginBottom: 10 }}>{j.narration || "No narration"}</div>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: t.card, color: t.subtext }}>
                        <th style={{ textAlign: "left", padding: "6px 8px" }}>Account</th>
                        <th style={{ textAlign: "left", padding: "6px 8px" }}>Debit (₹)</th>
                        <th style={{ textAlign: "left", padding: "6px 8px" }}>Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(j.lines || []).map((l, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${t.borderDash}` }}>
                          <td style={{ padding: "6px 8px", fontWeight: 500 }}>[{l.account_code}] {l.account_name}</td>
                          <td style={{ padding: "6px 8px", color: l.debit > 0 ? "#2ecc71" : t.subtext }}>{l.debit > 0 ? fmt(l.debit) : "—"}</td>
                          <td style={{ padding: "6px 8px", color: l.credit > 0 ? "#e74c3c" : t.subtext }}>{l.credit > 0 ? fmt(l.credit) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── TAB 4: TRIAL BALANCE ──────────────────────────────────────────── */}
      {tab === "tb" && (
        <Card t={t}>
          <CardHeader
            title="Trial Balance (Double-Entry Balancing)"
            t={t}
            actions={
              <span style={{ padding: "4px 10px", borderRadius: 6, background: trialBalance.totals?.balanced ? "#2ecc71" : "#e74c3c", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {trialBalance.totals?.balanced ? "Trial Balance Balanced" : "Unbalanced"}
              </span>
            }
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>A/C Code</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Account Name</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Group</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Debit (₹)</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Credit (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(trialBalance.data || []).map((r) => (
                  <tr key={r.code} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{r.code}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>{r.name}</td>
                    <td style={{ padding: "10px 12px", color: t.subtext }}>{r.group}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: r.debit > 0 ? "#2ecc71" : t.subtext }}>{r.debit > 0 ? fmt(r.debit) : "0.00"}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: r.credit > 0 ? "#e74c3c" : t.subtext }}>{r.credit > 0 ? fmt(r.credit) : "0.00"}</td>
                  </tr>
                ))}
                <tr style={{ background: t.card2, fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: "12px", textAlign: "right", textTransform: "uppercase" }}>Total Trial Balance:</td>
                  <td style={{ padding: "12px", color: "#2ecc71" }}>{fmt(trialBalance.totals?.total_debit)}</td>
                  <td style={{ padding: "12px", color: "#e74c3c" }}>{fmt(trialBalance.totals?.total_credit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── TAB 5: PROFIT & LOSS ──────────────────────────────────────────── */}
      {tab === "pl" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card t={t}>
            <CardHeader title="Operating Revenue (Inflow)" t={t} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>Jewellery Sales (Taxable)</span>
                <strong>{fmt(pl?.revenue?.sales_revenue)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>Making & Labour Charges</span>
                <strong>{fmt(pl?.revenue?.making_revenue)}</strong>
              </div>
              <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <strong>Total Revenue:</strong>
                <strong style={{ color: "#2ecc71" }}>{fmt(pl?.revenue?.total_revenue)}</strong>
              </div>
            </div>
          </Card>

          <Card t={t}>
            <CardHeader title="Expenses & COGS (Outflow)" t={t} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>Karigar Labour Cost</span>
                <strong>{fmt(pl?.expenses?.karigar_labour)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>Store Expenses & Utilities</span>
                <strong>{fmt(pl?.expenses?.utilities_rent)}</strong>
              </div>
              <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <strong>Net Profit:</strong>
                <strong style={{ color: "#27ae60", fontSize: 16 }}>{fmt(pl?.net_profit)}</strong>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 6: BALANCE SHEET ──────────────────────────────────────────── */}
      {tab === "bs" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card t={t}>
            <CardHeader title="Total Assets" t={t} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>Cash in Hand</span>
                <strong>{fmt(bs?.assets?.current_assets?.cash)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>Bank & UPI Float</span>
                <strong>{fmt(bs?.assets?.current_assets?.bank)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>Accounts Receivable (Debtors)</span>
                <strong>{fmt(bs?.assets?.current_assets?.debtors)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>Jewellery Inventory Stock</span>
                <strong>{fmt(bs?.assets?.inventory_assets?.stock)}</strong>
              </div>
              <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <strong>Total Assets:</strong>
                <strong style={{ color: BRAND.blue }}>{fmt(bs?.assets?.total_assets)}</strong>
              </div>
            </div>
          </Card>

          <Card t={t}>
            <CardHeader title="Liabilities & Equity" t={t} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>Supplier Payables (Creditors)</span>
                <strong>{fmt(bs?.liabilities?.current_liabilities?.creditors)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>GST Output Tax Payable</span>
                <strong>{fmt(bs?.liabilities?.current_liabilities?.gst_payable)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: t.text }}>Owner Equity / Retained Earnings</span>
                <strong>{fmt(bs?.equity?.retained_earnings)}</strong>
              </div>
              <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <strong>Total Liabilities & Equity:</strong>
                <strong style={{ color: BRAND.purple }}>{fmt(bs?.assets?.total_assets)}</strong>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 7: CHART OF ACCOUNTS ──────────────────────────────────────── */}
      {tab === "coa" && (
        <Card t={t}>
          <CardHeader title="Master Chart of Accounts" t={t} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Code</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Account Name</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>Group Name</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: t.subtext, fontSize: 11, textTransform: "uppercase" }}>System Account</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: BRAND.blue }}>{a.code}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: t.text }}>{a.name}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: a.type === "ASSET" ? "#3498db" : a.type === "LIABILITY" ? "#e74c3c" : a.type === "REVENUE" ? "#2ecc71" : "#9b59b6",
                        color: "#fff"
                      }}>
                        {a.type}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: t.subtext }}>{a.group_name}</td>
                    <td style={{ padding: "10px 12px", color: t.subtext }}>{a.is_system ? "Yes (Protected)" : "Custom"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── MODAL: POST DOUBLE-ENTRY VOUCHER ──────────────────────────────── */}
      <Modal
        open={voucherModal}
        onClose={() => setVoucherModal(false)}
        title="Post Double-Entry Journal Voucher"
        t={t}
        footer={
          <>
            <BtnOutline t={t} onClick={() => setVoucherModal(false)}>Cancel</BtnOutline>
            <BtnPrimary onClick={submitVoucher} disabled={saving}>
              {saving ? "Posting…" : "Post Voucher"}
            </BtnPrimary>
          </>
        }
      >
        <FormGrid>
          <FormGroup label="Voucher Type *" t={t} half>
            <Select
              t={t}
              value={voucherForm.voucher_type}
              onChange={(e) => setVoucherForm(prev => ({ ...prev, voucher_type: e.target.value }))}
            >
              <option value="JOURNAL">Journal Voucher (JV)</option>
              <option value="RECEIPT">Receipt Voucher (RV)</option>
              <option value="PAYMENT">Payment Voucher (PV)</option>
              <option value="CONTRA">Contra Bank/Cash (CV)</option>
            </Select>
          </FormGroup>

          <FormGroup label="Entry Date *" t={t} half>
            <Input
              t={t}
              type="date"
              value={voucherForm.entry_date}
              onChange={(e) => setVoucherForm(prev => ({ ...prev, entry_date: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Debit Account (Dr) *" t={t}>
            <Select
              t={t}
              value={voucherForm.debit_account_id}
              onChange={(e) => setVoucherForm(prev => ({ ...prev, debit_account_id: e.target.value }))}
            >
              <option value="">-- Choose Debit Account (Dr) --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>[{a.code}] {a.name} ({a.type})</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Credit Account (Cr) *" t={t}>
            <Select
              t={t}
              value={voucherForm.credit_account_id}
              onChange={(e) => setVoucherForm(prev => ({ ...prev, credit_account_id: e.target.value }))}
            >
              <option value="">-- Choose Credit Account (Cr) --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>[{a.code}] {a.name} ({a.type})</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Amount (₹) *" t={t} half>
            <Input
              t={t}
              type="number"
              placeholder="0.00"
              value={voucherForm.amount}
              onChange={(e) => setVoucherForm(prev => ({ ...prev, amount: e.target.value }))}
            />
          </FormGroup>

          <FormGroup label="Narration / Description *" t={t}>
            <Input
              t={t}
              placeholder="e.g. Cash transfer to SBI Bank or Store repairs expenditure"
              value={voucherForm.narration}
              onChange={(e) => setVoucherForm(prev => ({ ...prev, narration: e.target.value }))}
            />
          </FormGroup>
        </FormGrid>
      </Modal>
    </div>
  );
}
