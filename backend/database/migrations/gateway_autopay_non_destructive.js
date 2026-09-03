const db = require("../../config/db");

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows.length > 0;
}

async function addColumn(conn, table, column, ddl) {
  if (!(await columnExists(conn, table, column))) {
    await conn.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    console.log(`Added ${table}.${column}`);
  }
}

async function run() {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await addColumn(conn, "payment_modes", "gateway_provider", "gateway_provider VARCHAR(50) NULL");
    await addColumn(conn, "payment_modes", "gateway_environment", "gateway_environment ENUM('TEST','LIVE') NULL DEFAULT 'TEST'");
    await addColumn(conn, "payment_modes", "gateway_status", "gateway_status ENUM('NOT_CONFIGURED','CONFIGURED','ACTIVE','DISABLED','ERROR') NULL DEFAULT 'NOT_CONFIGURED'");
    await addColumn(conn, "payment_modes", "webhook_status", "webhook_status ENUM('UNKNOWN','HEALTHY','FAILING') NULL DEFAULT 'UNKNOWN'");
    await addColumn(conn, "payment_modes", "settlement_status", "settlement_status ENUM('NOT_STARTED','UNRECONCILED','PARTIALLY_RECONCILED','RECONCILED','MISMATCH') NULL DEFAULT 'NOT_STARTED'");

    await addColumn(conn, "emi_plans", "payment_method", "payment_method ENUM('MANUAL','AUTOPAY') NOT NULL DEFAULT 'MANUAL'");
    await addColumn(conn, "emi_plans", "autopay_status", "autopay_status ENUM('NOT_ENABLED','PENDING_SETUP','ACTIVE','PAUSED','CANCELLED','FAILED') NOT NULL DEFAULT 'NOT_ENABLED'");
    await addColumn(conn, "emi_plans", "gateway_provider", "gateway_provider VARCHAR(50) NULL");
    await addColumn(conn, "emi_plans", "mandate_id", "mandate_id INT NULL");
    await addColumn(conn, "emi_plans", "next_debit_date", "next_debit_date DATE NULL");
    await addColumn(conn, "emi_plans", "last_payment_at", "last_payment_at DATETIME NULL");
    await addColumn(conn, "emi_plans", "last_failure_reason", "last_failure_reason VARCHAR(255) NULL");
    await addColumn(conn, "emi_plans", "retry_count", "retry_count INT NOT NULL DEFAULT 0");

    await addColumn(conn, "emi_installments", "gateway_payment_id", "gateway_payment_id INT NULL");
    await addColumn(conn, "emi_installments", "processing_started_at", "processing_started_at DATETIME NULL");
    await addColumn(conn, "emi_installments", "failure_reason", "failure_reason VARCHAR(255) NULL");
    await addColumn(conn, "emi_installments", "retry_count", "retry_count INT NOT NULL DEFAULT 0");
    await addColumn(conn, "emi_installments", "last_attempt_at", "last_attempt_at DATETIME NULL");
    await addColumn(conn, "emi_installments", "next_retry_at", "next_retry_at DATETIME NULL");

    await conn.query(`
      ALTER TABLE emi_installments
      MODIFY status ENUM('Pending','Due','Processing','Paid','Failed','Partial','Overdue','Waived') NOT NULL DEFAULT 'Pending'
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_gateway_customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        customer_id INT NOT NULL,
        branch_id INT NULL,
        provider_customer_id VARCHAR(100) NOT NULL,
        status ENUM('CREATED','ACTIVE','DISABLED','FAILED') NOT NULL DEFAULT 'CREATED',
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_pgc_provider_customer (provider, customer_id),
        UNIQUE KEY uq_pgc_provider_ref (provider, provider_customer_id),
        INDEX idx_pgc_branch (branch_id),
        INDEX idx_pgc_customer (customer_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_mandates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        customer_id INT NOT NULL,
        branch_id INT NULL,
        emi_plan_id INT NULL,
        provider_customer_id VARCHAR(100) NULL,
        provider_mandate_id VARCHAR(100) NULL,
        status ENUM('CREATED','ACTIVE','PAUSED','CANCELLED','EXPIRED','FAILED') NOT NULL DEFAULT 'CREATED',
        amount_limit DECIMAL(12,2) NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        start_date DATE NULL,
        end_date DATE NULL,
        authorization_url VARCHAR(500) NULL,
        failure_reason VARCHAR(255) NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_pm_provider_mandate (provider, provider_mandate_id),
        INDEX idx_pm_branch (branch_id),
        INDEX idx_pm_plan (emi_plan_id),
        INDEX idx_pm_customer (customer_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_gateway_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        provider_order_id VARCHAR(100) NOT NULL,
        customer_id INT NULL,
        branch_id INT NULL,
        emi_plan_id INT NULL,
        emi_installment_id INT NULL,
        mandate_id INT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status ENUM('CREATED','AUTHORIZED','CAPTURED','FAILED','CANCELLED') NOT NULL DEFAULT 'CREATED',
        payment_type ENUM('EMI_AUTOPAY','EMI_MANUAL_GATEWAY','CUSTOMER_PAYMENT','ADVANCE','OTHER') NOT NULL DEFAULT 'OTHER',
        idempotency_key VARCHAR(120) NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_pgo_provider_order (provider, provider_order_id),
        UNIQUE KEY uq_pgo_idempotency (idempotency_key),
        INDEX idx_pgo_branch (branch_id),
        INDEX idx_pgo_emi (emi_plan_id, emi_installment_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_gateway_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        provider_payment_id VARCHAR(100) NULL,
        provider_order_id VARCHAR(100) NULL,
        provider_mandate_id VARCHAR(100) NULL,
        customer_id INT NULL,
        branch_id INT NULL,
        emi_plan_id INT NULL,
        emi_installment_id INT NULL,
        order_id INT NULL,
        mandate_id INT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status ENUM('CREATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED') NOT NULL DEFAULT 'CREATED',
        payment_type ENUM('EMI_AUTOPAY','EMI_MANUAL_GATEWAY','CUSTOMER_PAYMENT','ADVANCE','OTHER') NOT NULL DEFAULT 'OTHER',
        payment_mode VARCHAR(50) NOT NULL DEFAULT 'UPI',
        idempotency_key VARCHAR(120) NULL,
        webhook_event_id VARCHAR(120) NULL,
        failure_reason VARCHAR(255) NULL,
        journal_id INT NULL,
        gateway_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        gateway_fee_tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        captured_at DATETIME NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_pgp_provider_payment (provider, provider_payment_id),
        UNIQUE KEY uq_pgp_idempotency (idempotency_key),
        INDEX idx_pgp_order_ref (provider, provider_order_id),
        INDEX idx_pgp_branch (branch_id),
        INDEX idx_pgp_emi (emi_plan_id, emi_installment_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_webhook_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        webhook_event_id VARCHAR(120) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        provider_payment_id VARCHAR(100) NULL,
        provider_order_id VARCHAR(100) NULL,
        signature_valid TINYINT(1) NOT NULL DEFAULT 0,
        processing_status ENUM('RECEIVED','PROCESSING','PROCESSED','DUPLICATE','FAILED','IGNORED') NOT NULL DEFAULT 'RECEIVED',
        failure_reason VARCHAR(255) NULL,
        payload JSON NULL,
        processed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_pwe_provider_event (provider, webhook_event_id),
        INDEX idx_pwe_payment (provider, provider_payment_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_settlements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        settlement_id VARCHAR(120) NOT NULL,
        branch_id INT NULL,
        bank_account_id INT NULL,
        gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        gateway_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        gateway_fee_tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        net_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        settlement_date DATE NOT NULL,
        status ENUM('UNRECONCILED','PARTIALLY_RECONCILED','RECONCILED','MISMATCH') NOT NULL DEFAULT 'UNRECONCILED',
        journal_id INT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_ps_provider_settlement (provider, settlement_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payment_settlement_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        settlement_id INT NOT NULL,
        gateway_payment_id INT NOT NULL,
        gross_amount DECIMAL(12,2) NOT NULL,
        gateway_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        gateway_fee_tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        net_amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_psi_payment (gateway_payment_id),
        INDEX idx_psi_settlement (settlement_id)
      )
    `);

    await conn.commit();
    console.log("Gateway autopay migration complete");
  } catch (err) {
    await conn.rollback();
    console.error("Gateway autopay migration failed:", err.message);
    throw err;
  } finally {
    conn.release();
    await db.end();
  }
}

if (require.main === module) {
  run().catch(() => process.exit(1));
}

module.exports = run;
