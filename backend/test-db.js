const db = require("./config/db");

async function testConnection() {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS database_name");

    console.log("✅ MySQL connected successfully!");
    console.log("📦 Database:", rows[0].database_name);

    process.exit(0);
  } catch (error) {
    console.error("❌ MySQL connection failed!");
    console.error(error.message);

    process.exit(1);
  }
}

testConnection();
