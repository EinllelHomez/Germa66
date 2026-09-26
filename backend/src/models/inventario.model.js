// Modelo Inventario (RF-02). Toda consulta SQL sobre inventario vive aquí;
// el controlador solo llama estas funciones, nunca escribe SQL directamente.
const SELECT_ITEM = `SELECT id, codigo, nombre, categoria, cantidad, minimo, estado, ubicacion,
  (cantidad <= minimo) AS bajo_minimo FROM inventario`;

module.exports = (pool) => ({
  // RF-06: cada fila trae bajo_minimo (0/1) calculado por la propia consulta,
  // así el frontend puede resaltarlo sin tener que recalcularlo aparte.
  async listar() {
    const [rows] = await pool.query(SELECT_ITEM + " ORDER BY id");
    return rows.map((r) => ({ ...r, bajo_minimo: !!r.bajo_minimo }));
  },

  async buscarPorId(id) {
    const [[item]] = await pool.query(SELECT_ITEM + " WHERE id = ?", [id]);
    return item ? { ...item, bajo_minimo: !!item.bajo_minimo } : null;
  },

  async existeCodigo(codigo) {
    const [rows] = await pool.query("SELECT id FROM inventario WHERE codigo = ?", [codigo]);
    return rows.length > 0;
  },

  async crear({ codigo, nombre, categoria, cantidad, minimo, estado, ubicacion }) {
    const [info] = await pool.query(
      "INSERT INTO inventario (codigo, nombre, categoria, cantidad, minimo, estado, ubicacion) VALUES (?,?,?,?,?,?,?)",
      [codigo, nombre, categoria, cantidad, minimo ?? 5, estado || "disponible", ubicacion || null]
    );
    return this.buscarPorId(info.insertId);
  },

  async actualizar(id, { nombre, categoria, cantidad, minimo, estado, ubicacion }) {
    await pool.query(
      "UPDATE inventario SET nombre = ?, categoria = ?, cantidad = ?, minimo = ?, estado = ?, ubicacion = ? WHERE id = ?",
      [nombre, categoria, cantidad, minimo, estado, ubicacion || null, id]
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