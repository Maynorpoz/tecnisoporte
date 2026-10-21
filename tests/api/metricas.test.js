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

beforeEach(async () => {
  await limpiar();
  await sembrar();
});

// Lleva un incidente hasta el estado pedido por la API, igual que lo
// haría un técnico, para que las métricas se prueben sobre datos que
// pasaron por las mismas reglas que en producción.
const CAMINO = ["ASIGNADO", "EN_PROCESO", "RESUELTO", "CERRADO"];

async function llevarA(id, destino) {
  await request(app).patch(`/api/incidents/${id}/asignar`).send({ tecnico_id: 1 });

  for (const estado of CAMINO.slice(1, CAMINO.indexOf(destino) + 1)) {
    await request(app)
      .patch(`/api/incidents/${id}/estado`)
      .send({ estado, nota: "Se reemplazó el equipo dañado." });
  }
}

function buscar(lista, valor) {
  return lista.find((x) => x.valor === valor);
}

describe("GET /api/metrics", () => {
  beforeEach(async () => {
    // Uno de cada caso que distingue el resumen.
    await crearIncidente({ categoria: "RED", prioridad: "CRITICA" }); // nuevo
    const asignado = await crearIncidente({ categoria: "SOFTWARE", prioridad: "CRITICA" });
    const resuelto = await crearIncidente({ categoria: "SOFTWARE", prioridad: "MEDIA" });
    const cerrado = await crearIncidente({ categoria: "HARDWARE", prioridad: "BAJA" });
    const criticoCerrado = await crearIncidente({ categoria: "RED", prioridad: "CRITICA" });

    await llevarA(asignado.id, "ASIGNADO");
    await llevarA(resuelto.id, "RESUELTO");
    await llevarA(cerrado.id, "CERRADO");
    await llevarA(criticoCerrado.id, "CERRADO");
  });

  it("separa abiertos, resueltos y cerrados", async () => {
    const res = await request(app).get("/api/metrics");

    expect(res.status).toBe(200);
    expect(res.body.resumen).toEqual({
      total: 5,
      abiertos: 2,
      resueltos: 1,
      cerrados: 2,
      criticos_abiertos: 2,
      sin_asignar: 1
    });
  });

  it("no cuenta como crítico abierto un crítico que ya se cerró", async () => {
    const res = await request(app).get("/api/metrics");

    expect(buscar(res.body.por_prioridad, "CRITICA")).toEqual({
      valor: "CRITICA",
      total: 3,
      abiertos: 2
    });
    expect(res.body.resumen.criticos_abiertos).toBe(2);
  });

  it("incluye las categorías sin incidentes, con cero", async () => {
    const res = await request(app).get("/api/metrics");

    expect(res.body.por_categoria.map((c) => c.valor)).toEqual([
      "HARDWARE",
      "SOFTWARE",
      "RED",
      "ACCESOS",
      "OTRO"
    ]);
    expect(buscar(res.body.por_categoria, "ACCESOS").total).toBe(0);
    expect(buscar(res.body.por_categoria, "RED")).toMatchObject({ total: 2, abiertos: 1 });
  });

  it("reparte la carga por técnico y deja fuera al inactivo sin historial", async () => {
    const res = await request(app).get("/api/metrics");

    expect(res.body.por_tecnico).toEqual([
      { id: 1, nombre: "Tecnico Activo", total: 4, abiertos: 1, cerrados: 2 }
    ]);
  });
});

describe("GET /api/metrics sin incidentes", () => {
  it("devuelve ceros y no listas vacías", async () => {
    const res = await request(app).get("/api/metrics");

    expect(res.body.resumen.total).toBe(0);
    expect(res.body.por_estado).toHaveLength(5);
    expect(res.body.por_estado.every((e) => e.total === 0)).toBe(true);
    expect(res.body.por_tecnico).toEqual([
      { id: 1, nombre: "Tecnico Activo", total: 0, abiertos: 0, cerrados: 0 }
    ]);
  });
});
