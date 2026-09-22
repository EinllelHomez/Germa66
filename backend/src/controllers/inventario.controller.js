const inventarioModel = require("../models/inventario.model");
const auditoriaModel = require("../models/auditoria.model");

const CATEGORIAS = ["arma", "raid_suit", "artefacto"];
const ESTADOS = ["disponible", "en_mantenimiento", "agotado", "baja"];

module.exports = (pool) => {
  const Inventario = inventarioModel(pool);
  const Auditoria = auditoriaModel(pool);

  return {
    async list(req, res) {
      res.json(await Inventario.listar());
    },

    async create(req, res) {
      const { codigo, nombre, categoria, cantidad, estado, ubicacion } = req.body || {};
      if (!codigo || !nombre || !categoria || cantidad === undefined) {
        return res.status(400).json({ error: "Código, nombre, categoría y cantidad son obligatorios." });
      }
      if (!CATEGORIAS.includes(categoria)) {
        return res.status(400).json({ error: "Categoría inválida. Usa arma, raid_suit o artefacto." });
      }
      if (estado && !ESTADOS.includes(estado)) {
        return res.status(400).json({ error: "Estado inválido." });
      }
      const cantidadNum = Number(cantidad);
      if (!Number.isInteger(cantidadNum) || cantidadNum < 0) {
        return res.status(400).json({ error: "La cantidad no puede ser negativa." });
      }
      const codigoLimpio = String(codigo).trim();
      if (await Inventario.existeCodigo(codigoLimpio)) {
        return res.status(409).json({ error: "Ya existe un ítem con ese código." });
      }
      const creado = await Inventario.crear({
        codigo: codigoLimpio,
        nombre: String(nombre).trim(),
        categoria,
        cantidad: cantidadNum,
        estado,
        ubicacion,
      });
      await Auditoria.registrarLog(req.user.id, "Registró en inventario " + codigoLimpio, req.ip);
      res.status(201).json(creado);
    },

    async update(req, res) {
      const id = Number(req.params.id);
      const actual = await Inventario.buscarPorId(id);
      if (!actual) return res.status(404).json({ error: "Ítem no encontrado." });

      const { nombre, categoria, cantidad, estado, ubicacion } = req.body || {};
      const nuevaCategoria = categoria !== undefined ? categoria : actual.categoria;
      const nuevoEstado = estado !== undefined ? estado : actual.estado;
      const nuevaCantidad = cantidad !== undefined ? Number(cantidad) : actual.cantidad;

      if (!CATEGORIAS.includes(nuevaCategoria)) {
        return res.status(400).json({ error: "Categoría inválida." });
      }
      if (!ESTADOS.includes(nuevoEstado)) {
        return res.status(400).json({ error: "Estado inválido." });
      }
      if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 0) {
        return res.status(400).json({ error: "La cantidad no puede ser negativa." });
      }
      const actualizado = await Inventario.actualizar(id, {
        nombre: nombre !== undefined ? String(nombre).trim() : actual.nombre,
        categoria: nuevaCategoria,
        cantidad: nuevaCantidad,
        estado: nuevoEstado,
        ubicacion: ubicacion !== undefined ? ubicacion : actual.ubicacion,
      });
      await Auditoria.registrarLog(req.user.id, "Actualizó inventario #" + id + " (" + actual.codigo + ")", req.ip);
      res.json(actualizado);
    },

    async remove(req, res) {
      const id = Number(req.params.id);
      const actual = await Inventario.buscarPorId(id);
      if (!actual) return res.status(404).json({ error: "Ítem no encontrado." });
      await Inventario.eliminar(id);
      await Auditoria.registrarLog(req.user.id, "Eliminó del inventario " + actual.codigo, req.ip);
      res.status(204).send();
    },
  };
};