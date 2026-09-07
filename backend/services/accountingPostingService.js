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

let accountingTablesChecked = false;

const DEFAULT_ACCOUNTS = [
  { code: "1010", name: "Cash on Hand", type: "ASSET", group_name: "Current Assets" },
  { code: "1020", name: "Main Bank Account", type: "ASSET", group_name: "Current Assets" },
  { code: "1030", name: "Accounts Receivable", type: "ASSET", group_name: "Current Assets" },
  { code: "1040", name: "Jewellery Stock & Inventory", type: "ASSET", group_name: "Current Assets" },
  { code: "1050", name: "UPI Clearing Account", type: "ASSET", group_name: "Current Assets" },
  { code: "1051", name: "Card/POS Clearing Account", type: "ASSET", group_name: "Current Assets" },
  { code: "1052", name: "Wallet/Online Clearing Account", type: "ASSET", group_name: "Current Assets" },
  { code: "2010", name: "Accounts Payable (Karigars/Suppliers)", type: "LIABILITY", group_name: "Current Liabilities" },
  { code: "2020", name: "Output GST Payable", type: "LIABILITY", group_name: "Duties & Taxes" },
  { code: "2025", name: "Input GST Credit", type: "ASSET", group_name: "Duties & Taxes" },
  { code: "2030", name: "Customer Advance Deposits", type: "LIABILITY", group_name: "Current Liabilities" },
  { code: "2040", name: "EMI Liability Account", type: "LIABILITY", group_name: "Current Liabilities" },
  { code: "4010", name: "Jewellery Sales Revenue", type: "INCOME", group_name: "Direct Income" },
  { code: "4015", name: "Sales Returns & Reversals", type: "INCOME", group_name: "Direct Income" },
  { code: "5010", name: "Jewellery Material Purchases", type: "EXPENSE", group_name: "Direct Expenses" },
  { code: "5055", name: "Gateway & Bank Charges", type: "EXPENSE", group_name: "Indirect Expenses" },
];

