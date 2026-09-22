const bcrypt = require("bcryptjs");
const usuarioModel = require("../models/usuario.model");
const rolModel = require("../models/rol.model");
const auditoriaModel = require("../models/auditoria.model");

module.exports = (pool) => {
  const Usuario = usuarioModel(pool);
  const Rol = rolModel(pool);
  const Auditoria = auditoriaModel(pool);

  return {
    async list(req, res) {
      res.json(await Usuario.listar());
    },

    async create(req, res) {
      const { nombre, email, password, rol } = req.body || {};
      if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ error: "Nombre, correo, contraseña y rol son obligatorios." });
      }
      if (String(password).length < 8) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
      }
      const rolRow = await Rol.buscarPorNombre(rol);
      if (!rolRow) return res.status(400).json({ error: "Rol inválido. Usa Administrador u Operativo." });

      const correo = String(email).trim().toLowerCase();
      if (await Usuario.existeEmail(correo)) {
        return res.status(409).json({ error: "Ya existe un usuario con ese correo." });
      }
      const creado = await Usuario.crear({
        nombre: String(nombre).trim(),
        email: correo,
        claveHash: await bcrypt.hash(String(password), 10),
        rolId: rolRow.id,
      });
      await Auditoria.registrarLog(req.user.id, "Creó usuario " + correo + " (" + rol + ")", req.ip);
      res.status(201).json(creado);
    },

    async update(req, res) {
      const id = Number(req.params.id);
      const actual = await Usuario.buscarPorId(id);
      if (!actual) return res.status(404).json({ error: "Usuario no encontrado." });

      const { rol, activo } = req.body || {};
      if (id === req.user.id && (activo === false || activo === 0)) {
        return res.status(400).json({ error: "No puedes desactivar tu propia cuenta." });
      }
      let rolId = null;
      if (rol !== undefined) {
        const rolRow = await Rol.buscarPorNombre(rol);
        if (!rolRow) return res.status(400).json({ error: "Rol inválido." });
        rolId = rolRow.id;
      } else {
        rolId = (await Rol.buscarPorNombre(actual.rol)).id;
      }
      const nuevoActivo = activo === undefined ? (actual.activo ? 1 : 0) : (activo ? 1 : 0);
      const actualizado = await Usuario.actualizarRolYEstado(id, { rolId, activo: nuevoActivo });
      await Auditoria.registrarLog(req.user.id, "Actualizó usuario #" + id + " (rol=" + (rol || "igual") + ", activo=" + nuevoActivo + ")", req.ip);
      res.json(actualizado);
    },
  };
};
