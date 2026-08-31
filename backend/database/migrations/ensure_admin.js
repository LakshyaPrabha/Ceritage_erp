const db = require('../../config/db');
const bcrypt = require('bcrypt');

async function ensureAdmin() {
  const [existing] = await db.query("SELECT id FROM users WHERE username = 'admin'");
  if (existing.length === 0) {
    const hash = await bcrypt.hash('ceritage123', 12);
    await db.query(
      "INSERT INTO users (username, password_hash, full_name, role, branch_id, status) VALUES (?, ?, ?, ?, ?, ?)",
      ['admin', hash, 'Ceritage Super Admin', 'admin', 1, 'active']
    );
    console.log('✓ Admin user added to Aiven');
  } else {
    console.log('✓ Admin user already exists');
  }
  process.exit(0);
}

ensureAdmin().catch(e => {
  console.error(e);
  process.exit(1);
});
