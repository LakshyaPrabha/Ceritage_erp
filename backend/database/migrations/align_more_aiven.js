const db = require('../../config/db');

async function alignMoreAiven() {
  console.log('=== ALIGNING BRANCH & COMPATIBILITY COLUMNS ON AIVEN ===');

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

  // 1. branch_id additions
  await addCol('membership_plans', 'branch_id', 'INT DEFAULT 1');
  await addCol('customer_memberships', 'branch_id', 'INT DEFAULT 1');
  await addCol('emi_plans', 'branch_id', 'INT DEFAULT 1');
  await addCol('emi_installments', 'branch_id', 'INT DEFAULT 1');
  await addCol('emi_payments', 'branch_id', 'INT DEFAULT 1');
  await addCol('customer_occasion_reminders', 'branch_id', 'INT DEFAULT 1');
  await addCol('customer_notes', 'branch_id', 'INT DEFAULT 1');
  await addCol('customer_audit_logs', 'branch_id', 'INT DEFAULT 1');
  await addCol('repair_jobs', 'job_id', 'VARCHAR(30) NULL');

  // 2. Populate default membership plans if empty on Aiven
  const [[{ planCount }]] = await db.query('SELECT COUNT(*) AS planCount FROM membership_plans');
  if (planCount === 0) {
    console.log('• Seeding standard 5 membership plans on Aiven');
    await db.query(`
      INSERT INTO membership_plans (name, min_spend, annual_fee, loyalty_multiplier, making_discount_pct, perks_description, validity_days, badge_color, is_active, branch_id)
      VALUES
        ('Regular', 0.00, 0.00, 1.00, 0.00, 'Standard customer loyalty accrual', 365, '#95a5a6', 1, 1),
        ('Silver Club', 50000.00, 499.00, 1.25, 10.00, '10% making discount + 1.25x loyalty points', 365, '#bdc3c7', 1, 1),
        ('Gold Elite', 150000.00, 999.00, 1.50, 15.00, '15% making discount + 1.5x loyalty points + priority repair', 365, '#f1c40f', 1, 1),
        ('Platinum Royal', 500000.00, 1999.00, 2.00, 25.00, '25% making discount + 2x loyalty points + personal relationship manager', 365, '#e056fd', 1, 1),
        ('Diamond VIP', 1000000.00, 4999.00, 3.00, 40.00, '40% making discount + 3x loyalty points + bespoke jewellery preview', 365, '#22a6b3', 1, 1)
    `);
  }

  console.log('✅ Branch and compatibility columns aligned!');
  process.exit(0);
}

alignMoreAiven().catch(e => {
  console.error(e);
  process.exit(1);
});
