const db = require('../../config/db');

async function reconcileAivenSchema() {
  console.log('=== CHECKING MISSING TABLES / COLUMNS ON AIVEN ===');

  // 1. Check if purchase_order_items, grn_items, stock_movements exist
  const [tables] = await db.query(`
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'defaultdb' AND TABLE_NAME IN ('purchase_order_items', 'grn_items', 'stock_movements')
  `);
  console.log('Found new tables in Aiven:', tables.map(t => t.TABLE_NAME));

  // 2. Check purchase_orders columns
  const [poCols] = await db.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'defaultdb' AND TABLE_NAME = 'purchase_orders'
  `);
  console.log('purchase_orders columns:', poCols.map(c => c.COLUMN_NAME));

  // 3. Check grns columns
  const [grnCols] = await db.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'defaultdb' AND TABLE_NAME = 'grns'
  `);
  console.log('grns columns:', grnCols.map(c => c.COLUMN_NAME));

  // 4. Check supplier_ledger columns
  const [supLedgerCols] = await db.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'defaultdb' AND TABLE_NAME = 'supplier_ledger'
  `);
  console.log('supplier_ledger columns:', supLedgerCols.map(c => c.COLUMN_NAME));

  // 5. Check products columns
  const [prodCols] = await db.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'defaultdb' AND TABLE_NAME = 'products'
  `);
  console.log('products columns:', prodCols.map(c => c.COLUMN_NAME));

  process.exit(0);
}

reconcileAivenSchema().catch(e => {
  console.error(e);
  process.exit(1);
});
