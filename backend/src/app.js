const express = require("express");
const healthRouter = require("./routes/health");

const app = express();

app.use(express.json());
app.use("/api", healthRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

module.exports = app;
