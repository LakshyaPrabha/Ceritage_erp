const db = require('../../config/db');

async function migrate() {
  console.log('Running Phase 8 Schema Migration...');

  // 1. purchase_orders columns
  const [poCols] = await db.query('DESCRIBE purchase_orders');
  const poFields = poCols.map(c => c.Field);
  
  await db.query("ALTER TABLE purchase_orders MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'");
  if (!poFields.includes('branch_id')) await db.query('ALTER TABLE purchase_orders ADD COLUMN branch_id INT DEFAULT 1');
  if (!poFields.includes('total_qty')) await db.query('ALTER TABLE purchase_orders ADD COLUMN total_qty INT NOT NULL DEFAULT 1');
  if (!poFields.includes('subtotal')) await db.query('ALTER TABLE purchase_orders ADD COLUMN subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00');
  if (!poFields.includes('created_by')) await db.query("ALTER TABLE purchase_orders ADD COLUMN created_by VARCHAR(100) DEFAULT 'Admin'");

  // 2. purchase_order_items table
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

  // 3. grns columns
  const [grnCols] = await db.query('DESCRIBE grns');
  const grnFields = grnCols.map(c => c.Field);
  if (!grnFields.includes('branch_id')) await db.query('ALTER TABLE grns ADD COLUMN branch_id INT DEFAULT 1');
  if (!grnFields.includes('grn_no')) await db.query('ALTER TABLE grns ADD COLUMN grn_no VARCHAR(50) NULL');
  if (!grnFields.includes('invoice_ref')) await db.query('ALTER TABLE grns ADD COLUMN invoice_ref VARCHAR(100) NULL');
  if (!grnFields.includes('total_items')) await db.query('ALTER TABLE grns ADD COLUMN total_items INT NOT NULL DEFAULT 1');
  if (!grnFields.includes('total_weight')) await db.query('ALTER TABLE grns ADD COLUMN total_weight DECIMAL(10,3) NOT NULL DEFAULT 0.000');
  if (!grnFields.includes('total_amount')) await db.query('ALTER TABLE grns ADD COLUMN total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00');
  if (!grnFields.includes('status')) await db.query("ALTER TABLE grns ADD COLUMN status ENUM('RECEIVED','VERIFIED','REJECTED') NOT NULL DEFAULT 'VERIFIED'");

  // 4. grn_items table
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

  // 5. stock_movements table
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

  // 6. supplier_ledger columns
  const [supCols] = await db.query('DESCRIBE supplier_ledger');
  const supFields = supCols.map(c => c.Field);
  if (!supFields.includes('branch_id')) await db.query('ALTER TABLE supplier_ledger ADD COLUMN branch_id INT DEFAULT 1');
  if (!supFields.includes('debit')) await db.query('ALTER TABLE supplier_ledger ADD COLUMN debit DECIMAL(12,2) NOT NULL DEFAULT 0.00');
  if (!supFields.includes('credit')) await db.query('ALTER TABLE supplier_ledger ADD COLUMN credit DECIMAL(12,2) NOT NULL DEFAULT 0.00');
  if (!supFields.includes('particulars')) await db.query('ALTER TABLE supplier_ledger ADD COLUMN particulars VARCHAR(255) NULL');
  if (!supFields.includes('reference')) await db.query('ALTER TABLE supplier_ledger ADD COLUMN reference VARCHAR(100) NULL');

  console.log('✅ Phase 8 Schema Migration completed successfully!');
  process.exit(0);
}

migrate().catch(e => { console.error('Migration failed:', e); process.exit(1); });
