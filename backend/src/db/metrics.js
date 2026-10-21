const { pool } = require("./pool");

// Abierto es lo que todavía necesita trabajo de un técnico. RESUELTO no
// cuenta: el técnico ya terminó y solo falta confirmar el cierre, así que
// se reporta aparte para que el jefe de TI vea los dos números.
const ABIERTO = "i.estado IN ('NUEVO', 'ASIGNADO', 'EN_PROCESO')";

const SQL_RESUMEN = `
  SELECT count(*)::int                                              AS total,
         count(*) FILTER (WHERE ${ABIERTO})::int                    AS abiertos,
         count(*) FILTER (WHERE i.estado = 'RESUELTO')::int         AS resueltos,
         count(*) FILTER (WHERE i.estado = 'CERRADO')::int          AS cerrados,
         count(*) FILTER (WHERE ${ABIERTO}
                            AND i.prioridad = 'CRITICA')::int       AS criticos_abiertos,
         count(*) FILTER (WHERE i.tecnico_id IS NULL)::int          AS sin_asignar
  FROM incidents i
`;

// Las distribuciones salen de los tipos enumerados de la base y no de un
// GROUP BY sobre los incidentes. Así una categoría sin incidentes aparece
// con cero en vez de desaparecer de la gráfica, y la lista de categorías
// la decide la base, que es la fuente de verdad.
function sqlDistribucion(columna, tipo) {
  return `
    SELECT v.valor::text                                    AS valor,
           count(i.id)::int                                 AS total,
           count(i.id) FILTER (WHERE ${ABIERTO})::int       AS abiertos
    FROM unnest(enum_range(NULL::${tipo})) AS v(valor)
    LEFT JOIN incidents i ON i.${columna} = v.valor
    GROUP BY v.valor
    ORDER BY v.valor
  `;
}

// Los técnicos activos salen aunque no tengan nada asignado, porque un
// técnico desocupado también es un dato. Uno inactivo solo sale si tiene
// incidentes, para no perder su historial.
const SQL_POR_TECNICO = `
  SELECT t.id,
         t.nombre,
         count(i.id)::int                                   AS total,
         count(i.id) FILTER (WHERE ${ABIERTO})::int         AS abiertos,
         count(i.id) FILTER (WHERE i.estado = 'CERRADO')::int AS cerrados
  FROM technicians t
  LEFT JOIN incidents i ON i.tecnico_id = t.id
  GROUP BY t.id, t.nombre, t.activo
  HAVING t.activo OR count(i.id) > 0
  ORDER BY abiertos DESC, t.nombre
`;

async function obtener() {
  const [resumen, porEstado, porCategoria, porPrioridad, porTecnico] =
    await Promise.all([
      pool.query(SQL_RESUMEN),
      pool.query(sqlDistribucion("estado", "estado_incidente")),
      pool.query(sqlDistribucion("categoria", "categoria_incidente")),
      pool.query(sqlDistribucion("prioridad", "prioridad_incidente")),
      pool.query(SQL_POR_TECNICO)
    ]);

  return {
    resumen: resumen.rows[0],
    por_estado: porEstado.rows,
    por_categoria: porCategoria.rows,
    por_prioridad: porPrioridad.rows,
    por_tecnico: porTecnico.rows
  };
}

module.exports = { obtener };
