const db = require('../../config/db');

async function setupFineMetalLedgerTable() {
  console.log('=== SETTING UP FINE METAL LEDGER TABLE (NON-DESTRUCTIVE) ===');

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`fine_metal_ledger\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`voucher_no\` VARCHAR(50) NOT NULL,
      \`transaction_type\` ENUM(
        'OPENING_STOCK',
        'PURCHASE_INWARD',
        'KARIGAR_ISSUE',
        'KARIGAR_RECEIVE',
        'GOLD_EXCHANGE',
        'OLD_METAL_PURCHASE',
        'SALES_CONSUMPTION',
        'MELTING_ADJUSTMENT',
        'PURITY_UPGRADE',
        'PURITY_DOWNGRADE',
        'MANUAL_ENTRY'
      ) NOT NULL,
      \`metal_type\` ENUM('Gold', 'Silver', 'Platinum') NOT NULL DEFAULT 'Gold',
      \`purity\` VARCHAR(30) NOT NULL DEFAULT '22K',
      \`purity_fraction\` DECIMAL(6,4) NOT NULL DEFAULT 0.9167,
      \`gross_weight\` DECIMAL(10,3) NOT NULL DEFAULT 0.000,
      \`wastage\` DECIMAL(10,3) NOT NULL DEFAULT 0.000,
      \`fine_weight\` DECIMAL(10,3) NOT NULL DEFAULT 0.000,
      \`flow\` ENUM('INWARD', 'OUTWARD') NOT NULL,
      \`running_fine_balance\` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
      \`party_type\` ENUM('Supplier', 'Karigar', 'Customer', 'Store', 'Refinery') DEFAULT 'Store',
      \`party_id\` INT NULL,
      \`party_name\` VARCHAR(150) NULL,
      \`narration\` TEXT NULL,
      \`performed_by\` VARCHAR(100) DEFAULT 'Admin',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ fine_metal_ledger table ready!');
  process.exit(0);
}

setupFineMetalLedgerTable().catch(err => {
  console.error('Error setting up fine_metal_ledger:', err);
  process.exit(1);
});
