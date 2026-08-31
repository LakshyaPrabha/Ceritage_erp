-- =============================================================================
-- CERITAGE ERP — PHASE 8: PURCHASE ORDER & GRN SCHEMA ENHANCEMENTS
-- =============================================================================

-- 1. Ensure purchase_orders columns and status support
ALTER TABLE purchase_orders 
  MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS branch_id INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_qty INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT 'Admin';

-- 2. Create purchase_order_items Table
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
);

-- 3. Enhance grns Table
ALTER TABLE grns
  ADD COLUMN IF NOT EXISTS branch_id INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS grn_no VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS invoice_ref VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS total_items INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_weight DECIMAL(10,3) NOT NULL DEFAULT 0.000,
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS status ENUM('RECEIVED','VERIFIED','REJECTED') NOT NULL DEFAULT 'VERIFIED';

-- 4. Create grn_items Table
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
);

-- 5. Create stock_movements Table for complete inventory auditing
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
);

-- 6. Enhance supplier_ledger Table for strict double-entry accounting
ALTER TABLE supplier_ledger
  ADD COLUMN IF NOT EXISTS branch_id INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS debit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS credit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS particulars VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS reference VARCHAR(100) NULL;
