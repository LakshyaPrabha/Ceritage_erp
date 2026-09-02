const accounting = require("./accountingPostingService");

function toMysqlDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

async function applySuccessfulGatewayPayment(conn, options) {
  const gatewayPaymentId = options.gateway_payment_id;
  const providerPaymentId = options.provider_payment_id;
  const amount = accounting.money(options.amount);
  if (!gatewayPaymentId || !amount || amount <= 0) throw new Error("Valid gateway payment and amount are required");

  const [paymentRows] = await conn.query(
    "SELECT * FROM payment_gateway_payments WHERE id = ? FOR UPDATE",
    [gatewayPaymentId]
  );
  if (paymentRows.length === 0) throw new Error("Gateway payment record not found");
  const gatewayPayment = paymentRows[0];
  if (gatewayPayment.status === "CAPTURED" && gatewayPayment.journal_id) {
    return { duplicate: true, gateway_payment: gatewayPayment };
  }

  const [planRows] = await conn.query("SELECT * FROM emi_plans WHERE id = ? FOR UPDATE", [gatewayPayment.emi_plan_id]);
  if (planRows.length === 0) throw new Error("EMI plan not found for gateway payment");
  const plan = planRows[0];

  const [installmentRows] = await conn.query(
    "SELECT * FROM emi_installments WHERE id = ? AND plan_id = ? FOR UPDATE",
    [gatewayPayment.emi_installment_id, plan.id]
  );
  if (installmentRows.length === 0) throw new Error("EMI installment not found for gateway payment");
  const installment = installmentRows[0];

  const amountDue = Number(installment.amount_due || installment.amount || 0);
  const amountPaid = Number(installment.amount_paid || installment.paid_amount || 0);
  const outstanding = accounting.money(amountDue - amountPaid);
  if (amount > outstanding + 0.01) {
    throw new Error(`Gateway payment ${amount} exceeds installment outstanding ${outstanding}`);
  }

  const payDate = toMysqlDate(options.captured_at);
  const [[{ count }]] = await conn.query("SELECT COUNT(*) AS count FROM emi_payments");
  const paymentNo = `RCP-GW-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const [emiPaymentResult] = await conn.query(
    `INSERT INTO emi_payments
     (payment_no, plan_id, installment_id, customer_id, amount, payment_date, payment_mode, reference_no, collected_by, notes, branch_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      paymentNo,
      plan.id,
      installment.id,
      plan.customer_id,
      amount,
      payDate,
      options.payment_mode || "UPI",
      providerPaymentId,
      "Gateway AutoPay",
      `Gateway ${gatewayPayment.provider} AutoPay capture`,
      plan.branch_id || 1,
    ]
  );

  const newInstPaid = accounting.money(amountPaid + amount);
  const newInstStatus = newInstPaid >= amountDue - 0.01 ? "Paid" : "Partial";
  await conn.query(
    `UPDATE emi_installments SET
       paid_amount = ?,
       amount_paid = ?,
       status = ?,
       paid_date = CASE WHEN ? = 'Paid' THEN ? ELSE paid_date END,
       payment_mode = ?,
       receipt_no = ?,
       gateway_payment_id = ?,
       failure_reason = NULL,
       next_retry_at = NULL
     WHERE id = ?`,
    [newInstPaid, newInstPaid, newInstStatus, newInstStatus, payDate, options.payment_mode || "UPI", paymentNo, gatewayPaymentId, installment.id]
  );

  const newPlanPaid = accounting.money(Number(plan.paid_amount || 0) + amount);
  const newRemaining = accounting.money(Math.max(0, Number(plan.remaining_amount || 0) - amount));
  const [nextRows] = await conn.query(
    "SELECT due_date FROM emi_installments WHERE plan_id = ? AND status IN ('Pending','Due','Partial','Failed','Overdue') ORDER BY installment_no ASC LIMIT 1",
    [plan.id]
  );
  const nextDueDate = nextRows.length ? nextRows[0].due_date : null;
  const planStatus = newRemaining <= 0 ? "Completed" : "Active";

  await conn.query(
    `UPDATE emi_plans SET
       paid_amount = ?,
       remaining_amount = ?,
       next_due_date = ?,
       next_debit_date = ?,
       status = ?,
       autopay_status = CASE WHEN payment_method = 'AUTOPAY' AND ? = 'Active' THEN 'ACTIVE' ELSE autopay_status END,
       last_payment_at = NOW(),
       last_failure_reason = NULL,
       retry_count = 0
     WHERE id = ?`,
    [newPlanPaid, newRemaining, nextDueDate, nextDueDate, planStatus, planStatus, plan.id]
  );

  const [[balanceRow]] = await conn.query(
    "SELECT (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)) AS current_balance FROM customer_ledger WHERE customer_id = ?",
    [plan.customer_id]
  );
  const currentBalance = Number(balanceRow.current_balance || 0);
  const newBalance = Math.max(0, accounting.money(currentBalance - amount));
  await conn.query(
    `INSERT INTO customer_ledger (customer_id, date, particulars, debit, credit, balance, reference)
     VALUES (?, ?, ?, 0, ?, ?, ?)`,
    [plan.customer_id, payDate, `AutoPay EMI #${installment.installment_no} (${plan.plan_id || plan.plan_code})`, amount, newBalance, paymentNo]
  );
  await conn.query("UPDATE customers SET balance_due = ? WHERE id = ?", [newBalance, plan.customer_id]);

  const journal = await accounting.postCustomerReceipt(conn, {
    branch_id: plan.branch_id || 1,
    amount,
    payment_mode: options.payment_mode || "UPI",
    reference_no: paymentNo,
    source_type: "GATEWAY_EMI_PAYMENT",
    source_id: gatewayPaymentId,
    entry_date: payDate,
    created_by: "Gateway AutoPay",
    narration: `Gateway EMI AutoPay receipt ${paymentNo}`,
  });

  await conn.query(
    `UPDATE payment_gateway_payments SET
       provider_payment_id = COALESCE(provider_payment_id, ?),
       status = 'CAPTURED',
       webhook_event_id = ?,
       journal_id = ?,
       gateway_fee = ?,
       gateway_fee_tax = ?,
       captured_at = NOW(),
       failure_reason = NULL
     WHERE id = ?`,
    [
      providerPaymentId,
      options.webhook_event_id || null,
      journal.id,
      accounting.money(options.gateway_fee),
      accounting.money(options.gateway_fee_tax),
      gatewayPaymentId,
    ]
  );

  await conn.query(
    `INSERT INTO customer_audit_logs (customer_id, action_type, action, performed_by, description, details, branch_id)
     VALUES (?, 'EMI_AUTOPAY_CAPTURED', 'EMI_AUTOPAY_CAPTURED', 'Gateway AutoPay', ?, ?, ?)`,
    [
      plan.customer_id,
      `AutoPay captured INR ${amount.toLocaleString("en-IN")} for ${plan.plan_id || plan.plan_code} installment #${installment.installment_no}`,
      JSON.stringify({ payment_no: paymentNo, provider_payment_id: providerPaymentId, journal_voucher_no: journal.voucher_no }),
      plan.branch_id || 1,
    ]
  );

  return {
    duplicate: false,
    payment_no: paymentNo,
    journal,
    remaining_plan_balance: newRemaining,
    installment_status: newInstStatus,
    customer_balance_due: newBalance,
  };
}

