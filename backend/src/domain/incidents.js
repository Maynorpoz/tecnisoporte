// Valores que acepta el dominio. Tienen que coincidir con los tipos
// enumerados de database/01-schema.sql: si se agrega uno aquí, hay que
// agregarlo alla también con un ALTER TYPE.

const CATEGORIAS = ["HARDWARE", "SOFTWARE", "RED", "ACCESOS", "OTRO"];
const PRIORIDADES = ["BAJA", "MEDIA", "ALTA", "CRITICA"];
const ESTADOS = ["NUEVO", "ASIGNADO", "EN_PROCESO", "RESUELTO", "CERRADO"];

const ESTADO_INICIAL = "NUEVO";
const PRIORIDAD_POR_DEFECTO = "MEDIA";

module.exports = {
  CATEGORIAS,
  PRIORIDADES,
  ESTADOS,
  ESTADO_INICIAL,
  PRIORIDAD_POR_DEFECTO
};
