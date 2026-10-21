// Los valores de estado y prioridad viajan en mayúscula y con guion bajo
// porque así están en los tipos enumerados de la base. Lo que ve el
// usuario se traduce aquí, en un solo lugar: estas etiquetas las usan el
// listado, el detalle y la barra de filtros, y tenerlas repetidas en cada
// pantalla era pedir que un día dejaran de coincidir.
//
// Las categorías no están aquí a propósito: son palabras sueltas sin
// acentos ni guiones, así que se muestran tal cual vienen.

export const ETIQUETA_ESTADO = {
  NUEVO: "Nuevo",
  ASIGNADO: "Asignado",
  EN_PROCESO: "En proceso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado"
};

export const ETIQUETA_PRIORIDAD = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica"
};
