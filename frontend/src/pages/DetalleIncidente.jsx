import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";

function fecha(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("es-GT");
}

export default function DetalleIncidente() {
  const { id } = useParams();
  const [incidente, setIncidente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCargando(true);
    setError(null);

    api
      .obtenerIncidente(id)
      .then(setIncidente)
      .catch((e) =>
        setError(e.status === 404 ? "Ese incidente no existe." : e.message)
      )
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p className="aviso">Cargando…</p>;
  if (error)
    return (
      <div className="aviso error">
        <p>{error}</p>
        <Link to="/">Volver al listado</Link>
      </div>
    );

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
          {incidente.estado}
        </span>
        <span className={`etiqueta prioridad-${incidente.prioridad.toLowerCase()}`}>
          {incidente.prioridad}
        </span>
        <span className="etiqueta">{incidente.categoria}</span>
      </div>

      <p className="descripcion">{incidente.descripcion}</p>

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
