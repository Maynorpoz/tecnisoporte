const { pool } = require("./pool");

// El estado inicial lo pone la base con su DEFAULT, y el tecnico queda
// nulo a proposito: asignar es otra operacion, no parte de crear.
const SQL_CREAR = `
  INSERT INTO incidents (titulo, descripcion, categoria, prioridad, usuario_id)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id, titulo, descripcion, categoria, prioridad, estado,
            usuario_id, tecnico_id, creado_en, actualizado_en
`;

async function crear({ titulo, descripcion, categoria, prioridad, usuario_id }) {
  const { rows } = await pool.query(SQL_CREAR, [
    titulo,
    descripcion,
    categoria,
    prioridad,
    usuario_id
  ]);
  return rows[0];
}

module.exports = { crear };
