// Modelo de cyborg_equipamiento: qué ítems de inventario tiene asignado cada cyborg (RF-03).
module.exports = (pool) => ({
  async listarPorCyborg(cyborgId) {
    const [rows] = await pool.query(
      `SELECT e.id, e.cyborg_id, e.item_id, e.cantidad, e.asignado_en,
              i.codigo AS item_codigo, i.nombre AS item_nombre
       FROM cyborg_equipamiento e JOIN inventario i ON i.id = e.item_id
       WHERE e.cyborg_id = ? ORDER BY e.id`,
      [cyborgId]
    );
    return rows;
  },

  async buscarPorId(id) {
    const [[e]] = await pool.query("SELECT * FROM cyborg_equipamiento WHERE id = ?", [id]);
    return e || null;
  },

  async asignar({ cyborgId, itemId, cantidad }) {
    const [info] = await pool.query(
      "INSERT INTO cyborg_equipamiento (cyborg_id, item_id, cantidad) VALUES (?,?,?)",
      [cyborgId, itemId, cantidad]
    );
    return info.insertId;
  },

  async eliminar(id) {
    await pool.query("DELETE FROM cyborg_equipamiento WHERE id = ?", [id]);
  },

  // Qué cyborgs tienen asignado un ítem: se usa para avisar antes de eliminarlo del inventario.
  async listarPorItem(itemId) {
    const [rows] = await pool.query(
      `SELECT e.id, e.cyborg_id, e.cantidad, c.codigo AS cyborg_codigo, c.nombre AS cyborg_nombre
       FROM cyborg_equipamiento e JOIN cyborgs c ON c.id = e.cyborg_id
       WHERE e.item_id = ? ORDER BY c.codigo`,
      [itemId]
    );
    return rows;
  },

  async eliminarPorItem(itemId) {
    await pool.query("DELETE FROM cyborg_equipamiento WHERE item_id = ?", [itemId]);
  },
});