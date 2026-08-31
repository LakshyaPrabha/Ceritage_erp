const db = require('../../config/db');

async function alignProductsSchema() {
  const [cols] = await db.query('DESCRIBE products');
  const fields = cols.map(c => c.Field);
  
  const toAdd = [
    { field: 'metal_type', def: "VARCHAR(50) DEFAULT 'Gold'" },
    { field: 'making_charges_type', def: "ENUM('per_gram','fixed','percentage') DEFAULT 'per_gram'" },
    { field: 'making_charges', def: 'DECIMAL(10,2) DEFAULT 0.00' },
    { field: 'stone_charges', def: 'DECIMAL(10,2) DEFAULT 0.00' },
    { field: 'min_stock_qty', def: 'INT DEFAULT 1' },
    { field: 'location', def: 'VARCHAR(100) NULL' },
    { field: 'created_by', def: 'INT NULL' },
    { field: 'status', def: "VARCHAR(20) DEFAULT 'Active'" },
    { field: 'hallmark_status', def: "VARCHAR(50) DEFAULT 'Not Hallmarked'" }
  ];

  for (const item of toAdd) {
    if (!fields.includes(item.field)) {
      console.log('Adding column:', item.field);
      await db.query(`ALTER TABLE products ADD COLUMN ${item.field} ${item.def}`);
    }
  }

  // Also check product_stones table
  await db.query(`
    CREATE TABLE IF NOT EXISTS product_stones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      stone_name VARCHAR(100) NOT NULL,
      stone_type VARCHAR(50) DEFAULT 'Precious',
      pieces INT DEFAULT 1,
      weight_cts DECIMAL(10,3) DEFAULT 0.000,
      rate_per_ct DECIMAL(10,2) DEFAULT 0.00,
      total_stone_price DECIMAL(12,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Products & Product Stones schema aligned!');
  process.exit(0);
}

alignProductsSchema().catch(e => { console.error(e); process.exit(1); });
