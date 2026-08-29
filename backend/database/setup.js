const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function runSetup() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    await connection.query(schemaSql);
    console.log("Database and tables created from database/schema.sql");
  } finally {
    await connection.end();
  }
}

runSetup().catch((err) => {
  console.error("Database setup failed:");
  console.error(err.message || err);
  process.exit(1);
});
