const cyborgModel = require("../models/cyborg.model");
const equipamientoModel = require("../models/equipamiento.model");
const inventarioModel = require("../models/inventario.model");
const auditoriaModel = require("../models/auditoria.model");

const ESTADOS = ["activo", "en_mantenimiento", "baja"];

module.exports = (pool) => {
  const Cyborg = cyborgModel(pool);
  const Equipamiento = equipamientoModel(pool);
  const Inventario = inventarioModel(pool);
  const Auditoria = auditoriaModel(pool);

  return {
    async list(req, res) {
      res.json(await Cyborg.listar());
    },

    async create(req, res) {
      const { codigo, serie, nombre, estado } = req.body || {};
      if (!codigo || !serie) {
        return res.status(400).json({ error: "Código y serie son obligatorios." });
      }
      if (estado && !ESTADOS.includes(estado)) {
        return res.status(400).json({ error: "Estado inválido." });
      }
      const codigoLimpio = String(codigo).trim();
      const serieLimpia = String(serie).trim();
      if (await Cyborg.existeCodigo(codigoLimpio)) {
        return res.status(409).json({ error: "Ya existe un cyborg con ese código." });
      }
      if (await Cyborg.existeSerie(serieLimpia)) {
        return res.status(409).json({ error: "Ya existe un cyborg con esa serie." });
      }
      const creado = await Cyborg.crear({ codigo: codigoLimpio, serie: serieLimpia, nombre, estado });
      await Auditoria.registrarLog(req.user.id, "Registró cyborg " + codigoLimpio, req.ip);
      res.status(201).json(creado);
    },

    async update(req, res) {
      const id = Number(req.params.id);
      const actual = await Cyborg.buscarPorId(id);
      if (!actual) return res.status(404).json({ error: "Cyborg no encontrado." });

      const { nombre, estado } = req.body || {};
      const nuevoEstado = estado !== undefined ? estado : actual.estado;
      if (!ESTADOS.includes(nuevoEstado)) {
        return res.status(400).json({ error: "Estado inválido." });
      }
      const actualizado = await Cyborg.actualizar(id, {
        nombre: nombre !== undefined ? nombre : actual.nombre,
        estado: nuevoEstado,
      });
      await Auditoria.registrarLog(req.user.id, "Actualizó cyborg #" + id + " (" + actual.codigo + ")", req.ip);
      res.json(actualizado);
    },

    async listEquipamiento(req, res) {
      const cyborgId = Number(req.params.id);
      const cyborg = await Cyborg.buscarPorId(cyborgId);
      if (!cyborg) return res.status(404).json({ error: "Cyborg no encontrado." });
      res.json(await Equipamiento.listarPorCyborg(cyborgId));
    },

    // RF-03: "Solo permite asignar equipamiento con stock disponible en inventario (RF-02)".
    async assignEquipamiento(req, res) {
      const cyborgId = Number(req.params.id);
      const cyborg = await Cyborg.buscarPorId(cyborgId);
      if (!cyborg) return res.status(404).json({ error: "Cyborg no encontrado." });

      const { itemId, cantidad } = req.body || {};
      const itemIdNum = Number(itemId);
      const cantidadNum = Number(cantidad);
      if (!Number.isInteger(itemIdNum)) {
        return res.status(400).json({ error: "Selecciona un ítem del inventario." });
      }
      if (!Number.isInteger(cantidadNum) || cantidadNum <= 0) {
        return res.status(400).json({ error: "La cantidad debe ser mayor a cero." });
      }
      const item = await Inventario.buscarPorId(itemIdNum);
      if (!item) return res.status(404).json({ error: "Ítem de inventario no encontrado." });

      const descontado = await Inventario.descontar(itemIdNum, cantidadNum);
      if (!descontado) {
        return res.status(400).json({ error: `No hay stock suficiente de ${item.nombre} (disponible: ${item.cantidad}).` });
      }
      await Equipamiento.asignar({ cyborgId, itemId: itemIdNum, cantidad: cantidadNum });
      await Auditoria.registrarLog(req.user.id, `Asignó ${cantidadNum}x ${item.nombre} al cyborg ${cyborg.codigo}`, req.ip);
      res.status(201).json(await Equipamiento.listarPorCyborg(cyborgId));
    },

    // Quitarle equipamiento a un cyborg devuelve la cantidad al inventario.
    async unassignEquipamiento(req, res) {
      const cyborgId = Number(req.params.id);
      const equipId = Number(req.params.equipId);
      const equipo = await Equipamiento.buscarPorId(equipId);
      if (!equipo || equipo.cyborg_id !== cyborgId) {
        return res.status(404).json({ error: "Asignación no encontrada." });
      }
      await Equipamiento.eliminar(equipId);
      await Inventario.aumentar(equipo.item_id, equipo.cantidad);
      await Auditoria.registrarLog(req.user.id, `Quitó equipamiento #${equipId} del cyborg #${cyborgId}`, req.ip);
      res.status(204).send();
    },
  };
};