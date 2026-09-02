const accounting = require("./accountingPostingService");

async function getAccountId(conn, code) {
  const [rows] = await conn.query("SELECT id FROM accounts WHERE code = ?", [code]);
  if (!rows.length) throw new Error(`Accounting account ${code} is missing`);
  return rows[0].id;
}

async function createSettlement(conn, options) {
  const provider = String(options.provider || "mock").toLowerCase();
  const paymentIds = options.gateway_payment_ids || [];
  if (!paymentIds.length) throw new Error("At least one gateway payment is required for settlement");

  const [payments] = await conn.query(
    `SELECT * FROM payment_gateway_payments
     WHERE id IN (?) AND provider = ? AND status = 'CAPTURED'
     FOR UPDATE`,
    [paymentIds, provider]
  );
  if (payments.length !== paymentIds.length) throw new Error("Settlement contains missing or uncaptured gateway payments");

  const gross = accounting.money(payments.reduce((sum, p) => sum + Number(p.amount || 0), 0));
  const fee = accounting.money(options.gateway_fee ?? payments.reduce((sum, p) => sum + Number(p.gateway_fee || 0), 0));
  const feeTax = accounting.money(options.gateway_fee_tax ?? payments.reduce((sum, p) => sum + Number(p.gateway_fee_tax || 0), 0));
  const net = accounting.money(options.net_amount ?? (gross - fee - feeTax));
  if (gross <= 0) throw new Error("Settlement gross amount must be greater than zero");
  if (fee < 0 || feeTax < 0 || net < 0) {
    throw new Error("Settlement fee, fee tax, and net amount cannot be negative");
  }
  if (Math.abs(accounting.money(gross - fee - feeTax) - net) > 0.01) {
    throw new Error("Settlement invariant failed: gross - fees must equal net settlement");
  }

  const settlementRef = options.settlement_id || `SET-${provider.toUpperCase()}-${Date.now()}`;
  const bankAccountId = options.bank_account_id || await getAccountId(conn, accounting.ACCOUNT_CODES.BANK);

  const [settlementResult] = await conn.query(
    `INSERT INTO payment_settlements
     (provider, settlement_id, branch_id, bank_account_id, gross_amount, gateway_fee, gateway_fee_tax, net_amount, settlement_date, status, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNRECONCILED', ?)`,
    [
      provider,
      settlementRef,
      options.branch_id || payments[0].branch_id || null,
      bankAccountId,
      gross,
      fee,
      feeTax,
      net,
      options.settlement_date || new Date().toISOString().slice(0, 10),
      JSON.stringify(options.metadata || {}),
    ]
  );

  for (const payment of payments) {
    const paymentGross = Number(payment.amount || 0);
    const paymentFee = accounting.money(Number(payment.gateway_fee || 0));
    const paymentFeeTax = accounting.money(Number(payment.gateway_fee_tax || 0));
    await conn.query(
      `INSERT INTO payment_settlement_items
       (settlement_id, gateway_payment_id, gross_amount, gateway_fee, gateway_fee_tax, net_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [settlementResult.insertId, payment.id, paymentGross, paymentFee, paymentFeeTax, accounting.money(paymentGross - paymentFee - paymentFeeTax)]
    );
  }

  const firstPaymentMode = payments[0].payment_mode || "UPI";
  const mapping = await accounting.getPaymentMapping(conn, firstPaymentMode);
  const lines = [
    { account_id: bankAccountId, debit: net, credit: 0, narration: `Gateway settlement ${settlementRef}` },
  ];
  if (fee + feeTax > 0) {
    const feeAccountId = mapping.fee_account_id || await getAccountId(conn, "5055");
    lines.push({ account_id: feeAccountId, debit: accounting.money(fee + feeTax), credit: 0, narration: `Gateway fees ${settlementRef}` });
  }
  lines.push({
    account_id: mapping.clearing_account_id || mapping.receipt_account_id,
    debit: 0,
    credit: gross,
    narration: `Clear gateway receivable ${settlementRef}`,
  });

  const journal = await accounting.postJournal(conn, {
    voucher_type: "CONTRA",
    branch_id: options.branch_id || payments[0].branch_id || null,
    source_type: "GATEWAY_SETTLEMENT",
    source_id: settlementResult.insertId,
    reference_no: settlementRef,
    created_by: options.created_by || "Gateway Settlement",
    narration: `Gateway settlement ${settlementRef}`,
    lines,
  });

  await conn.query(
    "UPDATE payment_settlements SET status = 'RECONCILED', journal_id = ? WHERE id = ?",
    [journal.id, settlementResult.insertId]
  );

  return { id: settlementResult.insertId, settlement_id: settlementRef, gross_amount: gross, gateway_fee: fee, gateway_fee_tax: feeTax, net_amount: net, journal };
}

module.exports = {
  createSettlement,
};
