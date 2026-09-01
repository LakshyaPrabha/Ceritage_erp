const db = require('../../config/db');

async function updateStockTransfersTable() {
  console.log('=== UPDATING STOCK_TRANSFERS TABLE COLUMNS (NON-DESTRUCTIVE) ===');

  const [cols] = await db.query('DESCRIBE stock_transfers');
  const existingCols = new Set(cols.map(c => c.Field));

  const additions = [
    { col: 'transfer_id', def: "VARCHAR(50) NULL" },
    { col: 'from_branch_id', def: "INT NULL" },
    { col: 'to_branch_id', def: "INT NULL" },
    { col: 'sku', def: "VARCHAR(100) NULL" },
    { col: 'quantity', def: "INT DEFAULT 1" },
    { col: 'transport_mode', def: "VARCHAR(100) DEFAULT 'Own Vehicle'" },
    { col: 'dispatch_date', def: "DATE NULL" },
    { col: 'notes', def: "TEXT NULL" },
    { col: 'created_by', def: "VARCHAR(100) DEFAULT 'Admin'" }
  ];

  for (const { col, def } of additions) {
    if (!existingCols.has(col)) {
      await db.query(`ALTER TABLE stock_transfers ADD COLUMN \`${col}\` ${def}`);
      console.log(`✓ Added column \`${col}\` to stock_transfers`);
    } else {
      console.log(`✓ Column \`${col}\` already exists`);
    }
  }

  console.log('✅ stock_transfers table ready!');
  process.exit(0);
}

updateStockTransfersTable().catch(err => {
  console.error('Error updating stock_transfers:', err);
  process.exit(1);
});