async function markGatewayPaymentFailed(conn, options) {
  const gatewayPaymentId = options.gateway_payment_id;
  const failureReason = options.failure_reason || "Gateway payment failed";
  const [paymentRows] = await conn.query(
    "SELECT * FROM payment_gateway_payments WHERE id = ? FOR UPDATE",
    [gatewayPaymentId]
  );
  if (paymentRows.length === 0) throw new Error("Gateway payment record not found");
  const payment = paymentRows[0];
  if (payment.status === "CAPTURED") return { ignored: true };

  await conn.query(
    `UPDATE payment_gateway_payments
     SET status = 'FAILED', provider_payment_id = COALESCE(provider_payment_id, ?),
         webhook_event_id = ?, failure_reason = ?
     WHERE id = ?`,
    [options.provider_payment_id || null, options.webhook_event_id || null, failureReason, gatewayPaymentId]
  );
  await conn.query(
    `UPDATE emi_installments
     SET status = 'Failed', failure_reason = ?, retry_count = retry_count + 1,
         last_attempt_at = NOW(), next_retry_at = DATE_ADD(NOW(), INTERVAL 1 DAY)
     WHERE id = ? AND status != 'Paid'`,
    [failureReason, payment.emi_installment_id]
  );
  await conn.query(
    `UPDATE emi_plans
     SET autopay_status = 'FAILED', last_failure_reason = ?, retry_count = retry_count + 1
     WHERE id = ? AND status = 'Active'`,
    [failureReason, payment.emi_plan_id]
  );

  return { ignored: false, failure_reason: failureReason };
}

module.exports = {
  applySuccessfulGatewayPayment,
  markGatewayPaymentFailed,
};
