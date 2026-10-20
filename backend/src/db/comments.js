const { pool } = require("./pool");

const SQL_LISTAR = `
  SELECT id, incidente_id, autor, cuerpo, creado_en
  FROM comments
  WHERE incidente_id = $1
  ORDER BY creado_en ASC, id ASC
`;

const SQL_CREAR = `
  INSERT INTO comments (incidente_id, autor, cuerpo)
  VALUES ($1, $2, $3)
  RETURNING id, incidente_id, autor, cuerpo, creado_en
`;

// Orden ascendente a proposito: una bitacora se lee de arriba hacia
// abajo, como una conversacion, no como una lista de novedades.
async function listarPorIncidente(incidenteId) {
  const { rows } = await pool.query(SQL_LISTAR, [incidenteId]);
  return rows;
}

async function crear({ incidente_id, autor, cuerpo }) {
  const { rows } = await pool.query(SQL_CREAR, [incidente_id, autor, cuerpo]);
  return rows[0];
}

module.exports = { listarPorIncidente, crear, SQL_CREAR };
