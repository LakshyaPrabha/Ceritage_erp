require("dotenv").config({ path: "backend/.env" });
const crypto = require("crypto");
const mysql = require("mysql2/promise");

const API = process.env.API_BASE || "http://localhost:5000/api";
const SECRET = process.env.MOCK_GATEWAY_WEBHOOK_SECRET || process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || "ceritage_mock_secret";

function sign(payload) {
  return crypto.createHmac("sha256", SECRET).update(JSON.stringify(payload)).digest("hex");
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  let body;
  try { body = await res.json(); } catch { body = await res.text(); }
  if (!res.ok || body?.success === false) {
    throw new Error(`${options.method || "GET"} ${path} -> ${res.status}: ${body?.message || JSON.stringify(body)}`);
  }
  return { status: res.status, body };
}

function authHeaders(token, branch = 1) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-branch-id": String(branch) };
}

async function login(username, password) {
  const res = await api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.body.token || res.body.data?.token;
}

async function trialBalance(conn) {
  const [[journal]] = await conn.query("SELECT SUM(total_debit) dr, SUM(total_credit) cr FROM journal_entries");
  return { dr: Number(journal.dr || 0), cr: Number(journal.cr || 0), balanced: Number(journal.dr || 0) === Number(journal.cr || 0) };
}

async function getJournal(conn, reference) {
  const [rows] = await conn.query(
    `SELECT je.voucher_no, je.voucher_type, je.total_debit, je.total_credit,
            a.code, a.name, jel.debit, jel.credit, jel.narration
     FROM journal_entries je
     JOIN journal_entry_lines jel ON jel.journal_id = je.id
     JOIN accounts a ON a.id = jel.account_id
     WHERE je.reference_no = ? OR je.source_id = ? OR je.voucher_no = ?
     ORDER BY jel.id`,
    [reference, String(reference), reference]
  );
  return rows;
}

async function getJournalBySource(conn, sourceType, sourceId) {
  const [rows] = await conn.query(
    `SELECT je.voucher_no, je.voucher_type, je.total_debit, je.total_credit,
            a.code, a.name, jel.debit, jel.credit, jel.narration
     FROM journal_entries je
     JOIN journal_entry_lines jel ON jel.journal_id = je.id
     JOIN accounts a ON a.id = jel.account_id
     WHERE je.source_type = ? AND je.source_id = ?
     ORDER BY jel.id`,
    [sourceType, String(sourceId)]
  );
  return rows;
}

