const express = require("express");
const { validarNuevoIncidente } = require("../validation/incidents");
const incidentes = require("../db/incidents");

const router = express.Router();

// Codigo de Postgres para violacion de llave foranea. Lo usamos para
// distinguir "mandaste un usuario_id que no existe" de un error real.
const FK_VIOLATION = "23503";

router.post("/incidents", async (req, res) => {
  const { valido, errores, datos } = validarNuevoIncidente(req.body || {});

  if (!valido) {
    return res.status(400).json({ error: "Datos invalidos", detalles: errores });
  }

  try {
    const incidente = await incidentes.crear(datos);
    return res.status(201).json(incidente);
  } catch (error) {
    if (error.code === FK_VIOLATION) {
      return res.status(400).json({
        error: "Datos invalidos",
        detalles: [{ campo: "usuario_id", mensaje: "El usuario no existe" }]
      });
    }

    console.error("Error al crear incidente:", error);
    return res.status(500).json({ error: "No se pudo crear el incidente" });
  }
});

module.exports = router;
