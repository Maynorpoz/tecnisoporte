import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import BarraFiltros from "../components/BarraFiltros.jsx";
import { ETIQUETA_ESTADO, ETIQUETA_PRIORIDAD } from "../domain/etiquetas.js";

const PAGE_SIZE = 10;

// Los nombres van tal cual los espera la API para no tener que traducir
// entre lo que dice la URL y lo que se manda en la consulta.
const CAMPOS_FILTRO = ["estado", "prioridad", "categoria", "tecnico_id"];

// Todo el estado del listado vive en la URL y no en el componente. Cuando
// escribí la paginación dejé anotado que tenerla en un useState era un
// problema: entrabas a un incidente, le dabas atrás y volvías a la página
// 1. Con los filtros habría sido peor, porque también se perderían. Así
// la pantalla se puede compartir por enlace y el botón de atrás funciona
// como cualquiera espera.
//
// Lo que no previne al hacer el cambio es que la URL deja de ser algo que
// solo escribe esta pantalla: cualquiera puede pegar una dirección a
// mano. Eso abre dos casos que antes no existían y que se tratan más
// abajo, el de una página que no existe y el de un filtro inválido.
export default function ListaIncidentes() {
  const [params, setParams] = useSearchParams();
  const [datos, setDatos] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Un page que no sea un número cae en 1. La API también lo rechazaría,
  // pero pintar un error por una URL mal escrita a mano es peor que
  // mostrar la primera página.
  const page = Number(params.get("page")) || 1;

  const filtros = {};
  for (const campo of CAMPOS_FILTRO) {
    const valor = params.get(campo);
    if (valor) filtros[campo] = valor;
  }

  const hayFiltros = Object.keys(filtros).length > 0;

  // La dependencia del efecto es la cadena de la URL, no el objeto de
  // filtros: ese se construye en cada render y sería distinto cada vez,
  // así que el efecto no pararía de dispararse. Vale porque page y
  // filtros salen los dos de params, así que cambian cuando cambia esto.
  const consulta = params.toString();

  // Una página más allá de la última devuelve la lista vacía con el total
  // correcto, no un error. Sin esto la tabla quedaba en blanco y el
  // paginador decía "Página 99 de 2".
  const fueraDeRango =
    datos !== null && datos.totalPages > 0 && page > datos.totalPages;

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError(null);

    api
      .listarIncidentes({ page, pageSize: PAGE_SIZE, filtros })
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
  }, [consulta]);

  // Los técnicos se piden una sola vez: la lista no cambia mientras uno
  // navega entre páginas. Si falla, la barra sigue sirviendo sin ese
  // select en lugar de tumbar toda la pantalla.
  useEffect(() => {
    let cancelado = false;

    api
      .listarTecnicos()
      .then((lista) => {
        if (!cancelado) setTecnicos(lista);
      })
      .catch(() => {
        if (!cancelado) setTecnicos([]);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // La URL se corrige a la última página real. Va con replace para no
  // dejar la dirección inválida en el historial: si se metiera con push,
  // el botón de atrás regresaría a la página que no existe y el efecto
  // volvería a corregirla, dejando el historial inservible.
  useEffect(() => {
    if (!fueraDeRango) return;

    const siguiente = new URLSearchParams(params);
    siguiente.set("page", String(datos.totalPages));
    setParams(siguiente, { replace: true });
  }, [fueraDeRango]);

  // Cambiar un filtro devuelve a la página 1. Sin esto, alguien que está
  // en la página 3 y filtra por CRITICA cae en una página que ya no
  // existe y ve la tabla vacía aunque sí haya resultados.
  function cambiarFiltro(campo, valor) {
    const siguiente = new URLSearchParams(params);

    if (valor) siguiente.set(campo, valor);
    else siguiente.delete(campo);

    siguiente.delete("page");
    setParams(siguiente);
  }

  function limpiarFiltros() {
    setParams(new URLSearchParams());
  }

  // La página 1 no se escribe en la URL. Es el valor por defecto, y
  // dejarlo fuera hace que la dirección del listado sin filtrar vuelva a
  // ser limpia en cuanto uno regresa al principio.
  function irAPagina(numero) {
    const siguiente = new URLSearchParams(params);

    if (numero <= 1) siguiente.delete("page");
    else siguiente.set("page", String(numero));

    setParams(siguiente);
  }

  // La barra se esconde en un solo caso: cuando la base está vacía de
  // verdad, que es total 0 sin ningún filtro puesto. En los demás tiene
  // que quedarse, y eso incluye el error. Un filtro inválido pegado en la
  // URL devuelve 400, y si la barra desapareciera no habría manera de
  // corregirlo salvo editar la dirección a mano.
  const sistemaVacio =
    !error && datos !== null && datos.total === 0 && !hayFiltros;
  const primeraCarga = cargando && datos === null && !error;

  if (primeraCarga) return <p className="aviso">Cargando incidentes…</p>;

  return (
    <section>
      <div className="encabezado-seccion">
        <h1>Incidentes</h1>
        {!error && datos && (
          <span className="conteo">
            {hayFiltros
              ? `${datos.total} coinciden con los filtros`
              : `${datos.total} en total`}
          </span>
        )}
      </div>

      {!sistemaVacio && (
        <BarraFiltros
          valores={filtros}
          tecnicos={tecnicos}
          onCambiar={cambiarFiltro}
          onLimpiar={limpiarFiltros}
          hayFiltros={hayFiltros}
        />
      )}

      {error && <p className="aviso error">No se pudo cargar: {error}</p>}

      {!error && datos && datos.total === 0 && (
        <p className="aviso">
          {hayFiltros
            ? "Ningún incidente coincide con esos filtros."
            : "Todavía no hay incidentes reportados."}
        </p>
      )}

      {!error && datos && datos.total > 0 && datos.items.length === 0 && (
        <p className="aviso">Esa página no existe; regresando a la última.</p>
      )}

      {!error && datos && datos.items.length > 0 && (
        <>
          {/* Al cambiar de filtro o de página la tabla anterior se queda a
              la vista, solo atenuada. Reemplazarla por un "Cargando" hacía
              que la barra de filtros brincara de sitio en cada clic. */}
          <table className={cargando ? "tabla atenuada" : "tabla"}>
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
                      {ETIQUETA_PRIORIDAD[i.prioridad]}
                    </span>
                  </td>
                  <td>
                    <span className={`etiqueta estado-${i.estado.toLowerCase()}`}>
                      {ETIQUETA_ESTADO[i.estado]}
                    </span>
                  </td>
                  <td>{i.tecnico_nombre || <em className="vacio">sin asignar</em>}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {datos.totalPages > 1 && (
            <div className="paginador">
              <button onClick={() => irAPagina(page - 1)} disabled={page <= 1}>
                Anterior
              </button>
              <span>
                Página {datos.page} de {datos.totalPages}
              </span>
              <button
                onClick={() => irAPagina(page + 1)}
                disabled={page >= datos.totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
