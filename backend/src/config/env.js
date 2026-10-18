require("dotenv").config();

// Validación temprana: si falta una variable obligatoria, el proceso falla al
// arrancar en lugar de romperse a mitad de una petición.
const requeridas = ["DATABASE_URL"];
const faltantes = requeridas.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  throw new Error(
    `Faltan variables de entorno obligatorias: ${faltantes.join(", ")}. ` +
      "Copia .env.example a .env y rellena los valores."
  );
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL
};
