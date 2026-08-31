const db = require('../../config/db');

async function runAudit() {
  console.log('=== 1. RUNTIME CONNECTION DETAILS ===');
  const [[runtime]] = await db.query(`
    SELECT
      DATABASE() AS database_name,
      @@hostname AS server_hostname,
      @@port AS server_port,
      VERSION() AS mysql_version
  `);
  console.log(JSON.stringify(runtime, null, 2));

  console.log('\n=== 2. COMPLETE TABLE INVENTORY (BASE TABLES) ===');
  const [tables] = await db.query(`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME ASC
  `);
  console.log(`Total Base Tables: ${tables.length}`);

  console.log('\n=== 3. COMPLETE ROW COUNT FOR EVERY TABLE ===');
  let grandTotalRows = 0;
  const tableSummary = [];

  for (const t of tables) {
    const tName = t.TABLE_NAME;
    const [[{ cnt }]] = await db.query(`SELECT COUNT(*) AS cnt FROM \`${tName}\``);
    grandTotalRows += cnt;
    tableSummary.push({ name: tName, count: cnt });
    console.log(`• ${tName.padEnd(35)} : ${String(cnt).padStart(5)} rows`);
  }
  console.log(`\n========================================`);
  console.log(`TOTAL ROWS ACROSS ALL ${tables.length} TABLES: ${grandTotalRows}`);
  console.log(`========================================`);

  console.log('\n=== 4. INVESTIGATE THE USERS CHANGE ===');
  const [users] = await db.query(`
    SELECT id, username, full_name, role, branch_id, status, created_at, last_login
    FROM users
    ORDER BY id ASC
  `);
  console.log(JSON.stringify(users, null, 2));

  console.log('\n=== 5. INVESTIGATE MEMBERSHIP DATA ===');
  const [plans] = await db.query(`
    SELECT id, name, min_spend, annual_fee, loyalty_multiplier, making_discount_pct, is_active, created_at
    FROM membership_plans
    ORDER BY min_spend ASC
  `);
  console.log(`Total Plans: ${plans.length}`);
  console.log(JSON.stringify(plans, null, 2));

  const [[{ memberCount }]] = await db.query(`SELECT COUNT(*) AS memberCount FROM customer_memberships`);
  console.log(`Total Customer Memberships: ${memberCount}`);

  console.log('\n=== 7. FOREIGN KEY INTEGRITY & ORPHAN AUDIT ===');
  const [fks] = await db.query(`
    SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
  `);
  console.log(`Total Active Foreign Key Constraints: ${fks.length}`);

  const [[{ o1 }]] = await db.query(`SELECT COUNT(*) AS o1 FROM invoice_items ii LEFT JOIN invoices i ON ii.invoice_id = i.id WHERE i.id IS NULL`);
  const [[{ o2 }]] = await db.query(`SELECT COUNT(*) AS o2 FROM customer_ledger cl LEFT JOIN customers c ON cl.customer_id = c.id WHERE c.id IS NULL`);
  const [[{ o3 }]] = await db.query(`SELECT COUNT(*) AS o3 FROM customer_memberships cm LEFT JOIN customers c ON cm.customer_id = c.id WHERE c.id IS NULL`);
  const [[{ o4 }]] = await db.query(`SELECT COUNT(*) AS o4 FROM emi_plans ep LEFT JOIN customers c ON ep.customer_id = c.id WHERE c.id IS NULL`);
  const [[{ o5 }]] = await db.query(`SELECT COUNT(*) AS o5 FROM supplier_ledger sl LEFT JOIN suppliers s ON sl.supplier_id = s.id WHERE s.id IS NULL`);
  const [[{ o6 }]] = await db.query(`SELECT COUNT(*) AS o6 FROM repair_jobs rj LEFT JOIN customers c ON rj.customer_id = c.id WHERE c.id IS NULL`);
  const [[{ o7 }]] = await db.query(`SELECT COUNT(*) AS o7 FROM grn_items gi LEFT JOIN grns g ON gi.grn_id = g.id WHERE g.id IS NULL`);
  const [[{ o8 }]] = await db.query(`SELECT COUNT(*) AS o8 FROM purchase_order_items poi LEFT JOIN purchase_orders po ON poi.po_id = po.id WHERE po.id IS NULL`);
  const [[{ o9 }]] = await db.query(`SELECT COUNT(*) AS o9 FROM stock_movements sm LEFT JOIN products p ON sm.product_id = p.id WHERE p.id IS NULL`);

  const orphanBreakdown = {
    invoice_items: o1,
    customer_ledger: o2,
    customer_memberships: o3,
    emi_plans: o4,
    supplier_ledger: o5,
    repair_jobs: o6,
    grn_items: o7,
    purchase_order_items: o8,
    stock_movements: o9,
  };
  const totalOrphans = Object.values(orphanBreakdown).reduce((a, b) => a + b, 0);
  console.log('Orphan Record Breakdown:', JSON.stringify(orphanBreakdown, null, 2));
  console.log(`Total Orphan Records: ${totalOrphans}`);

  console.log('\n=== 8. DUPLICATE & FINANCIAL INTEGRITY AUDIT ===');
  const [[{ dupPhones }]] = await db.query(`
    SELECT COUNT(*) AS dupPhones FROM (
      SELECT phone FROM customers WHERE status = 'ACTIVE' AND phone IS NOT NULL GROUP BY phone HAVING COUNT(*) > 1
    ) sub
  `);
  const [[{ dupInvoices }]] = await db.query(`
    SELECT COUNT(*) AS dupInvoices FROM (
      SELECT invoice_no FROM invoices WHERE invoice_no IS NOT NULL GROUP BY invoice_no HAVING COUNT(*) > 1
    ) sub
  `);
  const [[{ dupReceipts }]] = await db.query(`
    SELECT COUNT(*) AS dupReceipts FROM (
      SELECT receipt_no FROM emi_installments WHERE receipt_no IS NOT NULL GROUP BY receipt_no HAVING COUNT(*) > 1
    ) sub
  `);
  const [[{ dupEmiPlans }]] = await db.query(`
    SELECT COUNT(*) AS dupEmiPlans FROM (
      SELECT plan_code FROM emi_plans WHERE plan_code IS NOT NULL GROUP BY plan_code HAVING COUNT(*) > 1
    ) sub
  `);
  const [[{ dupMemberships }]] = await db.query(`
    SELECT COUNT(*) AS dupMemberships FROM (
      SELECT customer_id FROM customer_memberships WHERE status = 'ACTIVE' GROUP BY customer_id HAVING COUNT(*) > 1
    ) sub
  `);
  const [[{ negCustBal }]] = await db.query(`
    SELECT COUNT(*) AS negCustBal FROM customers WHERE balance_due < 0 OR wallet_balance < 0 OR loyalty_points < 0
  `);
  const [[{ negSuppBal }]] = await db.query(`
    SELECT COUNT(*) AS negSuppBal FROM suppliers WHERE outstanding < 0
  `);

  console.log(JSON.stringify({
    duplicateActiveCustomerPhones: dupPhones,
    duplicateInvoices: dupInvoices,
    duplicateReceipts: dupReceipts,
    duplicateEmiPlans: dupEmiPlans,
    duplicateActiveMemberships: dupMemberships,
    negativeCustomerBalances: negCustBal,
    negativeSupplierBalances: negSuppBal,
  }, null, 2));

  process.exit(0);
}

runAudit().catch(e => {
  console.error('Audit Error:', e);
  process.exit(1);
});
