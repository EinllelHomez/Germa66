const catalogos = require("../domain/catalogos");

module.exports = () => ({

  async get(req, res) {
    res.json(catalogos);
  },
});
