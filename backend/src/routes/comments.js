const express = require("express");
const { validarNuevoComentario } = require("../validation/comments");
const incidentes = require("../db/incidents");
const comentarios = require("../db/comments");
const { asincrono } = require("../http/errores");
const { validarParamId } = require("../http/parametros");

const router = express.Router();

router.param("id", validarParamId);

router.get(
  "/incidents/:id/comments",
  asincrono(async (req, res) => {
    const id = req.incidenteId;

    // Se comprueba que el incidente exista para poder distinguir
    // "no hay comentarios" de "ese incidente no existe". Sin esto, pedir
    // los comentarios de un incidente inventado devolvería una lista
    // vacia como si fuera normal.
    if (!(await incidentes.obtenerPorId(id))) {
      return res.status(404).json({ error: "Incidente no encontrado" });
    }

    return res.json(await comentarios.listarPorIncidente(id));
  })
);

router.post(
  "/incidents/:id/comments",
  asincrono(async (req, res) => {
    const id = req.incidenteId;

    const { valido, errores, datos } = validarNuevoComentario(req.body || {});

    if (!valido) {
      return res.status(400).json({ error: "Datos inválidos", detalles: errores });
    }

    const incidente = await incidentes.obtenerPorId(id);

    if (!incidente) {
      return res.status(404).json({ error: "Incidente no encontrado" });
    }

    // Un incidente cerrado es un registro histórico: se puede leer, pero
    // ya no se le agregan notas.
    if (incidente.estado === "CERRADO") {
      return res.status(409).json({
        error: "No se pueden agregar comentarios a un incidente CERRADO"
      });
    }

    const creado = await comentarios.crear({ incidente_id: id, ...datos });
    return res.status(201).json(creado);
  })
);

module.exports = router;
