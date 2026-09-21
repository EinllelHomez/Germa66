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
  } catch (e) {
    console.error("Error en el seed:", e.message); process.exitCode = 1;
  } finally { await pool.end(); }
})();
