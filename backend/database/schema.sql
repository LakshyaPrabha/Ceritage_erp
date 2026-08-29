
CREATE DATABASE IF NOT EXISTS ceritage_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ceritage_erp;

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  city         VARCHAR(100),
  address      TEXT,
  manager_id   INT,
  phone        VARCHAR(20),
  gstin        VARCHAR(20),
  status       ENUM('Active','Inactive') DEFAULT 'Active',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  role          ENUM('admin','branch_manager','accountant','sales','inventory','cashier','readonly') NOT NULL,
  branch_id     INT,
  status        ENUM('active','inactive') DEFAULT 'active',
  last_login    DATETIME,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  role       VARCHAR(50) NOT NULL,
  module     VARCHAR(50) NOT NULL,
  can_view   TINYINT(1) DEFAULT 0,
  can_edit   TINYINT(1) DEFAULT 0,
  can_delete TINYINT(1) DEFAULT 0,
  UNIQUE KEY uq_role_module (role, module)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  customer_id   VARCHAR(20) UNIQUE,
  full_name     VARCHAR(150) NOT NULL,
  phone         VARCHAR(20) NOT NULL,
  email         VARCHAR(150),
  date_of_birth DATE,
  anniversary   DATE,
  tier          ENUM('Regular','Silver','Gold','Platinum') DEFAULT 'Regular',
  city          VARCHAR(100),
  state         VARCHAR(100),
  pan           VARCHAR(15),
  aadhaar       VARCHAR(20),
  gst_number    VARCHAR(20),
  credit_limit  DECIMAL(12,2) DEFAULT 0,
  balance_due   DECIMAL(12,2) DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  wallet_balance DECIMAL(12,2) DEFAULT 0,
  kyc_status    ENUM('Complete','Pending','Incomplete') DEFAULT 'Pending',
  opt_in_whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
  opt_in_sms    BOOLEAN NOT NULL DEFAULT TRUE,
  opt_in_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_channel ENUM('WHATSAPP','SMS','BOTH','NONE') NOT NULL DEFAULT 'WHATSAPP',
  status        ENUM('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_phone (status, phone)
);

-- Customer Occasion Reminders
CREATE TABLE IF NOT EXISTS customer_occasion_reminders (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  customer_id         INT NOT NULL,
  occasion_type       ENUM('BIRTHDAY','ANNIVERSARY') NOT NULL,
  occasion_date       DATE NOT NULL,
  occasion_year       INT NOT NULL,
  days_until_event    INT NOT NULL,
  status              ENUM('PENDING','ACKNOWLEDGED','SENT','SKIPPED') DEFAULT 'PENDING',
  acknowledged_by     VARCHAR(100) NULL,
  acknowledged_at     TIMESTAMP NULL,
  greeting_generated  BOOLEAN DEFAULT FALSE,
  coupon_code         VARCHAR(50) NULL,
  bonus_points        INT DEFAULT 0,
  notes               VARCHAR(255) NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cust_occasion_yr (customer_id, occasion_type, occasion_year),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  INDEX idx_occ_status_date (occasion_type, status, occasion_date)
);

-- Customer Audit Logs
CREATE TABLE IF NOT EXISTS customer_audit_logs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  customer_id  INT NOT NULL,
  action       VARCHAR(50) NOT NULL, -- 'CREATED', 'UPDATED', 'ARCHIVED', 'RESTORED', 'KYC_UPDATED'
  performed_by VARCHAR(100) DEFAULT 'System',
  details      TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_audit (customer_id, action, created_at),
  INDEX idx_cust_audit_date (customer_id, created_at)
);

-- Message Templates (SMS / WhatsApp)
CREATE TABLE IF NOT EXISTS message_templates (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  template_code         VARCHAR(50) UNIQUE NOT NULL,
  name                  VARCHAR(150) NOT NULL,
  channel               ENUM('SMS','WHATSAPP') NOT NULL,
  provider              VARCHAR(50) NOT NULL DEFAULT 'MSG91',
  provider_template_id  VARCHAR(100) NULL,
  language              VARCHAR(10) DEFAULT 'en',
  category              ENUM('BIRTHDAY','ANNIVERSARY','EMI_REMINDER','PAYMENT_REMINDER','REPAIR_READY','ORDER_READY','GENERAL') NOT NULL,
  content               TEXT NOT NULL,
  variables             JSON NULL,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            VARCHAR(100) DEFAULT 'System',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tpl_channel_cat (channel, category, is_active)
);

