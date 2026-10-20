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

afterAll(async () => {
  await cerrarConexion();
});

// Seis incidentes con una mezcla pensada para que cada filtro deje
// fuera a unos cuantos y se note si alguno no se aplica.
beforeEach(async () => {
  await limpiar();
  await sembrar();

  await crearIncidente({ categoria: "RED", prioridad: "CRITICA" });
  await crearIncidente({ categoria: "RED", prioridad: "BAJA" });
  await crearIncidente({ categoria: "SOFTWARE", prioridad: "CRITICA" });
  await crearIncidente({ categoria: "SOFTWARE", prioridad: "MEDIA" });
  await crearIncidente({ categoria: "HARDWARE", prioridad: "CRITICA" });
  await crearIncidente({ categoria: "ACCESOS", prioridad: "ALTA" });
});

describe("filtros del listado", () => {
  it("filtra por categoria", async () => {
    const res = await request(app).get("/api/incidents?categoria=RED");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items.every((i) => i.categoria === "RED")).toBe(true);
  });

  it("filtra por prioridad", async () => {
    const res = await request(app).get("/api/incidents?prioridad=CRITICA");

    expect(res.body.total).toBe(3);
  });

  it("combina categoria y prioridad", async () => {
    const res = await request(app).get(
      "/api/incidents?categoria=RED&prioridad=CRITICA"
    );

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].categoria).toBe("RED");
    expect(res.body.items[0].prioridad).toBe("CRITICA");
  });

  it("filtra por estado", async () => {
    const todos = await request(app).get("/api/incidents?pageSize=100");
    const primero = todos.body.items[0].id;
    await request(app)
      .patch(`/api/incidents/${primero}/asignar`)
      .send({ tecnico_id: 1 });

    const asignados = await request(app).get("/api/incidents?estado=ASIGNADO");
    const nuevos = await request(app).get("/api/incidents?estado=NUEVO");

    expect(asignados.body.total).toBe(1);
    expect(nuevos.body.total).toBe(5);
  });

  it("filtra por tecnico", async () => {
    const todos = await request(app).get("/api/incidents?pageSize=100");
    await request(app)
      .patch(`/api/incidents/${todos.body.items[0].id}/asignar`)
      .send({ tecnico_id: 1 });

    const res = await request(app).get("/api/incidents?tecnico_id=1");

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].tecnico_nombre).toBe("Tecnico Activo");
  });

  it("filtra los que no tienen tecnico asignado", async () => {
    const todos = await request(app).get("/api/incidents?pageSize=100");
    await request(app)
      .patch(`/api/incidents/${todos.body.items[0].id}/asignar`)
      .send({ tecnico_id: 1 });

    const res = await request(app).get("/api/incidents?tecnico_id=ninguno");

    expect(res.body.total).toBe(5);
    expect(res.body.items.every((i) => i.tecnico_id === null)).toBe(true);
  });

  it("sin filtros devuelve todo", async () => {
    const res = await request(app).get("/api/incidents?pageSize=100");
    expect(res.body.total).toBe(6);
  });
});

// Esto es lo que se habia anotado como riesgo al escribir la paginacion:
// que el conteo ignorara los filtros y el totalPages saliera mal.
describe("el total respeta los filtros", () => {
  it("totalPages se calcula sobre lo filtrado, no sobre la tabla entera", async () => {
    const res = await request(app).get(
      "/api/incidents?prioridad=CRITICA&pageSize=2"
    );

    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(2);
    expect(res.body.items).toHaveLength(2);
  });

  it("un filtro sin resultados da total 0 y ninguna pagina", async () => {
    const res = await request(app).get("/api/incidents?categoria=OTRO");

    expect(res.body.total).toBe(0);
    expect(res.body.totalPages).toBe(0);
    expect(res.body.items).toEqual([]);
  });
});

describe("filtros invalidos", () => {
  it("rechaza una categoria que no existe", async () => {
    const res = await request(app).get("/api/incidents?categoria=IMPRESORAS");

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe("categoria");
  });

  it("rechaza un estado que no existe", async () => {
    const res = await request(app).get("/api/incidents?estado=PENDIENTE");

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe("estado");
  });

  it("rechaza un tecnico_id que no es entero", async () => {
    const res = await request(app).get("/api/incidents?tecnico_id=abc");

    expect(res.status).toBe(400);
    expect(res.body.detalles[0].campo).toBe("tecnico_id");
  });

  it("reporta de una vez los errores de paginacion y de filtros", async () => {
    const res = await request(app).get(
      "/api/incidents?page=0&categoria=IMPRESORAS"
    );

    expect(res.status).toBe(400);
    const campos = res.body.detalles.map((d) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(["page", "categoria"]));
  });
});
