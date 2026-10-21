import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { api } from "../api/client.js";

// Las tarjetas que tienen un filtro exacto en el listado llevan a él.
// "Abiertos" y "Críticos abiertos" no lo tienen, porque abierto son tres
// estados y el listado filtra por uno solo; ahí un enlace mostraría algo
// distinto a lo que dice la tarjeta, así que se quedan sin enlace.
const TARJETAS = [
  { campo: "abiertos", titulo: "Abiertos", nota: "Nuevos, asignados o en proceso" },
  {
    campo: "criticos_abiertos",
    titulo: "Críticos abiertos",
    nota: "Prioridad crítica sin resolver",
    alerta: true
  },
  {
    campo: "sin_asignar",
    titulo: "Sin asignar",
    nota: "Esperan un técnico",
    enlace: "/?tecnico_id=ninguno"
  },
  {
    campo: "resueltos",
    titulo: "Por cerrar",
    nota: "Resueltos, falta confirmar",
    enlace: "/?estado=RESUELTO"
  },
  { campo: "cerrados", titulo: "Cerrados", enlace: "/?estado=CERRADO" },
  { campo: "total", titulo: "Total", enlace: "/" }
];

const COLOR_ABIERTOS = "#0052cc";
const COLOR_ATENDIDOS = "#c1c7d0";

function Tarjeta({ titulo, valor, nota, enlace, alerta }) {
  const clase = `tarjeta${alerta && valor > 0 ? " tarjeta-alerta" : ""}`;
  const contenido = (
    <>
      <span className="tarjeta-titulo">{titulo}</span>
      <strong className="tarjeta-valor">{valor}</strong>
      {nota && <span className="tarjeta-nota">{nota}</span>}
    </>
  );

  return enlace ? (
    <Link to={enlace} className={clase}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

export default function Dashboard() {
  const navegar = useNavigate();
  const [metricas, setMetricas] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    api
      .obtenerMetricas()
      .then((m) => {
        if (!cancelado) setMetricas(m);
      })
      .catch((e) => {
        if (!cancelado) setError(e.message);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  if (error) return <p className="aviso error">No se pudo cargar: {error}</p>;
  if (!metricas) return <p className="aviso">Cargando indicadores…</p>;

  // La gráfica apila lo abierto sobre lo ya atendido, así cada barra
  // muestra a la vez el volumen de la categoría y cuánto sigue pendiente.
  const porCategoria = metricas.por_categoria.map((c) => ({
    categoria: c.valor,
    Abiertos: c.abiertos,
    Atendidos: c.total - c.abiertos
  }));

  return (
    <section>
      <div className="encabezado-seccion">
        <h1>Dashboard</h1>
        <span className="conteo">Calculado al momento de abrir esta pantalla</span>
      </div>

      <div className="tarjetas">
        {TARJETAS.map((t) => (
          <Tarjeta key={t.campo} {...t} valor={metricas.resumen[t.campo]} />
        ))}
      </div>

      <div className="panel">
        <h2>Incidentes por categoría</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={porCategoria}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            onClick={(e) => {
              // Clic en una barra lleva al listado filtrado por esa
              // categoría, usando los mismos filtros de la URL.
              const categoria = e?.activeLabel;
              if (categoria) navegar(`/?categoria=${categoria}`);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="categoria" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: "rgba(0, 82, 204, 0.06)" }} />
            <Legend />
            <Bar dataKey="Abiertos" stackId="a" fill={COLOR_ABIERTOS} cursor="pointer" />
            <Bar dataKey="Atendidos" stackId="a" fill={COLOR_ATENDIDOS} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <h2>Carga por técnico</h2>
        {metricas.por_tecnico.length === 0 ? (
          <p className="vacio">No hay técnicos activos.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Técnico</th>
                <th>Abiertos</th>
                <th>Cerrados</th>
                <th>Total asignados</th>
              </tr>
            </thead>
            <tbody>
              {metricas.por_tecnico.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/?tecnico_id=${t.id}`}>{t.nombre}</Link>
                  </td>
                  <td>{t.abiertos}</td>
                  <td>{t.cerrados}</td>
                  <td>{t.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
