const { Router } = require("express");
const { authenticate, wrap } = require("../middleware/auth");

module.exports = (pool) => {
  const c = require("../controllers/auth.controller")(pool);
  const r = Router();
  r.post("/login", wrap(c.login));
  r.get("/me", authenticate, c.me);
  r.post("/logout", authenticate, wrap(c.logout));
  return r;
};
