const clienteModel = require("../models/cliente.model");
const auditoriaModel = require("../models/auditoria.model");

const ESTADOS_CUENTA = ["al_dia", "en_mora", "suspendida"];

module.exports = (pool) => {
  const Cliente = clienteModel(pool);
  const Auditoria = auditoriaModel(pool);

  return {
    async list(req, res) {
      res.json(await Cliente.listar());
    },

    async create(req, res) {
      const { nombre, contacto, ubicacion, estadoCuenta } = req.body || {};
      if (!nombre) {
        return res.status(400).json({ error: "El nombre del reino es obligatorio." });
      }
      if (estadoCuenta && !ESTADOS_CUENTA.includes(estadoCuenta)) {
        return res.status(400).json({ error: "Estado de cuenta inválido." });
      }
      const nombreLimpio = String(nombre).trim();
      if (await Cliente.existeNombre(nombreLimpio)) {
        return res.status(409).json({ error: "Ya existe un reino cliente con ese nombre." });
      }
      const creado = await Cliente.crear({ nombre: nombreLimpio, contacto, ubicacion, estadoCuenta });
      await Auditoria.registrarLog(req.user.id, "Registró cliente " + nombreLimpio, req.ip);
      res.status(201).json(creado);
    },

    async update(req, res) {
      const id = Number(req.params.id);
      const actual = await Cliente.buscarPorId(id);
      if (!actual) return res.status(404).json({ error: "Cliente no encontrado." });

      const { contacto, ubicacion, estadoCuenta } = req.body || {};
      const nuevoEstado = estadoCuenta !== undefined ? estadoCuenta : actual.estado_cuenta;
      if (!ESTADOS_CUENTA.includes(nuevoEstado)) {
        return res.status(400).json({ error: "Estado de cuenta inválido." });
      }
      const actualizado = await Cliente.actualizar(id, {
        contacto: contacto !== undefined ? contacto : actual.contacto,
        ubicacion: ubicacion !== undefined ? ubicacion : actual.ubicacion,
        estadoCuenta: nuevoEstado,
      });
      await Auditoria.registrarLog(req.user.id, "Actualizó cliente #" + id + " (" + actual.nombre + ")", req.ip);
      res.json(actualizado);
    },
  };
};