// Modelo Reportes (RF-06): lee de MySQL los datos que necesita el motor de reportes.
// El cálculo no se hace aquí: lo hace el motor en C++ (services/motorReportes.service.js).
module.exports = (pool) => ({
  async datosParaReporte() {
    const [inventario] = await pool.query(
      "SELECT codigo, nombre, categoria, cantidad, minimo, ubicacion FROM inventario"
    );
    const [pedidos] = await pool.query(
      "SELECT p.id, c.nombre AS cliente, p.estado FROM pedidos p JOIN reinos_clientes c ON c.id = p.cliente_id ORDER BY p.id"
    );
    const [cyborgs] = await pool.query("SELECT id, codigo, estado FROM cyborgs");
    return { inventario, pedidos, cyborgs };
  },
});
