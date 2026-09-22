// Controlador: recibe la petición HTTP, pide datos al Modelo y decide qué responder.
// No contiene SQL: eso vive en src/models.
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const usuarioModel = require("../models/usuario.model");
const auditoriaModel = require("../models/auditoria.model");

module.exports = (pool) => {
  const Usuario = usuarioModel(pool);
  const Auditoria = auditoriaModel(pool);

  return {
    async login(req, res) {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "Ingresa correo y contraseña." });

      const correo = String(email).trim().toLowerCase();
      const user = await Usuario.buscarPorEmailConClave(correo);

      // Mismo mensaje si no existe o la clave falla (no revela qué correos existen)
      if (!user || !(await bcrypt.compare(String(password), user.clave_hash))) {
        await Auditoria.registrarLog(user && user.id, "Login fallido: " + correo, req.ip);
        return res.status(401).json({ error: "Correo o contraseña incorrectos." });
      }
      if (!user.activo) {
        await Auditoria.registrarLog(user.id, "Login bloqueado: cuenta desactivada", req.ip);
        return res.status(403).json({ error: "Tu cuenta está desactivada. Contacta a un administrador." });
      }
      const payload = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
      const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
      await Auditoria.registrarLog(user.id, "Login exitoso", req.ip);
      res.json({ token, user: payload });
    },

    me(req, res) {
      const { id, nombre, email, rol } = req.user;
      res.json({ id, nombre, email, rol });
    },

    async logout(req, res) {
      await Auditoria.registrarLog(req.user.id, "Cierre de sesión", req.ip);
      res.json({ ok: true });
    },
  };
};