async function ensureAccountingDefaults(conn) {
  if (accountingTablesChecked) return;
  try {
    // 1. Create accounts table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        type VARCHAR(50) NOT NULL,
        group_name VARCHAR(100) NULL,
        current_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        is_system TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure accounts.type is VARCHAR(50) in case it was previously created as restrictive ENUM
    await conn.query(`ALTER TABLE accounts MODIFY COLUMN type VARCHAR(50) NOT NULL`).catch(() => {});
    await conn.query(`ALTER TABLE journal_entries MODIFY COLUMN voucher_type VARCHAR(50) NOT NULL DEFAULT 'JOURNAL'`).catch(() => {});
    await conn.query(`ALTER TABLE customer_wallet_transactions MODIFY COLUMN transaction_type VARCHAR(50) NOT NULL`).catch(() => {});
    await conn.query(`ALTER TABLE customer_loyalty_transactions MODIFY COLUMN transaction_type VARCHAR(50) NOT NULL`).catch(() => {});
    await conn.query(`ALTER TABLE customer_audit_logs MODIFY COLUMN action_type VARCHAR(50) NULL DEFAULT 'UPDATE'`).catch(() => {});

    // 2. Create payment_account_mappings table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_account_mappings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mode_code VARCHAR(30) NOT NULL UNIQUE,
        receipt_account_id INT NOT NULL,
        settlement_account_id INT NULL,
        clearing_account_id INT NULL,
        fee_account_id INT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pam_mode (mode_code, is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Create journal_entries table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        voucher_no VARCHAR(50) NOT NULL UNIQUE,
        voucher_type VARCHAR(50) NOT NULL DEFAULT 'JOURNAL',
        entry_date DATE NOT NULL,
        narration TEXT NULL,
        total_debit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        total_credit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        created_by VARCHAR(100) DEFAULT 'System',
        branch_id INT NULL,
        source_type VARCHAR(50) NULL,
        source_id VARCHAR(100) NULL,
        reference_no VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_je_date (entry_date),
        INDEX idx_je_src (source_type, source_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Create journal_entry_lines table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        journal_id INT NOT NULL,
        account_id INT NOT NULL,
        debit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        credit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
        narration TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_jel_journal (journal_id),
        INDEX idx_jel_account (account_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create invoice_tenders table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS invoice_tenders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        branch_id INT NOT NULL,
        payment_mode VARCHAR(50) NOT NULL,
        amount DECIMAL(14,2) NOT NULL,
        account_id INT NULL,
        reference_no VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_it_inv (invoice_id),
        INDEX idx_it_mode (payment_mode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Create customer_advance_applications table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS customer_advance_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rate_lock_id INT NOT NULL,
        invoice_id INT NOT NULL,
        branch_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_caa_lock (rate_lock_id),
        INDEX idx_caa_inv (invoice_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default chart of accounts
    for (const acc of DEFAULT_ACCOUNTS) {
      await conn.query(`
        INSERT INTO accounts (code, name, type, group_name, is_system)
        VALUES (?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), group_name = VALUES(group_name)
      `, [acc.code, acc.name, acc.type, acc.group_name]);
    }

    // Resolve Account IDs for mappings
    const [accRows] = await conn.query("SELECT id, code FROM accounts");
    const accMap = {};
    accRows.forEach(r => { accMap[r.code] = r.id; });

    const cashId = accMap["1010"] || 1;
    const bankId = accMap["1020"] || cashId;
    const upiId = accMap["1050"] || bankId;
    const cardId = accMap["1051"] || bankId;
    const feeId = accMap["5055"] || null;
    const walletId = accMap["2030"] || cashId;
    const emiId = accMap["1030"] || cashId;

    const DEFAULT_MAPPINGS = [
      { mode: "CASH", receipt: cashId, settlement: cashId, clearing: cashId, fee: null },
      { mode: "UPI", receipt: upiId, settlement: bankId, clearing: upiId, fee: null },
      { mode: "CARD", receipt: cardId, settlement: bankId, clearing: cardId, fee: feeId },
      { mode: "CREDIT_CARD", receipt: cardId, settlement: bankId, clearing: cardId, fee: feeId },
      { mode: "DEBIT_CARD", receipt: cardId, settlement: bankId, clearing: cardId, fee: feeId },
      { mode: "NETBANKING", receipt: bankId, settlement: bankId, clearing: bankId, fee: null },
      { mode: "BANK_TRANSFER", receipt: bankId, settlement: bankId, clearing: bankId, fee: null },
      { mode: "CHEQUE", receipt: bankId, settlement: bankId, clearing: bankId, fee: null },
      { mode: "WALLET", receipt: walletId, settlement: walletId, clearing: walletId, fee: null },
      { mode: "EMI", receipt: emiId, settlement: emiId, clearing: emiId, fee: null },
      { mode: "GOLD_EXCHANGE", receipt: accMap["1040"] || cashId, settlement: null, clearing: null, fee: null },
      { mode: "OLD_GOLD", receipt: accMap["1040"] || cashId, settlement: null, clearing: null, fee: null },
      { mode: "OTHER", receipt: cashId, settlement: cashId, clearing: cashId, fee: null }
    ];

    for (const m of DEFAULT_MAPPINGS) {
      await conn.query(`
        INSERT INTO payment_account_mappings 
          (mode_code, receipt_account_id, settlement_account_id, clearing_account_id, fee_account_id, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          receipt_account_id = VALUES(receipt_account_id),
          settlement_account_id = VALUES(settlement_account_id),
          clearing_account_id = VALUES(clearing_account_id),
          fee_account_id = VALUES(fee_account_id),
          is_active = 1
      `, [m.mode, m.receipt, m.settlement, m.clearing, m.fee]);
    }

    accountingTablesChecked = true;
  } catch (err) {
    console.warn("Accounting defaults initialization notice:", err.message);
  }
}

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
  await ensureAccountingDefaults(conn);
  const [rows] = await conn.query("SELECT id, code, name FROM accounts WHERE code = ?", [code]);
  if (rows.length > 0) return rows[0];

  const def = DEFAULT_ACCOUNTS.find(a => a.code === code) || {
    code,
    name: `System Account ${code}`,
    type: code.startsWith("1") ? "ASSET" : code.startsWith("2") ? "LIABILITY" : code.startsWith("4") ? "INCOME" : "EXPENSE",
    group_name: "General"
  };

  const [res] = await conn.query(
    `INSERT INTO accounts (code, name, type, group_name, is_system)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [def.code, def.name, def.type, def.group_name]
  );

  return { id: res.insertId, code: def.code, name: def.name };
}

async function getPaymentMapping(conn, paymentMode) {
  await ensureAccountingDefaults(conn);
  const modeCode = normalizeMode(paymentMode);
  const [rows] = await conn.query(
    `SELECT pam.*, a.code AS receipt_code, a.name AS receipt_name
     FROM payment_account_mappings pam
     JOIN accounts a ON a.id = pam.receipt_account_id
     WHERE pam.mode_code COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci AND pam.is_active = 1`,
    [modeCode]
  );
  if (rows.length > 0) {
    return rows[0];
  }

  // Resilient fallback to Cash (1010) or Bank (1020)
  const [[fallbackAcc]] = await conn.query("SELECT id, code, name FROM accounts WHERE code = '1010' OR code = '1020' ORDER BY id ASC LIMIT 1");
  if (fallbackAcc) {
    try {
      await conn.query(
        `INSERT INTO payment_account_mappings (mode_code, receipt_account_id, is_active)
         VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE receipt_account_id = VALUES(receipt_account_id), is_active = 1`,
        [modeCode, fallbackAcc.id]
      );
    } catch { /* silent */ }

    return {
      mode_code: modeCode,
      receipt_account_id: fallbackAcc.id,
      receipt_code: fallbackAcc.code,
      receipt_name: fallbackAcc.name,
      is_active: 1
    };
  }

  throw new Error(`No active accounting mapping found for payment mode ${paymentMode}`);
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
  const tcs = money(options.tcs);
  const advanceApplied = money(options.advance_applied);
  const tenderTotal = money((options.tenders || []).reduce((sum, tender) => sum + money(tender.amount), 0));
  const taxTotal = money(cgst + sgst + igst);
  const taxable = money(options.taxable_amount ?? (grandTotal - taxTotal - tcs));
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
  if (tcs > 0) lines.push({ account_code: ACCOUNT_CODES.GST_OUTPUT, debit: 0, credit: tcs, narration: `TCS payable ${options.invoice_no}` });

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
