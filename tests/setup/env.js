const path = require("path");
const { esBaseDePruebas } = require("./guardia");

// Esto corre antes de que las pruebas carguen cualquier modulo de la app.
// Es importante el orden: el pool del backend lee DATABASE_URL al ser
// importado, así que si no la cambiamos aquí, las pruebas borrarian la
// base de desarrollo.
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "Falta TEST_DATABASE_URL en el .env. Copia el .env.example y rellenala."
  );
}

if (!esBaseDePruebas(process.env.TEST_DATABASE_URL)) {
  throw new Error(
    "TEST_DATABASE_URL no apunta a una base de pruebas: el nombre tiene que " +
      "terminar en _test. Se detienen las pruebas para no borrar otra base."
  );
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = "test";
