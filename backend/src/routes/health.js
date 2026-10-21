const express = require("express");
const baseDeDatos = require("../db/pool");

const router = express.Router();

// Lo usa el pipeline y el docker-compose para saber si la API está viva
// y si alcanza la base de datos.
router.get("/health", async (req, res) => {
  try {
    const dbOk = await baseDeDatos.ping();
    res.json({ status: "ok", db: dbOk ? "up" : "down" });
  } catch (error) {
    // El mensaje de error de la base se queda en el log. Antes se mandaba
    // al cliente, y un fallo de conexión puede traer el host, el usuario
    // o el nombre de la base. Para diagnosticar basta con leer el log.
    console.error("Health: la base no responde:", error);
    res.status(503).json({ status: "degraded", db: "down" });
  }
});

module.exports = router;
