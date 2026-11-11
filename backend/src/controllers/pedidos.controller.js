const pedidoModel = require("../models/pedido.model");
const clienteModel = require("../models/cliente.model");
const auditoriaModel = require("../models/auditoria.model");
const { enTransaccion } = require("../config/db");

// Flujo de estados en orden. Solo se puede avanzar al siguiente; cancelar solo antes de enviar.
const SIGUIENTE = { pendiente: "confirmado", confirmado: "en_preparacion", en_preparacion: "entregado" };
const CANCELABLES = ["pendiente", "confirmado", "en_preparacion"];
const nombreEstado = (e) => e.replace("_", " ");
const ESTADOS = ["pendiente", "confirmado", "en_preparacion", "entregado", "cancelado"];

class ErrorNegocio extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

function entero(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

module.exports = (pool) => {
  const Pedido = pedidoModel(pool);
  const Cliente = clienteModel(pool);
  const Auditoria = auditoriaModel(pool);

  async function detalle(id) {
    const pedido = await Pedido.buscarPorId(id);
    if (!pedido) return null;
    pedido.items = await Pedido.items(id);
    return pedido;
  }

  // Agrega (o suma) un ítem a un pedido pendiente validando que alcance el stock.
  async function agregarItem(modelo, pedidoId, inventarioId, cantidad) {
    const item = await modelo.buscarItemInventario(inventarioId);
    if (!item) throw new ErrorNegocio(404, "El ítem de inventario no existe.");
    const yaEnPedido = await modelo.cantidadEnPedido(pedidoId, inventarioId);
    const total = yaEnPedido + cantidad;
    if (total > item.cantidad) {
      throw new ErrorNegocio(
        409,
        `Stock insuficiente de ${item.codigo}: hay ${item.cantidad} y el pedido pediría ${total}.`
      );
    }
    await modelo.fijarItem(pedidoId, inventarioId, total);
  }

  // Valida que el cuerpo sea { inventarioId, cantidad } con enteros positivos.
  function leerItem(body) {
    const inventarioId = entero(body && body.inventarioId);
    const cantidad = entero(body && body.cantidad);
    if (!inventarioId || !cantidad) {
      throw new ErrorNegocio(400, "Cada ítem necesita inventarioId y una cantidad entera mayor a 0.");
    }
    return { inventarioId, cantidad };
  }

  return {
    async list(req, res) {
      const { estado, clienteId } = req.query;
      if (estado && !ESTADOS.includes(estado)) {
        return res.status(400).json({ error: "Estado inválido." });
      }
      res.json(await Pedido.listar({ estado, clienteId: entero(clienteId) }));
    },

    async get(req, res) {
      const pedido = await detalle(Number(req.params.id));
      if (!pedido) return res.status(404).json({ error: "Pedido no encontrado." });
      res.json(pedido);
    },

    // Crea el pedido para un reino. Opcionalmente puede traer ítems: { clienteId, items: [{inventarioId, cantidad}] }
    async create(req, res) {
      const { clienteId, items } = req.body || {};
      const idCliente = entero(clienteId);
      if (!idCliente) return res.status(400).json({ error: "El reino cliente es obligatorio." });
      if (items !== undefined && !Array.isArray(items)) {
        return res.status(400).json({ error: "Los ítems deben ser una lista." });
      }
      const cliente = await Cliente.buscarPorId(idCliente);
      if (!cliente) return res.status(404).json({ error: "Reino cliente no encontrado." });

      const lista = (items || []).map(leerItem);
      let creadoId;
      try {
        creadoId = await enTransaccion(pool, async (conn) => {
          const modelo = pedidoModel(conn);
          const nuevo = await modelo.crear({ clienteId: idCliente, usuarioId: req.user.id });
          for (const it of lista) await agregarItem(modelo, nuevo.id, it.inventarioId, it.cantidad);
          return nuevo.id;
        });
      } catch (e) {
        if (e instanceof ErrorNegocio) return res.status(e.status).json({ error: e.message });
        throw e;
      }
      await Auditoria.registrarLog(req.user.id, `Creó pedido #${creadoId} para ${cliente.nombre}`, req.ip);
      res.status(201).json(await detalle(creadoId));
    },

    async addItem(req, res) {
      const id = Number(req.params.id);
      const pedido = await Pedido.buscarPorId(id);
      if (!pedido) return res.status(404).json({ error: "Pedido no encontrado." });
      if (pedido.estado !== "pendiente") {
        return res.status(409).json({ error: "Solo se pueden modificar ítems de pedidos pendientes." });
      }
      try {
        const { inventarioId, cantidad } = leerItem(req.body);
        await agregarItem(Pedido, id, inventarioId, cantidad);
      } catch (e) {
        if (e instanceof ErrorNegocio) return res.status(e.status).json({ error: e.message });
        throw e;
      }
      await Auditoria.registrarLog(req.user.id, `Agregó ítem al pedido #${id}`, req.ip);
      res.json(await detalle(id));
    },

    async removeItem(req, res) {
      const id = Number(req.params.id);
      const pedido = await Pedido.buscarPorId(id);
      if (!pedido) return res.status(404).json({ error: "Pedido no encontrado." });
      if (pedido.estado !== "pendiente") {
        return res.status(409).json({ error: "Solo se pueden modificar ítems de pedidos pendientes." });
      }
      const quitado = await Pedido.quitarItem(id, Number(req.params.inventarioId));
      if (!quitado) return res.status(404).json({ error: "Ese ítem no está en el pedido." });
      await Auditoria.registrarLog(req.user.id, `Quitó ítem del pedido #${id}`, req.ip);
      res.json(await detalle(id));
    },

    // Cambia el estado respetando el orden. Al confirmar descuenta stock; al cancelar un pedido confirmado lo devuelve.
    async cambiarEstado(req, res) {
      const id = Number(req.params.id);
      const { estado } = req.body || {};
      if (!ESTADOS.includes(estado)) return res.status(400).json({ error: "Estado inválido." });

      const actual = await Pedido.buscarPorId(id);
      if (!actual) return res.status(404).json({ error: "Pedido no encontrado." });

      const esAvance = SIGUIENTE[actual.estado] === estado;
      const esCancelacion = estado === "cancelado" && CANCELABLES.includes(actual.estado);
      if (!esAvance && !esCancelacion) {
        const permitido = SIGUIENTE[actual.estado];
        return res.status(409).json({
          error: permitido
            ? `Un pedido ${nombreEstado(actual.estado)} solo puede pasar a ${nombreEstado(permitido)}${CANCELABLES.includes(actual.estado) ? " o cancelarse" : ""}.`
            : `Un pedido ${nombreEstado(actual.estado)} ya no puede cambiar de estado.`,
        });
      }

      try {
        await enTransaccion(pool, async (conn) => {
          const modelo = pedidoModel(conn);
          const items = await modelo.items(id);

          if (estado === "confirmado") {
            if (!items.length) throw new ErrorNegocio(409, "No se puede confirmar un pedido sin ítems.");
            for (const it of items) {
              const fila = await modelo.buscarItemInventario(it.inventario_id, { bloquear: true });
              if (!fila || fila.cantidad < it.cantidad) {
                throw new ErrorNegocio(
                  409,
                  `Stock insuficiente de ${it.codigo}: hay ${fila ? fila.cantidad : 0} y el pedido pide ${it.cantidad}.`
                );
              }
              await modelo.descontarStock(it.inventario_id, it.cantidad);
            }
          }

          if (estado === "cancelado" && actual.estado !== "pendiente") {
            for (const it of items) await modelo.devolverStock(it.inventario_id, it.cantidad);
          }

          await modelo.cambiarEstado(id, estado);
        });
      } catch (e) {
        if (e instanceof ErrorNegocio) return res.status(e.status).json({ error: e.message });
        throw e;
      }
      await Auditoria.registrarLog(req.user.id, `Pedido #${id}: ${actual.estado} → ${estado}`, req.ip);
      res.json(await detalle(id));
    },
  };
};
