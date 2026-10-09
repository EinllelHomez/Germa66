const reportesModel = require("../models/reportes.model");
const motorReportes = require("../services/motorReportes.service");

module.exports = (pool) => {
  const Reportes = reportesModel(pool);

  return {
    async get(req, res) {
      try {
        const datos = await Reportes.datosParaReporte();
        res.json(await motorReportes.generarReporte(datos));
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    },
  };
};
