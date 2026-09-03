const db = require("../../config/db");

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
  console.log(`Finance hardening migration on ${currentDb}`);

  await addAccount("1053", "Cheque/DD Clearing Account", "ASSET", "Current Assets");
  await addAccount("2025", "GST Input Tax Credit", "ASSET", "Duties & Taxes");
  await addAccount("4015", "Sales Returns & Refunds", "REVENUE", "Direct Revenue");

  await upsertPaymentMapping("CHEQUE", "1053", "1020", "1053");

  console.log("Finance hardening migration complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
