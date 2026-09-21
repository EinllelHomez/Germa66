const { Router } = require("express");
const { authenticate, authorize, wrap } = require("../middleware/auth");

module.exports = (pool) => {
  const c = require("../controllers/audit.controller")(pool);
  const r = Router();
  r.get("/", authenticate, authorize("Administrador"), wrap(c.list));
  return r;
};
