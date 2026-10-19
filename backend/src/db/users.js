const { pool } = require("./pool");

const SQL_LISTAR = "SELECT id, nombre, email FROM users ORDER BY nombre";

async function listar() {
  const { rows } = await pool.query(SQL_LISTAR);
  return rows;
}

module.exports = { listar };
