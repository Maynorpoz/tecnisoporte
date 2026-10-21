const { esTextoUtil, resultado } = require("./comun");

const AUTOR_MAX = 120;
const CUERPO_MIN = 10;

function validarNuevoComentario(body) {
  const errores = [];
  const datos = {};

  if (!esTextoUtil(body.autor)) {
    errores.push({ campo: "autor", mensaje: "El autor es obligatorio" });
  } else if (body.autor.trim().length > AUTOR_MAX) {
    errores.push({
      campo: "autor",
      mensaje: `El autor no puede pasar de ${AUTOR_MAX} caracteres`
    });
  } else {
    datos.autor = body.autor.trim();
  }

  if (!esTextoUtil(body.cuerpo)) {
    errores.push({ campo: "cuerpo", mensaje: "El comentario no puede ir vacío" });
  } else if (body.cuerpo.trim().length < CUERPO_MIN) {
    errores.push({
      campo: "cuerpo",
      mensaje: `El comentario debe tener al menos ${CUERPO_MIN} caracteres`
    });
  } else {
    datos.cuerpo = body.cuerpo.trim();
  }

  return resultado(errores, datos);
}

// La nota que acompaña un cambio de estado. Es opcional salvo al
// resolver: ahi es el momento en que el técnico sabe como lo arreglo, y
// si no se le pide en ese instante no lo escribe nunca.
//
// Tiene la misma forma que los demás validadores, acumulando en una lista
// aunque hoy valide un solo campo. Antes cortaba en el primer error con
// tres return distintos, y agregarle una regla obligaba a reescribirla.
function validarNotaDeEstado(nota, nuevoEstado) {
  const errores = [];
  const datos = { nota: null };

  if (!esTextoUtil(nota)) {
    if (nuevoEstado === "RESUELTO") {
      errores.push({
        campo: "nota",
        mensaje: "Al resolver hay que explicar cómo se solucionó el incidente"
      });
    }
  } else if (nota.trim().length < CUERPO_MIN) {
    errores.push({
      campo: "nota",
      mensaje: `La nota debe tener al menos ${CUERPO_MIN} caracteres`
    });
  } else {
    datos.nota = nota.trim();
  }

  return resultado(errores, datos);
}

module.exports = {
  validarNuevoComentario,
  validarNotaDeEstado,
  AUTOR_MAX,
  CUERPO_MIN
};
