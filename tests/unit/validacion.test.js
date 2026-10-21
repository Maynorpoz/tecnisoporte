const {
  leerEnteroPositivo,
  juntarErrores,
  resultado
} = require("../../backend/src/validation/comun");
const { validarNotaDeEstado } = require("../../backend/src/validation/comments");

describe("leerEnteroPositivo", () => {
  it("distingue un valor que no vino de uno que vino mal", () => {
    expect(leerEnteroPositivo(undefined)).toEqual({
      presente: false,
      invalido: false,
      valor: undefined
    });
    expect(leerEnteroPositivo("abc")).toEqual({
      presente: true,
      invalido: true,
      valor: undefined
    });
  });

  it("trata la cadena vacía como ausente", () => {
    expect(leerEnteroPositivo("").presente).toBe(false);
  });

  it.each(["0", "-1", "1.5", "2e3", " 3"])("rechaza %p", (valor) => {
    expect(leerEnteroPositivo(valor).invalido).toBe(true);
  });

  it("convierte a número un valor válido, venga como texto o como número", () => {
    expect(leerEnteroPositivo("42").valor).toBe(42);
    expect(leerEnteroPositivo(7).valor).toBe(7);
  });
});

describe("juntarErrores", () => {
  it("reúne los errores de todos los validadores", () => {
    const a = resultado([{ campo: "page", mensaje: "x" }], {});
    const b = resultado([{ campo: "estado", mensaje: "y" }], {});

    const junto = juntarErrores(a, b);

    expect(junto.valido).toBe(false);
    expect(junto.errores.map((e) => e.campo)).toEqual(["page", "estado"]);
  });

  it("es válido si ninguno trae errores", () => {
    expect(juntarErrores(resultado([], {}), resultado([], {})).valido).toBe(true);
  });
});

describe("validarNotaDeEstado", () => {
  it("devuelve la misma forma que los demás validadores", () => {
    const r = validarNotaDeEstado(undefined, "RESUELTO");

    expect(r).toHaveProperty("valido", false);
    expect(Array.isArray(r.errores)).toBe(true);
    expect(r).toHaveProperty("datos");
  });

  it("no exige nota fuera de RESUELTO", () => {
    expect(validarNotaDeEstado(undefined, "EN_PROCESO")).toEqual({
      valido: true,
      errores: [],
      datos: { nota: null }
    });
  });
});