-- Communication Logs
CREATE TABLE IF NOT EXISTS communication_logs (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  customer_id           INT NOT NULL,
  channel               ENUM('SMS','WHATSAPP') NOT NULL,
  provider              VARCHAR(50) NOT NULL,
  template_id           INT NULL,
  template_code         VARCHAR(50) NULL,
  recipient             VARCHAR(30) NOT NULL,
  message_preview       TEXT NULL,
  provider_message_id   VARCHAR(150) NULL,
  status                ENUM('QUEUED','SENDING','SENT','DELIVERED','FAILED','SKIPPED','CANCELLED') NOT NULL DEFAULT 'QUEUED',
  error_code            VARCHAR(50) NULL,
  error_message         TEXT NULL,
  retry_count           INT DEFAULT 0,
  is_test               BOOLEAN DEFAULT FALSE,
  sent_at               TIMESTAMP NULL,
  delivered_at          TIMESTAMP NULL,
  failed_at             TIMESTAMP NULL,
  created_by            VARCHAR(100) DEFAULT 'System',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  INDEX idx_cust_comm (customer_id, created_at),
  INDEX idx_status_channel (status, channel, created_at)
);

-- Message Dispatches
CREATE TABLE IF NOT EXISTS message_dispatches (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  customer_id           INT NOT NULL,
  event_type            VARCHAR(50) NOT NULL,
  event_reference       VARCHAR(100) NOT NULL,
  channel               ENUM('SMS','WHATSAPP') NOT NULL,
  template_code         VARCHAR(50) NOT NULL,
  scheduled_for         DATE NULL,
  status                ENUM('PENDING','SENT','SKIPPED','FAILED') NOT NULL DEFAULT 'PENDING',
  communication_log_id  INT NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dispatch_event (customer_id, event_type, event_reference, channel, template_code),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  FOREIGN KEY (communication_log_id) REFERENCES communication_logs(id) ON DELETE SET NULL
);

-- Customer Notes & CRM Interactions
CREATE TABLE IF NOT EXISTS customer_notes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  customer_id  INT NOT NULL,
  category     ENUM('General', 'Preference', 'Follow-up', 'Complaint', 'Special Request', 'VIP') NOT NULL DEFAULT 'General',
  note_text    TEXT NOT NULL,
  is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by   VARCHAR(100) DEFAULT 'Staff',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  INDEX idx_cust_notes (customer_id, is_pinned, created_at)
);

