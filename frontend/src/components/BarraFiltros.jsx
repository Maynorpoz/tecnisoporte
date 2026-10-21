import { CATEGORIAS, PRIORIDADES, ESTADOS } from "../api/client.js";
import { ETIQUETA_ESTADO, ETIQUETA_PRIORIDAD } from "../domain/etiquetas.js";

// La barra no guarda nada: recibe los valores que ya vienen de la URL y
// avisa hacia arriba cuando cambia alguno. Así el listado sigue siendo el
// único que decide qué se pide a la API, y este componente se puede mirar
// sin pensar en de dónde salieron los datos.
export default function BarraFiltros({
  valores,
  tecnicos,
  onCambiar,
  onLimpiar,
  hayFiltros
}) {
  // El id del técnico llega de la URL como texto y las opciones lo pintan
  // desde un número, así que la comparación va sobre cadenas.
  const tecnicoElegido = valores.tecnico_id || "";
  const tecnicoFueraDeLista =
    tecnicoElegido !== "" &&
    tecnicoElegido !== "ninguno" &&
    !tecnicos.some((t) => String(t.id) === tecnicoElegido);

  return (
    <div className="barra-filtros">
      <label>
        Estado
        <select
          value={valores.estado || ""}
          onChange={(e) => onCambiar("estado", e.target.value)}
        >
          <option value="">Todos</option>
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {ETIQUETA_ESTADO[estado]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Prioridad
        <select
          value={valores.prioridad || ""}
          onChange={(e) => onCambiar("prioridad", e.target.value)}
        >
          <option value="">Todas</option>
          {PRIORIDADES.map((prioridad) => (
            <option key={prioridad} value={prioridad}>
              {ETIQUETA_PRIORIDAD[prioridad]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Categoría
        <select
          value={valores.categoria || ""}
          onChange={(e) => onCambiar("categoria", e.target.value)}
        >
          <option value="">Todas</option>
          {CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>
      </label>

      <label>
        Técnico
        <select
          value={tecnicoElegido}
          onChange={(e) => onCambiar("tecnico_id", e.target.value)}
        >
          <option value="">Todos</option>
          {/* La API entiende la palabra ninguno para los que no tienen a
              nadie asignado. Es la vista que de verdad sirve para repartir
              trabajo, así que va arriba y no al final de la lista. */}
          <option value="ninguno">Sin asignar</option>

          {/* Si la URL ya traía un técnico pero la lista todavía no llegó,
              el select se vería en "Todos" mientras el filtro sí está
              aplicado. Esta opción temporal evita esa contradicción. */}
          {tecnicoFueraDeLista && (
            <option value={tecnicoElegido}>Técnico #{tecnicoElegido}</option>
          )}

          {tecnicos.map((tecnico) => (
            <option key={tecnico.id} value={tecnico.id}>
              {tecnico.nombre}
            </option>
          ))}
        </select>
      </label>

      <button type="button" onClick={onLimpiar} disabled={!hayFiltros}>
        Limpiar filtros
      </button>
    </div>
  );
}
