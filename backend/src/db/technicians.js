const { pool } = require("./pool");

const SQL_LISTAR = `
  SELECT id, nombre, email, especialidad
  FROM technicians
  WHERE activo = true
  ORDER BY nombre
`;

const SQL_EXISTE = "SELECT 1 FROM technicians WHERE id = $1 AND activo = true";

async function listar() {
  const { rows } = await pool.query(SQL_LISTAR);
  return rows;
}

async function existe(id) {
  const { rowCount } = await pool.query(SQL_EXISTE, [id]);
  return rowCount > 0;
}

module.exports = { listar, existe };
