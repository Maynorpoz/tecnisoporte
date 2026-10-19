const {
  CATEGORIAS,
  PRIORIDADES,
  PRIORIDAD_POR_DEFECTO
} = require("../domain/incidents");

const TITULO_MIN = 5;
const TITULO_MAX = 150;
const DESCRIPCION_MIN = 10;

function esTextoUtil(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

// Valida el cuerpo de un POST /incidents. No toca la base: recibe el
// body y devuelve los errores y los datos ya limpios, asi se puede
// probar sin levantar nada.
function validarNuevoIncidente(body) {
  const errores = [];
  const datos = {};

  if (!esTextoUtil(body.titulo)) {
    errores.push({ campo: "titulo", mensaje: "El titulo es obligatorio" });
  } else {
    const titulo = body.titulo.trim();
    if (titulo.length < TITULO_MIN || titulo.length > TITULO_MAX) {
      errores.push({
        campo: "titulo",
        mensaje: `El titulo debe tener entre ${TITULO_MIN} y ${TITULO_MAX} caracteres`
      });
    } else {
      datos.titulo = titulo;
    }
  }

  if (!esTextoUtil(body.descripcion)) {
    errores.push({ campo: "descripcion", mensaje: "La descripcion es obligatoria" });
  } else {
    const descripcion = body.descripcion.trim();
    if (descripcion.length < DESCRIPCION_MIN) {
      errores.push({
        campo: "descripcion",
        mensaje: `La descripcion debe tener al menos ${DESCRIPCION_MIN} caracteres`
      });
    } else {
      datos.descripcion = descripcion;
    }
  }

  if (!CATEGORIAS.includes(body.categoria)) {
    errores.push({
      campo: "categoria",
      mensaje: `La categoria debe ser una de: ${CATEGORIAS.join(", ")}`
    });
  } else {
    datos.categoria = body.categoria;
  }

  // La prioridad es opcional: si no viene, se usa la de por defecto.
  if (body.prioridad === undefined || body.prioridad === null) {
    datos.prioridad = PRIORIDAD_POR_DEFECTO;
  } else if (!PRIORIDADES.includes(body.prioridad)) {
    errores.push({
      campo: "prioridad",
      mensaje: `La prioridad debe ser una de: ${PRIORIDADES.join(", ")}`
    });
  } else {
    datos.prioridad = body.prioridad;
  }

  if (!Number.isInteger(body.usuario_id) || body.usuario_id < 1) {
    errores.push({
      campo: "usuario_id",
      mensaje: "El usuario_id debe ser un entero positivo"
    });
  } else {
    datos.usuario_id = body.usuario_id;
  }

  return { valido: errores.length === 0, errores, datos };
}

module.exports = { validarNuevoIncidente, TITULO_MIN, TITULO_MAX, DESCRIPCION_MIN };
