const db = require('../../config/db');

async function afterAudit() {
  console.log('=== AIVEN DATABASE AFTER MIGRATION AUDIT ===');
  const [[runtime]] = await db.query(`
    SELECT
      DATABASE() AS database_name,
      @@hostname AS server_hostname,
      @@port AS server_port,
      @@version AS mysql_version
  `);
  console.log('Runtime Connection:', runtime);

  const [tables] = await db.query(`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'defaultdb'
    ORDER BY TABLE_NAME ASC
  `);

  console.log(`\nTotal Tables in Aiven (AFTER): ${tables.length}`);

  let totalRowsAcrossAllTables = 0;
  const inventory = [];

  for (const t of tables) {
    const tName = t.TABLE_NAME;
    const [[{ cnt }]] = await db.query(`SELECT COUNT(*) AS cnt FROM \`${tName}\``);
    const [cols] = await db.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'defaultdb' AND TABLE_NAME = ?
    `, [tName]);

    totalRowsAcrossAllTables += cnt;
    inventory.push({ table: tName, rows: cnt, colsCount: cols.length });
  }

  inventory.forEach(i => {
    if (i.rows > 0) {
      console.log(`• [POPULATED] ${i.table.padEnd(30)}: ${String(i.rows).padStart(4)} rows (${i.colsCount} cols)`);
    }
  });

  console.log(`\nTotal Populated Rows in Aiven: ${totalRowsAcrossAllTables}`);

  // Data Integrity Verification
  console.log('\n--- DATA INTEGRITY CHECKS ---');
  const [[{ dupPhones }]] = await db.query(`
    SELECT COUNT(*) AS dupPhones FROM (
      SELECT phone FROM customers WHERE status = 'ACTIVE' GROUP BY phone HAVING COUNT(*) > 1
    ) sub
  `);
  console.log('Duplicate Active Customer Phones:', dupPhones);

  const [[{ negBalances }]] = await db.query(`
    SELECT COUNT(*) AS negBalances FROM customers WHERE balance_due < 0 OR wallet_balance < 0 OR loyalty_points < 0
  `);
  console.log('Negative Customer Balances:', negBalances);

  const [[{ orphanLedgers }]] = await db.query(`
    SELECT COUNT(*) AS orphanLedgers FROM customer_ledger cl
    LEFT JOIN customers c ON cl.customer_id = c.id
    WHERE c.id IS NULL
  `);
  console.log('Orphan Customer Ledgers:', orphanLedgers);

  const [[{ orphanInvoiceItems }]] = await db.query(`
    SELECT COUNT(*) AS orphanInvoiceItems FROM invoice_items ii
    LEFT JOIN invoices i ON ii.invoice_id = i.id
    WHERE i.id IS NULL
  `);
  console.log('Orphan Invoice Items:', orphanInvoiceItems);

  process.exit(0);
}

afterAudit().catch(e => {
  console.error(e);
  process.exit(1);
});
