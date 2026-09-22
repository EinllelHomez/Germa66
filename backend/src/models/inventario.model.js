// Modelo Inventario (RF-02). Toda consulta SQL sobre inventario vive aquí;
// el controlador solo llama estas funciones, nunca escribe SQL directamente.
const SELECT_ITEM = `SELECT id, codigo, nombre, categoria, cantidad, estado, ubicacion FROM inventario`;

module.exports = (pool) => ({
  async listar() {
    const [rows] = await pool.query(SELECT_ITEM + " ORDER BY id");
    return rows;
  },

  async buscarPorId(id) {
    const [[item]] = await pool.query(SELECT_ITEM + " WHERE id = ?", [id]);
    return item || null;
  },

  async existeCodigo(codigo) {
    const [rows] = await pool.query("SELECT id FROM inventario WHERE codigo = ?", [codigo]);
    return rows.length > 0;
  },

  async crear({ codigo, nombre, categoria, cantidad, estado, ubicacion }) {
    const [info] = await pool.query(
      "INSERT INTO inventario (codigo, nombre, categoria, cantidad, estado, ubicacion) VALUES (?,?,?,?,?,?)",
      [codigo, nombre, categoria, cantidad, estado || "disponible", ubicacion || null]
    );
    return this.buscarPorId(info.insertId);
  },

  async actualizar(id, { nombre, categoria, cantidad, estado, ubicacion }) {
    await pool.query(
      "UPDATE inventario SET nombre = ?, categoria = ?, cantidad = ?, estado = ?, ubicacion = ? WHERE id = ?",
      [nombre, categoria, cantidad, estado, ubicacion || null, id]
    );
    return this.buscarPorId(id);
  },

  async eliminar(id) {
    await pool.query("DELETE FROM inventario WHERE id = ?", [id]);
  },

  // Descuenta stock solo si hay suficiente (evita cantidades negativas por condición de carrera).
  // Devuelve true si se pudo descontar, false si no había suficiente stock.
  async descontar(id, cantidad) {
    const [result] = await pool.query(
      "UPDATE inventario SET cantidad = cantidad - ? WHERE id = ? AND cantidad >= ?",
      [cantidad, id, cantidad]
    );
    return result.affectedRows > 0;
  },

  // Devuelve stock al inventario (ej: al quitarle equipamiento a un cyborg o cancelar un pedido).
  async aumentar(id, cantidad) {
    await pool.query("UPDATE inventario SET cantidad = cantidad + ? WHERE id = ?", [cantidad, id]);
  },
});