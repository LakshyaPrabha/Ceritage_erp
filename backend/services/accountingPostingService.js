const ACCOUNT_CODES = {
  CASH: "1010",
  BANK: "1020",
  RECEIVABLE: "1030",
  STOCK: "1040",
  PAYABLE: "2010",
  GST_OUTPUT: "2020",
  CUSTOMER_ADVANCE: "2030",
  EMI_LIABILITY: "2040",
  SALES: "4010",
  SALES_RETURNS: "4015",
  PURCHASES: "5010",
  GST_INPUT: "2025",
};

function money(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizeMode(mode) {
  const raw = String(mode || "CASH").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (raw === "CREDIT CARD") return "CREDIT_CARD";
  if (raw === "DEBIT CARD") return "DEBIT_CARD";
  if (raw === "BANK" || raw === "BANK_TRANSFER" || raw === "TRANSFER") return "BANK_TRANSFER";
  if (raw === "NET_BANKING" || raw === "NETBANKING") return "NETBANKING";
  return raw;
}

async function getAccountByCode(conn, code) {
  const [rows] = await conn.query("SELECT id, code, name FROM accounts WHERE code = ?", [code]);
  if (rows.length === 0) throw new Error(`Accounting account ${code} is missing`);
  return rows[0];
}

async function getPaymentMapping(conn, paymentMode) {
  const modeCode = normalizeMode(paymentMode);
  const [rows] = await conn.query(
    `SELECT pam.*, a.code AS receipt_code, a.name AS receipt_name
     FROM payment_account_mappings pam
     JOIN accounts a ON a.id = pam.receipt_account_id
     WHERE pam.mode_code COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci AND pam.is_active = 1`,
    [modeCode]
  );
  if (rows.length === 0) {
    throw new Error(`No active accounting mapping found for payment mode ${paymentMode}`);
  }
  return rows[0];
}

async function resolveLine(conn, line) {
  if (line.account_id) return { ...line, account_id: line.account_id };
  const account = await getAccountByCode(conn, line.account_code);
  return { ...line, account_id: account.id };
}

async function postJournal(conn, options) {
  const lines = [];
  for (const line of options.lines || []) {
    const debit = money(line.debit);
    const credit = money(line.credit);
    if (debit < 0 || credit < 0) throw new Error("Negative journal amounts are not allowed");
    if (debit === 0 && credit === 0) continue;
    lines.push(await resolveLine(conn, { ...line, debit, credit }));
  }

  if (lines.length < 2) throw new Error("A journal posting requires at least two non-zero lines");

  const totalDebit = money(lines.reduce((sum, line) => sum + line.debit, 0));
  const totalCredit = money(lines.reduce((sum, line) => sum + line.credit, 0));
  if (Math.abs(totalDebit - totalCredit) > 0.01 || totalDebit <= 0) {
    throw new Error(`Accounting invariant failed: debit ${totalDebit.toFixed(2)} != credit ${totalCredit.toFixed(2)}`);
  }

  const voucherType = options.voucher_type || "JOURNAL";
  const prefix = voucherType === "RECEIPT" ? "RV" : voucherType === "PAYMENT" ? "PV" : voucherType === "CONTRA" ? "CV" : "JV";
  const voucherNo = options.voucher_no || `${prefix}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000000)}`;

  const [result] = await conn.query(
    `INSERT INTO journal_entries
       (voucher_no, voucher_type, entry_date, narration, total_debit, total_credit, created_by, branch_id, source_type, source_id, reference_no)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      voucherNo,
      voucherType,
      options.entry_date || new Date().toISOString().slice(0, 10),
      options.narration || null,
      totalDebit,
      totalCredit,
      options.created_by || "System",
      options.branch_id || null,
      options.source_type || null,
      options.source_id || null,
      options.reference_no || null,
    ]
  );

  for (const line of lines) {
    await conn.query(
      `INSERT INTO journal_entry_lines (journal_id, account_id, debit, credit, narration)
       VALUES (?, ?, ?, ?, ?)`,
      [result.insertId, line.account_id, line.debit, line.credit, line.narration || null]
    );
    await conn.query(
      "UPDATE accounts SET current_balance = current_balance + ? - ? WHERE id = ?",
      [line.debit, line.credit, line.account_id]
    );
  }

  return { id: result.insertId, voucher_no: voucherNo, total_debit: totalDebit, total_credit: totalCredit, lines };
}

async function buildTenderLines(conn, tenders, narrationPrefix) {
  const lines = [];
  const enriched = [];
  for (const tender of tenders || []) {
    const amount = money(tender.amount);
    if (amount <= 0) continue;
    const mapping = await getPaymentMapping(conn, tender.payment_mode);
    lines.push({
      account_id: mapping.receipt_account_id,
      debit: amount,
      credit: 0,
      narration: `${narrationPrefix} via ${tender.payment_mode}`,
    });
    enriched.push({ ...tender, amount, account_id: mapping.receipt_account_id, mode_code: mapping.mode_code });
  }
  return { lines, tenders: enriched };
}

async function postInvoiceSale(conn, options) {
  const grandTotal = money(options.grand_total);
  const cgst = money(options.cgst);
  const sgst = money(options.sgst);
  const igst = money(options.igst);
  const advanceApplied = money(options.advance_applied);
  const tenderTotal = money((options.tenders || []).reduce((sum, tender) => sum + money(tender.amount), 0));
  const taxTotal = money(cgst + sgst + igst);
  const taxable = money(options.taxable_amount ?? (grandTotal - taxTotal));
  const receivable = money(grandTotal - tenderTotal - advanceApplied);

  if (receivable < -0.01) throw new Error("Invoice tenders and advance exceed invoice grand total");

  const { lines: tenderLines, tenders } = await buildTenderLines(conn, options.tenders, `Invoice ${options.invoice_no}`);
  const lines = [...tenderLines];

  if (advanceApplied > 0) {
    lines.push({ account_code: ACCOUNT_CODES.CUSTOMER_ADVANCE, debit: advanceApplied, credit: 0, narration: `Advance applied to ${options.invoice_no}` });
  }
  if (receivable > 0) {
    lines.push({ account_code: ACCOUNT_CODES.RECEIVABLE, debit: receivable, credit: 0, narration: `Receivable for ${options.invoice_no}` });
  }
  if (taxable > 0) {
    lines.push({ account_code: ACCOUNT_CODES.SALES, debit: 0, credit: taxable, narration: `Taxable sale ${options.invoice_no}` });
  }
  if (cgst > 0) lines.push({ account_code: ACCOUNT_CODES.GST_OUTPUT, debit: 0, credit: cgst, narration: `Output CGST ${options.invoice_no}` });
  if (sgst > 0) lines.push({ account_code: ACCOUNT_CODES.GST_OUTPUT, debit: 0, credit: sgst, narration: `Output SGST ${options.invoice_no}` });
  if (igst > 0) lines.push({ account_code: ACCOUNT_CODES.GST_OUTPUT, debit: 0, credit: igst, narration: `Output IGST ${options.invoice_no}` });

  const journal = await postJournal(conn, {
    voucher_type: "JOURNAL",
    entry_date: options.entry_date,
    narration: `Sales invoice ${options.invoice_no}`,
    branch_id: options.branch_id,
    source_type: "INVOICE",
    source_id: String(options.invoice_id),
    reference_no: options.invoice_no,
    created_by: options.created_by,
    lines,
  });

  return { journal, tenders, receivable, tender_total: tenderTotal, taxable, tax_total: taxTotal };
}

async function postCustomerReceipt(conn, options) {
  const amount = money(options.amount);
  const mapping = await getPaymentMapping(conn, options.payment_mode);
  return postJournal(conn, {
    voucher_type: "RECEIPT",
    entry_date: options.entry_date,
    narration: options.narration || `Customer receipt ${options.reference_no}`,
    branch_id: options.branch_id,
    source_type: options.source_type || "CUSTOMER_PAYMENT",
    source_id: options.source_id ? String(options.source_id) : null,
    reference_no: options.reference_no,
    created_by: options.created_by,
    lines: [
      { account_id: mapping.receipt_account_id, debit: amount, credit: 0, narration: `Receipt via ${options.payment_mode}` },
      { account_code: ACCOUNT_CODES.RECEIVABLE, debit: 0, credit: amount, narration: "Customer receivable reduced" },
    ],
  });
}

async function postAdvanceReceipt(conn, options) {
  const amount = money(options.amount);
  const mapping = await getPaymentMapping(conn, options.payment_mode);
  return postJournal(conn, {
    voucher_type: "RECEIPT",
    entry_date: options.entry_date,
    narration: options.narration || `Customer advance ${options.reference_no}`,
    branch_id: options.branch_id,
    source_type: "CUSTOMER_ADVANCE",
    source_id: options.source_id ? String(options.source_id) : null,
    reference_no: options.reference_no,
    created_by: options.created_by,
    lines: [
      { account_id: mapping.receipt_account_id, debit: amount, credit: 0, narration: `Advance via ${options.payment_mode}` },
      { account_code: ACCOUNT_CODES.CUSTOMER_ADVANCE, debit: 0, credit: amount, narration: "Customer advance liability" },
    ],
  });
}

async function postSalesRefund(conn, options) {
  const amount = money(options.amount);
  const cgst = money(options.cgst);
  const sgst = money(options.sgst);
  const igst = money(options.igst);
  const taxTotal = money(cgst + sgst + igst);
  const taxable = money(options.taxable_amount ?? (amount - taxTotal));
  if (amount <= 0) throw new Error("Refund amount must be greater than zero");
  if (taxable < -0.01) throw new Error("Refund tax exceeds refund amount");

  const mode = normalizeMode(options.refund_mode || "CASH");
  let creditLine;
  if (mode === "CREDIT_ADJUSTMENT" || mode === "ADJUSTMENT") {
    creditLine = { account_code: ACCOUNT_CODES.RECEIVABLE, debit: 0, credit: amount, narration: "Customer receivable adjusted for return" };
  } else if (mode === "WALLET" || mode === "STORE_CREDIT") {
    creditLine = { account_code: ACCOUNT_CODES.CUSTOMER_ADVANCE, debit: 0, credit: amount, narration: "Store credit liability for return" };
  } else {
    const mapping = await getPaymentMapping(conn, options.refund_mode || "CASH");
    creditLine = { account_id: mapping.receipt_account_id, debit: 0, credit: amount, narration: `Refund paid via ${options.refund_mode || "Cash"}` };
  }

  const lines = [];
  if (taxable > 0) lines.push({ account_code: ACCOUNT_CODES.SALES_RETURNS, debit: taxable, credit: 0, narration: `Sales return ${options.reference_no}` });
  if (cgst > 0) lines.push({ account_code: ACCOUNT_CODES.GST_OUTPUT, debit: cgst, credit: 0, narration: `Output CGST reversal ${options.reference_no}` });
  if (sgst > 0) lines.push({ account_code: ACCOUNT_CODES.GST_OUTPUT, debit: sgst, credit: 0, narration: `Output SGST reversal ${options.reference_no}` });
  if (igst > 0) lines.push({ account_code: ACCOUNT_CODES.GST_OUTPUT, debit: igst, credit: 0, narration: `Output IGST reversal ${options.reference_no}` });
  lines.push(creditLine);

  return postJournal(conn, {
    voucher_type: "PAYMENT",
    entry_date: options.entry_date,
    narration: options.narration || `Sales refund ${options.reference_no}`,
    branch_id: options.branch_id,
    source_type: "SALES_RETURN",
    source_id: options.source_id ? String(options.source_id) : null,
    reference_no: options.reference_no,
    created_by: options.created_by,
    lines,
  });
}

async function postSupplierPayment(conn, options) {
  const amount = money(options.amount);
  if (amount <= 0) throw new Error("Supplier payment amount must be greater than zero");
  const mapping = await getPaymentMapping(conn, options.payment_mode || "CASH");
  return postJournal(conn, {
    voucher_type: "PAYMENT",
    entry_date: options.entry_date,
    narration: options.narration || `Supplier payment ${options.reference_no}`,
    branch_id: options.branch_id,
    source_type: "SUPPLIER_PAYMENT",
    source_id: options.source_id ? String(options.source_id) : null,
    reference_no: options.reference_no,
    created_by: options.created_by,
    lines: [
      { account_code: ACCOUNT_CODES.PAYABLE, debit: amount, credit: 0, narration: "Supplier payable reduced" },
      { account_id: mapping.receipt_account_id, debit: 0, credit: amount, narration: `Payment via ${options.payment_mode || "Cash"}` },
    ],
  });
}

async function postPurchaseAccrual(conn, options) {
  const taxable = money(options.taxable_amount);
  const gst = money(options.gst_amount);
  const total = money(options.total_amount ?? (taxable + gst));
  if (total <= 0) throw new Error("Purchase amount must be greater than zero");

  const lines = [];
  if (taxable > 0) lines.push({ account_code: ACCOUNT_CODES.PURCHASES, debit: taxable, credit: 0, narration: `Purchase ${options.reference_no}` });
  if (gst > 0) lines.push({ account_code: ACCOUNT_CODES.GST_INPUT, debit: gst, credit: 0, narration: `Input GST ${options.reference_no}` });
  lines.push({ account_code: ACCOUNT_CODES.PAYABLE, debit: 0, credit: total, narration: `Supplier payable ${options.reference_no}` });

  return postJournal(conn, {
    voucher_type: "JOURNAL",
    entry_date: options.entry_date,
    narration: options.narration || `Purchase ${options.reference_no}`,
    branch_id: options.branch_id,
    source_type: "PURCHASE_ORDER",
    source_id: options.source_id ? String(options.source_id) : null,
    reference_no: options.reference_no,
    created_by: options.created_by,
    lines,
  });
}

module.exports = {
  ACCOUNT_CODES,
  money,
  normalizeMode,
  getPaymentMapping,
  postJournal,
  postInvoiceSale,
  postCustomerReceipt,
  postAdvanceReceipt,
  postSalesRefund,
  postSupplierPayment,
  postPurchaseAccrual,
};
