const {
  puedeTransicionar,
  siguientesEstados,
  columnaDeFecha,
  esEstadoValido
} = require("../../backend/src/domain/estados");

// Estas pruebas no tocan la base ni levantan el servidor. El modulo de
// estados es logica pura y por eso se puede probar asi de directo.

describe("transiciones validas", () => {
  const camino = [
    ["NUEVO", "ASIGNADO"],
    ["ASIGNADO", "EN_PROCESO"],
    ["EN_PROCESO", "RESUELTO"],
    ["RESUELTO", "CERRADO"]
  ];

  it.each(camino)("permite pasar de %s a %s", (desde, hacia) => {
    expect(puedeTransicionar(desde, hacia).permitido).toBe(true);
  });
});

describe("transiciones invalidas", () => {
  it("no permite saltarse estados", () => {
    const { permitido, motivo } = puedeTransicionar("NUEVO", "RESUELTO");
    expect(permitido).toBe(false);
    expect(motivo).toContain("ASIGNADO");
  });

  it("no permite retroceder", () => {
    expect(puedeTransicionar("RESUELTO", "EN_PROCESO").permitido).toBe(false);
  });

  it("no permite quedarse en el mismo estado", () => {
    const { permitido, motivo } = puedeTransicionar("ASIGNADO", "ASIGNADO");
    expect(permitido).toBe(false);
    expect(motivo).toContain("ya esta");
  });

  it("rechaza un estado que no existe", () => {
    const { permitido, motivo } = puedeTransicionar("NUEVO", "PENDIENTE");
    expect(permitido).toBe(false);
    expect(motivo).toContain("debe ser uno de");
  });

  it("rechaza un estado de origen desconocido", () => {
    expect(puedeTransicionar("INVENTADO", "NUEVO").permitido).toBe(false);
  });
});

describe("estados finales", () => {
  it("un incidente CERRADO ya no se mueve", () => {
    const { permitido, motivo } = puedeTransicionar("CERRADO", "EN_PROCESO");
    expect(permitido).toBe(false);
    expect(motivo).toContain("ya no puede");
  });

  it("CERRADO no tiene siguientes estados", () => {
    expect(siguientesEstados("CERRADO")).toEqual([]);
  });
});

describe("siguientesEstados", () => {
  it("desde NUEVO solo se puede ir a ASIGNADO", () => {
    expect(siguientesEstados("NUEVO")).toEqual(["ASIGNADO"]);
  });

  it("devuelve lista vacia para un estado inventado", () => {
    expect(siguientesEstados("INVENTADO")).toEqual([]);
  });
});

describe("columnaDeFecha", () => {
  it("RESUELTO marca resuelto_en", () => {
    expect(columnaDeFecha("RESUELTO")).toBe("resuelto_en");
  });

  it("CERRADO marca cerrado_en", () => {
    expect(columnaDeFecha("CERRADO")).toBe("cerrado_en");
  });

  // Importante porque ese valor se concatena al SQL: solo puede ser una
  // de las dos columnas conocidas o nada.
  it("los demas estados no marcan ninguna fecha", () => {
    ["NUEVO", "ASIGNADO", "EN_PROCESO", "INVENTADO"].forEach((estado) => {
      expect(columnaDeFecha(estado)).toBeNull();
    });
  });
});

describe("esEstadoValido", () => {
  it("acepta los cinco estados del dominio", () => {
    ["NUEVO", "ASIGNADO", "EN_PROCESO", "RESUELTO", "CERRADO"].forEach((e) => {
      expect(esEstadoValido(e)).toBe(true);
    });
  });

  it("rechaza cualquier otra cosa", () => {
    expect(esEstadoValido("pendiente")).toBe(false);
    expect(esEstadoValido("")).toBe(false);
    expect(esEstadoValido(null)).toBe(false);
  });
});
