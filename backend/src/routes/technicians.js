const express = require("express");
const tecnicos = require("../db/technicians");

const router = express.Router();

// La pantalla de asignacion necesita la lista de tecnicos disponibles.
// Solo devuelve los activos: a un tecnico dado de baja no se le asigna.
router.get("/technicians", async (req, res) => {
  try {
    return res.json(await tecnicos.listar());
  } catch (error) {
    console.error("Error al listar tecnicos:", error);
    return res.status(500).json({ error: "No se pudieron listar los tecnicos" });
  }
});

module.exports = router;
