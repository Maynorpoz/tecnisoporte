const express = require("express");
const healthRouter = require("./routes/health");
const incidentsRouter = require("./routes/incidents");

const app = express();

app.use(express.json());
app.use("/api", healthRouter);
app.use("/api", incidentsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

module.exports = app;
