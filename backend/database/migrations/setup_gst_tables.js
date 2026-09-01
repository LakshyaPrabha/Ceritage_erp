const db = require('../../config/db');

async function setupGstTables() {
  console.log('=== SETTING UP GST & HSN CONFIGURATION TABLES (NON-DESTRUCTIVE) ===');

  await db.query(`
    CREATE TABLE IF NOT EXISTS \`hsn_codes\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`hsn_code\` VARCHAR(20) UNIQUE NOT NULL,
      \`description\` VARCHAR(255) NOT NULL,
      \`category\` VARCHAR(100) NOT NULL,
      \`gst_rate\` DECIMAL(5,2) NOT NULL DEFAULT 3.00,
      \`cgst_rate\` DECIMAL(5,2) NOT NULL DEFAULT 1.50,
      \`sgst_rate\` DECIMAL(5,2) NOT NULL DEFAULT 1.50,
      \`igst_rate\` DECIMAL(5,2) NOT NULL DEFAULT 3.00,
      \`status\` ENUM('Active', 'Inactive') DEFAULT 'Active',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const [existing] = await db.query('SELECT COUNT(*) AS cnt FROM hsn_codes');
  if (existing[0].cnt === 0) {
    await db.query(`
      INSERT INTO \`hsn_codes\` (\`hsn_code\`, \`description\`, \`category\`, \`gst_rate\`, \`cgst_rate\`, \`sgst_rate\`, \`igst_rate\`) VALUES
      ('7113', 'Articles of Jewellery & Parts (Gold, Silver, Platinum)', 'Jewellery', 3.00, 1.50, 1.50, 3.00),
      ('7108', 'Gold Bullion, Bars, Ingots & Coins (Unwrought/Semi-manufactured)', 'Bullion', 3.00, 1.50, 1.50, 3.00),
      ('7106', 'Silver Bullion, Bars & Coins', 'Bullion', 3.00, 1.50, 1.50, 3.00),
      ('7102', 'Non-Industrial Diamonds (Cut & Polished, Unset)', 'Diamonds', 0.25, 0.125, 0.125, 0.25),
      ('7103', 'Precious & Semi-Precious Gemstones (Unset)', 'Gemstones', 0.25, 0.125, 0.125, 0.25),
      ('7117', 'Imitation & Fashion Jewellery', 'Fashion Jewellery', 3.00, 1.50, 1.50, 3.00),
      ('9988', 'Manufacturing Services on Physical Inputs (Karigar Job Work)', 'Job Work', 5.00, 2.50, 2.50, 5.00),
      ('9983', 'Jewellery Certification, Appraisal & Hallmark Testing Services', 'Services', 18.00, 9.00, 9.00, 18.00)
    `);
    console.log('✓ Standard Jewelry HSN Codes seeded (8 master codes)');
  } else {
    console.log(`✓ hsn_codes table already has ${existing[0].cnt} records`);
  }

  console.log('✅ GST tables ready!');
  process.exit(0);
}

setupGstTables().catch(err => {
  console.error('Error setting up GST tables:', err);
  process.exit(1);
});
