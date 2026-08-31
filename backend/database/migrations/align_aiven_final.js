const db = require('../../config/db');

async function alignAiven() {
  console.log('=== ALIGNING AIVEN COLUMNS (NON-DESTRUCTIVE) ===');

  async function addCol(table, col, def) {
    const [cols] = await db.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'defaultdb' AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [table, col]);

    if (cols.length === 0) {
      console.log(`• Adding: ${table}.${col}`);
      await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
    } else {
      console.log(`✓ Exists: ${table}.${col}`);
    }
  }

  // 1. metal_benchmark_rates
  await addCol('metal_benchmark_rates', 'metal', 'VARCHAR(50) NULL');
  await addCol('metal_benchmark_rates', 'purity', 'VARCHAR(50) NULL');
  await addCol('metal_benchmark_rates', 'source_price', 'DECIMAL(12,2) NULL');
  await addCol('metal_benchmark_rates', 'source_unit', "VARCHAR(20) DEFAULT '1G'");
  await addCol('metal_benchmark_rates', 'price_per_gram', 'DECIMAL(12,2) NULL');
  await addCol('metal_benchmark_rates', 'rate_type', 'VARCHAR(50) NULL');
  await addCol('metal_benchmark_rates', 'source_timestamp', 'TIMESTAMP NULL');
  await addCol('metal_benchmark_rates', 'fetched_at', 'TIMESTAMP NULL');

  // 2. products
  await addCol('products', 'stock_status', "ENUM('In Stock','Low Stock','Out of Stock') DEFAULT 'In Stock'");
  await addCol('products', 'min_stock', 'INT DEFAULT 2');

  // 3. shop_metal_adjustments
  await addCol('shop_metal_adjustments', 'metal', 'VARCHAR(50) NULL');
  await addCol('shop_metal_adjustments', 'adjustment_per_gram', 'DECIMAL(10,2) DEFAULT 0.00');
  await addCol('shop_metal_adjustments', 'updated_by', "VARCHAR(100) DEFAULT 'Admin'");

  console.log('✅ Aiven columns aligned successfully!');
  process.exit(0);
}

alignAiven().catch(e => {
  console.error('Alignment error:', e);
  process.exit(1);
});
