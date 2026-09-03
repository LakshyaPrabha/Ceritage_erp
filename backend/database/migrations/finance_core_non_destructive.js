const db = require("../../config/db");

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (await columnExists(table, column)) {
    console.log(`ok ${table}.${column}`);
    return;
  }
  await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`added ${table}.${column}`);
}

async function addAccount(code, name, type, groupName) {
  await db.query(
    `INSERT INTO accounts (code, name, type, group_name, is_system)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), group_name = VALUES(group_name)`,
    [code, name, type, groupName]
  );
}

async function accountId(code) {
  const [[row]] = await db.query("SELECT id FROM accounts WHERE code = ?", [code]);
  if (!row) throw new Error(`Missing account ${code}`);
  return row.id;
}

async function upsertPaymentMapping(modeCode, receiptCode, settlementCode = null, clearingCode = null, feeCode = null) {
  await db.query(
    `INSERT INTO payment_account_mappings
       (mode_code, receipt_account_id, settlement_account_id, clearing_account_id, fee_account_id, is_active)
     VALUES (?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       receipt_account_id = VALUES(receipt_account_id),
       settlement_account_id = VALUES(settlement_account_id),
       clearing_account_id = VALUES(clearing_account_id),
       fee_account_id = VALUES(fee_account_id),
       is_active = 1`,
    [
      modeCode,
      await accountId(receiptCode),
      settlementCode ? await accountId(settlementCode) : null,
      clearingCode ? await accountId(clearingCode) : null,
      feeCode ? await accountId(feeCode) : null,
    ]
  );
}

async function main() {
  const [[{ currentDb }]] = await db.query("SELECT DATABASE() AS currentDb");
  console.log(`Finance core migration on ${currentDb}`);

  await addAccount("1050", "UPI Clearing Account", "ASSET", "Current Assets");
  await addAccount("1051", "Card/POS Clearing Account", "ASSET", "Current Assets");
  await addAccount("1052", "Wallet/Online Clearing Account", "ASSET", "Current Assets");
  await addAccount("5055", "Gateway & Bank Charges", "EXPENSE", "Indirect Expenses");

  await addColumnIfMissing("journal_entries", "branch_id", "INT NULL");
  await addColumnIfMissing("journal_entries", "source_type", "VARCHAR(50) NULL");
  await addColumnIfMissing("journal_entries", "source_id", "VARCHAR(100) NULL");
  await addColumnIfMissing("journal_entries", "reference_no", "VARCHAR(100) NULL");

  await addColumnIfMissing("invoices", "membership_tier", "VARCHAR(50) DEFAULT 'Regular'");
  await addColumnIfMissing("invoices", "loyalty_multiplier", "DECIMAL(5,2) DEFAULT 1.00");
  await addColumnIfMissing("invoices", "making_discount_pct", "DECIMAL(5,2) DEFAULT 0.00");
  await addColumnIfMissing("invoices", "making_discount_amt", "DECIMAL(12,2) DEFAULT 0.00");
  await addColumnIfMissing("invoices", "wallet_used", "DECIMAL(12,2) DEFAULT 0.00");
  await addColumnIfMissing("invoices", "points_redeemed", "INT DEFAULT 0");
  await addColumnIfMissing("invoices", "points_earned", "INT DEFAULT 0");

  await db.query(`
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
      FOREIGN KEY (receipt_account_id) REFERENCES accounts(id),
      FOREIGN KEY (settlement_account_id) REFERENCES accounts(id),
      FOREIGN KEY (clearing_account_id) REFERENCES accounts(id),
      FOREIGN KEY (fee_account_id) REFERENCES accounts(id)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS invoice_tenders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      branch_id INT NOT NULL,
      payment_mode VARCHAR(50) NOT NULL,
      amount DECIMAL(14,2) NOT NULL,
      account_id INT NULL,
      reference_no VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      INDEX idx_invoice_tenders_invoice (invoice_id),
      INDEX idx_invoice_tenders_branch (branch_id, payment_mode)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_advance_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rate_lock_id INT NOT NULL,
      invoice_id INT NOT NULL,
      branch_id INT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rate_lock_id) REFERENCES rate_locks(id),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      INDEX idx_adv_app_lock (rate_lock_id),
      INDEX idx_adv_app_invoice (invoice_id)
    )
  `);

  await upsertPaymentMapping("CASH", "1010");
  await upsertPaymentMapping("UPI", "1050", "1020", "1050");
  await upsertPaymentMapping("CARD", "1051", "1020", "1051", "5055");
  await upsertPaymentMapping("CREDIT_CARD", "1051", "1020", "1051", "5055");
  await upsertPaymentMapping("DEBIT_CARD", "1051", "1020", "1051", "5055");
  await upsertPaymentMapping("NETBANKING", "1020", "1020");
  await upsertPaymentMapping("BANK_TRANSFER", "1020", "1020");
  await upsertPaymentMapping("CHEQUE", "1020", "1020");
  await upsertPaymentMapping("WALLET", "2030");
  await upsertPaymentMapping("EMI", "1030");

  console.log("Finance core migration complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
