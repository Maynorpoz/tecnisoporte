const request = require("supertest");
const app = require("../../backend/src/app");
const incidentes = require("../../backend/src/db/incidents");
const { cerrarConexion } = require("../helpers/datos");

// Estas pruebas no necesitan datos: la falla de la base se simula
// reemplazando la función del módulo, así que no hace falta romper nada
// de verdad para ver qué responde la API.

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await cerrarConexion();
});

// Un mensaje con el nombre de una tabla, que es lo que nunca debe llegar
// al cliente.
const FALLA_INTERNA = 'relation "incidents" does not exist';

describe("middleware de errores", () => {
  beforeEach(() => {
    // El middleware escribe el error en el log, que es lo que tiene que
    // hacer. Aquí se silencia para que no ensucie la salida de la suite.
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("responde 500 con un mensaje genérico si falla la base", async () => {
    jest.spyOn(incidentes, "listar").mockRejectedValue(new Error(FALLA_INTERNA));

    const res = await request(app).get("/api/incidents");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Error interno del servidor" });
    expect(JSON.stringify(res.body)).not.toContain("relation");
  });

  it("deja el detalle del error en el log del servidor", async () => {
    jest.spyOn(incidentes, "listar").mockRejectedValue(new Error(FALLA_INTERNA));

    await request(app).get("/api/incidents");

    expect(console.error).toHaveBeenCalledWith(
      "Error en GET /api/incidents:",
      expect.objectContaining({ message: FALLA_INTERNA })
    );
  });

  it("atrapa también los errores de las rutas de otros archivos", async () => {
    jest
      .spyOn(incidentes, "obtenerPorId")
      .mockRejectedValue(new Error(FALLA_INTERNA));

    const res = await request(app).get("/api/incidents/1/comments");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Error interno del servidor" });
  });

  it("responde 400 en JSON, no una página HTML, si el cuerpo está mal formado", async () => {
    const res = await request(app)
      .post("/api/incidents")
      .set("Content-Type", "application/json")
      .send('{"titulo": ');

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.detalles[0].campo).toBe("body");
    expect(res.text).not.toContain("node_modules");
  });
});
