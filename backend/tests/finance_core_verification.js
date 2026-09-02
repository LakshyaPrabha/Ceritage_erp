const db = require("../config/db");

const API = "http://localhost:5000/api";

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const message = body?.message || body?.error || text || res.statusText;
    throw new Error(`${options.method || "GET"} ${path} -> ${res.status}: ${message}`);
  }
  return { status: res.status, body };
}

function authHeaders(token, branchId) {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  if (branchId) headers["x-branch-id"] = String(branchId);
  return headers;
}

async function login(username, password) {
  const { body } = await api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return body.token;
}

async function createCustomer(token, name, phone, branchId = 1, creditLimit = 500000) {
  const { body } = await api("/customers", {
    method: "POST",
    headers: authHeaders(token, branchId),
    body: JSON.stringify({
      full_name: name,
      phone,
      city: "Verification",
      credit_limit: creditLimit,
      kyc_status: "Pending",
    }),
  });
  return body.data.id;
}

async function getJournal(ref) {
  const [rows] = await db.query(
    `SELECT j.id, j.voucher_no, j.voucher_type, j.entry_date, j.total_debit, j.total_credit,
            a.code, a.name, l.debit, l.credit, l.narration
     FROM journal_entries j
     JOIN journal_entry_lines l ON l.journal_id = j.id
     JOIN accounts a ON a.id = l.account_id
     WHERE j.reference_no = ? OR j.voucher_no = ?
     ORDER BY j.id, l.id`,
    [ref, ref]
  );
  return rows;
}

async function getInvoice(id) {
  const [[invoice]] = await db.query("SELECT * FROM invoices WHERE id = ?", [id]);
  const [tenders] = await db.query(
    `SELECT it.*, a.code AS account_code, a.name AS account_name
     FROM invoice_tenders it
     LEFT JOIN accounts a ON a.id = it.account_id
     WHERE it.invoice_id = ?
     ORDER BY it.id`,
    [id]
  );
  return { invoice, tenders };
}

async function getCustomer(id) {
  const [[row]] = await db.query("SELECT id, full_name, branch_id, balance_due, credit_limit FROM customers WHERE id = ?", [id]);
  return row;
}

async function getProduct(id) {
  const [[row]] = await db.query("SELECT id, name, stock_qty FROM products WHERE id = ?", [id]);
  return row;
}

async function trialBalance() {
  const [[journal]] = await db.query("SELECT COALESCE(SUM(total_debit),0) dr, COALESCE(SUM(total_credit),0) cr FROM journal_entries");
  const [[lines]] = await db.query("SELECT COALESCE(SUM(debit),0) dr, COALESCE(SUM(credit),0) cr FROM journal_entry_lines");
  return { journal, lines, balanced: Math.abs(Number(lines.dr) - Number(lines.cr)) < 0.01 };
}

