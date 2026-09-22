// Modelo Reinos Clientes (RF-04). Toda consulta SQL sobre clientes vive aquí.
const SELECT_CLIENTE = `SELECT id, nombre, contacto, ubicacion, estado_cuenta FROM reinos_clientes`;

module.exports = (pool) => ({
  async listar() {
    const [rows] = await pool.query(SELECT_CLIENTE + " ORDER BY id");
    return rows;
  },

  async buscarPorId(id) {
    const [[cliente]] = await pool.query(SELECT_CLIENTE + " WHERE id = ?", [id]);
    return cliente || null;
  },

  async existeNombre(nombre) {
    const [rows] = await pool.query("SELECT id FROM reinos_clientes WHERE nombre = ?", [nombre]);
    return rows.length > 0;
  },

  async crear({ nombre, contacto, ubicacion, estadoCuenta }) {
    const [info] = await pool.query(
      "INSERT INTO reinos_clientes (nombre, contacto, ubicacion, estado_cuenta) VALUES (?,?,?,?)",
      [nombre, contacto || null, ubicacion || null, estadoCuenta || "al_dia"]
    );
    return this.buscarPorId(info.insertId);
  },

  async actualizar(id, { contacto, ubicacion, estadoCuenta }) {
    await pool.query(
      "UPDATE reinos_clientes SET contacto = ?, ubicacion = ?, estado_cuenta = ? WHERE id = ?",
      [contacto || null, ubicacion || null, estadoCuenta, id]
    );
    return this.buscarPorId(id);
  },
});