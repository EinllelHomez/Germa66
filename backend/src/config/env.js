require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT) || 4444,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-no-usar-en-produccion",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "germa66",
  },
  adminEmail: process.env.ADMIN_EMAIL || "admin@germa66.local",
  adminPassword: process.env.ADMIN_PASSWORD || "cambia-esta-clave",
};