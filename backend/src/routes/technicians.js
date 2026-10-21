const express = require("express");
const tecnicos = require("../db/technicians");
const { asincrono } = require("../http/errores");

const router = express.Router();

// La pantalla de asignación necesita la lista de técnicos disponibles.
// Solo devuelve los activos: a un técnico dado de baja no se le asigna.
router.get(
  "/technicians",
  asincrono(async (req, res) => {
    return res.json(await tecnicos.listar());
  })
);

module.exports = router;
