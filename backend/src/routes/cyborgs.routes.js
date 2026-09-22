const { Router } = require("express");
const { authenticate, authorize, wrap } = require("../middleware/auth");

module.exports = (pool) => {
  const c = require("../controllers/cyborgs.controller")(pool);
  const r = Router();
  r.use(authenticate, authorize("Administrador", "Operativo"));
  r.get("/", wrap(c.list));
  r.post("/", wrap(c.create));
  r.patch("/:id", wrap(c.update));
  r.get("/:id/equipamiento", wrap(c.listEquipamiento));
  r.post("/:id/equipamiento", wrap(c.assignEquipamiento));
  r.delete("/:id/equipamiento/:equipId", wrap(c.unassignEquipamiento));
  return r;
};