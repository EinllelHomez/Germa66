const mysql = require("mysql2/promise");
const env = require("../config/env");

function createPool() {
  return mysql.createPool({ ...env.db, waitForConnections: true, connectionLimit: 10 });
}

module.exports = { createPool };
