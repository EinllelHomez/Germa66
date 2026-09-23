const reportesModel = require("../models/reportes.model");

module.exports = (pool) => {
  const Reportes = reportesModel(pool);

  return {
    async get(req, res) {
      try {
        const reporte = await Reportes.generarReporte();
        res.json(reporte);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    },
  };
};