-- ═══════════════════════════════════════════════════════════════════════════════
-- Ceritage ERP — Complete Database Setup for Aiven MySQL
-- Run this entire file in Aiven SQL Editor or MySQL Workbench
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Branches (Company / Tenant) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  city         VARCHAR(100),
  address      TEXT,
  manager_id   INT,
  phone        VARCHAR(20),
  gstin        VARCHAR(20),
  status       VARCHAR(20) DEFAULT 'Active',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  role          VARCHAR(30) NOT NULL DEFAULT 'admin',
  branch_id     INT,
  status        VARCHAR(20) DEFAULT 'active',
  last_login    DATETIME,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ── Role Permissions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  role       VARCHAR(50) NOT NULL,
  module     VARCHAR(50) NOT NULL,
  can_view   TINYINT(1) DEFAULT 1,
  can_edit   TINYINT(1) DEFAULT 1,
  can_delete TINYINT(1) DEFAULT 1,
  UNIQUE KEY uq_role_module (role, module)
);

-- ── Suppliers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT DEFAULT NULL,
  company_name    VARCHAR(150) NOT NULL,
  contact_person  VARCHAR(100),
  phone           VARCHAR(20),
  email           VARCHAR(150),
  supply_type     VARCHAR(50),
  city            VARCHAR(100),
  gstin           VARCHAR(20),
  pan             VARCHAR(15),
  credit_limit    DECIMAL(12,2) DEFAULT 0,
  outstanding     DECIMAL(12,2) DEFAULT 0,
  total_purchased DECIMAL(14,2) DEFAULT 0,
  bank_account    VARCHAR(30),
  ifsc            VARCHAR(15),
  rating          TINYINT DEFAULT 5,
  status          VARCHAR(20) DEFAULT 'Active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Customers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  branch_id      INT DEFAULT NULL,
  customer_code  VARCHAR(20),
  full_name      VARCHAR(150) NOT NULL,
  phone          VARCHAR(20) NOT NULL,
  alt_phone      VARCHAR(20),
  email          VARCHAR(150),
  gender         VARCHAR(10),
  date_of_birth  DATE,
  anniversary    DATE,
  tier           VARCHAR(20) DEFAULT 'Regular',
  address        TEXT,
  city           VARCHAR(100),
  state          VARCHAR(100),
  pincode        VARCHAR(10),
  pan            VARCHAR(15),
  aadhaar        VARCHAR(20),
  gst_number     VARCHAR(20),
  credit_limit   DECIMAL(12,2) DEFAULT 0,
  balance_due    DECIMAL(12,2) DEFAULT 0,
  total_purchase DECIMAL(14,2) DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  wallet_balance DECIMAL(12,2) DEFAULT 0,
  kyc_status     VARCHAR(20) DEFAULT 'Pending',
  notes          TEXT,
  status         VARCHAR(20) DEFAULT 'Active',
  created_by     INT DEFAULT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Customer Ledger ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_ledger (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  date        DATE NOT NULL,
  particulars VARCHAR(255),
  debit       DECIMAL(12,2) DEFAULT 0,
  credit      DECIMAL(12,2) DEFAULT 0,
  balance     DECIMAL(12,2) DEFAULT 0,
  reference   VARCHAR(50),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ── Customer Wallet Log ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_wallet_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  type        VARCHAR(20) NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  description VARCHAR(255),
  reference   VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ── Customer Loyalty Log ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_loyalty_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  type        VARCHAR(20) NOT NULL,
  points      INT NOT NULL,
  description VARCHAR(255),
  reference   VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ── Products ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  branch_id            INT DEFAULT NULL,
  product_code         VARCHAR(30),
  name                 VARCHAR(200) NOT NULL,
  sku                  VARCHAR(50) NOT NULL,
  jewellery_category   VARCHAR(100),
  product_category     VARCHAR(100),
  metal_type           VARCHAR(50),
  purity               VARCHAR(30),
  gross_weight         DECIMAL(10,3) DEFAULT 0,
  stone_weight         DECIMAL(10,3) DEFAULT 0,
  net_weight           DECIMAL(10,3) DEFAULT 0,
  making_charges_type  VARCHAR(20) DEFAULT 'per_gram',
  making_charges       DECIMAL(10,2) DEFAULT 0,
  stone_charges        DECIMAL(10,2) DEFAULT 0,
  purchase_price       DECIMAL(12,2) DEFAULT 0,
  mrp                  DECIMAL(12,2) DEFAULT 0,
  hsn_code             VARCHAR(10) DEFAULT '7113',
  huid                 VARCHAR(20),
  hallmark_status      VARCHAR(50) DEFAULT 'Not Hallmarked',
  barcode              VARCHAR(50),
  stock_qty            INT DEFAULT 1,
  min_stock_qty        INT DEFAULT 1,
  location             VARCHAR(100),
  supplier_id          INT,
  description          TEXT,
  status               VARCHAR(20) DEFAULT 'Active',
  created_by           INT DEFAULT NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_branch_sku (branch_id, sku),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- ── Product Stones ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_stones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  stone_type  VARCHAR(100),
  stone_name  VARCHAR(200),
  pieces      INT DEFAULT 1,
  weight_ct   DECIMAL(8,3) DEFAULT 0,
  quality     VARCHAR(50),
  color       VARCHAR(50),
  shape       VARCHAR(50),
  rate        DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(12,2) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── Invoices ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  branch_id         INT DEFAULT NULL,
  invoice_no        VARCHAR(30) UNIQUE NOT NULL,
  invoice_type      VARCHAR(50) DEFAULT 'Retail Invoice',
  customer_id       INT,
  invoice_date      DATE NOT NULL,
  salesperson_id    INT,
  hsn_code          VARCHAR(10) DEFAULT '7113',
  payment_mode      VARCHAR(50),
  discount_pct      DECIMAL(5,2) DEFAULT 0,
  discount_amt      DECIMAL(12,2) DEFAULT 0,
  coupon_code       VARCHAR(30),
  gift_voucher      VARCHAR(30),
  old_gold_exchange DECIMAL(12,2) DEFAULT 0,
  cgst              DECIMAL(12,2) DEFAULT 0,
  sgst              DECIMAL(12,2) DEFAULT 0,
  igst              DECIMAL(12,2) DEFAULT 0,
  tcs               DECIMAL(12,2) DEFAULT 0,
  grand_total       DECIMAL(14,2) NOT NULL,
  paid_amount       DECIMAL(14,2) DEFAULT 0,
  status            VARCHAR(30) DEFAULT 'Paid',
  notes             TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- ── Invoice Items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id       INT NOT NULL,
  product_id       INT,
  item_description VARCHAR(255),
  hsn_code         VARCHAR(10) DEFAULT '7113',
  purity           VARCHAR(30),
  weight_g         DECIMAL(10,3) DEFAULT 0,
  rate_per_gram    DECIMAL(10,2) DEFAULT 0,
  making_charges   DECIMAL(12,2) DEFAULT 0,
  stone_charges    DECIMAL(12,2) DEFAULT 0,
  gst_pct          DECIMAL(5,2) DEFAULT 3,
  discount_pct     DECIMAL(5,2) DEFAULT 0,
  amount           DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ── Credit Debit Notes ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_debit_notes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT DEFAULT NULL,
  note_no         VARCHAR(30) UNIQUE NOT NULL,
  note_type       VARCHAR(10) NOT NULL,
  customer_id     INT,
  against_invoice VARCHAR(30),
  reason          VARCHAR(255),
  amount          DECIMAL(12,2) NOT NULL,
  description     TEXT,
  status          VARCHAR(20) DEFAULT 'Pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- ── Returns ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  branch_id        INT DEFAULT NULL,
  return_no        VARCHAR(30) UNIQUE NOT NULL,
  customer_id      INT,
  invoice_ref      VARCHAR(30),
  item_description VARCHAR(255),
  reason           VARCHAR(255),
  refund_amount    DECIMAL(12,2) DEFAULT 0,
  refund_mode      VARCHAR(50),
  item_condition   VARCHAR(100),
  return_date      DATE,
  status           VARCHAR(20) DEFAULT 'Done',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- ── Gold Rates ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gold_rates (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  branch_id      INT DEFAULT NULL,
  rate_22k       DECIMAL(10,2) NOT NULL,
  rate_24k       DECIMAL(10,2) NOT NULL,
  rate_18k       DECIMAL(10,2) DEFAULT NULL,
  rate_14k       DECIMAL(10,2) DEFAULT NULL,
  silver_rate    DECIMAL(10,2) DEFAULT NULL,
  platinum_rate  DECIMAL(10,2) DEFAULT NULL,
  usd_inr        DECIMAL(10,2) DEFAULT NULL,
  effective_date DATE NOT NULL,
  updated_by     VARCHAR(100),
  remarks        VARCHAR(255),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Supplier Payments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_payments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  branch_id    INT DEFAULT NULL,
  pay_id       VARCHAR(20) UNIQUE NOT NULL,
  supplier_id  INT,
  amount       DECIMAL(12,2) NOT NULL,
  payment_mode VARCHAR(50),
  reference    VARCHAR(100),
  po_ref       VARCHAR(50),
  remark       VARCHAR(255),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- ── Supplier Ledger ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_ledger (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  date        DATE NOT NULL,
  particulars VARCHAR(255),
  debit       DECIMAL(12,2) DEFAULT 0,
  credit      DECIMAL(12,2) DEFAULT 0,
  balance     DECIMAL(12,2) DEFAULT 0,
  reference   VARCHAR(50),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- ── Default Admin Permissions (run after first register) ─────────────────────
-- Ye optional hai — register karne ke baad admin ko sab permissions milti hain automatically
INSERT IGNORE INTO role_permissions (role, module, can_view, can_edit, can_delete) VALUES
('admin','dashboard',1,1,1),('admin','customers',1,1,1),('admin','products',1,1,1),
('admin','billing',1,1,1),('admin','sales',1,1,1),('admin','purchase',1,1,1),
('admin','suppliers',1,1,1),('admin','rates',1,1,1),('admin','employees',1,1,1),
('admin','orders',1,1,1),('admin','repair',1,1,1),('admin','karigar',1,1,1),
('admin','inventory',1,1,1),('admin','hallmark',1,1,1),('admin','reports',1,1,1),
('admin','users',1,1,1),('admin','branch',1,1,1),('admin','accounting',1,1,1),
('admin','gst',1,1,1),('admin','emi',1,1,1),('admin','gold-exchange',1,1,1),
('admin','jangad',1,1,1),('admin','tunch',1,1,1),('admin','rfid',1,1,1),
('admin','advance',1,1,1),('admin','compliance',1,1,1),('admin','ai',1,1,1),
('admin','communication',1,1,1),('admin','analytics',1,1,1),('admin','payments',1,1,1),
('admin','security',1,1,1);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE — Ab backend restart karo aur register karo
-- ═══════════════════════════════════════════════════════════════════════════════
