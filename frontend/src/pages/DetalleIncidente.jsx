import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";

function fecha(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("es-GT");
}

// Las etiquetas que ve el usuario. En la API los estados van en mayuscula
// y con guion bajo porque asi estan en el enum de la base.
const ETIQUETA_ESTADO = {
  NUEVO: "Nuevo",
  ASIGNADO: "Asignado",
  EN_PROCESO: "En proceso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado"
};

export default function DetalleIncidente() {
  const { id } = useParams();
  const [incidente, setIncidente] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [tecnicoElegido, setTecnicoElegido] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [accionEnCurso, setAccionEnCurso] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  const cargar = useCallback(async () => {
    const datos = await api.obtenerIncidente(id);
    setIncidente(datos);
    setTecnicoElegido(datos.tecnico_id ? String(datos.tecnico_id) : "");
    return datos;
  }, [id]);

  useEffect(() => {
    let cancelado = false;

    setCargando(true);
    setError(null);

    Promise.all([api.obtenerIncidente(id), api.listarTecnicos()])
      .then(([datos, listaTecnicos]) => {
        if (cancelado) return;
        setIncidente(datos);
        setTecnicos(listaTecnicos);
        setTecnicoElegido(datos.tecnico_id ? String(datos.tecnico_id) : "");
      })
      .catch((e) => {
        if (cancelado) return;
        setError(e.status === 404 ? "Ese incidente no existe." : e.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    // Sin esta bandera, si alguien entra al detalle y se sale antes de
    // que responda la API, se intenta un setState sobre un componente
    // que ya no esta montado.
    return () => {
      cancelado = true;
    };
  }, [id]);

  async function asignar() {
    setAccionEnCurso("asignar");
    setErrorAccion(null);
    try {
      await api.asignarTecnico(id, Number(tecnicoElegido));
      await cargar();
    } catch (e) {
      setErrorAccion(e.detalles?.[0]?.mensaje || e.message);
    } finally {
      setAccionEnCurso(null);
    }
  }

  async function moverA(estado) {
    setAccionEnCurso(estado);
    setErrorAccion(null);
    try {
      await api.cambiarEstado(id, estado);
      await cargar();
    } catch (e) {
      setErrorAccion(e.message);
      // Si el rechazo trae las transiciones validas, se refresca para
      // que los botones reflejen el estado real.
      if (e.transicionesPosibles) await cargar();
    } finally {
      setAccionEnCurso(null);
    }
  }

  if (cargando) return <p className="aviso">Cargando…</p>;
  if (error)
    return (
      <div className="aviso error">
        <p>{error}</p>
        <Link to="/">Volver al listado</Link>
      </div>
    );

  const cerrado = incidente.estado === "CERRADO";
  const transiciones = incidente.transiciones_posibles || [];

  return (
    <section>
      <Link to="/" className="volver">
        ← Volver al listado
      </Link>

      <div className="encabezado-seccion">
        <h1>
          #{incidente.id} {incidente.titulo}
        </h1>
      </div>

      <div className="etiquetas">
        <span className={`etiqueta estado-${incidente.estado.toLowerCase()}`}>
          {ETIQUETA_ESTADO[incidente.estado]}
        </span>
        <span className={`etiqueta prioridad-${incidente.prioridad.toLowerCase()}`}>
          {incidente.prioridad}
        </span>
        <span className="etiqueta">{incidente.categoria}</span>
      </div>

      <p className="descripcion">{incidente.descripcion}</p>

      {errorAccion && <p className="aviso error">{errorAccion}</p>}

      <div className="panel-acciones">
        <div className="accion">
          <h2>Técnico asignado</h2>
          {cerrado ? (
            <p className="vacio">
              {incidente.tecnico_nombre || "sin asignar"} · el incidente está
              cerrado y ya no se puede reasignar
            </p>
          ) : (
            <div className="fila-accion">
              <select
                value={tecnicoElegido}
                onChange={(e) => setTecnicoElegido(e.target.value)}
              >
                <option value="">Selecciona un técnico</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                    {t.especialidad ? ` — ${t.especialidad}` : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={asignar}
                disabled={
                  !tecnicoElegido ||
                  accionEnCurso !== null ||
                  Number(tecnicoElegido) === incidente.tecnico_id
                }
              >
                {accionEnCurso === "asignar" ? "Asignando…" : "Asignar"}
              </button>
            </div>
          )}
        </div>

        <div className="accion">
          <h2>Cambiar estado</h2>
          {transiciones.length === 0 ? (
            <p className="vacio">
              Este incidente está {ETIQUETA_ESTADO[incidente.estado].toLowerCase()}{" "}
              y ya no cambia de estado.
            </p>
          ) : (
            <div className="fila-accion">
              {/* Los botones salen de lo que responde la API, no de una
                  lista escrita aqui. Si cambia una regla en el backend,
                  esto se ajusta solo. */}
              {transiciones.map((estado) => (
                <button
                  key={estado}
                  onClick={() => moverA(estado)}
                  disabled={accionEnCurso !== null}
                >
                  {accionEnCurso === estado
                    ? "Cambiando…"
                    : `Pasar a ${ETIQUETA_ESTADO[estado]}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <dl className="ficha">
        <dt>Reportado por</dt>
        <dd>{incidente.usuario_nombre}</dd>

        <dt>Técnico asignado</dt>
        <dd>{incidente.tecnico_nombre || "sin asignar"}</dd>

        <dt>Creado</dt>
        <dd>{fecha(incidente.creado_en)}</dd>

        <dt>Última actualización</dt>
        <dd>{fecha(incidente.actualizado_en)}</dd>

        <dt>Resuelto</dt>
        <dd>{fecha(incidente.resuelto_en)}</dd>

        <dt>Cerrado</dt>
        <dd>{fecha(incidente.cerrado_en)}</dd>
      </dl>
    </section>
  );
}
