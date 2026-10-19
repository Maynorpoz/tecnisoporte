const { ESTADOS } = require("./incidents");

// El flujo es lineal: un incidente avanza de un estado al siguiente y no
// se devuelve. No contemplo reabrir un incidente resuelto porque el
// documento del proyecto describe el flujo en un solo sentido; si se
// necesitara, habria que agregar RESUELTO -> EN_PROCESO aqui y un motivo
// de reapertura en la base.
const TRANSICIONES = {
  NUEVO: ["ASIGNADO", "RESUELTO"],
  ASIGNADO: ["EN_PROCESO"],
  EN_PROCESO: ["RESUELTO"],
  RESUELTO: ["CERRADO"],
  CERRADO: []
};

// Estados en los que el incidente ya no se mueve.
const ESTADOS_FINALES = ["CERRADO"];

function esEstadoValido(estado) {
  return ESTADOS.includes(estado);
}

function siguientesEstados(desde) {
  return TRANSICIONES[desde] || [];
}

// Devuelve el resultado en vez de lanzar, para que la ruta decida que
// codigo HTTP corresponde y el modulo siga siendo probable sin Express.
function puedeTransicionar(desde, hacia) {
  if (!esEstadoValido(desde)) {
    return { permitido: false, motivo: `Estado de origen desconocido: ${desde}` };
  }

  if (!esEstadoValido(hacia)) {
    return {
      permitido: false,
      motivo: `El estado debe ser uno de: ${ESTADOS.join(", ")}`
    };
  }

  if (desde === hacia) {
    return { permitido: false, motivo: `El incidente ya esta en ${hacia}` };
  }

  if (ESTADOS_FINALES.includes(desde)) {
    return {
      permitido: false,
      motivo: `Un incidente ${desde} ya no puede cambiar de estado`
    };
  }

  if (!siguientesEstados(desde).includes(hacia)) {
    const posibles = siguientesEstados(desde).join(", ") || "ninguno";
    return {
      permitido: false,
      motivo: `No se puede pasar de ${desde} a ${hacia}. Desde ${desde} solo se puede ir a: ${posibles}`
    };
  }

  return { permitido: true, motivo: null };
}

// Marcas de tiempo que acompañan a ciertos estados. La base guarda
// resuelto_en y cerrado_en, y es aqui donde se decide cuando se llenan.
function columnaDeFecha(estado) {
  if (estado === "RESUELTO") return "resuelto_en";
  if (estado === "CERRADO") return "cerrado_en";
  return null;
}

module.exports = {
  TRANSICIONES,
  ESTADOS_FINALES,
  esEstadoValido,
  siguientesEstados,
  puedeTransicionar,
  columnaDeFecha
};
