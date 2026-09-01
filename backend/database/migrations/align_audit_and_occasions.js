const db = require('../../config/db');

async function alignAuditAndOccasions() {
  console.log('=== ALIGNING AUDIT LOGS & OCCASIONS (NON-DESTRUCTIVE) ===');

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

  // customer_audit_logs compatibility
  await addCol('customer_audit_logs', 'action', 'VARCHAR(50) NULL');
  await addCol('customer_audit_logs', 'details', 'TEXT NULL');

  // customer_occasion_reminders compatibility
  await addCol('customer_occasion_reminders', 'status', "VARCHAR(30) DEFAULT 'UPCOMING'");
  await addCol('customer_occasion_reminders', 'days_until_event', 'INT DEFAULT 0');
  await addCol('customer_occasion_reminders', 'greeting_generated', 'TINYINT(1) DEFAULT 0');
  await addCol('customer_occasion_reminders', 'coupon_code', 'VARCHAR(50) NULL');
  await addCol('customer_occasion_reminders', 'bonus_points', 'INT DEFAULT 0');
  await addCol('customer_occasion_reminders', 'acknowledged_by', 'VARCHAR(100) NULL');
  await addCol('customer_occasion_reminders', 'acknowledged_at', 'DATETIME NULL');

  console.log('✅ Columns aligned non-destructively!');
  process.exit(0);
}

alignAuditAndOccasions().catch(e => {
  console.error(e);
  process.exit(1);
});
