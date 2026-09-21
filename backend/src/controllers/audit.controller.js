module.exports = (pool) => ({
  async list(req, res) {
    const limite = Math.min(Number(req.query.limit) || 50, 200);
    const [rows] = await pool.query(
      "SELECT a.id, a.fecha_hora, a.accion_realizada, a.direccion_ip, u.email AS usuario FROM auditoria_seguridad a LEFT JOIN usuarios u ON u.id = a.usuario_id ORDER BY a.id DESC LIMIT ?",
      [limite]
    );
    res.json(rows);
  },
});
