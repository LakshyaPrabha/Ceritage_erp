const db = require('../../config/db');

async function setupPaymentModesTable() {
  console.log('=== SETTING UP PAYMENT MODES TABLE (NON-DESTRUCTIVE) ===');

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`payment_modes\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`mode_code\` VARCHAR(30) UNIQUE NOT NULL,
      \`mode_name\` VARCHAR(100) NOT NULL,
      \`is_active\` TINYINT(1) DEFAULT 1,
      \`mdr_pct\` DECIMAL(5,2) DEFAULT 0.00,
      \`vpa_id\` VARCHAR(100) NULL,
      \`account_no\` VARCHAR(100) NULL,
      \`terminal_id\` VARCHAR(100) NULL,
      \`icon\` VARCHAR(50) DEFAULT 'wallet',
      \`description\` TEXT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Seed default modes if empty
  const [existing] = await db.query('SELECT COUNT(*) AS cnt FROM payment_modes');
  if (existing[0].cnt === 0) {
    await db.query(`
      INSERT INTO \`payment_modes\` (\`mode_code\`, \`mode_name\`, \`is_active\`, \`mdr_pct\`, \`vpa_id\`, \`description\`) VALUES
      ('CASH', 'Cash Payment', 1, 0.00, NULL, 'Standard physical cash tender at billing counter'),
      ('UPI', 'UPI / QR Code (GPay / PhonePe / Paytm)', 1, 0.00, 'ceritage@icici', 'Instant digital UPI payment via static/dynamic QR code'),
      ('CARD', 'Credit & Debit Card (POS Swipe)', 1, 1.50, NULL, 'POS machine card tap/chip payment (Visa/Mastercard/RuPay)'),
      ('NETBANKING', 'NEFT / RTGS / IMPS Bank Transfer', 1, 0.00, 'HDFC0001234', 'Direct bank account transfer for high-value transactions'),
      ('CHEQUE', 'Bank Cheque / Demand Draft', 1, 0.00, NULL, 'Physical clearing cheque or banker demand draft'),
      ('EMI', 'Gold Savings Scheme & EMI', 1, 0.00, NULL, 'Monthly gold installment plan redemption & settlement'),
      ('SPLIT', 'Split / Multi-Tender Payment', 1, 0.00, NULL, 'Combination of Cash + Card + UPI for single bill')
    `);
    console.log('✓ Default payment modes seeded');
  } else {
    console.log(`✓ payment_modes table already has ${existing[0].cnt} records`);
  }

  console.log('✅ payment_modes table ready!');
  process.exit(0);
}

setupPaymentModesTable().catch(err => {
  console.error('Error setting up payment_modes:', err);
  process.exit(1);
});
