const db = require('../../config/db');

async function seedBaselineMetalRates() {
  console.log('=== SEEDING BASELINE JEWELLERY MARKET RATES (NON-DESTRUCTIVE) ===');

  await db.query("ALTER TABLE shop_metal_adjustments MODIFY COLUMN reason VARCHAR(255) DEFAULT 'Standard retail markup'");

  // Seed shop adjustments if empty
  const [adj] = await db.query('SELECT COUNT(*) AS cnt FROM shop_metal_adjustments');
  if (adj[0].cnt === 0) {
    await db.query(`
      INSERT INTO shop_metal_adjustments (metal, purity, adjustment_per_gram, updated_by, reason) VALUES
      ('GOLD', '999', 50.00, 'Admin', 'Standard retail markup'),
      ('GOLD', '916', 50.00, 'Admin', 'Standard retail markup'),
      ('GOLD', '750', 40.00, 'Admin', 'Standard retail markup'),
      ('GOLD', '585', 30.00, 'Admin', 'Standard retail markup'),
      ('SILVER', '999', 2.00, 'Admin', 'Standard retail markup'),
      ('PLATINUM', '999', 50.00, 'Admin', 'Standard retail markup')
      ON DUPLICATE KEY UPDATE adjustment_per_gram = VALUES(adjustment_per_gram)
    `);
    console.log('✓ Seeded standard shop metal adjustments');
  }

  console.log('✅ Baseline Market Rates Ready!');
  process.exit(0);
}

seedBaselineMetalRates().catch(err => {
  console.error('Error seeding rates:', err);
  process.exit(1);
});
