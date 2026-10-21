const request = require("supertest");
const app = require("../../backend/src/app");
const baseDeDatos = require("../../backend/src/db/pool");
const { cerrarConexion } = require("../helpers/datos");

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await cerrarConexion();
});

describe("CORS", () => {
  it("le da permiso al frontend propio", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("no le da permiso a otro sitio", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://sitio-cualquiera.com");

    expect(res.headers["access-control-allow-origin"]).not.toBe(
      "https://sitio-cualquiera.com"
    );
    expect(res.headers["access-control-allow-origin"]).not.toBe("*");
  });
});

describe("GET /api/health con la base caída", () => {
  it("responde 503 sin el mensaje de error de la base", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest
      .spyOn(baseDeDatos, "ping")
      .mockRejectedValue(
        new Error('password authentication failed for user "incident_user"')
      );

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", db: "down" });
    expect(res.text).not.toContain("incident_user");
  });
});
