const bcrypt = require("bcryptjs");
const { registrarLog } = require("../services/audit");

const SELECT_USER = "SELECT u.id, u.nombre, u.email, u.activo, u.creado_en, r.nombre AS rol FROM usuarios u JOIN roles r ON r.id = u.rol_id";

module.exports = (pool) => ({
  async list(req, res) {
    const [rows] = await pool.query(SELECT_USER + " ORDER BY u.id");
    res.json(rows);
  },

  async create(req, res) {
    const { nombre, email, password, rol } = req.body || {};
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: "Nombre, correo, contraseña y rol son obligatorios." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
    }
    const [[rolRow]] = await pool.query("SELECT id FROM roles WHERE nombre = ?", [rol]);
    if (!rolRow) return res.status(400).json({ error: "Rol inválido. Usa Administrador u Operativo." });

    const correo = String(email).trim().toLowerCase();
    const [dup] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [correo]);
    if (dup.length) return res.status(409).json({ error: "Ya existe un usuario con ese correo." });

    const [info] = await pool.query(
      "INSERT INTO usuarios (nombre, email, clave_hash, rol_id) VALUES (?,?,?,?)",
      [String(nombre).trim(), correo, await bcrypt.hash(String(password), 10), rolRow.id]
    );
    await registrarLog(pool, req.user.id, "Creó usuario " + correo + " (" + rol + ")", req.ip);
    const [[creado]] = await pool.query(SELECT_USER + " WHERE u.id = ?", [info.insertId]);
    res.status(201).json(creado);
  },

  async update(req, res) {
    const id = Number(req.params.id);
    const [[actual]] = await pool.query("SELECT * FROM usuarios WHERE id = ?", [id]);
    if (!actual) return res.status(404).json({ error: "Usuario no encontrado." });

    const { rol, activo } = req.body || {};
    if (id === req.user.id && (activo === false || activo === 0)) {
      return res.status(400).json({ error: "No puedes desactivar tu propia cuenta." });
    }
    let rolId = actual.rol_id;
    if (rol !== undefined) {
      const [[rolRow]] = await pool.query("SELECT id FROM roles WHERE nombre = ?", [rol]);
      if (!rolRow) return res.status(400).json({ error: "Rol inválido." });
      rolId = rolRow.id;
    }
    const nuevoActivo = activo === undefined ? actual.activo : (activo ? 1 : 0);
    await pool.query("UPDATE usuarios SET rol_id = ?, activo = ? WHERE id = ?", [rolId, nuevoActivo, id]);
    await registrarLog(pool, req.user.id, "Actualizó usuario #" + id + " (rol=" + (rol || "igual") + ", activo=" + nuevoActivo + ")", req.ip);
    const [[u]] = await pool.query(SELECT_USER + " WHERE u.id = ?", [id]);
    res.json(u);
  },
});
