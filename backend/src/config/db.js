const mysql = require("mysql2/promise");
const env = require("./env");

function createPool() {
  return mysql.createPool({ ...env.db, waitForConnections: true, connectionLimit: 10 });
}

// Ejecuta varias consultas como una sola operación: si alguna falla, se deshacen todas.
// fn recibe una conexión que se usa igual que el pool (los modelos la aceptan tal cual).
async function enTransaccion(pool, fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = { createPool, enTransaccion };
