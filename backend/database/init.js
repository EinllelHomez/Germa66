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

async function agregarColumna(pool, tabla, columna, definicion) {
  const [[col]] = await pool.query(
    `SELECT COUNT(*) AS existe FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tabla, columna]
  );
  if (!col.existe) {
    await pool.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
    console.log(`Migración aplicada: se agregó la columna '${columna}' a ${tabla}.`);
  }
}

// Estados del pedido según las fichas: Pendiente, En preparación, Despachado y Cancelado.
// Las bases creadas antes tenían 'confirmado' y 'entregado'. Se pasa por una columna nueva
// (en vez de MODIFY del ENUM) porque así funciona igual en MySQL/WampServer y en TiDB.
async function migrarEstadosPedido(pool) {
  const [[col]] = await pool.query(
    `SELECT COUNT(*) AS viejo FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'estado'
       AND (column_type LIKE '%confirmado%' OR column_type LIKE '%entregado%')`
  );
  if (!col.viejo) return;
  await pool.query("ALTER TABLE pedidos ADD COLUMN estado_nuevo ENUM('pendiente','en_preparacion','despachado','cancelado') NOT NULL DEFAULT 'pendiente'");
  await pool.query(
    `UPDATE pedidos SET estado_nuevo = CASE estado
       WHEN 'confirmado' THEN 'pendiente' WHEN 'entregado' THEN 'despachado' ELSE estado END`
  );
  await pool.query("ALTER TABLE pedidos DROP COLUMN estado");
  await pool.query("ALTER TABLE pedidos CHANGE COLUMN estado_nuevo estado ENUM('pendiente','en_preparacion','despachado','cancelado') NOT NULL DEFAULT 'pendiente'");
  console.log("Migración aplicada: estados del pedido actualizados (confirmado→pendiente, entregado→despachado).");
}

async function migrarColumnasNuevas(pool) {
  await agregarColumna(pool, "inventario", "minimo", "INT NOT NULL DEFAULT 5 AFTER cantidad");
  // SCRUM-47
  await agregarColumna(pool, "cyborgs", "modelo", "VARCHAR(80) NULL AFTER nombre");
  await agregarColumna(pool, "cyborgs", "especificaciones", "TEXT NULL AFTER modelo");
  await agregarColumna(pool, "reinos_clientes", "representante", "VARCHAR(120) NULL AFTER nombre");
  await migrarEstadosPedido(pool);
}

module.exports = { initDatabase };

if (require.main === module) {
  const { createPool } = require("../src/config/db");
  const pool = createPool();
  initDatabase(pool)
    .then(() => console.log("Base de datos lista."))
    .catch((e) => { console.error("Error al inicializar la BD:", e.message); process.exitCode = 1; })
    .finally(() => pool.end());
}