require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT) || 4444,
  jwtSecret: process.env.JWT_SECRET || "germa66proyecto",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "germa66",
  },
  adminEmail: process.env.ADMIN_EMAIL || "germa66@admin.com",
  adminPassword: process.env.ADMIN_PASSWORD || "germa66.",
};
