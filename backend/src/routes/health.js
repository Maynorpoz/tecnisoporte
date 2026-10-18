const express = require("express");
const { ping } = require("../db/pool");

const router = express.Router();

// Lo usa el pipeline y el docker-compose para saber si la API está viva
// y si alcanza la base de datos.
router.get("/health", async (req, res) => {
  try {
    const dbOk = await ping();
    res.json({ status: "ok", db: dbOk ? "up" : "down" });
  } catch (error) {
    res.status(503).json({ status: "degraded", db: "down", error: error.message });
  }
});

module.exports = router;
