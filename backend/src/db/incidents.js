const { pool } = require("./pool");

// El estado inicial lo pone la base con su DEFAULT, y el técnico queda
// nulo a proposito: asignar es otra operación, no parte de crear.
const SQL_CREAR = `
  INSERT INTO incidents (titulo, descripcion, categoria, prioridad, usuario_id)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id, titulo, descripcion, categoria, prioridad, estado,
            usuario_id, tecnico_id, creado_en, actualizado_en
`;

// Los nombres vienen con JOIN para que el frontend no tenga que pedir
// cada usuario y cada técnico por aparte. El de técnico es LEFT porque
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

  // Dos consultas: una para la pagina y otra para el total. Se podría
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

// Asignar implica mover el incidente a ASIGNADO cuando venia de NUEVO.
// La restriccion de la base exige que todo lo que pase de NUEVO tenga
// técnico, así que las dos cosas van en la misma sentencia y no pueden
// quedar a medias.
const SQL_ASIGNAR = `
  UPDATE incidents
  SET tecnico_id = $2,
      estado = CASE WHEN estado = 'NUEVO' THEN 'ASIGNADO'::estado_incidente ELSE estado END
  WHERE id = $1
  RETURNING id
`;

async function asignarTecnico(id, tecnicoId) {
  const { rowCount } = await pool.query(SQL_ASIGNAR, [id, tecnicoId]);
  return rowCount > 0 ? obtenerPorId(id) : null;
}

// La columna de fecha se arma aquí y no viene del cliente. El dominio
// decide cual toca según el estado, y solo puede devolver resuelto_en,
// cerrado_en o nada, así que no hay forma de inyectar un nombre
// arbitrario en el SQL.
// Si viene nota, el cambio de estado y el comentario van en la misma
// transaccion. Separados, un fallo entre los dos dejaria un incidente
// RESUELTO sin la explicacion que lo justifica, que es justo lo que la
// nota obligatoria pretende evitar.
async function cambiarEstado(id, nuevoEstado, columnaFecha, nota = null) {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const sql = `
      UPDATE incidents
      SET estado = $2::estado_incidente
          ${columnaFecha ? `, ${columnaFecha} = now()` : ""}
      WHERE id = $1
      RETURNING id
    `;

    const { rowCount } = await cliente.query(sql, [id, nuevoEstado]);

    if (rowCount === 0) {
      await cliente.query("ROLLBACK");
      return null;
    }

    if (nota) {
      await cliente.query(
        "INSERT INTO comments (incidente_id, autor, cuerpo) VALUES ($1, $2, $3)",
        [id, nota.autor, nota.cuerpo]
      );
    }

    await cliente.query("COMMIT");
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }

  return obtenerPorId(id);
}

module.exports = { crear, listar, obtenerPorId, asignarTecnico, cambiarEstado };
