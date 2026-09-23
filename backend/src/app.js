const path = require("path");
const express = require("express");
const cors = require("cors");

function createApp(pool) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true, sistema: "Germa 66" }));
  app.use("/api/auth", require("./routes/auth.routes")(pool));
  app.use("/api/users", require("./routes/users.routes")(pool));
  app.use("/api/auditoria", require("./routes/audit.routes")(pool));

  app.use("/api/inventario", require("./routes/inventario.routes")(pool));

  // Sprint 2 y 3: se montan aquí los demás módulos
  app.use("/api/cyborgs",    require("./routes/cyborgs.routes")(pool));
  app.use("/api/clientes",   require("./routes/clientes.routes")(pool));
  app.use("/api/reportes",   require("./routes/reportes.routes")(pool));
  //app.use("/api/pedidos",    require("./routes/pedidos.routes")(pool));
  //app.use("/api/reportes",   require("./routes/reportes.routes")(pool));

  app.use("/api", (req, res) => res.status(404).json({ error: "Ruta no encontrada." }));
  app.use(express.static(path.join(__dirname, "../../frontend")));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor." });
  });
  return app;
}

module.exports = { createApp };