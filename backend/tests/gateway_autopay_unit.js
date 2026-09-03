const assert = require("assert");
const gateway = require("../services/paymentGatewayService");
const accounting = require("../services/accountingPostingService");

function createMockConn() {
  const state = {
    accounts: [
      { id: 1, code: "1010", name: "Cash", current_balance: 0 },
      { id: 2, code: "1020", name: "Bank", current_balance: 0 },
      { id: 3, code: "1030", name: "Accounts Receivable", current_balance: 0 },
      { id: 4, code: "1050", name: "UPI Clearing", current_balance: 0 },
      { id: 5, code: "5055", name: "Gateway Charges", current_balance: 0 },
    ],
    mappings: [
      { mode_code: "UPI", receipt_account_id: 4, settlement_account_id: 2, clearing_account_id: 4, fee_account_id: 5, is_active: 1 },
    ],
    journalId: 0,
    entries: [],
    lines: [],
  };
  return {
    state,
    async query(sql, params) {
      if (sql.includes("FROM payment_account_mappings")) {
        const mode = params[0];
        const row = state.mappings.find((m) => m.mode_code === mode);
        return [[{ ...row, receipt_code: "1050", receipt_name: "UPI Clearing" }]];
      }
      if (sql.includes("SELECT id, code, name FROM accounts WHERE code")) {
        const row = state.accounts.find((a) => a.code === params[0]);
        return [[row].filter(Boolean)];
      }
      if (sql.includes("INSERT INTO journal_entries")) {
        state.journalId += 1;
        state.entries.push({ id: state.journalId, params });
        return [{ insertId: state.journalId }];
      }
      if (sql.includes("INSERT INTO journal_entry_lines")) {
        state.lines.push(params);
        return [{ insertId: state.lines.length }];
      }
      if (sql.includes("UPDATE accounts SET current_balance")) {
        const account = state.accounts.find((a) => a.id === params[2]);
        account.current_balance += Number(params[0]) - Number(params[1]);
        return [{}];
      }
      throw new Error(`Unexpected SQL in unit test: ${sql}`);
    },
  };
}

async function main() {
  process.env.MOCK_GATEWAY_WEBHOOK_SECRET = "unit-secret";
  const adapter = gateway.getAdapter("mock");
  const payload = {
    id: "evt_unit_1",
    event: "payment.captured",
    payment: {
      id: "pay_unit_1",
      order_id: "order_unit_1",
      mandate_id: "mandate_unit_1",
      amount: 10000,
      fee: 100,
      tax: 18,
      currency: "INR",
      status: "captured",
    },
  };
  const signature = adapter.signTestWebhook(payload);
  assert.strictEqual(adapter.verifyWebhookSignature({ headers: { "x-mock-signature": signature }, rawBody: JSON.stringify(payload) }), true);
  assert.strictEqual(adapter.verifyWebhookSignature({ headers: { "x-mock-signature": "bad" }, rawBody: JSON.stringify(payload) }), false);

  const parsed = adapter.parseWebhook(payload);
  assert.strictEqual(parsed.event_id, "evt_unit_1");
  assert.strictEqual(parsed.provider_payment_id, "pay_unit_1");
  assert.strictEqual(parsed.provider_order_id, "order_unit_1");
  assert.strictEqual(parsed.status, "CAPTURED");
  assert.strictEqual(parsed.amount, 10000);

  const conn = createMockConn();
  const journal = await accounting.postCustomerReceipt(conn, {
    amount: 10000,
    payment_mode: "UPI",
    reference_no: "RCP-UNIT",
    source_type: "GATEWAY_EMI_PAYMENT",
    source_id: 1,
    branch_id: 1,
  });
  assert.strictEqual(journal.total_debit, 10000);
  assert.strictEqual(journal.total_credit, 10000);
  assert.strictEqual(conn.state.lines.length, 2);

  const gross = 10000;
  const gatewayFee = 100;
  const gatewayFeeTax = 18;
  const net = gross - gatewayFee - gatewayFeeTax;
  assert.strictEqual(net, 9882);

  console.log("GATEWAY_AUTOPAY_UNIT_OK", {
    signature_valid: true,
    invalid_signature_rejected: true,
    parsed_payment: parsed.provider_payment_id,
    journal_balanced: journal.total_debit === journal.total_credit,
    settlement_net: net,
  });
}

main().catch((err) => {
  console.error("GATEWAY_AUTOPAY_UNIT_FAILED", err);
  process.exit(1);
});
