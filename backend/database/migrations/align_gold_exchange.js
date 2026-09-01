const db = require('../../config/db');

async function alignGoldExchange() {
  console.log('=== ALIGNING GOLD_EXCHANGES COLUMNS (NON-DESTRUCTIVE) ===');

  async function addCol(table, col, def) {
    const [cols] = await db.query(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['defaultdb', table, col]
    );
    if (cols.length === 0) {
      console.log(`• Adding: ${table}.${col}`);
      await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
    } else {
      console.log(`✓ Exists: ${table}.${col}`);
    }
  }

  await addCol('gold_exchanges', 'metal_type', "VARCHAR(50) DEFAULT 'Gold'");
  await addCol('gold_exchanges', 'purity', 'VARCHAR(30) NULL');
  await addCol('gold_exchanges', 'stone_weight', 'DECIMAL(10,3) DEFAULT 0.000');
  await addCol('gold_exchanges', 'fine_weight', 'DECIMAL(10,3) DEFAULT 0.000');
  await addCol('gold_exchanges', 'rate', 'DECIMAL(10,2) DEFAULT 0.00');
  await addCol('gold_exchanges', 'wastage_pct', 'DECIMAL(5,2) DEFAULT 0.00');
  await addCol('gold_exchanges', 'base_value', 'DECIMAL(12,2) DEFAULT 0.00');
  await addCol('gold_exchanges', 'deduction', 'DECIMAL(12,2) DEFAULT 0.00');
  await addCol('gold_exchanges', 'final_value', 'DECIMAL(12,2) DEFAULT 0.00');
  await addCol('gold_exchanges', 'exchange_for', "VARCHAR(100) DEFAULT 'New Purchase'");

  console.log('✅ gold_exchanges aligned!');
  process.exit(0);
}

alignGoldExchange().catch(e => {
  console.error(e);
  process.exit(1);
});
