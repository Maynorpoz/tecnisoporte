const request = require("supertest");
const app = require("../../backend/src/app");
const { cerrarConexion } = require("../helpers/datos");

afterAll(async () => {
  await cerrarConexion();
});

// La validación del :id está registrada una sola vez por router. Esta
// prueba recorre todas las rutas que lo usan, incluidas las del router de
// comentarios, para que una ruta nueva que olvide el router.param no pase
// sin que nadie lo note.
const RUTAS_CON_ID = [
  ["get", "/api/incidents/abc"],
  ["patch", "/api/incidents/abc/asignar"],
  ["patch", "/api/incidents/abc/estado"],
  ["get", "/api/incidents/abc/comments"],
  ["post", "/api/incidents/abc/comments"]
];

describe("validación del :id", () => {
  it.each(RUTAS_CON_ID)("%s %s responde 400 con el campo id", async (metodo, ruta) => {
    const res = await request(app)[metodo](ruta).send({});

    expect(res.status).toBe(400);
    expect(res.body.detalles).toEqual([
      { campo: "id", mensaje: "El id debe ser un entero positivo" }
    ]);
  });

  it("rechaza el cero aunque sea un número", async () => {
    const res = await request(app).get("/api/incidents/0");
    expect(res.status).toBe(400);
  });
});
