const db = require('../../config/db');

async function auditAiven() {
  console.log('=== STEP 3: RUNTIME CONNECTION TO AIVEN ===');
  const [[runtime]] = await db.query(`
    SELECT
      DATABASE() AS database_name,
      @@hostname AS server_hostname,
      @@port AS server_port,
      @@version AS mysql_version
  `);
  console.log('Runtime Connection:', runtime);

  console.log('\n=== STEP 4 & 5: TABLE INVENTORY & ROW COUNTS ===');
  const [tables] = await db.query(`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'defaultdb'
    ORDER BY TABLE_NAME ASC
  `);

  console.log(`Total Tables in Aiven (defaultdb): ${tables.length}`);

  const inventory = [];
  for (const t of tables) {
    const tName = t.TABLE_NAME;
    const [cols] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'defaultdb' AND TABLE_NAME = ?
    `, [tName]);

    let rowCount = 0;
    try {
      const [[{ cnt }]] = await db.query(`SELECT COUNT(*) AS cnt FROM \`${tName}\``);
      rowCount = cnt;
    } catch (e) {
      rowCount = 'ERR: ' + e.message;
    }

    inventory.push({
      table: tName,
      columnsCount: cols.length,
      rows: rowCount,
      columns: cols.map(c => c.COLUMN_NAME)
    });
  }

  console.log('\n--- EXISTING TABLES & ROW COUNTS ---');
  inventory.forEach(i => {
    console.log(`• ${i.table.padEnd(35)}: ${String(i.rows).padStart(6)} rows (${i.columnsCount} cols)`);
  });

  // Check Foreign Keys
  const [fks] = await db.query(`
    SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'defaultdb' AND REFERENCED_TABLE_NAME IS NOT NULL
  `);
  console.log(`\nTotal Foreign Keys in Aiven: ${fks.length}`);

  process.exit(0);
}

auditAiven().catch(e => {
  console.error('Audit Error:', e);
  process.exit(1);
});
