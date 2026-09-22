// Modelo Rol (diagrama UML del SRS: idRol, nombreRol)
module.exports = (pool) => ({
  async buscarPorNombre(nombre) {
    const [[rol]] = await pool.query("SELECT id, nombre FROM roles WHERE nombre = ?", [nombre]);
    return rol || null;
  },
});
