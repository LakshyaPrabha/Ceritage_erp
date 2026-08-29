// Run this once to create the admin user with correct password hash
// Command: node database/seed.js

const bcrypt = require("bcrypt");
const db = require("../config/db");

async function seed() {
  try {
    console.log("Connecting to database...");

    // Create admin branch
    await db.query(
      `INSERT IGNORE INTO branches (id, name, city, status) VALUES (1, 'Mumbai HQ', 'Mumbai', 'Active')`
    );
    console.log("Branch created.");

    // Hash admin password
    const hash = await bcrypt.hash("ceritage123", 12);

    // Create admin user
    await db.query(
      `INSERT INTO users (username, password_hash, full_name, role, branch_id, status)
       VALUES ('admin', ?, 'Administrator', 'admin', 1, 'active')
       ON DUPLICATE KEY UPDATE password_hash = ?`,
      [hash, hash]
    );
    console.log("Admin user created. username: admin | password: ceritage123");

    // Seed default permissions
    const permissions = [
      // branch_manager
      ...["dashboard","analytics","customers","products","billing","sales","purchase",
         "gold-exchange","repair","orders","karigar","jangad","payments","inventory",
         "hallmark","rates","rfid","advance","employees","reports"].map(m =>
        ["branch_manager", m, 1, m !== "reports" && m !== "analytics" && m !== "dashboard" ? 1 : 0, 0]
      ),
      // accountant
      ...["dashboard","accounting","payments","emi","gst","tunch","compliance","reports","billing","sales"].map(m =>
        ["accountant", m, 1, ["accounting","payments","emi","gst","tunch","compliance"].includes(m) ? 1 : 0, 0]
      ),
      // sales
      ...["dashboard","customers","products","billing","sales","gold-exchange","repair","orders","rates","inventory"].map(m =>
        ["sales", m, 1, ["customers","billing","sales","repair","orders","gold-exchange"].includes(m) ? 1 : 0, 0]
      ),
      // cashier
      ...["dashboard","billing","payments","customers"].map(m =>
        ["cashier", m, 1, ["billing","payments"].includes(m) ? 1 : 0, 0]
      ),
      // readonly — all modules, view only
      ...["dashboard","analytics","customers","products","billing","sales","purchase",
         "gold-exchange","repair","orders","karigar","inventory","hallmark","rates","reports"].map(m =>
        ["readonly", m, 1, 0, 0]
      ),
    ];

    for (const [role, module, can_view, can_edit, can_delete] of permissions) {
      await db.query(
        `INSERT INTO role_permissions (role, module, can_view, can_edit, can_delete)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE can_view=?, can_edit=?, can_delete=?`,
        [role, module, can_view, can_edit, can_delete, can_view, can_edit, can_delete]
      );
    }
    console.log("Permissions seeded.");

    // Seed initial gold & silver rates if not set
    const [rateRows] = await db.query("SELECT COUNT(*) AS count FROM gold_rates");
    if (rateRows[0].count === 0) {
      await db.query(
        `INSERT INTO gold_rates (rate_22k, rate_24k, rate_18k, rate_14k, silver_rate, platinum_rate, usd_inr, effective_date, updated_by, remarks)
         VALUES (6650.00, 7255.00, 5440.00, 4230.00, 84.50, 3120.00, 86.80, CURDATE(), 'System', 'Metals.Dev Initial Rates')`
      );
      console.log("Initial Gold & Silver rates seeded.");
    }

    console.log("\nSetup complete! You can now start the backend with: npm run dev");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  }
}

seed();
