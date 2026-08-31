const db = require('../../config/db');

async function migrateAivenSafely() {
  console.log('=== NON-DESTRUCTIVE AIVEN SCHEMA MIGRATION ===');

  // Verify database is defaultdb
  const [[{ currentDb }]] = await db.query('SELECT DATABASE() AS currentDb');
  if (currentDb !== 'defaultdb') {
    throw new Error(`Safety check failed: active database is '${currentDb}', expected 'defaultdb'`);
  }
  console.log(`Confirmed Database: ${currentDb}`);

  // Helper to add column only if missing
  async function addColumnIfMissing(table, colName, colDef) {
    const [cols] = await db.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'defaultdb' AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [table, colName]);

    if (cols.length === 0) {
      console.log(`• Adding missing column: ${table}.${colName}`);
      await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${colName}\` ${colDef}`);
    } else {
      console.log(`✓ Column already exists: ${table}.${colName}`);
    }
  }

  // 1. Reconcile purchase_orders columns
  await addColumnIfMissing('purchase_orders', 'purchase_date', 'DATE NULL');
  await addColumnIfMissing('purchase_orders', 'material_type', 'VARCHAR(50) NULL');
  await addColumnIfMissing('purchase_orders', 'item_description', 'VARCHAR(255) NULL');
  await addColumnIfMissing('purchase_orders', 'purity', 'VARCHAR(30) NULL');
  await addColumnIfMissing('purchase_orders', 'weight_qty', 'DECIMAL(10,3) DEFAULT 0.000');
  await addColumnIfMissing('purchase_orders', 'rate', 'DECIMAL(10,2) DEFAULT 0.00');
  await addColumnIfMissing('purchase_orders', 'amount', 'DECIMAL(12,2) DEFAULT 0.00');
  await addColumnIfMissing('purchase_orders', 'gst_pct', 'DECIMAL(5,2) DEFAULT 3.00');
  await addColumnIfMissing('purchase_orders', 'gst_amount', 'DECIMAL(12,2) DEFAULT 0.00');
  await addColumnIfMissing('purchase_orders', 'subtotal', 'DECIMAL(12,2) DEFAULT 0.00');
  await addColumnIfMissing('purchase_orders', 'total', 'DECIMAL(12,2) DEFAULT 0.00');
  await addColumnIfMissing('purchase_orders', 'total_qty', 'INT DEFAULT 1');
  await addColumnIfMissing('purchase_orders', 'paid_amount', 'DECIMAL(12,2) DEFAULT 0.00');
  await addColumnIfMissing('purchase_orders', 'payment_mode', 'VARCHAR(50) NULL');
  await addColumnIfMissing('purchase_orders', 'remarks', 'TEXT NULL');

  // 2. Reconcile grns columns
  await addColumnIfMissing('grns', 'grn_id', 'VARCHAR(50) NULL');
  await addColumnIfMissing('grns', 'branch_id', 'INT DEFAULT 1');
  await addColumnIfMissing('grns', 'item_description', 'VARCHAR(255) NULL');
  await addColumnIfMissing('grns', 'weight_qty', 'DECIMAL(10,3) DEFAULT 0.000');
  await addColumnIfMissing('grns', 'total_items', 'INT DEFAULT 1');
  await addColumnIfMissing('grns', 'received_by', 'VARCHAR(100) NULL');
  await addColumnIfMissing('grns', 'condition_status', "VARCHAR(50) DEFAULT 'Good'");
  await addColumnIfMissing('grns', 'notes', 'TEXT NULL');

  // 3. Reconcile supplier_ledger columns
  await addColumnIfMissing('supplier_ledger', 'branch_id', 'INT DEFAULT 1');
  await addColumnIfMissing('supplier_ledger', 'po_no', 'VARCHAR(30) NULL');
  await addColumnIfMissing('supplier_ledger', 'item', 'VARCHAR(255) NULL');
  await addColumnIfMissing('supplier_ledger', 'total', 'DECIMAL(12,2) DEFAULT 0.00');
  await addColumnIfMissing('supplier_ledger', 'paid', 'DECIMAL(12,2) DEFAULT 0.00');

  // 4. Create missing tables IF NOT EXISTS
  console.log('\n--- CREATING MISSING EXTENSION TABLES ---');

  await db.query(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      po_id INT NOT NULL,
      product_id INT NULL,
      item_name VARCHAR(200) NOT NULL,
      category VARCHAR(100) NULL,
      purity VARCHAR(30) NULL,
      ordered_qty INT NOT NULL DEFAULT 1,
      received_qty INT NOT NULL DEFAULT 0,
      weight_g DECIMAL(10,3) NOT NULL DEFAULT 0.000,
      rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      making_charge DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      gst_pct DECIMAL(5,2) NOT NULL DEFAULT 3.00,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      INDEX idx_po_items (po_id)
    )
  `);
  console.log('✓ purchase_order_items verified/created');

  await db.query(`
    CREATE TABLE IF NOT EXISTS grn_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grn_id INT NOT NULL,
      po_item_id INT NULL,
      product_id INT NULL,
      item_name VARCHAR(200) NOT NULL,
      ordered_qty INT NOT NULL DEFAULT 0,
      received_qty INT NOT NULL DEFAULT 1,
      accepted_qty INT NOT NULL DEFAULT 1,
      rejected_qty INT NOT NULL DEFAULT 0,
      weight_g DECIMAL(10,3) NOT NULL DEFAULT 0.000,
      rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      rejection_reason VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grn_id) REFERENCES grns(id) ON DELETE CASCADE,
      FOREIGN KEY (po_item_id) REFERENCES purchase_order_items(id) ON DELETE SET NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      INDEX idx_grn_items (grn_id)
    )
  `);
  console.log('✓ grn_items verified/created');

  await db.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      branch_id INT DEFAULT 1,
      movement_type ENUM('PURCHASE_GRN','SALE_INVOICE','SALES_RETURN','PURCHASE_RETURN','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT') NOT NULL,
      quantity_change INT NOT NULL,
      stock_before INT NOT NULL DEFAULT 0,
      stock_after INT NOT NULL DEFAULT 0,
      reference_type VARCHAR(50) NULL,
      reference_id VARCHAR(100) NULL,
      notes TEXT NULL,
      performed_by VARCHAR(100) DEFAULT 'System',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_stock_move_prod (product_id, created_at)
    )
  `);
  console.log('✓ stock_movements verified/created');

  console.log('\n✅ NON-DESTRUCTIVE RECONCILIATION COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

migrateAivenSafely().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
