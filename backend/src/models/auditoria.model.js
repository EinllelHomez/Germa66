module.exports = (pool) => ({

  async registrarLog(usuarioId, accion, ip) {
    try {
      await pool.query(
        "INSERT INTO auditoria_seguridad (usuario_id, accion_realizada, direccion_ip) VALUES (?,?,?)",
        [usuarioId || null, accion, ip || null]
      );
    } catch (e) {
      console.error("No se pudo registrar auditoría:", e.message);
    }
  },

  
  async consultarLogsActividad(limite = 50) {
    const [rows] = await pool.query(
      `SELECT a.id, a.fecha_hora, a.accion_realizada, a.direccion_ip, u.email AS usuario
       FROM auditoria_seguridad a LEFT JOIN usuarios u ON u.id = a.usuario_id
       ORDER BY a.id DESC LIMIT ?`,
      [limite]
    );
    return rows;
  },
});
