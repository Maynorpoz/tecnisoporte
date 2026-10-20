const request = require("supertest");
const app = require("../../backend/src/app");
const {
  prepararBase,
  limpiar,
  sembrar,
  crearIncidente,
  cerrarConexion
} = require("../helpers/datos");

beforeAll(async () => {
  await prepararBase();
});

beforeEach(async () => {
  await limpiar();
  await sembrar();
});

afterAll(async () => {
  await cerrarConexion();
});

// Deja un incidente listo para resolver: asignado y en proceso.
async function incidenteEnProceso() {
  const creado = await crearIncidente();
  const url = `/api/incidents/${creado.id}`;
  await request(app).patch(`${url}/asignar`).send({ tecnico_id: 1 });
  await request(app).patch(`${url}/estado`).send({ estado: "EN_PROCESO" });
  return creado.id;
}

describe("POST /api/incidents/:id/comments", () => {
  it("agrega un comentario a la bitacora", async () => {
    const creado = await crearIncidente();

    const res = await request(app)
      .post(`/api/incidents/${creado.id}/comments`)
      .send({ autor: "Usuario Uno", cuerpo: "Sigue sin funcionar la impresora." });

    expect(res.status).toBe(201);
    expect(res.body.autor).toBe("Usuario Uno");
    expect(res.body.creado_en).toBeDefined();
  });

  it("rechaza un comentario vacio o muy corto", async () => {
    const creado = await crearIncidente();

    const res = await request(app)
      .post(`/api/incidents/${creado.id}/comments`)
      .send({ autor: "Usuario Uno", cuerpo: "ok" });

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe("cuerpo");
  });

  it("exige el autor", async () => {
    const creado = await crearIncidente();

    const res = await request(app)
      .post(`/api/incidents/${creado.id}/comments`)
      .send({ cuerpo: "Un comentario suficientemente largo." });

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe("autor");
  });

  it("devuelve 404 si el incidente no existe", async () => {
    const res = await request(app)
      .post("/api/incidents/9999/comments")
      .send({ autor: "Usuario Uno", cuerpo: "Un comentario cualquiera." });

    expect(res.status).toBe(404);
  });

  it("no deja comentar un incidente CERRADO", async () => {
    const id = await incidenteEnProceso();
    const url = `/api/incidents/${id}`;
    await request(app)
      .patch(`${url}/estado`)
      .send({ estado: "RESUELTO", nota: "Se cambio el cable de red del switch." });
    await request(app).patch(`${url}/estado`).send({ estado: "CERRADO" });

    const res = await request(app)
      .post(`${url}/comments`)
      .send({ autor: "Usuario Uno", cuerpo: "Quiero agregar algo mas." });

    expect(res.status).toBe(409);
  });
});

describe("GET /api/incidents/:id/comments", () => {
  it("devuelve la bitacora en orden cronologico", async () => {
    const creado = await crearIncidente();
    const url = `/api/incidents/${creado.id}/comments`;

    await request(app).post(url).send({ autor: "Usuario Uno", cuerpo: "Primer mensaje de la bitacora." });
    await request(app).post(url).send({ autor: "Tecnico Activo", cuerpo: "Segundo mensaje de la bitacora." });

    const res = await request(app).get(url);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].cuerpo).toContain("Primer");
    expect(res.body[1].cuerpo).toContain("Segundo");
  });

  it("distingue un incidente sin comentarios de uno que no existe", async () => {
    const creado = await crearIncidente();

    const vacio = await request(app).get(`/api/incidents/${creado.id}/comments`);
    const inexistente = await request(app).get("/api/incidents/9999/comments");

    expect(vacio.status).toBe(200);
    expect(vacio.body).toEqual([]);
    expect(inexistente.status).toBe(404);
  });
});

describe("nota obligatoria al resolver", () => {
  it("no deja pasar a RESUELTO sin explicar como se soluciono", async () => {
    const id = await incidenteEnProceso();

    const res = await request(app)
      .patch(`/api/incidents/${id}/estado`)
      .send({ estado: "RESUELTO" });

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe("nota");
  });

  it("guarda la nota como comentario firmado por el tecnico asignado", async () => {
    const id = await incidenteEnProceso();

    const res = await request(app)
      .patch(`/api/incidents/${id}/estado`)
      .send({ estado: "RESUELTO", nota: "Se reemplazo el cable de red del switch." });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("RESUELTO");

    const bitacora = await request(app).get(`/api/incidents/${id}/comments`);
    expect(bitacora.body).toHaveLength(1);
    expect(bitacora.body[0].autor).toBe("Tecnico Activo");
    expect(bitacora.body[0].cuerpo).toContain("cable de red");
  });

  it("acepta una nota opcional en otras transiciones", async () => {
    const creado = await crearIncidente();
    const url = `/api/incidents/${creado.id}`;
    await request(app).patch(`${url}/asignar`).send({ tecnico_id: 1 });

    const res = await request(app)
      .patch(`${url}/estado`)
      .send({ estado: "EN_PROCESO", nota: "Empiezo a revisar el equipo hoy." });

    expect(res.status).toBe(200);
    const bitacora = await request(app).get(`${url}/comments`);
    expect(bitacora.body).toHaveLength(1);
  });

  it("si la transicion es invalida no pide nota", async () => {
    const creado = await crearIncidente();

    const res = await request(app)
      .patch(`/api/incidents/${creado.id}/estado`)
      .send({ estado: "RESUELTO" });

    // 409 por el salto invalido, no 400 por falta de nota.
    expect(res.status).toBe(409);
  });
});
