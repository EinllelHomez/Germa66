// Crea las tablas y los roles base. Uso: npm run init-db
const fs = require("fs");
const path = require("path");

async function initDatabase(pool) {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8")
    .split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    await pool.query(stmt);
  }
  await pool.query("INSERT IGNORE INTO roles (nombre) VALUES (\"Administrador\"), (\"Operativo\")");
}

module.exports = { initDatabase };

if (require.main === module) {
  const { createPool } = require("./pool");
  const pool = createPool();
  initDatabase(pool)
    .then(() => console.log("Base de datos lista."))
    .catch((e) => { console.error("Error al inicializar la BD:", e.message); process.exitCode = 1; })
    .finally(() => pool.end());
}