async function createCustomer(token, name, phone) {
  const res = await api("/customers", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ full_name: name, phone, branch_id: 1, credit_limit: 500000, status: "Active" }),
  });
  return res.body.data?.id || res.body.id;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  const stamp = Date.now().toString().slice(-8);
  const token = await login("admin", "ceritage123");
  const headers = authHeaders(token);
  const beforeTb = await trialBalance(conn);
  console.log("BEFORE_TRIAL_BALANCE", beforeTb);

  const manualCustomer = await createCustomer(token, `FGW Manual ${stamp}`, `910${stamp.slice(0, 7)}`);
  const autoCustomer = await createCustomer(token, `FGW Auto ${stamp}`, `911${stamp.slice(0, 7)}`);
  const failCustomer = await createCustomer(token, `FGW Fail ${stamp}`, `912${stamp.slice(0, 7)}`);

  const manualPlan = await api("/emi/plans", {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer_id: manualCustomer,
      item_description: "FGW Manual EMI",
      total_amount: 60000,
      down_payment: 0,
      num_emis: 6,
      interest_rate: 0,
      finance_partner: "In-House",
    }),
  });
  console.log("MANUAL_EMI_CREATE", manualPlan.body.data);

  const creditSale = await api("/billing", {
    method: "POST",
    headers,
    body: JSON.stringify({
      invoice_type: "Retail Invoice",
      customer_id: autoCustomer,
      branch_id: 1,
      payment_mode: "Credit",
      hsn_code: "7113",
      cgst: 1500,
      sgst: 1500,
      igst: 0,
      grand_total: 103000,
      paid_amount: 0,
      credit_days: 30,
      items: [{ description: "FGW AutoPay Credit Invoice", hsn: "7113", amount: 100000, gst_pct: 3 }],
    }),
  });

  const autoPlan = await api("/emi/plans", {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer_id: autoCustomer,
      invoice_ref: creditSale.body.data.invoice_no,
      item_description: "FGW AutoPay EMI",
      total_amount: 103000,
      down_payment: 3000,
      num_emis: 10,
      interest_rate: 0,
      finance_partner: "In-House",
    }),
  });
  const autoPlanId = autoPlan.body.data.id;
  const setup = await api(`/emi/plans/${autoPlanId}/autopay/setup`, {
    method: "POST",
    headers,
    body: JSON.stringify({ provider: "mock" }),
  });
  console.log("AUTOPAY_SETUP", setup.body.data);

  const retry = await api(`/emi/plans/${autoPlanId}/autopay/retry`, {
    method: "POST",
    headers,
    body: JSON.stringify({ provider: "mock" }),
  });
  const successGatewayPaymentId = retry.body.data.gateway_payment_id;
  const successOrderId = retry.body.data.provider_order_id;
  console.log("AUTOPAY_ATTEMPT", retry.body.data);

  const [[customerBefore]] = await conn.query("SELECT id, balance_due FROM customers WHERE id = ?", [autoCustomer]);
  const [[planBefore]] = await conn.query("SELECT id, paid_amount, remaining_amount FROM emi_plans WHERE id = ?", [autoPlanId]);
  const [[instBefore]] = await conn.query("SELECT id, paid_amount, amount_paid, status FROM emi_installments WHERE gateway_payment_id = ?", [successGatewayPaymentId]);

  const successPayload = {
    id: `evt_fgw_success_${stamp}`,
    event: "payment.captured",
    payment: {
      id: `pay_fgw_success_${stamp}`,
      order_id: successOrderId,
      mandate_id: setup.body.data.mandate_id,
      amount: 10000,
      fee: 100,
      tax: 18,
      currency: "INR",
      status: "captured",
    },
  };
  const firstWebhook = await api("/payments/webhook/mock", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-mock-signature": sign(successPayload) },
    body: JSON.stringify(successPayload),
  });
  const duplicateWebhook = await api("/payments/webhook/mock", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-mock-signature": sign(successPayload) },
    body: JSON.stringify(successPayload),
  });

  const concurrentResults = await Promise.all(
    [1, 2, 3, 4].map(() => fetch(`${API}/payments/webhook/mock`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-mock-signature": sign(successPayload) },
      body: JSON.stringify(successPayload),
    }).then(async (res) => ({ status: res.status, body: await res.json() })))
  );

  const [[customerAfter]] = await conn.query("SELECT id, balance_due FROM customers WHERE id = ?", [autoCustomer]);
  const [[planAfter]] = await conn.query("SELECT id, paid_amount, remaining_amount, autopay_status FROM emi_plans WHERE id = ?", [autoPlanId]);
  const [[instAfter]] = await conn.query("SELECT id, paid_amount, amount_paid, status, receipt_no FROM emi_installments WHERE gateway_payment_id = ?", [successGatewayPaymentId]);
  const [[paymentAfter]] = await conn.query("SELECT * FROM payment_gateway_payments WHERE id = ?", [successGatewayPaymentId]);
  const [[dupCounts]] = await conn.query(
    `SELECT
       COUNT(*) AS gateway_payment_rows,
       (SELECT COUNT(*) FROM emi_payments WHERE reference_no = ?) AS emi_payment_rows,
       (SELECT COUNT(*) FROM journal_entries WHERE source_type = 'GATEWAY_EMI_PAYMENT' AND source_id = ?) AS journal_rows,
       (SELECT COUNT(*) FROM payment_webhook_events WHERE webhook_event_id = ?) AS webhook_rows
     FROM payment_gateway_payments WHERE provider_payment_id = ?`,
    [`pay_fgw_success_${stamp}`, String(successGatewayPaymentId), `evt_fgw_success_${stamp}`, `pay_fgw_success_${stamp}`]
  );
  console.log("SUCCESS_WEBHOOK", {
    first: firstWebhook.body,
    duplicate: duplicateWebhook.body,
    concurrent: concurrentResults,
    customer_before: customerBefore,
    customer_after: customerAfter,
    plan_before: planBefore,
    plan_after: planAfter,
    installment_before: instBefore,
    installment_after: instAfter,
    payment_after: paymentAfter,
    counts: dupCounts,
    journal: await getJournalBySource(conn, "GATEWAY_EMI_PAYMENT", successGatewayPaymentId),
  });

  const invalidBefore = await conn.query("SELECT COUNT(*) c FROM payment_webhook_events").then(([r]) => r[0].c);
  const invalidRes = await fetch(`${API}/payments/webhook/mock`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-mock-signature": "invalid" },
    body: JSON.stringify({ id: `evt_invalid_${stamp}`, event: "payment.captured", payment: { id: `pay_invalid_${stamp}`, order_id: "missing", amount: 10000 } }),
  });
  const invalidAfter = await conn.query("SELECT COUNT(*) c FROM payment_webhook_events").then(([r]) => r[0].c);
  console.log("INVALID_WEBHOOK", { status: invalidRes.status, before_events: invalidBefore, after_events: invalidAfter });

  const failPlan = await api("/emi/plans", {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer_id: failCustomer,
      item_description: "FGW Failed AutoPay EMI",
      total_amount: 50000,
      down_payment: 0,
      num_emis: 5,
      interest_rate: 0,
      finance_partner: "In-House",
    }),
  });
  const failPlanId = failPlan.body.data.id;
  await api(`/emi/plans/${failPlanId}/autopay/setup`, { method: "POST", headers, body: JSON.stringify({ provider: "mock" }) });
  const failAttempt = await api(`/emi/plans/${failPlanId}/autopay/retry`, { method: "POST", headers, body: JSON.stringify({ provider: "mock" }) });
  const failPayload = {
    id: `evt_fgw_failed_${stamp}`,
    event: "payment.failed",
    payment: {
      id: `pay_fgw_failed_${stamp}`,
      order_id: failAttempt.body.data.provider_order_id,
      amount: 10000,
      currency: "INR",
      status: "failed",
      failure_reason: "Insufficient funds",
    },
  };
  await api("/payments/webhook/mock", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-mock-signature": sign(failPayload) },
    body: JSON.stringify(failPayload),
  });
  const [[failedPayment]] = await conn.query("SELECT * FROM payment_gateway_payments WHERE id = ?", [failAttempt.body.data.gateway_payment_id]);
  const [[failedInstallment]] = await conn.query("SELECT id, status, paid_amount, failure_reason, retry_count, next_retry_at FROM emi_installments WHERE gateway_payment_id = ?", [failAttempt.body.data.gateway_payment_id]);
  const failedJournalRows = await conn.query("SELECT COUNT(*) AS c FROM journal_entries WHERE source_type = 'GATEWAY_EMI_PAYMENT' AND source_id = ?", [String(failAttempt.body.data.gateway_payment_id)]).then(([r]) => r[0].c);
  const retryAfterFailure = await api(`/emi/plans/${failPlanId}/autopay/retry`, { method: "POST", headers, body: JSON.stringify({ provider: "mock" }) });
  console.log("FAILED_AND_RETRY", {
    failed_payment: failedPayment,
    failed_installment: failedInstallment,
    successful_journals_for_failed_attempt: failedJournalRows,
    retry_attempt: retryAfterFailure.body.data,
  });

  const mismatchBefore = await conn.query("SELECT COUNT(*) c FROM payment_settlements").then(([r]) => r[0].c);
  let mismatchError = null;
  try {
    await api("/payments/settlements", {
      method: "POST",
      headers,
      body: JSON.stringify({
        provider: "mock",
        gateway_payment_ids: [successGatewayPaymentId],
        settlement_id: `SET-FGW-MISMATCH-${stamp}`,
        gateway_fee: 100,
        gateway_fee_tax: 18,
        net_amount: 9000,
      }),
    });
  } catch (err) {
    mismatchError = err.message;
  }
  const mismatchAfter = await conn.query("SELECT COUNT(*) c FROM payment_settlements").then(([r]) => r[0].c);
  const settlement = await api("/payments/settlements", {
    method: "POST",
    headers,
    body: JSON.stringify({
      provider: "mock",
      gateway_payment_ids: [successGatewayPaymentId],
      settlement_id: `SET-FGW-OK-${stamp}`,
      gateway_fee: 100,
      gateway_fee_tax: 18,
      net_amount: 9882,
    }),
  });
  console.log("SETTLEMENT", {
    mismatch: { before: mismatchBefore, after: mismatchAfter, error: mismatchError, rolled_back: mismatchBefore === mismatchAfter },
    reconciled: settlement.body.data,
    journal: await getJournal(conn, settlement.body.data.settlement_id),
  });

  const modes = await api("/payments/modes", { headers });
  console.log("PAYMENT_MODES", modes.body.data.map((m) => ({
    code: m.mode_code,
    receipt: m.receipt_account_code,
    settlement: m.settlement_account_code,
    gateway: m.gateway_provider || null,
  })));

  const noAuth = await fetch(`${API}/payments/gateway/config`);
  console.log("SECURITY", { no_auth_gateway_config: noAuth.status });

  const [integrity] = await conn.query(`
    SELECT
      (SELECT COUNT(*) FROM payment_webhook_events GROUP BY provider, webhook_event_id HAVING COUNT(*) > 1 LIMIT 1) AS duplicate_webhook_groups,
      (SELECT COUNT(*) FROM payment_gateway_payments WHERE provider_payment_id IS NOT NULL GROUP BY provider, provider_payment_id HAVING COUNT(*) > 1 LIMIT 1) AS duplicate_payment_groups,
      (SELECT COUNT(*) FROM payment_gateway_payments WHERE idempotency_key IS NOT NULL GROUP BY idempotency_key HAVING COUNT(*) > 1 LIMIT 1) AS duplicate_idempotency_groups,
      (SELECT COUNT(*) FROM emi_plans WHERE remaining_amount < 0) AS negative_emi_plans,
      (SELECT COUNT(*) FROM emi_installments WHERE COALESCE(amount_paid, paid_amount, 0) > COALESCE(amount_due, amount, 0)) AS overpaid_installments
  `);
  const afterTb = await trialBalance(conn);
  console.log("INTEGRITY", { ...integrity[0], after_trial_balance: afterTb });

  console.log("TEST_RECORDS", {
    prefix: `FGW`,
    customers: [manualCustomer, autoCustomer, failCustomer],
    invoices: [creditSale.body.data.invoice_no],
    plans: [manualPlan.body.data.plan_id, autoPlan.body.data.plan_id, failPlan.body.data.plan_id],
    gateway_payment_ids: [successGatewayPaymentId, failAttempt.body.data.gateway_payment_id, retryAfterFailure.body.data.gateway_payment_id],
  });

  await conn.end();
}

main().catch((err) => {
  console.error("LIVE_GATEWAY_E2E_FAILED", err);
  process.exit(1);
});
