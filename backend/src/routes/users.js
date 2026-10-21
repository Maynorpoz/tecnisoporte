const express = require("express");
const usuarios = require("../db/users");
const { asincrono } = require("../http/errores");

const router = express.Router();

// El formulario de creacion necesita poder elegir quien reporta. Como no
// hay login, el usuario se selecciona de una lista.
router.get(
  "/users",
  asincrono(async (req, res) => {
    return res.json(await usuarios.listar());
  })
);

module.exports = router;
