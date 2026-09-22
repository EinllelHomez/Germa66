// Modelo Cyborgs (RF-03). Toda consulta SQL sobre cyborgs vive aquí.
const SELECT_CYBORG = `
  SELECT c.id, c.codigo, c.serie, c.nombre, c.estado, c.creado_en,
         COUNT(e.id) AS items_asignados
  FROM cyborgs c LEFT JOIN cyborg_equipamiento e ON e.cyborg_id = c.id`;

module.exports = (pool) => ({
  async listar() {
    const [rows] = await pool.query(SELECT_CYBORG + " GROUP BY c.id ORDER BY c.id");
    return rows;
  },

  async buscarPorId(id) {
    const [[c]] = await pool.query(SELECT_CYBORG + " WHERE c.id = ? GROUP BY c.id", [id]);
    return c || null;
  },

  async existeCodigo(codigo) {
    const [rows] = await pool.query("SELECT id FROM cyborgs WHERE codigo = ?", [codigo]);
    return rows.length > 0;
  },

  async existeSerie(serie) {
    const [rows] = await pool.query("SELECT id FROM cyborgs WHERE serie = ?", [serie]);
    return rows.length > 0;
  },

  async crear({ codigo, serie, nombre, estado }) {
    const [info] = await pool.query(
      "INSERT INTO cyborgs (codigo, serie, nombre, estado) VALUES (?,?,?,?)",
      [codigo, serie, nombre || null, estado || "activo"]
    );
    return this.buscarPorId(info.insertId);
  },

  async actualizar(id, { nombre, estado }) {
    await pool.query("UPDATE cyborgs SET nombre = ?, estado = ? WHERE id = ?", [nombre, estado, id]);
    return this.buscarPorId(id);
  },
});