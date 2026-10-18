const { Pool } = require("pg");
const config = require("../config/env");

const pool = new Pool({ connectionString: config.databaseUrl });

async function ping() {
  const { rows } = await pool.query("SELECT 1 AS ok");
  return rows[0].ok === 1;
}

module.exports = { pool, ping };
