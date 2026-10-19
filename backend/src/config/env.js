const path = require("path");

// El .env vive en la raiz del repo, no dentro de backend/. Si dejamos que
// dotenv lo busque solo, lo busca en el directorio desde donde se ejecuta
// node y no lo encuentra cuando se arranca desde backend/.
const RAIZ_DEL_REPO = path.resolve(__dirname, "..", "..", "..");

require("dotenv").config({ path: path.join(RAIZ_DEL_REPO, ".env") });

// Validacion temprana: si falta una variable obligatoria, el proceso falla
// al arrancar en lugar de romperse a mitad de una peticion.
const requeridas = ["DATABASE_URL"];
const faltantes = requeridas.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  throw new Error(
    `Faltan variables de entorno obligatorias: ${faltantes.join(", ")}. ` +
      "Copia .env.example a .env en la raiz del repositorio y rellena los valores."
  );
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL
};
