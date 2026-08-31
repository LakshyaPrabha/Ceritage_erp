const db = require('../../config/db');

async function alignFinal() {
  console.log('=== ADDING FINAL COMPATIBILITY COLUMNS ===');

  async function add(t, c, d) {
    const [cols] = await db.query(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['defaultdb', t, c]
    );
    if (cols.length === 0) {
      console.log(`• Adding: ${t}.${c}`);
      await db.query(`ALTER TABLE \`${t}\` ADD COLUMN \`${c}\` ${d}`);
    } else {
      console.log(`✓ Exists: ${t}.${c}`);
    }
  }

  await add('customers', 'customer_id', 'VARCHAR(20) NULL');
  await db.query('UPDATE customers SET customer_id = customer_code WHERE customer_id IS NULL');
  await add('emi_plans', 'plan_id', 'VARCHAR(30) NULL');
  await add('emi_plans', 'invoice_ref', 'VARCHAR(50) NULL');
  await add('customer_memberships', 'fee_paid', 'DECIMAL(10,2) DEFAULT 0.00');
  await add('emi_installments', 'amount_due', 'DECIMAL(12,2) DEFAULT 0.00');
  await add('emi_installments', 'amount_paid', 'DECIMAL(12,2) DEFAULT 0.00');
  await add('invoices', 'credit_days', 'INT DEFAULT 0');
  await add('invoices', 'credit_due_date', 'DATE NULL');
  await add('invoices', 'balance_due', 'DECIMAL(14,2) DEFAULT 0.00');

  console.log('✅ Final compatibility columns added!');
  process.exit(0);
}

alignFinal().catch(e => {
  console.error(e);
  process.exit(1);
});