-- Membership Plans
CREATE TABLE IF NOT EXISTS membership_plans (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  name                  VARCHAR(50) UNIQUE NOT NULL,
  min_spend             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  annual_fee            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  loyalty_multiplier    DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  making_discount_pct   DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  perks_description     TEXT NULL,
  validity_days         INT NOT NULL DEFAULT 365,
  badge_color           VARCHAR(20) DEFAULT '#9b59b6',
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customer Memberships
CREATE TABLE IF NOT EXISTS customer_memberships (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT NOT NULL,
  plan_id         INT NOT NULL,
  plan_name       VARCHAR(50) NOT NULL,
  start_date      DATE NOT NULL,
  expiry_date     DATE NOT NULL,
  fee_paid        DECIMAL(12,2) DEFAULT 0.00,
  payment_ref     VARCHAR(50) NULL,
  status          ENUM('ACTIVE', 'EXPIRED', 'UPGRADED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  enrolled_by     VARCHAR(100) DEFAULT 'System',
  notes           VARCHAR(255) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE RESTRICT,
  INDEX idx_cust_member (customer_id, status, expiry_date)
);

-- Customer Ledger
CREATE TABLE IF NOT EXISTS customer_ledger (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  customer_id  INT NOT NULL,
  date         DATE NOT NULL,
  particulars  VARCHAR(255),
  debit        DECIMAL(12,2) DEFAULT 0,
  credit       DECIMAL(12,2) DEFAULT 0,
  balance      DECIMAL(12,2) DEFAULT 0,
  reference    VARCHAR(50),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_cust_ledger (customer_id, date, id),
  INDEX idx_ref (reference)
);

-- Customer Wallet Transactions
CREATE TABLE IF NOT EXISTS customer_wallet_transactions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  customer_id      INT NOT NULL,
  transaction_type ENUM('CREDIT', 'DEBIT', 'REFUND', 'ADJUSTMENT', 'OPENING_BALANCE') NOT NULL,
  amount           DECIMAL(12,2) NOT NULL,
  balance_after    DECIMAL(12,2) NOT NULL,
  reference_type   VARCHAR(50) DEFAULT 'MANUAL',
  reference_id     VARCHAR(100) NULL,
  description      VARCHAR(255) NULL,
  performed_by     VARCHAR(100) DEFAULT 'System',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_wallet_cust (customer_id, created_at, id),
  INDEX idx_wallet_ref (reference_type, reference_id)
);

-- Customer Loyalty Transactions
CREATE TABLE IF NOT EXISTS customer_loyalty_transactions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  customer_id      INT NOT NULL,
  transaction_type ENUM('EARN', 'REDEEM', 'REVERSAL', 'ADJUSTMENT', 'OPENING_BALANCE') NOT NULL,
  points           INT NOT NULL,
  balance_after    INT NOT NULL,
  reference_type   VARCHAR(50) DEFAULT 'MANUAL',
  reference_id     VARCHAR(100) NULL,
  description      VARCHAR(255) NULL,
  performed_by     VARCHAR(100) DEFAULT 'System',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_loyalty_cust (customer_id, created_at, id),
  INDEX idx_loyalty_ref (reference_type, reference_id)
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  company_name     VARCHAR(150) NOT NULL,
  contact_person   VARCHAR(100),
  phone            VARCHAR(20),
  email            VARCHAR(150),
  supply_type      VARCHAR(50),
  city             VARCHAR(100),
  gstin            VARCHAR(20),
  pan              VARCHAR(15),
  credit_limit     DECIMAL(12,2) DEFAULT 0,
  outstanding      DECIMAL(12,2) DEFAULT 0,
  total_purchased  DECIMAL(14,2) DEFAULT 0,
  bank_account     VARCHAR(30),
  ifsc             VARCHAR(15),
  rating           TINYINT DEFAULT 5,
  status           ENUM('Active','Inactive') DEFAULT 'Active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(200) NOT NULL,
  sku                 VARCHAR(50) UNIQUE NOT NULL,
  product_code        VARCHAR(50),
  jewellery_category  VARCHAR(100),
  product_category    VARCHAR(100),
  purity              VARCHAR(30),
  gross_weight        DECIMAL(10,3) DEFAULT 0,
  stone_weight        DECIMAL(10,3) DEFAULT 0,
  net_weight          DECIMAL(10,3) DEFAULT 0,
  wastage_pct         DECIMAL(5,2) DEFAULT 0,
  making_per_gram     DECIMAL(10,2) DEFAULT 0,
  making_fixed        DECIMAL(10,2) DEFAULT 0,
  purchase_price      DECIMAL(12,2) DEFAULT 0,
  selling_price       DECIMAL(12,2) DEFAULT 0,
  mrp                 DECIMAL(12,2) DEFAULT 0,
  discount_pct        DECIMAL(5,2) DEFAULT 0,
  huid                VARCHAR(20),
  hallmark            VARCHAR(100),
  hsn_code            VARCHAR(10) DEFAULT '7113',
  supplier_id         INT,
  stock_qty           INT DEFAULT 0,
  min_stock           INT DEFAULT 2,
  stock_status        ENUM('In Stock','Low Stock','Out of Stock') DEFAULT 'In Stock',
  description         TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Stones
CREATE TABLE IF NOT EXISTS stones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  stone_type      VARCHAR(100),
  color           VARCHAR(100),
  shape           VARCHAR(100),
  size            VARCHAR(50),
  clarity         VARCHAR(20),
  cut             VARCHAR(30),
  ratti           DECIMAL(8,3) DEFAULT 0,
  carat           DECIMAL(8,3) DEFAULT 0,
  weight_g        DECIMAL(8,3) DEFAULT 0,
  pieces          INT DEFAULT 0,
  purchase_price  DECIMAL(12,2) DEFAULT 0,
  selling_price   DECIMAL(12,2) DEFAULT 0,
  certificate_no  VARCHAR(100),
  supplier_id     INT,
  origin          VARCHAR(100),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  invoice_no       VARCHAR(30) UNIQUE NOT NULL,
  invoice_type     VARCHAR(50) DEFAULT 'Retail Invoice',
  customer_id      INT,
  branch_id        INT DEFAULT 1,
  invoice_date     DATE NOT NULL,
  salesperson_id   INT,
  hsn_code         VARCHAR(10) DEFAULT '7113',
  payment_mode     VARCHAR(50),
  credit_days      INT DEFAULT 0,
  credit_due_date  DATE,
  discount_pct     DECIMAL(5,2) DEFAULT 0,
  discount_amt     DECIMAL(12,2) DEFAULT 0,
  coupon_code      VARCHAR(30),
  gift_voucher     VARCHAR(30),
  old_gold_exchange DECIMAL(12,2) DEFAULT 0,
  cgst             DECIMAL(12,2) DEFAULT 0,
  sgst             DECIMAL(12,2) DEFAULT 0,
  igst             DECIMAL(12,2) DEFAULT 0,
  tcs              DECIMAL(12,2) DEFAULT 0,
  grand_total      DECIMAL(14,2) NOT NULL,
  paid_amount      DECIMAL(14,2) DEFAULT 0,
  status           ENUM('Paid','Partial','Credit','EMI Active','Draft','Returned') DEFAULT 'Paid',
  membership_tier  VARCHAR(50) DEFAULT 'Regular',
  loyalty_multiplier DECIMAL(3,2) DEFAULT 1.00,
  making_discount_pct DECIMAL(5,2) DEFAULT 0.00,
  making_discount_amt DECIMAL(12,2) DEFAULT 0.00,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Invoice Items
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

-- Credit Debit Notes
CREATE TABLE IF NOT EXISTS credit_debit_notes (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  note_no          VARCHAR(30) UNIQUE NOT NULL,
  note_type        ENUM('Credit','Debit') NOT NULL,
  customer_id      INT,
  against_invoice  VARCHAR(30),
  reason           VARCHAR(255),
  amount           DECIMAL(12,2) NOT NULL,
  description      TEXT,
  status           ENUM('Pending','Adjusted') DEFAULT 'Pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Returns
CREATE TABLE IF NOT EXISTS returns (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  return_no        VARCHAR(30) UNIQUE NOT NULL,
  customer_id      INT,
  invoice_ref      VARCHAR(30),
  item_description VARCHAR(255),
  reason           VARCHAR(255),
  refund_amount    DECIMAL(12,2) DEFAULT 0,
  refund_mode      VARCHAR(50),
  item_condition   VARCHAR(100),
  return_date      DATE DEFAULT (CURRENT_DATE),
  status           ENUM('Pending','Done') DEFAULT 'Done',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  po_no            VARCHAR(30) UNIQUE NOT NULL,
  supplier_id      INT,
  purchase_date    DATE NOT NULL,
  material_type    VARCHAR(50),
  item_description VARCHAR(255),
  purity           VARCHAR(30),
  weight_qty       DECIMAL(10,3) DEFAULT 0,
  rate             DECIMAL(10,2) DEFAULT 0,
  amount           DECIMAL(12,2) DEFAULT 0,
  gst_pct          DECIMAL(5,2) DEFAULT 3,
  gst_amount       DECIMAL(12,2) DEFAULT 0,
  total            DECIMAL(12,2) DEFAULT 0,
  paid_amount      DECIMAL(12,2) DEFAULT 0,
  payment_mode     VARCHAR(50),
  expected_delivery DATE,
  status           ENUM('Pending','Received','Partial','Cancelled') DEFAULT 'Pending',
  remarks          TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- GRNs
CREATE TABLE IF NOT EXISTS grns (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  grn_id           VARCHAR(30) UNIQUE NOT NULL,
  po_id            INT,
  supplier_id      INT,
  received_date    DATE NOT NULL,
  item_description VARCHAR(255),
  weight_qty       DECIMAL(10,3) DEFAULT 0,
  received_by      VARCHAR(100),
  condition_status ENUM('Good','Partial Damage','Rejected') DEFAULT 'Good',
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE SET NULL
);

-- Supplier Payments
CREATE TABLE IF NOT EXISTS supplier_payments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  pay_id      VARCHAR(30) UNIQUE NOT NULL,
  supplier_id INT,
  amount      DECIMAL(12,2) NOT NULL,
  payment_mode VARCHAR(50),
  reference   VARCHAR(100),
  po_ref      VARCHAR(30),
  remark      TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Supplier Ledger
CREATE TABLE IF NOT EXISTS supplier_ledger (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  date        DATE NOT NULL,
  po_no       VARCHAR(30),
  item        VARCHAR(255),
  total       DECIMAL(12,2) DEFAULT 0,
  paid        DECIMAL(12,2) DEFAULT 0,
  balance     DECIMAL(12,2) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Gold Exchange
CREATE TABLE IF NOT EXISTS gold_exchanges (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  customer_id      INT,
  metal_type       VARCHAR(50),
  item_description VARCHAR(255),
  gross_weight     DECIMAL(10,3) DEFAULT 0,
  stone_weight     DECIMAL(10,3) DEFAULT 0,
  net_weight       DECIMAL(10,3) DEFAULT 0,
  purity           VARCHAR(20),
  fine_weight      DECIMAL(10,3) DEFAULT 0,
  rate             DECIMAL(10,2) DEFAULT 0,
  wastage_pct      DECIMAL(5,2) DEFAULT 0,
  base_value       DECIMAL(12,2) DEFAULT 0,
  deduction        DECIMAL(12,2) DEFAULT 0,
  final_value      DECIMAL(12,2) DEFAULT 0,
  exchange_for     VARCHAR(100),
  invoice_ref      VARCHAR(30),
  status           ENUM('Completed','Pending') DEFAULT 'Completed',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Old Metal Purchases
CREATE TABLE IF NOT EXISTS old_metal_purchases (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT,
  metal_type      VARCHAR(50),
  gross_weight    DECIMAL(10,3) DEFAULT 0,
  stone_deduction DECIMAL(10,3) DEFAULT 0,
  net_weight      DECIMAL(10,3) DEFAULT 0,
  purity          VARCHAR(20),
  fine_weight     DECIMAL(10,3) DEFAULT 0,
  rate            DECIMAL(10,2) DEFAULT 0,
  amount_paid     DECIMAL(12,2) DEFAULT 0,
  payment_mode    VARCHAR(50),
  status          ENUM('Completed','Pending') DEFAULT 'Completed',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Repair Jobs
CREATE TABLE IF NOT EXISTS repair_jobs (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  job_id            VARCHAR(20) UNIQUE NOT NULL,
  customer_id       INT,
  item_description  VARCHAR(255),
  issue             TEXT,
  item_type         VARCHAR(100),
  metal             VARCHAR(50),
  item_weight       DECIMAL(10,3) DEFAULT 0,
  karigar_id        INT,
  received_date     DATE DEFAULT (CURRENT_DATE),
  promised_date     DATE,
  estimate          DECIMAL(12,2) DEFAULT 0,
  total             DECIMAL(12,2) DEFAULT 0,
  advance_collected DECIMAL(12,2) DEFAULT 0,
  balance           DECIMAL(12,2) DEFAULT 0,
  instructions      TEXT,
  status            ENUM('Pending','In Progress','Ready','Delivered','Overdue') DEFAULT 'Pending',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Delivery Challans
CREATE TABLE IF NOT EXISTS delivery_challans (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  dc_no             VARCHAR(30) UNIQUE NOT NULL,
  invoice_ref       VARCHAR(30),
  customer_id       INT,
  customer_name     VARCHAR(150),
  phone             VARCHAR(20),
  delivery_address  TEXT,
  items_description TEXT,
  quantity          INT DEFAULT 1,
  delivery_mode     VARCHAR(100),
  delivered_by      VARCHAR(100),
  status            ENUM('Pending','In Transit','Delivered') DEFAULT 'In Transit',
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  order_id         VARCHAR(20) UNIQUE NOT NULL,
  customer_id      INT NOT NULL,
  order_type       ENUM('Custom','Bridal','Advance') DEFAULT 'Custom',
  priority         ENUM('Normal','High','Urgent') DEFAULT 'Normal',
  item_description TEXT,
  purity           VARCHAR(30),
  est_weight       DECIMAL(10,3) DEFAULT 0,
  estimated_amount DECIMAL(12,2) DEFAULT 0,
  gold_rate_locked DECIMAL(10,2) DEFAULT 0,
  advance_amount   DECIMAL(12,2) DEFAULT 0,
  balance          DECIMAL(12,2) DEFAULT 0,
  payment_mode     VARCHAR(50),
  delivery_date    DATE,
  karigar_id       INT,
  instructions     TEXT,
  status           ENUM('Pending','Confirmed','In Design','Manufacturing','Ready','Delivered') DEFAULT 'Pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Karigars
CREATE TABLE IF NOT EXISTS karigars (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  full_name        VARCHAR(150) NOT NULL,
  phone            VARCHAR(20),
  email            VARCHAR(150),
  aadhaar          VARCHAR(20),
  pan              VARCHAR(15),
  address          TEXT,
  specialization   VARCHAR(100),
  experience_years INT DEFAULT 0,
  labour_rate      DECIMAL(10,2) DEFAULT 0,
  rate_unit        VARCHAR(30) DEFAULT 'per gram',
  bank_account     VARCHAR(30),
  ifsc             VARCHAR(15),
  bank_name        VARCHAR(100),
  gold_at_hand     DECIMAL(10,3) DEFAULT 0,
  pending_jobs     INT DEFAULT 0,
  pending_payment  DECIMAL(12,2) DEFAULT 0,
  rating           TINYINT DEFAULT 5,
  status           ENUM('Active','Inactive','On Leave') DEFAULT 'Active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  wo_id            VARCHAR(20) UNIQUE NOT NULL,
  karigar_id       INT NOT NULL,
  job_ref          VARCHAR(30),
  item_description TEXT,
  quantity         INT DEFAULT 1,
  priority         ENUM('Normal','High','Urgent') DEFAULT 'Normal',
  due_date         DATE,
  est_labour       DECIMAL(12,2) DEFAULT 0,
  advance          DECIMAL(12,2) DEFAULT 0,
  balance          DECIMAL(12,2) DEFAULT 0,
  status           ENUM('Pending','In Progress','Delivered') DEFAULT 'Pending',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (karigar_id) REFERENCES karigars(id)
);

-- Gold Issues
CREATE TABLE IF NOT EXISTS gold_issues (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  issue_id        VARCHAR(20) UNIQUE NOT NULL,
  karigar_id      INT NOT NULL,
  work_order_id   INT,
  metal_type      VARCHAR(50),
  gross_weight    DECIMAL(10,3) DEFAULT 0,
  stone_weight    DECIMAL(10,3) DEFAULT 0,
  net_weight      DECIMAL(10,3) DEFAULT 0,
  issued_by       VARCHAR(100),
  status          ENUM('Issued','Received Back') DEFAULT 'Issued',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (karigar_id) REFERENCES karigars(id)
);

-- Gold Receives
CREATE TABLE IF NOT EXISTS gold_receives (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  receive_id      VARCHAR(20) UNIQUE NOT NULL,
  karigar_id      INT NOT NULL,
  work_order_ref  VARCHAR(30),
  metal_type      VARCHAR(50),
  issued_weight   DECIMAL(10,3) DEFAULT 0,
  received_weight DECIMAL(10,3) DEFAULT 0,
  wastage         DECIMAL(10,3) DEFAULT 0,
  wastage_pct     DECIMAL(6,2) DEFAULT 0,
  received_by     VARCHAR(100),
  remarks         TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (karigar_id) REFERENCES karigars(id)
);

-- Karigar Payments
CREATE TABLE IF NOT EXISTS karigar_payments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  pay_id        VARCHAR(20) UNIQUE NOT NULL,
  karigar_id    INT NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  payment_mode  VARCHAR(50),
  reference     VARCHAR(100),
  work_order_id INT,
  remark        TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (karigar_id) REFERENCES karigars(id)
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  full_name    VARCHAR(150) NOT NULL,
  role         VARCHAR(100),
  department   VARCHAR(100),
  phone        VARCHAR(20),
  email        VARCHAR(150),
  dob          DATE,
  basic_salary DECIMAL(12,2) DEFAULT 0,
  join_date    DATE,
  aadhaar      VARCHAR(20),
  pan          VARCHAR(15),
  bank_account VARCHAR(30),
  branch_id    INT,
  status       ENUM('Active','Inactive','On Leave') DEFAULT 'Active',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date        DATE NOT NULL,
  status      ENUM('Present','Absent','Leave','Holiday') NOT NULL,
  remarks     TEXT,
  UNIQUE KEY uq_emp_date (employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Leaves
CREATE TABLE IF NOT EXISTS leaves (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  leave_type  VARCHAR(50),
  from_date   DATE,
  to_date     DATE,
  days        INT DEFAULT 1,
  reason      TEXT,
  status      ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  approved_by VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Gold Rates (Legacy Table maintained for backward compatibility)
CREATE TABLE IF NOT EXISTS gold_rates (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  rate_22k       DECIMAL(10,2) NOT NULL,
  rate_24k       DECIMAL(10,2) NOT NULL,
  rate_18k       DECIMAL(10,2),
  rate_14k       DECIMAL(10,2),
  silver_rate    DECIMAL(10,2),
  platinum_rate  DECIMAL(10,2),
  usd_inr        DECIMAL(8,2),
  effective_date DATE NOT NULL,
  updated_by     VARCHAR(100),
  remarks        TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Metal Rates (Metals.Dev Live Market, MCX Reference, LBMA Reference, and Manual Audit Records)
CREATE TABLE IF NOT EXISTS metal_benchmark_rates (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  metal            VARCHAR(20) NOT NULL,          -- 'GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM'
  purity           VARCHAR(20) NOT NULL,          -- '999', '916', '750', '585', 'MCX', 'LBMA_AM', 'LBMA_PM'
  source           VARCHAR(50) NOT NULL DEFAULT 'Metals.Dev', -- 'Metals.Dev', 'MANUAL'
  source_price     DECIMAL(14,2) NOT NULL,        -- Raw source price
  source_unit      VARCHAR(20) NOT NULL DEFAULT '1G', -- '1G', '10G', '1KG'
  price_per_gram   DECIMAL(12,2) NOT NULL,        -- Price in ₹ / gram
  rate_type        VARCHAR(30) NOT NULL DEFAULT 'LIVE_MARKET', -- 'LIVE_MARKET', 'MCX_REFERENCE', 'LBMA_REFERENCE'
  source_timestamp DATETIME,                      -- Timestamp from provider
  fetched_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_metal_purity_date (metal, purity, rate_type, created_at)
);

-- Shop Metal Adjustments (Ceritage Shop Selling Margin / Premium / Discount)
CREATE TABLE IF NOT EXISTS shop_metal_adjustments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  metal               VARCHAR(20) NOT NULL,
  purity              VARCHAR(20) NOT NULL,
  adjustment_per_gram DECIMAL(10,2) DEFAULT 0.00,  -- Margin added to benchmark (e.g. +100.00 / gram)
  updated_by          VARCHAR(100) DEFAULT 'Admin',
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_metal_purity (metal, purity)
);

-- Metal API Sync Logs (Enforces 2 requests/day limit and tracks scheduled day/evening syncs)
CREATE TABLE IF NOT EXISTS api_sync_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  provider   VARCHAR(50) NOT NULL DEFAULT 'Metals.Dev',
  slot       VARCHAR(20) NOT NULL DEFAULT 'MANUAL', -- 'DAY', 'EVENING', 'MANUAL'
  status     VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  message    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
);

-- EMI Plans
CREATE TABLE IF NOT EXISTS emi_plans (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  plan_id         VARCHAR(20) UNIQUE NOT NULL,
  customer_id     INT NOT NULL,
  invoice_ref     VARCHAR(30),
  item_description TEXT,
  total_amount    DECIMAL(14,2) NOT NULL,
  down_payment    DECIMAL(12,2) DEFAULT 0,
  loan_amount     DECIMAL(12,2),
  num_emis        INT NOT NULL,
  interest_rate   DECIMAL(5,2) DEFAULT 0,
  emi_amount      DECIMAL(12,2),
  finance_partner VARCHAR(100) DEFAULT 'In-House',
  first_due_date  DATE,
  next_due_date   DATE,
  paid_emis       INT DEFAULT 0,
  remaining_amount DECIMAL(12,2),
  status          ENUM('Active','Closed','Overdue','On Track') DEFAULT 'Active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- EMI Installment Schedule
CREATE TABLE IF NOT EXISTS emi_installments (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  plan_id        INT NOT NULL,
  customer_id    INT NOT NULL,
  installment_no INT NOT NULL,
  due_date       DATE NOT NULL,
  amount_due     DECIMAL(12,2) NOT NULL,
  amount_paid    DECIMAL(12,2) DEFAULT 0,
  status         ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
  paid_at        TIMESTAMP NULL,
  payment_mode   VARCHAR(50) NULL,
  receipt_no     VARCHAR(30) NULL,
  reference      VARCHAR(100) NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES emi_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_plan_inst (plan_id, installment_no),
  INDEX idx_inst_due (status, due_date)
);

-- EMI Payment Receipts
CREATE TABLE IF NOT EXISTS emi_payments (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  receipt_no     VARCHAR(30) UNIQUE NOT NULL,
  plan_id        INT NOT NULL,
  customer_id    INT NOT NULL,
  installment_no INT NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,
  payment_mode   VARCHAR(50) NOT NULL DEFAULT 'Cash',
  payment_date   DATE NOT NULL,
  reference      VARCHAR(100) NULL,
  notes          VARCHAR(255) NULL,
  performed_by   VARCHAR(100) DEFAULT 'System',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES emi_plans(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_emi_pay (plan_id, customer_id, payment_date),
  INDEX idx_emi_rcp (receipt_no)
);

-- Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  transfer_id     VARCHAR(20) UNIQUE NOT NULL,
  from_branch_id  INT,
  to_branch_id    INT,
  sku             VARCHAR(50),
  quantity        INT DEFAULT 1,
  transport_mode  VARCHAR(100),
  dispatch_date   DATE,
  notes           TEXT,
  status          ENUM('In Transit','Received','Cancelled') DEFAULT 'In Transit',
  created_by      VARCHAR(100),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_branch_id) REFERENCES branches(id),
  FOREIGN KEY (to_branch_id) REFERENCES branches(id)
);

-- ============================================================
-- SEED DATA — Default admin user (password: ceritage123)
-- ============================================================
INSERT IGNORE INTO branches (id, name, city, status) VALUES (1, 'Mumbai HQ', 'Mumbai', 'Active');

INSERT IGNORE INTO users (id, username, password_hash, full_name, role, branch_id, status)
VALUES (1, 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Ht0H1c9qbJXdHZ9pN5EG', 'Administrator', 'admin', 1, 'active');
-- Default password hash for "ceritage123"

-- Default permissions for all roles
INSERT IGNORE INTO role_permissions (role, module, can_view, can_edit, can_delete) VALUES
-- admin: full access (handled in code)
-- branch_manager
('branch_manager','dashboard',1,0,0),('branch_manager','analytics',1,0,0),
('branch_manager','customers',1,1,0),('branch_manager','products',1,1,0),
('branch_manager','billing',1,1,0),('branch_manager','sales',1,1,0),
('branch_manager','purchase',1,1,0),('branch_manager','gold-exchange',1,1,0),
('branch_manager','repair',1,1,0),('branch_manager','orders',1,1,0),
('branch_manager','karigar',1,1,0),('branch_manager','jangad',1,1,0),
('branch_manager','payments',1,1,0),('branch_manager','inventory',1,1,0),
('branch_manager','hallmark',1,1,0),('branch_manager','rates',1,1,0),
('branch_manager','rfid',1,1,0),('branch_manager','advance',1,1,0),
('branch_manager','reports',1,0,0),
-- accountant
('accountant','dashboard',1,0,0),('accountant','accounting',1,1,0),
('accountant','payments',1,1,0),('accountant','emi',1,1,0),
('accountant','gst',1,1,0),('accountant','tunch',1,1,0),
('accountant','compliance',1,1,0),('accountant','reports',1,0,0),
('accountant','billing',1,0,0),('accountant','sales',1,0,0),
-- sales
('sales','dashboard',1,0,0),('sales','customers',1,1,0),
('sales','products',1,0,0),('sales','billing',1,1,0),
('sales','sales',1,1,0),('sales','gold-exchange',1,1,0),
('sales','repair',1,1,0),('sales','orders',1,1,0),
('sales','rates',1,0,0),('sales','inventory',1,0,0),
-- cashier
('cashier','dashboard',1,0,0),('cashier','billing',1,1,0),
('cashier','payments',1,1,0),('cashier','customers',1,0,0),
-- readonly
('readonly','dashboard',1,0,0),('readonly','analytics',1,0,0),
('readonly','customers',1,0,0),('readonly','products',1,0,0),
('readonly','billing',1,0,0),('readonly','sales',1,0,0),
('readonly','reports',1,0,0),('readonly','inventory',1,0,0);

-- ============================================================
-- NOTE: The admin password hash above is for "ceritage123"
-- Generated with: bcrypt.hashSync("ceritage123", 12)
-- If it doesn't match, run this in Node.js to regenerate:
--   const bcrypt = require('bcrypt');
--   bcrypt.hash('ceritage123', 12).then(console.log);
-- Then update the INSERT above
-- ============================================================
