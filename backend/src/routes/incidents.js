const express = require("express");
const {
  validarNuevoIncidente,
  validarPaginacion,
  validarId
} = require("../validation/incidents");
const incidentes = require("../db/incidents");
const tecnicos = require("../db/technicians");
const {
  puedeTransicionar,
  siguientesEstados,
  columnaDeFecha
} = require("../domain/estados");

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

router.get("/incidents", async (req, res) => {
  const { valido, errores, datos } = validarPaginacion(req.query || {});

  if (!valido) {
    return res.status(400).json({ error: "Parametros invalidos", detalles: errores });
  }

  try {
    const resultado = await incidentes.listar(datos);
    return res.json(resultado);
  } catch (error) {
    console.error("Error al listar incidentes:", error);
    return res.status(500).json({ error: "No se pudieron listar los incidentes" });
  }
});

router.get("/incidents/:id", async (req, res) => {
  const id = validarId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Parametros invalidos",
      detalles: [{ campo: "id", mensaje: "El id debe ser un entero positivo" }]
    });
  }

  try {
    const incidente = await incidentes.obtenerPorId(id);

    if (!incidente) {
      return res.status(404).json({ error: "Incidente no encontrado" });
    }

    // Se incluye a donde puede moverse el incidente para que el frontend
    // no tenga que repetir la maquina de estados. Si manana cambia una
    // regla aqui, la interfaz se ajusta sola.
    return res.json({
      ...incidente,
      transiciones_posibles: siguientesEstados(incidente.estado)
    });
  } catch (error) {
    console.error("Error al obtener incidente:", error);
    return res.status(500).json({ error: "No se pudo obtener el incidente" });
  }
});

router.patch("/incidents/:id/asignar", async (req, res) => {
  const id = validarId(req.params.id);
  const tecnicoId = validarId((req.body || {}).tecnico_id);

  if (id === null) {
    return res.status(400).json({
      error: "Parametros invalidos",
      detalles: [{ campo: "id", mensaje: "El id debe ser un entero positivo" }]
    });
  }

  if (tecnicoId === null) {
    return res.status(400).json({
      error: "Datos invalidos",
      detalles: [
        { campo: "tecnico_id", mensaje: "El tecnico_id debe ser un entero positivo" }
      ]
    });
  }

  try {
    const incidente = await incidentes.obtenerPorId(id);

    if (!incidente) {
      return res.status(404).json({ error: "Incidente no encontrado" });
    }

    if (incidente.estado === "CERRADO") {
      return res.status(409).json({
        error: "No se puede asignar un tecnico a un incidente CERRADO"
      });
    }

    if (!(await tecnicos.existe(tecnicoId))) {
      return res.status(400).json({
        error: "Datos invalidos",
        detalles: [
          { campo: "tecnico_id", mensaje: "El tecnico no existe o esta inactivo" }
        ]
      });
    }

    return res.json(await incidentes.asignarTecnico(id, tecnicoId));
  } catch (error) {
    console.error("Error al asignar tecnico:", error);
    return res.status(500).json({ error: "No se pudo asignar el tecnico" });
  }
});

router.patch("/incidents/:id/estado", async (req, res) => {
  const id = validarId(req.params.id);
  const nuevoEstado = (req.body || {}).estado;

  if (id === null) {
    return res.status(400).json({
      error: "Parametros invalidos",
      detalles: [{ campo: "id", mensaje: "El id debe ser un entero positivo" }]
    });
  }

  try {
    const incidente = await incidentes.obtenerPorId(id);

    if (!incidente) {
      return res.status(404).json({ error: "Incidente no encontrado" });
    }

    const { permitido, motivo } = puedeTransicionar(incidente.estado, nuevoEstado);

    if (!permitido) {
      // 409 y no 400: el dato puede ser un estado valido, lo que no es
      // valido es el salto desde donde esta el incidente ahora.
      return res.status(409).json({
        error: motivo,
        estado_actual: incidente.estado,
        transiciones_posibles: siguientesEstados(incidente.estado)
      });
    }

    const actualizado = await incidentes.cambiarEstado(
      id,
      nuevoEstado,
      columnaDeFecha(nuevoEstado)
    );

    return res.json(actualizado);
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    return res.status(500).json({ error: "No se pudo cambiar el estado" });
  }
});

module.exports = router;
