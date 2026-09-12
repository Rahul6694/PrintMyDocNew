require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  // Base schema (safe to re-run — everything in it is CREATE TABLE/DATABASE IF NOT EXISTS).
  const baseSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  console.log("Applying base schema...");
  await connection.query(baseSql);

  const dbName = process.env.DB_NAME || "printmydoc";
  await connection.changeUser({ database: dbName });

  await connection.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB
  `);

  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()
    : [];

  const [applied] = await connection.query("SELECT name FROM _migrations");
  const appliedNames = new Set(applied.map((r) => r.name));

  for (const file of files) {
    if (appliedNames.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Applying migration: ${file}`);
    await connection.query(sql);
    await connection.query("INSERT INTO _migrations (name) VALUES (?)", [file]);
  }

  console.log("Migration complete. Database:", dbName);
  await connection.end();
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
