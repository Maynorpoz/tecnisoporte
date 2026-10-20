const request = require("supertest");
const app = require("../../backend/src/app");
const {
  prepararBase,
  limpiar,
  sembrar,
  crearIncidente,
  cerrarConexion
} = require("../helpers/datos");

// Estas si tocan la base, pero la de pruebas: tests/setup/env.js apunta
// DATABASE_URL a TEST_DATABASE_URL antes de que se cargue el pool.

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

describe("POST /api/incidents", () => {
  it("crea un incidente y lo devuelve en NUEVO sin tecnico", async () => {
    const res = await request(app).post("/api/incidents").send({
      titulo: "La impresora no responde",
      descripcion: "Manda los trabajos a la cola pero no imprime.",
      categoria: "HARDWARE",
      prioridad: "ALTA",
      usuario_id: 1
    });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe("NUEVO");
    expect(res.body.tecnico_id).toBeNull();
    expect(res.body.prioridad).toBe("ALTA");
  });

  it("usa MEDIA cuando no se manda prioridad", async () => {
    const res = await request(app).post("/api/incidents").send({
      titulo: "Solicito instalacion de Office",
      descripcion: "Equipo nuevo del area de ventas sin ofimatica.",
      categoria: "SOFTWARE",
      usuario_id: 1
    });

    expect(res.status).toBe(201);
    expect(res.body.prioridad).toBe("MEDIA");
  });

  it("rechaza un cuerpo vacio e indica cada campo faltante", async () => {
    const res = await request(app).post("/api/incidents").send({});

    expect(res.status).toBe(400);
    const campos = res.body.detalles.map((d) => d.campo);
    expect(campos).toEqual(
      expect.arrayContaining(["titulo", "descripcion", "categoria", "usuario_id"])
    );
  });

  it("rechaza una categoria que no existe", async () => {
    const res = await request(app).post("/api/incidents").send({
      titulo: "Titulo valido para la prueba",
      descripcion: "Descripcion suficientemente larga para pasar.",
      categoria: "IMPRESORAS",
      usuario_id: 1
    });

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe("categoria");
  });

  it("devuelve 400, no 500, si el usuario no existe", async () => {
    const res = await request(app).post("/api/incidents").send({
      titulo: "Titulo valido para la prueba",
      descripcion: "Descripcion suficientemente larga para pasar.",
      categoria: "RED",
      usuario_id: 9999
    });

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].mensaje).toContain("no existe");
  });
});

describe("GET /api/incidents", () => {
  it("pagina y devuelve el total correcto", async () => {
    for (let i = 0; i < 5; i++) {
      await crearIncidente({ titulo: `Incidente numero ${i + 1}` });
    }

    const res = await request(app).get("/api/incidents?page=2&pageSize=2");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.items).toHaveLength(2);
  });

  it("devuelve lista vacia y 200 en una pagina fuera de rango", async () => {
    await crearIncidente();

    const res = await request(app).get("/api/incidents?page=99&pageSize=10");

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(1);
  });

  it("rechaza un pageSize mayor al tope", async () => {
    const res = await request(app).get("/api/incidents?pageSize=500");

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe("pageSize");
  });

  it("trae el nombre del usuario resuelto", async () => {
    await crearIncidente({ usuario_id: 2 });

    const res = await request(app).get("/api/incidents");

    expect(res.body.items[0].usuario_nombre).toBe("Usuario Dos");
    expect(res.body.items[0].tecnico_nombre).toBeNull();
  });
});

describe("GET /api/incidents/:id", () => {
  it("devuelve el detalle de un incidente existente", async () => {
    const creado = await crearIncidente({ titulo: "Incidente para el detalle" });

    const res = await request(app).get(`/api/incidents/${creado.id}`);

    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe("Incidente para el detalle");
  });

  // El frontend dibuja los botones de cambio de estado con esto, asi que
  // no tiene que repetir la maquina de estados.
  it("incluye las transiciones posibles desde el estado actual", async () => {
    const creado = await crearIncidente();

    const res = await request(app).get(`/api/incidents/${creado.id}`);

    expect(res.body.estado).toBe("NUEVO");
    expect(res.body.transiciones_posibles).toEqual(["ASIGNADO"]);
  });

  it("un incidente CERRADO no ofrece transiciones", async () => {
    const creado = await crearIncidente();
    const url = `/api/incidents/${creado.id}`;

    await request(app).patch(`${url}/asignar`).send({ tecnico_id: 1 });
    await request(app).patch(`${url}/estado`).send({ estado: "EN_PROCESO" });
    await request(app)
      .patch(`${url}/estado`)
      .send({ estado: "RESUELTO", nota: "Se reemplazo el equipo danado." });
    await request(app).patch(`${url}/estado`).send({ estado: "CERRADO" });

    const res = await request(app).get(url);

    expect(res.body.estado).toBe("CERRADO");
    expect(res.body.transiciones_posibles).toEqual([]);
  });

  it("devuelve 404 si no existe", async () => {
    const res = await request(app).get("/api/incidents/9999");
    expect(res.status).toBe(404);
  });

  it("devuelve 400 si el id no es un entero", async () => {
    const res = await request(app).get("/api/incidents/abc");
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/incidents/:id/asignar", () => {
  it("asigna el tecnico y mueve el incidente a ASIGNADO", async () => {
    const creado = await crearIncidente();

    const res = await request(app)
      .patch(`/api/incidents/${creado.id}/asignar`)
      .send({ tecnico_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("ASIGNADO");
    expect(res.body.tecnico_nombre).toBe("Tecnico Activo");
  });

  it("no permite asignar un tecnico inactivo", async () => {
    const creado = await crearIncidente();

    const res = await request(app)
      .patch(`/api/incidents/${creado.id}/asignar`)
      .send({ tecnico_id: 2 });

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].mensaje).toContain("inactivo");
  });
});

describe("PATCH /api/incidents/:id/estado", () => {
  it("recorre el flujo completo y marca las fechas", async () => {
    const creado = await crearIncidente();
    const url = `/api/incidents/${creado.id}/estado`;

    await request(app).patch(`/api/incidents/${creado.id}/asignar`).send({ tecnico_id: 1 });
    await request(app).patch(url).send({ estado: "EN_PROCESO" });
    await request(app)
      .patch(url)
      .send({ estado: "RESUELTO", nota: "Se reemplazo el equipo danado." });
    const res = await request(app).patch(url).send({ estado: "CERRADO" });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("CERRADO");
    expect(res.body.resuelto_en).not.toBeNull();
    expect(res.body.cerrado_en).not.toBeNull();
  });

  it("devuelve 409 y las transiciones posibles ante un salto invalido", async () => {
    const creado = await crearIncidente();

    const res = await request(app)
      .patch(`/api/incidents/${creado.id}/estado`)
      .send({ estado: "CERRADO" });

    expect(res.status).toBe(409);
    expect(res.body.estado_actual).toBe("NUEVO");
    expect(res.body.transiciones_posibles).toEqual(["ASIGNADO"]);
  });
});
