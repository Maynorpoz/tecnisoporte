const express = require("express");
const { validarId } = require("../validation/incidents");
const { validarNuevoComentario } = require("../validation/comments");
const incidentes = require("../db/incidents");
const comentarios = require("../db/comments");

const router = express.Router();

router.get("/incidents/:id/comments", async (req, res) => {
  const id = validarId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Parametros invalidos",
      detalles: [{ campo: "id", mensaje: "El id debe ser un entero positivo" }]
    });
  }

  try {
    // Se comprueba que el incidente exista para poder distinguir
    // "no hay comentarios" de "ese incidente no existe". Sin esto, pedir
    // los comentarios de un incidente inventado devolveria una lista
    // vacia como si fuera normal.
    if (!(await incidentes.obtenerPorId(id))) {
      return res.status(404).json({ error: "Incidente no encontrado" });
    }

    return res.json(await comentarios.listarPorIncidente(id));
  } catch (error) {
    console.error("Error al listar comentarios:", error);
    return res.status(500).json({ error: "No se pudieron listar los comentarios" });
  }
});

router.post("/incidents/:id/comments", async (req, res) => {
  const id = validarId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Parametros invalidos",
      detalles: [{ campo: "id", mensaje: "El id debe ser un entero positivo" }]
    });
  }

  const { valido, errores, datos } = validarNuevoComentario(req.body || {});

  if (!valido) {
    return res.status(400).json({ error: "Datos invalidos", detalles: errores });
  }

  try {
    const incidente = await incidentes.obtenerPorId(id);

    if (!incidente) {
      return res.status(404).json({ error: "Incidente no encontrado" });
    }

    // Un incidente cerrado es un registro historico: se puede leer, pero
    // ya no se le agregan notas.
    if (incidente.estado === "CERRADO") {
      return res.status(409).json({
        error: "No se pueden agregar comentarios a un incidente CERRADO"
      });
    }

    const creado = await comentarios.crear({ incidente_id: id, ...datos });
    return res.status(201).json(creado);
  } catch (error) {
    console.error("Error al crear comentario:", error);
    return res.status(500).json({ error: "No se pudo crear el comentario" });
  }
});

module.exports = router;
