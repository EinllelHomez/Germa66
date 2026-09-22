const auditoriaModel = require("../models/auditoria.model");

module.exports = (pool) => {
  const Auditoria = auditoriaModel(pool);
  return {
    async list(req, res) {
      const limite = Math.min(Number(req.query.limit) || 50, 200);
      res.json(await Auditoria.consultarLogsActividad(limite));
    },
  };
};
