const { esBaseDePruebas } = require("../setup/guardia");

describe("esBaseDePruebas", () => {
  it("acepta una base cuyo nombre termina en _test", () => {
    expect(
      esBaseDePruebas("postgresql://u:p@localhost:5436/tecnisoporte_test")
    ).toBe(true);
  });

  it("rechaza la base de desarrollo", () => {
    expect(esBaseDePruebas("postgresql://u:p@localhost:5435/tecnisoporte")).toBe(
      false
    );
  });

  it("no se deja engañar por _test en otra parte de la URL", () => {
    expect(
      esBaseDePruebas("postgresql://u_test:p@host_test:5435/tecnisoporte")
    ).toBe(false);
  });

  it("rechaza una URL que no se puede leer", () => {
    expect(esBaseDePruebas("no es una url")).toBe(false);
  });
});
