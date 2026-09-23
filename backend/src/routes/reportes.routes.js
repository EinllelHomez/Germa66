const { Router } = require("express");
const { authenticate, authorize, wrap } = require("../middleware/auth");

module.exports = (pool) => {
  const c = require("../controllers/reportes.controller")(pool);
  const r = Router();
  r.use(authenticate, authorize("Administrador", "Operativo"));
  r.get("/", wrap(c.get));
  return r;
};