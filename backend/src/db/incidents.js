const { pool } = require("./pool");

// El estado inicial lo pone la base con su DEFAULT, y el tecnico queda
// nulo a proposito: asignar es otra operacion, no parte de crear.
const SQL_CREAR = `
  INSERT INTO incidents (titulo, descripcion, categoria, prioridad, usuario_id)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id, titulo, descripcion, categoria, prioridad, estado,
            usuario_id, tecnico_id, creado_en, actualizado_en
`;

// Los nombres vienen con JOIN para que el frontend no tenga que pedir
// cada usuario y cada tecnico por aparte. El de tecnico es LEFT porque
// un incidente en NUEVO todavia no tiene a nadie asignado.
const SELECT_BASE = `
  SELECT i.id, i.titulo, i.descripcion, i.categoria, i.prioridad, i.estado,
         i.usuario_id, u.nombre AS usuario_nombre,
         i.tecnico_id, t.nombre AS tecnico_nombre,
         i.creado_en, i.actualizado_en, i.resuelto_en, i.cerrado_en
  FROM incidents i
  JOIN users u ON u.id = i.usuario_id
  LEFT JOIN technicians t ON t.id = i.tecnico_id
`;

const SQL_LISTAR = `
  ${SELECT_BASE}
  ORDER BY i.creado_en DESC, i.id DESC
  LIMIT $1 OFFSET $2
`;

const SQL_CONTAR = "SELECT count(*)::int AS total FROM incidents";

const SQL_POR_ID = `${SELECT_BASE} WHERE i.id = $1`;

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

async function listar({ page, pageSize }) {
  const offset = (page - 1) * pageSize;

  // Dos consultas: una para la pagina y otra para el total. Se podria
  // resolver con count(*) over(), pero entonces una pagina vacia no
  // devuelve el total y hay que tratarlo aparte igual.
  const [pagina, conteo] = await Promise.all([
    pool.query(SQL_LISTAR, [pageSize, offset]),
    pool.query(SQL_CONTAR)
  ]);

  const total = conteo.rows[0].total;

  return {
    items: pagina.rows,
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
  };
}

async function obtenerPorId(id) {
  const { rows } = await pool.query(SQL_POR_ID, [id]);
  return rows[0] || null;
}

module.exports = { crear, listar, obtenerPorId };
