const catalogos = require("../domain/catalogos");

module.exports = () => ({
  // El frontend arma sus selectores con estas listas, así nunca se desincroniza del backend.
  async get(req, res) {
    res.json(catalogos);
  },
});
