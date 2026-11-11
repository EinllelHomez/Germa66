const { Router } = require("express");
const { authenticate, wrap } = require("../middleware/auth");

module.exports = (pool) => {
  const c = require("../controllers/pedidos.controller")(pool);
  const r = Router();

  // Todos los roles autenticados pueden usar pedidos.
  r.use(authenticate);
  r.get("/", wrap(c.list));
  r.get("/:id", wrap(c.get));
  r.post("/", wrap(c.create));
  r.post("/:id/items", wrap(c.addItem));
  r.delete("/:id/items/:inventarioId", wrap(c.removeItem));
  r.patch("/:id/estado", wrap(c.cambiarEstado));
  return r;
};
