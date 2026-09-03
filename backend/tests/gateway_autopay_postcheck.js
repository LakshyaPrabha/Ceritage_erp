require("dotenv").config({ path: "backend/.env" });
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");

const API = process.env.API_BASE || "http://localhost:5000/api";

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  const [[payment]] = await conn.query(
    `SELECT * FROM payment_gateway_payments
     WHERE status = 'CAPTURED' AND payment_type = 'EMI_AUTOPAY'
     ORDER BY id DESC LIMIT 1`
  );
  const [paymentJournal] = await conn.query(
    `SELECT je.voucher_no, je.total_debit, je.total_credit, a.code, a.name, jel.debit, jel.credit, jel.narration
     FROM journal_entries je
     JOIN journal_entry_lines jel ON jel.journal_id = je.id
     JOIN accounts a ON a.id = jel.account_id
     WHERE je.source_type = 'GATEWAY_EMI_PAYMENT' AND je.source_id = ?
     ORDER BY jel.id`,
    [String(payment.id)]
  );

  const [[settlement]] = await conn.query(
    `SELECT * FROM payment_settlements
     WHERE status = 'RECONCILED'
     ORDER BY id DESC LIMIT 1`
  );
  const [settlementJournal] = await conn.query(
    `SELECT je.voucher_no, je.total_debit, je.total_credit, a.code, a.name, jel.debit, jel.credit, jel.narration
     FROM journal_entries je
     JOIN journal_entry_lines jel ON jel.journal_id = je.id
     JOIN accounts a ON a.id = jel.account_id
     WHERE je.source_type = 'GATEWAY_SETTLEMENT' AND je.source_id = ?
     ORDER BY jel.id`,
    [String(settlement.id)]
  );

  const branchToken = jwt.sign(
    {
      id: 999998,
      username: "branch2_manager_check",
      full_name: "Branch 2 Manager Check",
      role: "manager",
      branch_id: 2,
      permissions: { customers: { view: true, edit: true }, payments: { view: true, edit: true }, accounting: { view: true, edit: true } },
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  const retryRes = await fetch(`${API}/emi/plans/${payment.emi_plan_id}/autopay/retry`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${branchToken}` },
    body: JSON.stringify({ provider: "mock" }),
  });
  const plansRes = await fetch(`${API}/emi/plans`, {
    headers: { Authorization: `Bearer ${branchToken}` },
  });
  const plansBody = await plansRes.json();
  const leakedPlan = (plansBody.data || []).some((p) => Number(p.id) === Number(payment.emi_plan_id));

  const [[tb]] = await conn.query("SELECT SUM(total_debit) AS dr, SUM(total_credit) AS cr FROM journal_entries");
  console.log("GATEWAY_POSTCHECK", {
    captured_gateway_payment: {
      id: payment.id,
      provider_payment_id: payment.provider_payment_id,
      amount: payment.amount,
      status: payment.status,
      branch_id: payment.branch_id,
    },
    payment_journal: paymentJournal,
    settlement: {
      id: settlement.id,
      settlement_id: settlement.settlement_id,
      gross_amount: settlement.gross_amount,
      gateway_fee: settlement.gateway_fee,
      gateway_fee_tax: settlement.gateway_fee_tax,
      net_amount: settlement.net_amount,
      status: settlement.status,
    },
    settlement_journal: settlementJournal,
    branch_retry_status: retryRes.status,
    branch_list_status: plansRes.status,
    branch_plan_leaked: leakedPlan,
    trial_balance: { debit: tb.dr, credit: tb.cr, balanced: Number(tb.dr) === Number(tb.cr) },
  });
  await conn.end();
}

main().catch((err) => {
  console.error("GATEWAY_POSTCHECK_FAILED", err);
  process.exit(1);
});
