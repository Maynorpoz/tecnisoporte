const express = require("express");
const metricas = require("../db/metrics");
const { asincrono } = require("../http/errores");

const router = express.Router();

// Los indicadores del dashboard. Se calculan en cada petición, sin caché:
// con el volumen de un área de soporte son unas cuantas consultas de
// conteo, y así el tablero nunca muestra un número viejo.
router.get(
  "/metrics",
  asincrono(async (req, res) => {
    return res.json(await metricas.obtener());
  })
);

module.exports = router;
