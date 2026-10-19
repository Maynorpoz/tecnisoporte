const express = require("express");
const usuarios = require("../db/users");

const router = express.Router();

// El formulario de creacion necesita poder elegir quien reporta. Como no
// hay login, el usuario se selecciona de una lista.
router.get("/users", async (req, res) => {
  try {
    return res.json(await usuarios.listar());
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return res.status(500).json({ error: "No se pudieron listar los usuarios" });
  }
});

module.exports = router;
