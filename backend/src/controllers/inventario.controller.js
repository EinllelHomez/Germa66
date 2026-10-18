const inventarioModel = require("../models/inventario.model");
const auditoriaModel = require("../models/auditoria.model");
const equipamientoModel = require("../models/equipamiento.model");
const { enTransaccion } = require("../config/db");

const { categoriasInventario: CATEGORIAS, estadosInventario: ESTADOS } = require("../domain/catalogos");

module.exports = (pool) => {
  const Inventario = inventarioModel(pool);
  const Auditoria = auditoriaModel(pool);
  const Equipamiento = equipamientoModel(pool);

  return {
    async list(req, res) {
      res.json(await Inventario.listar());
    },

    async create(req, res) {
      const { codigo, nombre, categoria, cantidad, minimo, estado, ubicacion } = req.body || {};
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
      const minimoNum = minimo === undefined ? 5 : Number(minimo);
      if (!Number.isInteger(minimoNum) || minimoNum < 0) {
        return res.status(400).json({ error: "El mínimo no puede ser negativo." });
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
        minimo: minimoNum,
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

      const { nombre, categoria, cantidad, minimo, estado, ubicacion } = req.body || {};
      const nuevaCategoria = categoria !== undefined ? categoria : actual.categoria;
      const nuevoEstado = estado !== undefined ? estado : actual.estado;
      const nuevaCantidad = cantidad !== undefined ? Number(cantidad) : actual.cantidad;
      const nuevoMinimo = minimo !== undefined ? Number(minimo) : actual.minimo;

      if (!CATEGORIAS.includes(nuevaCategoria)) {
        return res.status(400).json({ error: "Categoría inválida." });
      }
      if (!ESTADOS.includes(nuevoEstado)) {
        return res.status(400).json({ error: "Estado inválido." });
      }
      if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 0) {
        return res.status(400).json({ error: "La cantidad no puede ser negativa." });
      }
      if (!Number.isInteger(nuevoMinimo) || nuevoMinimo < 0) {
        return res.status(400).json({ error: "El mínimo no puede ser negativo." });
      }
      const actualizado = await Inventario.actualizar(id, {
        nombre: nombre !== undefined ? String(nombre).trim() : actual.nombre,
        categoria: nuevaCategoria,
        cantidad: nuevaCantidad,
        minimo: nuevoMinimo,
        estado: nuevoEstado,
        ubicacion: ubicacion !== undefined ? ubicacion : actual.ubicacion,
      });
      await Auditoria.registrarLog(req.user.id, "Actualizó inventario #" + id + " (" + actual.codigo + ")", req.ip);
      res.json(actualizado);
    },

    // Cyborgs que tienen asignado este ítem. El frontend lo consulta antes de eliminar para avisar.
    async asignaciones(req, res) {
      const id = Number(req.params.id);
      if (!(await Inventario.buscarPorId(id))) return res.status(404).json({ error: "Ítem no encontrado." });
      res.json(await Equipamiento.listarPorItem(id));
    },

    // Si el ítem está asignado a cyborgs, solo se elimina con ?forzar=1 (el usuario ya confirmó el aviso):
    // primero se le quita a esos cyborgs y luego se borra, todo en una transacción.
    async remove(req, res) {
      const id = Number(req.params.id);
      const actual = await Inventario.buscarPorId(id);
      if (!actual) return res.status(404).json({ error: "Ítem no encontrado." });
      if (await Inventario.estaEnPedidos(id)) {
        return res.status(409).json({ error: `No se puede eliminar ${actual.codigo}: aparece en pedidos registrados.` });
      }
      const asignado = await Equipamiento.listarPorItem(id);
      const forzar = req.query.forzar === "1";
      if (asignado.length && !forzar) {
        const lista = asignado.map((a) => a.cyborg_codigo).join(", ");
        return res.status(409).json({ error: `${actual.codigo} está asignado a: ${lista}. Confirma para eliminarlo igualmente.` });
      }
      await enTransaccion(pool, async (conn) => {
        await equipamientoModel(conn).eliminarPorItem(id);
        await inventarioModel(conn).eliminar(id);
      });
      const detalle = asignado.length ? " (se quitó a " + asignado.map((a) => a.cyborg_codigo).join(", ") + ")" : "";
      await Auditoria.registrarLog(req.user.id, "Eliminó del inventario " + actual.codigo + detalle, req.ip);
      res.status(204).send();
    },
  };
};