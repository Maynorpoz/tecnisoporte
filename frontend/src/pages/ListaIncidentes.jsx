import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

const PAGE_SIZE = 10;

export default function ListaIncidentes() {
  const [datos, setDatos] = useState(null);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError(null);

    api
      .listarIncidentes({ page, pageSize: PAGE_SIZE })
      .then((r) => {
        if (!cancelado) setDatos(r);
      })
      .catch((e) => {
        if (!cancelado) setError(e.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [page]);

  if (cargando) return <p className="aviso">Cargando incidentes…</p>;
  if (error) return <p className="aviso error">No se pudo cargar: {error}</p>;
  if (!datos || datos.total === 0)
    return <p className="aviso">Todavía no hay incidentes reportados.</p>;

  return (
    <section>
      <div className="encabezado-seccion">
        <h1>Incidentes</h1>
        <span className="conteo">{datos.total} en total</span>
      </div>

      <table className="tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>Título</th>
            <th>Categoría</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Técnico</th>
          </tr>
        </thead>
        <tbody>
          {datos.items.map((i) => (
            <tr key={i.id}>
              <td>{i.id}</td>
              <td>
                <Link to={`/incidentes/${i.id}`}>{i.titulo}</Link>
              </td>
              <td>{i.categoria}</td>
              <td>
                <span className={`etiqueta prioridad-${i.prioridad.toLowerCase()}`}>
                  {i.prioridad}
                </span>
              </td>
              <td>
                <span className={`etiqueta estado-${i.estado.toLowerCase()}`}>
                  {i.estado}
                </span>
              </td>
              <td>{i.tecnico_nombre || <em className="vacio">sin asignar</em>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {datos.totalPages > 1 && (
        <div className="paginador">
          <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
            Anterior
          </button>
          <span>
            Página {datos.page} de {datos.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= datos.totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
