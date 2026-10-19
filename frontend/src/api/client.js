const BASE = import.meta.env.VITE_API_URL || "http://localhost:3100/api";

// Envuelve fetch para que todo el manejo de errores de la API quede en un
// solo lugar. Si la respuesta trae detalles de validacion, los deja
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
    throw error;
  }

  return cuerpo;
}

export const api = {
  listarIncidentes: ({ page = 1, pageSize = 10 } = {}) =>
    pedir(`/incidents?page=${page}&pageSize=${pageSize}`),

  obtenerIncidente: (id) => pedir(`/incidents/${id}`),

  crearIncidente: (datos) =>
    pedir("/incidents", { method: "POST", body: JSON.stringify(datos) }),

  listarUsuarios: () => pedir("/users")
};

export const CATEGORIAS = ["HARDWARE", "SOFTWARE", "RED", "ACCESOS", "OTRO"];
export const PRIORIDADES = ["BAJA", "MEDIA", "ALTA", "CRITICA"];
