// AuditoriaSeguridad.registrarLog(idUsuario, accion)
async function registrarLog(pool, usuarioId, accion, ip) {
  try {
    await pool.query(
      "INSERT INTO auditoria_seguridad (usuario_id, accion_realizada, direccion_ip) VALUES (?,?,?)",
      [usuarioId || null, accion, ip || null]
    );
  } catch (e) {
    console.error("No se pudo registrar auditoría:", e.message); // nunca tumba la petición
  }
}

module.exports = { registrarLog };
