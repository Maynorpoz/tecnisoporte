const express = require("express");
const tecnicos = require("../db/technicians");

const router = express.Router();

// La pantalla de asignación necesita la lista de técnicos disponibles.
// Solo devuelve los activos: a un técnico dado de baja no se le asigna.
router.get("/technicians", async (req, res) => {
  try {
    return res.json(await tecnicos.listar());
  } catch (error) {
    console.error("Error al listar tecnicos:", error);
    return res.status(500).json({ error: "No se pudieron listar los técnicos" });
  }
});

module.exports = router;
