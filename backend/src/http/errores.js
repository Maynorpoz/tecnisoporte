// Express 4 no atrapa los errores de una función async: si la promesa se
// rechaza, la petición se queda colgada o el proceso avisa de un rechazo
// sin manejar. Por eso cada ruta tenía su propio try/catch. Esta envoltura
// manda cualquier error al middleware de abajo, y las rutas ya no tienen
// que repetir el bloque.
function asincrono(ruta) {
  return (req, res, next) => {
    Promise.resolve(ruta(req, res, next)).catch(next);
  };
}

// Va al final de app.js y es el único lugar que responde un 500. El
// detalle del error se queda en el log del servidor; al cliente solo le
// llega un mensaje genérico, para que nunca se filtren nombres de tablas,
// consultas ni rutas del disco.
function manejarErrores(error, req, res, next) {
  // Un cuerpo que no es JSON válido lo rechaza express.json antes de
  // llegar a la ruta. Es un error del cliente, no del servidor, y sin este
  // caso Express respondía una página HTML con el stack trace completo.
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Datos inválidos",
      detalles: [{ campo: "body", mensaje: "El cuerpo no es un JSON válido" }]
    });
  }

  console.error(`Error en ${req.method} ${req.originalUrl}:`, error);

  // Si la respuesta ya empezó a enviarse no se puede cambiar el código de
  // estado. Lo único que queda es dejar que Express corte la conexión.
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({ error: "Error interno del servidor" });
}

module.exports = { asincrono, manejarErrores };
