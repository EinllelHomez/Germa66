const env = require("./config/env");
const { createPool } = require("./db/pool");
const { initDatabase } = require("./db/init");
const { createApp } = require("./app");

(async () => {
  if (env.jwtSecret.startsWith("dev-secret")) console.warn("Aviso: define JWT_SECRET en .env antes de desplegar.");
  const pool = createPool();
  await initDatabase(pool);
  createApp(pool).listen(env.port, () => console.log("Germa 66 en http://localhost:" + env.port));
})().catch((e) => { console.error("No se pudo iniciar:", e.message); process.exit(1); });
