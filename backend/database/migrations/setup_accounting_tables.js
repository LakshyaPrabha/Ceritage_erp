const db = require('../../config/db');

async function setupAccountingTables() {
  console.log('=== SETTING UP ACCOUNTING & CHART OF ACCOUNTS TABLES (NON-DESTRUCTIVE) ===');

  // 1. Chart of Accounts Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`accounts\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`code\` VARCHAR(20) UNIQUE NOT NULL,
      \`name\` VARCHAR(100) NOT NULL,
      \`type\` ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
      \`group_name\` VARCHAR(100) NOT NULL,
      \`opening_balance\` DECIMAL(15,2) DEFAULT 0.00,
      \`current_balance\` DECIMAL(15,2) DEFAULT 0.00,
      \`is_system\` TINYINT(1) DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Journal Entries Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`journal_entries\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`voucher_no\` VARCHAR(50) UNIQUE NOT NULL,
      \`voucher_type\` ENUM('JOURNAL', 'RECEIPT', 'PAYMENT', 'CONTRA', 'EXPENSE') NOT NULL DEFAULT 'JOURNAL',
      \`entry_date\` DATE NOT NULL,
      \`narration\` TEXT NULL,
      \`total_debit\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      \`total_credit\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      \`created_by\` VARCHAR(100) DEFAULT 'Admin',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Journal Entry Lines Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`journal_entry_lines\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`journal_id\` INT NOT NULL,
      \`account_id\` INT NOT NULL,
      \`debit\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      \`credit\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      \`narration\` VARCHAR(255) NULL,
      FOREIGN KEY (\`journal_id\`) REFERENCES \`journal_entries\`(\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Populate Standard Chart of Accounts if empty
  const [existingAcc] = await db.query('SELECT COUNT(*) AS cnt FROM accounts');
  if (existingAcc[0].cnt === 0) {
    await db.query(`
      INSERT INTO \`accounts\` (\`code\`, \`name\`, \`type\`, \`group_name\`, \`is_system\`) VALUES
      ('1010', 'Cash in Hand (Store Counter)', 'ASSET', 'Current Assets', 1),
      ('1020', 'Bank Current A/C & UPI/POS Settlement', 'ASSET', 'Current Assets', 1),
      ('1030', 'Accounts Receivable (Customer Dues)', 'ASSET', 'Current Assets', 1),
      ('1040', 'Gold & Jewellery Stock in Hand', 'ASSET', 'Inventory Assets', 1),
      ('2010', 'Accounts Payable (Supplier Dues)', 'LIABILITY', 'Current Liabilities', 1),
      ('2020', 'GST Output Tax Payable (CGST/SGST/IGST)', 'LIABILITY', 'Duties & Taxes', 1),
      ('2030', 'Customer Advance Deposits & Rate Locks', 'LIABILITY', 'Current Liabilities', 1),
      ('2040', 'Gold Savings Scheme & EMI Liabilities', 'LIABILITY', 'Current Liabilities', 1),
      ('3010', 'Owner Capital & Reserves', 'EQUITY', 'Owner Equity', 1),
      ('3020', 'Retained Earnings', 'EQUITY', 'Owner Equity', 1),
      ('4010', 'Jewellery Sales Revenue', 'REVENUE', 'Direct Revenue', 1),
      ('4020', 'Making Charges & Hallmarking Income', 'REVENUE', 'Direct Revenue', 1),
      ('4030', 'Old Gold Exchange Processing Income', 'REVENUE', 'Indirect Revenue', 1),
      ('5010', 'Cost of Goods Sold (Gold/Bullion Purchases)', 'EXPENSE', 'Direct Expenses', 1),
      ('5020', 'Karigar Making & Labour Expenses', 'EXPENSE', 'Direct Expenses', 1),
      ('5030', 'Showroom Rent & Utilities', 'EXPENSE', 'Indirect Expenses', 1),
      ('5040', 'Staff Salaries, Welfare & Commissions', 'EXPENSE', 'Indirect Expenses', 1),
      ('5050', 'Store General & Administrative Expenses', 'EXPENSE', 'Indirect Expenses', 1)
    `);
    console.log('✓ Standard Chart of Accounts seeded (18 core accounts)');
  } else {
    console.log(`✓ accounts table already has ${existingAcc[0].cnt} records`);
  }

  console.log('✅ Accounting tables ready!');
  process.exit(0);
}

setupAccountingTables().catch(err => {
  console.error('Error setting up accounting tables:', err);
  process.exit(1);
});
