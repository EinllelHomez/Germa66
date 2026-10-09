const { Router } = require("express");
const { authenticate, wrap } = require("../middleware/auth");

module.exports = () => {
  const c = require("../controllers/catalogos.controller")();
  const r = Router();
  r.get("/", authenticate, wrap(c.get));
  return r;
};
