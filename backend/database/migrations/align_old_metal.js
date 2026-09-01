const db = require('../../config/db');

async function alignOldMetalPurchases() {
  async function addCol(col, def) {
    const [cols] = await db.query(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['defaultdb', 'old_metal_purchases', col]
    );
    if (cols.length === 0) {
      console.log('Adding: ' + col);
      await db.query(`ALTER TABLE \`old_metal_purchases\` ADD COLUMN \`${col}\` ${def}`);
    } else {
      console.log('Exists: ' + col);
    }
  }

  await addCol('fine_weight', 'DECIMAL(10,3) DEFAULT 0.000');
  await addCol('stone_deduction', 'DECIMAL(10,3) DEFAULT 0.000');
  await addCol('rate', 'DECIMAL(10,2) DEFAULT 0.00');
  await addCol('amount_paid', 'DECIMAL(12,2) DEFAULT 0.00');
  console.log('Done!');
  process.exit(0);
}

alignOldMetalPurchases().catch(e => {
  console.error(e);
  process.exit(1);
});
