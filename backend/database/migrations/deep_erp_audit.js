const db = require('../../config/db');

async function runDeepAudit() {
  console.log('=== 1. RUNTIME DATABASE CONNECTION ===');
  const [[runtime]] = await db.query(`
    SELECT
      DATABASE() AS database_name,
      @@hostname AS server_hostname,
      @@port AS server_port,
      VERSION() AS mysql_version
  `);
  console.log(JSON.stringify(runtime, null, 2));

  console.log('\n=== 2. TABLE COUNT & INVENTORY ===');
  const [tables] = await db.query(`
    SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME ASC
  `);
  console.log(`Total Base Tables: ${tables.length}`);

  console.log('\n=== 3. TABLE ROW COUNTS ===');
  let totalRows = 0;
  const tableCounts = {};
  for (const t of tables) {
    const [[{ cnt }]] = await db.query(`SELECT COUNT(*) AS cnt FROM \`${t.TABLE_NAME}\``);
    totalRows += cnt;
    tableCounts[t.TABLE_NAME] = cnt;
    if (cnt > 0) {
      console.log(`• ${t.TABLE_NAME.padEnd(32)}: ${cnt} rows`);
    }
  }
  console.log(`\nTotal Populated Tables: ${Object.values(tableCounts).filter(c => c > 0).length}`);
  console.log(`Total Rows Across All Tables: ${totalRows}`);

  console.log('\n=== 4. INTEGRITY & DATA QUALITY CHECKS ===');
  // Check negative stock
  const [negStock] = await db.query(`SELECT id, product_code, name, stock_qty FROM products WHERE stock_qty < 0`);
  console.log('Negative Stock Count:', negStock.length);

  // Check negative customer balances
  const [negCust] = await db.query(`SELECT id, full_name, balance_due, wallet_balance, loyalty_points FROM customers WHERE balance_due < 0 OR wallet_balance < 0 OR loyalty_points < 0`);
  console.log('Negative Customer Balances Count:', negCust.length);

  // Check negative supplier dues
  const [negSupp] = await db.query(`SELECT id, company_name, outstanding FROM suppliers WHERE outstanding < 0`);
  console.log('Negative Supplier Dues Count:', negSupp.length);

  // Check duplicate active customer phones
  const [dupPhones] = await db.query(`
    SELECT phone, COUNT(*) AS count
    FROM customers
    WHERE status = 'ACTIVE' AND phone IS NOT NULL AND phone != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
  `);
  console.log('Duplicate Active Customer Phones Count:', dupPhones.length);

  // Check duplicate invoice numbers
  const [dupInvoices] = await db.query(`
    SELECT invoice_no, COUNT(*) AS count
    FROM invoices
    WHERE invoice_no IS NOT NULL AND invoice_no != ''
    GROUP BY invoice_no
    HAVING COUNT(*) > 1
  `);
  console.log('Duplicate Invoice Numbers Count:', dupInvoices.length);

  // Check duplicate receipt numbers
  const [dupReceipts] = await db.query(`
    SELECT receipt_no, COUNT(*) AS count
    FROM emi_installments
    WHERE receipt_no IS NOT NULL AND receipt_no != ''
    GROUP BY receipt_no
    HAVING COUNT(*) > 1
  `);
  console.log('Duplicate Receipt Numbers Count:', dupReceipts.length);

  // Check duplicate metal rate records
  const [dupRates] = await db.query(`
    SELECT effective_date, COUNT(*) AS count
    FROM gold_rates
    WHERE effective_date IS NOT NULL
    GROUP BY effective_date
    HAVING COUNT(*) > 1
  `);
  console.log('Duplicate Gold Rate Dates Count:', dupRates.length);

  // Foreign Key Constraints
  const [fks] = await db.query(`
    SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
  `);
  console.log('Total Foreign Key Constraints:', fks.length);

  // Check Orphans
  const [[{ o1 }]] = await db.query(`SELECT COUNT(*) AS cnt FROM invoice_items ii LEFT JOIN invoices i ON ii.invoice_id = i.id WHERE i.id IS NULL`);
  const [[{ o2 }]] = await db.query(`SELECT COUNT(*) AS cnt FROM customer_ledger cl LEFT JOIN customers c ON cl.customer_id = c.id WHERE c.id IS NULL`);
  const [[{ o3 }]] = await db.query(`SELECT COUNT(*) AS cnt FROM customer_memberships cm LEFT JOIN customers c ON cm.customer_id = c.id WHERE c.id IS NULL`);
  const [[{ o4 }]] = await db.query(`SELECT COUNT(*) AS cnt FROM emi_plans ep LEFT JOIN customers c ON ep.customer_id = c.id WHERE c.id IS NULL`);
  const [[{ o5 }]] = await db.query(`SELECT COUNT(*) AS cnt FROM supplier_ledger sl LEFT JOIN suppliers s ON sl.supplier_id = s.id WHERE s.id IS NULL`);
  const [[{ o6 }]] = await db.query(`SELECT COUNT(*) AS cnt FROM repair_jobs rj LEFT JOIN customers c ON rj.customer_id = c.id WHERE c.id IS NULL`);
  const [[{ o7 }]] = await db.query(`SELECT COUNT(*) AS cnt FROM grn_items gi LEFT JOIN grns g ON gi.grn_id = g.id WHERE g.id IS NULL`);
  const [[{ o8 }]] = await db.query(`SELECT COUNT(*) AS cnt FROM purchase_order_items poi LEFT JOIN purchase_orders po ON poi.po_id = po.id WHERE po.id IS NULL`);
  const [[{ o9 }]] = await db.query(`SELECT COUNT(*) AS cnt FROM stock_movements sm LEFT JOIN products p ON sm.product_id = p.id WHERE p.id IS NULL`);
  console.log('Orphan Records Audit:', {
    invoice_items: o1,
    customer_ledger: o2,
    customer_memberships: o3,
    emi_plans: o4,
    supplier_ledger: o5,
    repair_jobs: o6,
    grn_items: o7,
    purchase_order_items: o8,
    stock_movements: o9
  });

  process.exit(0);
}

runDeepAudit().catch(e => {
  console.error(e);
  process.exit(1);
});
