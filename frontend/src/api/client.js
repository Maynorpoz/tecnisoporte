const BASE = import.meta.env.VITE_API_URL || "http://localhost:3100/api";

// Envuelve fetch para que todo el manejo de errores de la API quede en un
// solo lugar. Si la respuesta trae detalles de validación, los deja
// accesibles en error.detalles para que el formulario los pinte por campo.
async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones
  });

  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }

  if (!respuesta.ok) {
    const error = new Error(cuerpo?.error || `Error ${respuesta.status}`);
    error.status = respuesta.status;
    error.detalles = cuerpo?.detalles || [];
    // El 409 de una transición inválida trae a donde si se puede ir.
    error.transicionesPosibles = cuerpo?.transiciones_posibles || null;
    throw error;
  }

  return cuerpo;
}

export const api = {
  // Los filtros se arman con URLSearchParams y no concatenando, porque
  // cualquier valor con espacios o acentos tiene que ir escapado. Los
  // vacíos no se mandan: un estado="" sería un parámetro más que la API
  // tendría que ignorar y ensucia la URL sin aportar nada.
  listarIncidentes: ({ page = 1, pageSize = 10, filtros = {} } = {}) => {
    const params = new URLSearchParams({ page, pageSize });

    for (const [campo, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== "") {
        params.set(campo, valor);
      }
    }

    return pedir(`/incidents?${params}`);
  },

  obtenerIncidente: (id) => pedir(`/incidents/${id}`),

  crearIncidente: (datos) =>
    pedir("/incidents", { method: "POST", body: JSON.stringify(datos) }),

  asignarTecnico: (id, tecnicoId) =>
    pedir(`/incidents/${id}/asignar`, {
      method: "PATCH",
      body: JSON.stringify({ tecnico_id: tecnicoId })
    }),

  // La nota es opcional salvo al resolver, pero esa regla la aplica el
  // backend. Aquí solo se manda lo que el usuario haya escrito.
  cambiarEstado: (id, estado, nota) =>
    pedir(`/incidents/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado, nota: nota || undefined })
    }),

  listarComentarios: (id) => pedir(`/incidents/${id}/comments`),

  crearComentario: (id, { autor, cuerpo }) =>
    pedir(`/incidents/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ autor, cuerpo })
    }),

  listarUsuarios: () => pedir("/users"),

  listarTecnicos: () => pedir("/technicians")
};

// Estas listas son copia de backend/src/domain/incidents.js. Duplicarlas
// no es gratis: si alguien agrega una categoría allá y se olvida de aquí,
// el formulario y los filtros no la ofrecen aunque la base ya la acepte.
// Lo correcto sería que la API sirviera los catálogos en un endpoint y el
// frontend los pidiera; queda apuntado como deuda.
export const CATEGORIAS = ["HARDWARE", "SOFTWARE", "RED", "ACCESOS", "OTRO"];
export const PRIORIDADES = ["BAJA", "MEDIA", "ALTA", "CRITICA"];
export const ESTADOS = ["NUEVO", "ASIGNADO", "EN_PROCESO", "RESUELTO", "CERRADO"];
