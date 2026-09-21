const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { registrarLog } = require("../services/audit");

module.exports = (pool) => ({
  async login(req, res) {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Ingresa correo y contraseña." });

    const correo = String(email).trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT u.id, u.nombre, u.email, u.clave_hash, u.activo, r.nombre AS rol FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.email = ?",
      [correo]
    );
    const user = rows[0];

    // Mismo mensaje si no existe o la clave falla (no revela qué correos existen)
    if (!user || !(await bcrypt.compare(String(password), user.clave_hash))) {
      await registrarLog(pool, user && user.id, "Login fallido: " + correo, req.ip);
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }
    if (!user.activo) {
      await registrarLog(pool, user.id, "Login bloqueado: cuenta desactivada", req.ip);
      return res.status(403).json({ error: "Tu cuenta está desactivada. Contacta a un administrador." });
    }
    const payload = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
    await registrarLog(pool, user.id, "Login exitoso", req.ip);
    res.json({ token, user: payload });
  },

  me(req, res) {
    const { id, nombre, email, rol } = req.user;
    res.json({ id, nombre, email, rol });
  },

  async logout(req, res) { // CerrarSesion(): el token se descarta en el cliente
    await registrarLog(pool, req.user.id, "Cierre de sesión", req.ip);
    res.json({ ok: true });
  },
});
