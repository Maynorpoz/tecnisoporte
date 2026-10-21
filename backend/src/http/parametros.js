const { validarId } = require("../validation/incidents");

// Todas las rutas con :id validaban el parámetro igual y respondían el
// mismo 400, copiado en cinco lugares. Express permite registrar esa
// validación una sola vez por router con router.param, y la corre antes
// de cualquier ruta que tenga :id en su camino.
//
// El id ya convertido a número queda en req.incidenteId, que es lo que
// usan las rutas. Así ninguna vuelve a leer req.params.id como texto.
function validarParamId(req, res, next, valor) {
  const id = validarId(valor);

  if (id === null) {
    return res.status(400).json({
      error: "Parámetros inválidos",
      detalles: [{ campo: "id", mensaje: "El id debe ser un entero positivo" }]
    });
  }

  req.incidenteId = id;
  return next();
}

module.exports = { validarParamId };
