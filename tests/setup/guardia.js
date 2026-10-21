// Las pruebas de API borran el esquema completo antes de correr. Si por
// un error en el .env la variable de pruebas apuntara a la base de
// desarrollo, la suite la vaciaría sin avisar. Antes la única protección
// era que fueran dos variables distintas.
//
// La regla es simple a propósito: la base tiene que llamarse algo que
// termine en _test. Es una convención que ya cumplen el .env.example, el
// pipeline de Azure y el workflow de GitHub.
function esBaseDePruebas(url) {
  let nombre;

  try {
    nombre = new URL(url).pathname.slice(1);
  } catch {
    return false;
  }

  return nombre.endsWith("_test");
}

module.exports = { esBaseDePruebas };
