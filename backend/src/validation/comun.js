// Piezas que comparten todas las validaciones. Antes cada archivo tenía
// su propia copia de esTextoUtil, y cada validador armaba su resultado a
// mano con formas que no siempre coincidían.

function esTextoUtil(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

// Los query params y los params de ruta llegan como texto. Esta función
// separa los tres casos posibles en campos con nombre: que no haya venido,
// que haya venido mal o que esté bien. Antes los tres se devolvían como
// undefined, null o el número, y bastaba con confundir undefined con null
// para tratar un valor inválido como si no hubiera venido.
function leerEnteroPositivo(valor) {
  if (valor === undefined || valor === "") {
    return { presente: false, invalido: false, valor: undefined };
  }

  if (!/^\d+$/.test(String(valor)) || Number(valor) < 1) {
    return { presente: true, invalido: true, valor: undefined };
  }

  return { presente: true, invalido: false, valor: Number(valor) };
}

// La forma que devuelven todos los validadores del proyecto.
function resultado(errores, datos) {
  return { valido: errores.length === 0, errores, datos };
}

// Junta los errores de varios validadores. Así una petición con varios
// parámetros malos los reporta todos de una vez, y agregar un validador
// más es sumarlo a la llamada en vez de reescribir la unión a mano.
function juntarErrores(...resultados) {
  const errores = resultados.flatMap((r) => r.errores);
  return { valido: errores.length === 0, errores };
}

module.exports = { esTextoUtil, leerEnteroPositivo, resultado, juntarErrores };
