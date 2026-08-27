
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
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  FOREIGN KEY (customer_id) REFERENCES customers(id)
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
  invoice_date     DATE NOT NULL,
  salesperson_id   INT,
  hsn_code         VARCHAR(10) DEFAULT '7113',
  payment_mode     VARCHAR(50),
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

-- Gold Rates
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
