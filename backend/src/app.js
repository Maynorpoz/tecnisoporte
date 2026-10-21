const express = require("express");
const cors = require("cors");
const healthRouter = require("./routes/health");
const incidentsRouter = require("./routes/incidents");
const usersRouter = require("./routes/users");
const techniciansRouter = require("./routes/technicians");
const commentsRouter = require("./routes/comments");
const { manejarErrores } = require("./http/errores");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", healthRouter);
app.use("/api", incidentsRouter);
app.use("/api", usersRouter);
app.use("/api", techniciansRouter);
app.use("/api", commentsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

// Tiene que ir al final: Express reconoce un manejador de errores por sus
// cuatro argumentos, y solo le llegan los errores de lo que está antes.
app.use(manejarErrores);

module.exports = app;
