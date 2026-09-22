// Modelo Usuario (diagrama UML del SRS: idUsuario, nombre, email, claveHash, estadoActivo).
// Toda consulta SQL sobre usuarios vive aquí; el controlador solo llama estas funciones.
const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.email, u.activo, u.creado_en, r.nombre AS rol
  FROM usuarios u JOIN roles r ON r.id = u.rol_id`;

module.exports = (pool) => ({
  async listar() {
    const [rows] = await pool.query(SELECT_USUARIO + " ORDER BY u.id");
    return rows;
  },

  async buscarPorId(id) {
    const [[u]] = await pool.query(SELECT_USUARIO + " WHERE u.id = ?", [id]);
    return u || null;
  },

  // Incluye clave_hash y rol_id: solo lo usa auth.controller para validar el login.
  async buscarPorEmailConClave(email) {
    const [[u]] = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.clave_hash, u.activo, u.rol_id, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.email = ?`,
      [email]
    );
    return u || null;
  },

  async existeEmail(email) {
    const [rows] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    return rows.length > 0;
  },

  async crear({ nombre, email, claveHash, rolId }) {
    const [info] = await pool.query(
      "INSERT INTO usuarios (nombre, email, clave_hash, rol_id) VALUES (?,?,?,?)",
      [nombre, email, claveHash, rolId]
    );
    return this.buscarPorId(info.insertId);
  },

  async actualizarRolYEstado(id, { rolId, activo }) {
    await pool.query("UPDATE usuarios SET rol_id = ?, activo = ? WHERE id = ?", [rolId, activo, id]);
    return this.buscarPorId(id);
  },
});
