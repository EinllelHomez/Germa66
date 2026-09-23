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
  await migrarColumnasNuevas(pool);
}

// Agrega columnas nuevas a bases de datos que ya existían antes de que se agregaran
// al schema.sql (CREATE TABLE IF NOT EXISTS no las crea en tablas ya existentes).
// Se ejecuta cada vez que arranca el servidor; si la columna ya existe, no hace nada.
async function migrarColumnasNuevas(pool) {
  const [[col]] = await pool.query(
    `SELECT COUNT(*) AS existe FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'inventario' AND column_name = 'minimo'`
  );
  if (!col.existe) {
    await pool.query("ALTER TABLE inventario ADD COLUMN minimo INT NOT NULL DEFAULT 5 AFTER cantidad");
    console.log("Migración aplicada: se agregó la columna 'minimo' a inventario.");
  }
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