async function main() {
  const stamp = Date.now().toString().slice(-8);
  const adminToken = await login("admin", "ceritage123");
  const headers = authHeaders(adminToken, 1);
  const beforeTb = await trialBalance();
  console.log("BEFORE_TRIAL_BALANCE", beforeTb);

  const cashCustomer = await createCustomer(adminToken, `FC Cash ${stamp}`, `900${stamp.slice(0, 7)}`, 1);
  const creditCustomer = await createCustomer(adminToken, `FC Credit ${stamp}`, `901${stamp.slice(0, 7)}`, 1);
  const splitCustomer = await createCustomer(adminToken, `FC Split ${stamp}`, `902${stamp.slice(0, 7)}`, 1);
  const advanceCustomer = await createCustomer(adminToken, `FC Advance ${stamp}`, `903${stamp.slice(0, 7)}`, 1);
  const emiCustomer = await createCustomer(adminToken, `FC EMI ${stamp}`, `904${stamp.slice(0, 7)}`, 1);

  const productBefore = await getProduct(2);
  const cashSale = await api("/billing", {
    method: "POST",
    headers,
    body: JSON.stringify({
      invoice_type: "Retail Invoice",
      customer_id: cashCustomer,
      branch_id: 1,
      payment_mode: "Cash",
      hsn_code: "7113",
      cgst: 1500,
      sgst: 1500,
      igst: 0,
      grand_total: 103000,
      paid_amount: 103000,
      items: [{ product_id: 2, description: "FC Cash Sale Gold", hsn: "7113", amount: 100000, gst_pct: 3 }],
    }),
  });
  const cashData = cashSale.body.data;
  const cashInvoice = await getInvoice(cashData.id);
  const cashJournal = await getJournal(cashData.invoice_no);
  const productAfter = await getProduct(2);
  console.log("CASH_SALE", { response: cashData, invoice: cashInvoice, stock_before: productBefore, stock_after: productAfter, journal: cashJournal });

  const creditSale = await api("/billing", {
    method: "POST",
    headers,
    body: JSON.stringify({
      invoice_type: "Retail Invoice",
      customer_id: creditCustomer,
      branch_id: 1,
      payment_mode: "Credit",
      hsn_code: "7113",
      cgst: 1500,
      sgst: 1500,
      igst: 0,
      grand_total: 103000,
      paid_amount: 0,
      credit_days: 30,
      items: [{ description: "FC Credit Sale Gold", hsn: "7113", amount: 100000, gst_pct: 3 }],
    }),
  });
  const creditData = creditSale.body.data;
  const creditBeforePayment = await getCustomer(creditCustomer);
  const creditJournal = await getJournal(creditData.invoice_no);
  console.log("CREDIT_SALE", { response: creditData, customer: creditBeforePayment, journal: creditJournal });

  const receipt = await api("/payments/record", {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "CUSTOMER_DUES",
      customer_id: creditCustomer,
      amount: 30000,
      payment_mode: "UPI",
      reference_no: `FC-UPI-${stamp}`,
      remark: "finance core verification",
    }),
  });
  const receiptData = receipt.body.data;
  const creditAfterPayment = await getCustomer(creditCustomer);
  const receiptJournal = await getJournal(receiptData.receipt_id);
  console.log("CUSTOMER_PAYMENT", { response: receiptData, before: creditBeforePayment, after: creditAfterPayment, journal: receiptJournal });

  const splitSale = await api("/billing", {
    method: "POST",
    headers,
    body: JSON.stringify({
      invoice_type: "Retail Invoice",
      customer_id: splitCustomer,
      branch_id: 1,
      payment_mode: "Split",
      hsn_code: "7113",
      cgst: 3000,
      sgst: 3000,
      igst: 0,
      grand_total: 206000,
      split_payments: [
        { payment_mode: "Cash", amount: 50000 },
        { payment_mode: "UPI", amount: 100000, reference_no: `UPI-SPLIT-${stamp}` },
        { payment_mode: "BANK_TRANSFER", amount: 56000, reference_no: `BANK-SPLIT-${stamp}` },
      ],
      items: [{ description: "FC Split Sale Gold", hsn: "7113", amount: 200000, gst_pct: 3 }],
    }),
  });
  const splitData = splitSale.body.data;
  console.log("SPLIT_SALE", { response: splitData, invoice: await getInvoice(splitData.id), journal: await getJournal(splitData.invoice_no) });

  const advance = await api("/advance", {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer_id: advanceCustomer,
      item_description: "FC Advance Lock",
      locked_rate: 7000,
      weight_g: 10,
      advance_paid: 50000,
      payment_mode: "Cash",
      payment_ref: `FC-ADV-${stamp}`,
    }),
  });
  const advanceData = advance.body.data;
  console.log("ADVANCE_RECEIPT", { response: advanceData, journal: await getJournal(`FC-ADV-${stamp}`) });

  const advanceInvoice = await api("/billing", {
    method: "POST",
    headers,
    body: JSON.stringify({
      invoice_type: "Retail Invoice",
      customer_id: advanceCustomer,
      branch_id: 1,
      payment_mode: "Cash",
      hsn_code: "7113",
      cgst: 1500,
      sgst: 1500,
      igst: 0,
      grand_total: 103000,
      paid_amount: 53000,
      advance_applications: [{ rate_lock_id: advanceData.id, amount: 50000 }],
      items: [{ description: "FC Advance Final Sale", hsn: "7113", amount: 100000, gst_pct: 3 }],
    }),
  });
  const advanceInvoiceData = advanceInvoice.body.data;
  console.log("ADVANCE_CONSUMPTION", { response: advanceInvoiceData, invoice: await getInvoice(advanceInvoiceData.id), journal: await getJournal(advanceInvoiceData.invoice_no) });

  const emiPlan = await api("/emi/plans", {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer_id: emiCustomer,
      item_description: "FC EMI Purchase",
      total_amount: 120000,
      down_payment: 20000,
      num_emis: 10,
      interest_rate: 0,
      finance_partner: "In-House",
    }),
  });
  const emiPlanData = emiPlan.body.data;
  const [installments] = await db.query("SELECT * FROM emi_installments WHERE plan_id = ? ORDER BY installment_no", [emiPlanData.id]);
  console.log("EMI_PLAN", { response: emiPlanData, installments });

  const emiCollect = await api(`/emi/plans/${emiPlanData.id}/collect`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      installment_id: installments[0].id,
      amount: Number(installments[0].amount_due || installments[0].amount),
      payment_mode: "Cash",
      notes: "finance core verification",
    }),
  });
  const emiCollectData = emiCollect.body.data;
  const [[emiPlanAfter]] = await db.query("SELECT * FROM emi_plans WHERE id = ?", [emiPlanData.id]);
  const [emiInstallmentsAfter] = await db.query("SELECT * FROM emi_installments WHERE plan_id = ? ORDER BY installment_no", [emiPlanData.id]);
  console.log("EMI_COLLECTION", { response: emiCollectData, plan_after: emiPlanAfter, installments_after: emiInstallmentsAfter, journal: await getJournal(emiCollectData.receipt_no) });

  const beforeRollback = await db.query("SELECT COUNT(*) AS c FROM invoices").then(([r]) => r[0].c);
  let rollbackError = null;
  try {
    await api("/billing", {
      method: "POST",
      headers,
      body: JSON.stringify({
        invoice_type: "Retail Invoice",
        customer_id: cashCustomer,
        branch_id: 1,
        payment_mode: "MissingMode",
        hsn_code: "7113",
        grand_total: 1000,
        paid_amount: 1000,
        items: [{ description: "Rollback Bad Mapping", amount: 1000 }],
      }),
    });
  } catch (error) {
    rollbackError = error.message;
  }
  const afterRollback = await db.query("SELECT COUNT(*) AS c FROM invoices").then(([r]) => r[0].c);
  console.log("ROLLBACK_TEST", { beforeRollback, afterRollback, rollbackError, rolled_back: beforeRollback === afterRollback });

  const noAuth = await fetch(`${API}/billing`);
  console.log("AUTH_401", { status: noAuth.status });

  const cashierToken = await login("cashier", "ceritage123").catch(() => null);
  if (cashierToken) {
    const branchViolation = await fetch(`${API}/billing`, {
      method: "POST",
      headers: authHeaders(cashierToken),
      body: JSON.stringify({
        invoice_type: "Retail Invoice",
        customer_id: cashCustomer,
        branch_id: 2,
        payment_mode: "Cash",
        grand_total: 100,
        paid_amount: 100,
        items: [{ description: "Branch Violation", amount: 100 }],
      }),
    });
    console.log("BRANCH_403", { status: branchViolation.status, body: await branchViolation.text() });
  } else {
    console.log("BRANCH_403", { skipped: "cashier login unavailable" });
  }

  const afterTb = await trialBalance();
  console.log("AFTER_TRIAL_BALANCE", afterTb);
  await db.end();
}

main().catch(async (error) => {
  console.error("VERIFY_FAILED", error);
  await db.end();
  process.exit(1);
});
