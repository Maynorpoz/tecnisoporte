const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { pool } = require("../../backend/src/db/pool");

const RAIZ = path.resolve(__dirname, "..", "..");

// Crea la base de pruebas si no existe y le aplica el mismo esquema que
// usa la aplicación. Se llama una vez por suite que necesite base.
//
// Esto vivia en el globalSetup de Jest, pero ese archivo se carga fuera
// del resolver de Jest y no encontraba los modulos de backend/, porque
// tests/ esta en la raiz del repo y node_modules esta en backend/.
async function prepararBase() {
  const url = process.env.DATABASE_URL;
  const nombreBase = new URL(url).pathname.slice(1);

  // CREATE DATABASE no se puede ejecutar desde la base que se va a crear,
  // así que se usa postgres, que siempre existe.
  const urlAdmin = new URL(url);
  urlAdmin.pathname = "/postgres";

  const admin = new Client({ connectionString: urlAdmin.toString() });
  await admin.connect();

  const { rowCount } = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [nombreBase]
  );

  if (rowCount === 0) {
    // El nombre no puede ir parametrizado aquí, pero sale del .env y no
    // de una petición, así que no hay entrada externa.
    await admin.query(`CREATE DATABASE "${nombreBase}"`);
  }

  await admin.end();

  // Borrar y recrear deja la base igual en cada corrida, sin importar
  // como haya quedado la anterior.
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await pool.query(
    fs.readFileSync(path.join(RAIZ, "database", "01-schema.sql"), "utf8")
  );
}

// Las pruebas limpian antes de correr, no después. Si una falla, los
// datos quedan ahi para poder revisarlos.
async function limpiar() {
  await pool.query(
    "TRUNCATE comments, incidents, technicians, users RESTART IDENTITY CASCADE"
  );
}

// Datos minimos y predecibles: los ids siempre salen 1 y 2 porque el
// TRUNCATE reinicia las secuencias.
async function sembrar() {
  await pool.query(`
    INSERT INTO users (nombre, email) VALUES
      ('Usuario Uno', 'uno@prueba.gt'),
      ('Usuario Dos', 'dos@prueba.gt')
  `);

  await pool.query(`
    INSERT INTO technicians (nombre, email, especialidad, activo) VALUES
      ('Tecnico Activo',   'activo@prueba.gt',   'Redes',   true),
      ('Tecnico Inactivo', 'inactivo@prueba.gt', 'Soporte', false)
  `);
}

async function crearIncidente(campos = {}) {
  const { rows } = await pool.query(
    `INSERT INTO incidents (titulo, descripcion, categoria, prioridad, usuario_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      campos.titulo || "Incidente de prueba",
      campos.descripcion || "Descripcion suficientemente larga para pasar.",
      campos.categoria || "RED",
      campos.prioridad || "MEDIA",
      campos.usuario_id || 1
    ]
  );
  return rows[0];
}

async function cerrarConexion() {
  await pool.end();
}

module.exports = {
  prepararBase,
  limpiar,
  sembrar,
  crearIncidente,
  cerrarConexion
};
