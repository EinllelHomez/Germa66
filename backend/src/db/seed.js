// Crea el Administrador inicial. Uso: npm run seed
const bcrypt = require("bcryptjs");
const env = require("../config/env");
const { createPool } = require("./pool");
const { initDatabase } = require("./init");

(async () => {
  const pool = createPool();
  try {
    await initDatabase(pool);
    const [[rol]] = await pool.query("SELECT id FROM roles WHERE nombre = \"Administrador\"");
    const [existe] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [env.adminEmail]);
    if (existe.length) return console.log("El administrador " + env.adminEmail + " ya existe.");
    await pool.query(
      "INSERT INTO usuarios (nombre, email, clave_hash, rol_id) VALUES (?,?,?,?)",
      ["Comandante Germa 66", env.adminEmail, await bcrypt.hash(env.adminPassword, 10), rol.id]
    );
    console.log("Administrador creado: " + env.adminEmail + " / " + env.adminPassword);

    // Usuario Operativo de prueba (checklist Sprint 1: al menos un usuario por cada rol).
    const [[rolOperativo]] = await pool.query("SELECT id FROM roles WHERE nombre = \"Operativo\"");
    const operativoEmail = "operativo@germa66.com";
    const [existeOp] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [operativoEmail]);
    if (!existeOp.length) {
      await pool.query(
        "INSERT INTO usuarios (nombre, email, clave_hash, rol_id) VALUES (?,?,?,?)",
        ["Operativo de prueba", operativoEmail, await bcrypt.hash("Operativo123.", 10), rolOperativo.id]
      );
      console.log("Operativo creado: " + operativoEmail + " / Operativo123.");
    } else {
      console.log("El operativo " + operativoEmail + " ya existe.");
    }
  } catch (e) {
    console.error("Error en el seed:", e.message); process.exitCode = 1;
  } finally { await pool.end(); }
})();