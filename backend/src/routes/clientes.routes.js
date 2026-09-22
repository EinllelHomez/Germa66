const { Router } = require("express");
const { authenticate, authorize, wrap } = require("../middleware/auth");

module.exports = (pool) => {
  const c = require("../controllers/clientes.controller")(pool);
  const r = Router();
  r.use(authenticate, authorize("Administrador", "Operativo"));
  r.get("/", wrap(c.list));
  r.post("/", wrap(c.create));
  r.patch("/:id", wrap(c.update));
  return r;
};