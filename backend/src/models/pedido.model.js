// Modelo Pedidos (RF-05). Toda consulta SQL sobre pedidos y sus ítems vive aquí.
// Acepta el pool o una conexión de transacción (igual que los demás modelos).
const SELECT_PEDIDO = `
  SELECT p.id, p.cliente_id, c.nombre AS cliente_nombre, p.usuario_id, p.estado, p.fecha,
         (SELECT COALESCE(SUM(pi.cantidad), 0) FROM pedido_items pi WHERE pi.pedido_id = p.id) AS total_unidades,
         (SELECT COUNT(*) FROM pedido_items pi WHERE pi.pedido_id = p.id) AS total_items
  FROM pedidos p
  JOIN reinos_clientes c ON c.id = p.cliente_id`;

module.exports = (pool) => ({
  async listar({ estado, clienteId } = {}) {
    const where = [];
    const params = [];
    if (estado) { where.push("p.estado = ?"); params.push(estado); }
    if (clienteId) { where.push("p.cliente_id = ?"); params.push(clienteId); }
    const sql = SELECT_PEDIDO + (where.length ? " WHERE " + where.join(" AND ") : "") + " ORDER BY p.id DESC";
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async buscarPorId(id) {
    const [[pedido]] = await pool.query(SELECT_PEDIDO + " WHERE p.id = ?", [id]);
    return pedido || null;
  },

  // inventario_id se devuelve con ese alias para que el frontend hable siempre de "inventario".
  async items(pedidoId) {
    const [rows] = await pool.query(
      `SELECT pi.item_id AS inventario_id, i.codigo, i.nombre, i.categoria, pi.cantidad, i.cantidad AS stock_actual
       FROM pedido_items pi
       JOIN inventario i ON i.id = pi.item_id
       WHERE pi.pedido_id = ?
       ORDER BY i.codigo`,
      [pedidoId]
    );
    return rows;
  },

  async crear({ clienteId, usuarioId }) {
    const [info] = await pool.query(
      "INSERT INTO pedidos (cliente_id, usuario_id, estado) VALUES (?, ?, 'pendiente')",
      [clienteId, usuarioId]
    );
    return this.buscarPorId(info.insertId);
  },

  // FOR UPDATE bloquea la fila dentro de una transacción para que dos pedidos no se lleven el mismo stock.
  async buscarItemInventario(id, { bloquear = false } = {}) {
    const [[item]] = await pool.query(
      "SELECT id, codigo, nombre, cantidad FROM inventario WHERE id = ?" + (bloquear ? " FOR UPDATE" : ""),
      [id]
    );
    return item || null;
  },

  async cantidadEnPedido(pedidoId, itemId) {
    const [[fila]] = await pool.query(
      "SELECT cantidad FROM pedido_items WHERE pedido_id = ? AND item_id = ?",
      [pedidoId, itemId]
    );
    return fila ? fila.cantidad : 0;
  },

  // La tabla no tiene llave única (pedido_id, item_id): si el ítem ya está se actualiza, si no se inserta.
  async fijarItem(pedidoId, itemId, cantidad) {
    const [info] = await pool.query(
      "UPDATE pedido_items SET cantidad = ? WHERE pedido_id = ? AND item_id = ?",
      [cantidad, pedidoId, itemId]
    );
    if (info.affectedRows === 0) {
      await pool.query(
        "INSERT INTO pedido_items (pedido_id, item_id, cantidad) VALUES (?,?,?)",
        [pedidoId, itemId, cantidad]
      );
    }
  },

  async quitarItem(pedidoId, itemId) {
    const [info] = await pool.query(
      "DELETE FROM pedido_items WHERE pedido_id = ? AND item_id = ?",
      [pedidoId, itemId]
    );
    return info.affectedRows > 0;
  },

  async cambiarEstado(id, estado) {
    await pool.query("UPDATE pedidos SET estado = ? WHERE id = ?", [estado, id]);
    return this.buscarPorId(id);
  },

  // Descuenta stock solo si alcanza. Devuelve false si no había suficiente.
  async descontarStock(itemId, cantidad) {
    const [info] = await pool.query(
      "UPDATE inventario SET cantidad = cantidad - ? WHERE id = ? AND cantidad >= ?",
      [cantidad, itemId, cantidad]
    );
    return info.affectedRows > 0;
  },

  async devolverStock(itemId, cantidad) {
    await pool.query("UPDATE inventario SET cantidad = cantidad + ? WHERE id = ?", [cantidad, itemId]);
  },
});
