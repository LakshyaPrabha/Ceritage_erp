const db = require('../../config/db');

async function patchInvoicesTable() {
  console.log('=== PATCHING invoices TABLE — adding missing columns ===');

  const addIfMissing = async (col, def) => {
    const [cols] = await db.query(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['invoices', col]
    );
    if (cols.length === 0) {
      await db.query(`ALTER TABLE invoices ADD COLUMN ${col} ${def}`);
      console.log('+ Added column:', col);
    } else {
      console.log('✓ Column already exists:', col);
    }
  };

  await addIfMissing('membership_tier', "VARCHAR(50) DEFAULT 'Regular'");
  await addIfMissing('loyalty_multiplier', 'DECIMAL(5,2) DEFAULT 1.00');
  await addIfMissing('making_discount_pct', 'DECIMAL(5,2) DEFAULT 0.00');
  await addIfMissing('making_discount_amt', 'DECIMAL(12,2) DEFAULT 0.00');
  await addIfMissing('wallet_used', 'DECIMAL(12,2) DEFAULT 0.00');
  await addIfMissing('points_redeemed', 'INT DEFAULT 0');
  await addIfMissing('points_earned', 'INT DEFAULT 0');

  console.log('✅ invoices table patched successfully.');
  process.exit(0);
}

patchInvoicesTable().catch(e => {
  console.error('Migration error:', e.message);
  process.exit(1);
});
