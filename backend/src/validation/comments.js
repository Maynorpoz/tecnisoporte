const AUTOR_MAX = 120;
const CUERPO_MIN = 10;

function esTextoUtil(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

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

  return { valido: errores.length === 0, errores, datos };
}

// La nota que acompaña un cambio de estado. Es opcional salvo al
// resolver: ahi es el momento en que el técnico sabe como lo arreglo, y
// si no se le pide en ese instante no lo escribe nunca.
function validarNotaDeEstado(nota, nuevoEstado) {
  const obligatoria = nuevoEstado === "RESUELTO";
  const vino = esTextoUtil(nota);

  if (!vino) {
    if (obligatoria) {
      return {
        valido: false,
        errores: [
          {
            campo: "nota",
            mensaje:
              "Al resolver hay que explicar cómo se solucionó el incidente"
          }
        ],
        datos: {}
      };
    }
    return { valido: true, errores: [], datos: { nota: null } };
  }

  if (nota.trim().length < CUERPO_MIN) {
    return {
      valido: false,
      errores: [
        {
          campo: "nota",
          mensaje: `La nota debe tener al menos ${CUERPO_MIN} caracteres`
        }
      ],
      datos: {}
    };
  }

  return { valido: true, errores: [], datos: { nota: nota.trim() } };
}

module.exports = {
  validarNuevoComentario,
  validarNotaDeEstado,
  AUTOR_MAX,
  CUERPO_MIN
};
