const express = require("express");
const {
  validarNuevoIncidente,
  validarPaginacion,
  validarFiltros,
  validarId
} = require("../validation/incidents");
const { validarNotaDeEstado } = require("../validation/comments");
const incidentes = require("../db/incidents");
const tecnicos = require("../db/technicians");
const {
  puedeTransicionar,
  siguientesEstados,
  columnaDeFecha
} = require("../domain/estados");
const { asincrono } = require("../http/errores");

const router = express.Router();

// Código de Postgres para violacion de llave foranea. Lo usamos para
// distinguir "mandaste un usuario_id que no existe" de un error real.
const FK_VIOLATION = "23503";

router.post(
  "/incidents",
  asincrono(async (req, res) => {
    const { valido, errores, datos } = validarNuevoIncidente(req.body || {});

    if (!valido) {
      return res.status(400).json({ error: "Datos inválidos", detalles: errores });
    }

    // Este es el único try/catch que queda en las rutas, y no es para el
    // 500. Un usuario_id inexistente lo descubre la base con la llave
    // foránea, y eso es un error del cliente que hay que traducir a 400.
    // Cualquier otra falla sigue de largo al middleware de errores.
    try {
      const incidente = await incidentes.crear(datos);
      return res.status(201).json(incidente);
    } catch (error) {
      if (error.code === FK_VIOLATION) {
        return res.status(400).json({
          error: "Datos inválidos",
          detalles: [{ campo: "usuario_id", mensaje: "El usuario no existe" }]
        });
      }
      throw error;
    }
  })
);

router.get(
  "/incidents",
  asincrono(async (req, res) => {
    const paginacion = validarPaginacion(req.query || {});
    const filtros = validarFiltros(req.query || {});

    // Se juntan los errores de los dos para que una petición con varios
    // parámetros malos los reporte todos de una vez y no de uno en uno.
    const errores = [...paginacion.errores, ...filtros.errores];

    if (errores.length > 0) {
      return res.status(400).json({ error: "Parámetros inválidos", detalles: errores });
    }

    const resultado = await incidentes.listar({
      ...paginacion.datos,
      filtros: filtros.datos
    });
    return res.json(resultado);
  })
);

router.get(
  "/incidents/:id",
  asincrono(async (req, res) => {
    const id = validarId(req.params.id);

    if (id === null) {
      return res.status(400).json({
        error: "Parámetros inválidos",
        detalles: [{ campo: "id", mensaje: "El id debe ser un entero positivo" }]
      });
    }

    const incidente = await incidentes.obtenerPorId(id);

    if (!incidente) {
      return res.status(404).json({ error: "Incidente no encontrado" });
    }

    // Se incluye a donde puede moverse el incidente para que el frontend
    // no tenga que repetir la máquina de estados. Si mañana cambia una
    // regla aquí, la interfaz se ajusta sola.
    return res.json({
      ...incidente,
      transiciones_posibles: siguientesEstados(incidente.estado)
    });
  })
);

router.patch(
  "/incidents/:id/asignar",
  asincrono(async (req, res) => {
    const id = validarId(req.params.id);
    const tecnicoId = validarId((req.body || {}).tecnico_id);

    if (id === null) {
      return res.status(400).json({
        error: "Parámetros inválidos",
        detalles: [{ campo: "id", mensaje: "El id debe ser un entero positivo" }]
      });
    }

    if (tecnicoId === null) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalles: [
          { campo: "tecnico_id", mensaje: "El tecnico_id debe ser un entero positivo" }
        ]
      });
    }

    const incidente = await incidentes.obtenerPorId(id);

    if (!incidente) {
      return res.status(404).json({ error: "Incidente no encontrado" });
    }

    if (incidente.estado === "CERRADO") {
      return res.status(409).json({
        error: "No se puede asignar un técnico a un incidente CERRADO"
      });
    }

    if (!(await tecnicos.existe(tecnicoId))) {
      return res.status(400).json({
        error: "Datos inválidos",
        detalles: [
          { campo: "tecnico_id", mensaje: "El técnico no existe o está inactivo" }
        ]
      });
    }

    return res.json(await incidentes.asignarTecnico(id, tecnicoId));
  })
);

router.patch(
  "/incidents/:id/estado",
  asincrono(async (req, res) => {
    const id = validarId(req.params.id);
    const nuevoEstado = (req.body || {}).estado;

    if (id === null) {
      return res.status(400).json({
        error: "Parámetros inválidos",
        detalles: [{ campo: "id", mensaje: "El id debe ser un entero positivo" }]
      });
    }

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

    // La nota es opcional salvo al resolver. Se valida después de la
    // transición para no exigir una explicacion por un cambio que de
    // todas formas se va a rechazar.
    const revision = validarNotaDeEstado((req.body || {}).nota, nuevoEstado);

    if (!revision.valido) {
      return res
        .status(400)
        .json({ error: "Datos inválidos", detalles: revision.errores });
    }

    const actualizado = await incidentes.cambiarEstado(
      id,
      nuevoEstado,
      columnaDeFecha(nuevoEstado),
      revision.datos.nota
        ? {
            // El autor es el técnico asignado. Llegar mas alla de NUEVO
            // exige tener uno, así que siempre hay nombre.
            autor: incidente.tecnico_nombre,
            cuerpo: revision.datos.nota
          }
        : null
    );

    return res.json(actualizado);
  })
);

module.exports = router;
