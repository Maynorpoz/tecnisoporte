const {
  CATEGORIAS,
  PRIORIDADES,
  ESTADOS,
  PRIORIDAD_POR_DEFECTO
} = require("../domain/incidents");

const TITULO_MIN = 5;
const TITULO_MAX = 150;
const DESCRIPCION_MIN = 10;

function esTextoUtil(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

// Valida el cuerpo de un POST /incidents. No toca la base: recibe el
// body y devuelve los errores y los datos ya limpios, así se puede
// probar sin levantar nada.
function validarNuevoIncidente(body) {
  const errores = [];
  const datos = {};

  if (!esTextoUtil(body.titulo)) {
    errores.push({ campo: "titulo", mensaje: "El título es obligatorio" });
  } else {
    const titulo = body.titulo.trim();
    if (titulo.length < TITULO_MIN || titulo.length > TITULO_MAX) {
      errores.push({
        campo: "titulo",
        mensaje: `El título debe tener entre ${TITULO_MIN} y ${TITULO_MAX} caracteres`
      });
    } else {
      datos.titulo = titulo;
    }
  }

  if (!esTextoUtil(body.descripcion)) {
    errores.push({ campo: "descripcion", mensaje: "La descripción es obligatoria" });
  } else {
    const descripcion = body.descripcion.trim();
    if (descripcion.length < DESCRIPCION_MIN) {
      errores.push({
        campo: "descripcion",
        mensaje: `La descripción debe tener al menos ${DESCRIPCION_MIN} caracteres`
      });
    } else {
      datos.descripcion = descripcion;
    }
  }

  if (!CATEGORIAS.includes(body.categoria)) {
    errores.push({
      campo: "categoria",
      mensaje: `La categoría debe ser una de: ${CATEGORIAS.join(", ")}`
    });
  } else {
    datos.categoria = body.categoria;
  }

  // La prioridad es opcional: si no viene, se usa la de por defecto.
  if (body.prioridad === undefined || body.prioridad === null) {
    datos.prioridad = PRIORIDAD_POR_DEFECTO;
  } else if (!PRIORIDADES.includes(body.prioridad)) {
    errores.push({
      campo: "prioridad",
      mensaje: `La prioridad debe ser una de: ${PRIORIDADES.join(", ")}`
    });
  } else {
    datos.prioridad = body.prioridad;
  }

  if (!Number.isInteger(body.usuario_id) || body.usuario_id < 1) {
    errores.push({
      campo: "usuario_id",
      mensaje: "El usuario_id debe ser un entero positivo"
    });
  } else {
    datos.usuario_id = body.usuario_id;
  }

  return { valido: errores.length === 0, errores, datos };
}

const PAGE_SIZE_POR_DEFECTO = 20;
const PAGE_SIZE_MAX = 100;

// Los query params siempre llegan como texto, así que hay que convertir
// antes de comparar. Un valor ausente toma el default; uno inválido es
// error, porque ?page=abc casi siempre es un bug del cliente y es peor
// devolverle la pagina 1 en silencio.
function aEnteroPositivo(valor) {
  if (valor === undefined || valor === "") return undefined;
  if (!/^\d+$/.test(String(valor))) return null;
  const numero = Number(valor);
  return numero >= 1 ? numero : null;
}

function validarPaginacion(query) {
  const errores = [];
  const datos = {};

  const page = aEnteroPositivo(query.page);
  if (page === null) {
    errores.push({ campo: "page", mensaje: "page debe ser un entero mayor o igual a 1" });
  } else {
    datos.page = page === undefined ? 1 : page;
  }

  const pageSize = aEnteroPositivo(query.pageSize);
  if (pageSize === null) {
    errores.push({
      campo: "pageSize",
      mensaje: `pageSize debe ser un entero entre 1 y ${PAGE_SIZE_MAX}`
    });
  } else if (pageSize !== undefined && pageSize > PAGE_SIZE_MAX) {
    errores.push({
      campo: "pageSize",
      mensaje: `pageSize no puede ser mayor a ${PAGE_SIZE_MAX}`
    });
  } else {
    datos.pageSize = pageSize === undefined ? PAGE_SIZE_POR_DEFECTO : pageSize;
  }

  return { valido: errores.length === 0, errores, datos };
}

// Filtros del listado. Son opcionales y combinables; cada uno se valida
// contra las listas del dominio para que un valor inventado se rechace
// aqui y no llegue a la base como error de tipo.
function validarFiltros(query) {
  const errores = [];
  const datos = {};

  const porLista = {
    estado: ESTADOS,
    prioridad: PRIORIDADES,
    categoria: CATEGORIAS
  };

  for (const [campo, permitidos] of Object.entries(porLista)) {
    const valor = query[campo];
    if (valor === undefined || valor === "") continue;

    if (!permitidos.includes(valor)) {
      errores.push({
        campo,
        mensaje: `${campo} debe ser uno de: ${permitidos.join(", ")}`
      });
    } else {
      datos[campo] = valor;
    }
  }

  // El tecnico se puede filtrar por id, o pedir los que no tienen
  // ninguno asignado con tecnico_id=ninguno.
  const tecnico = query.tecnico_id;
  if (tecnico !== undefined && tecnico !== "") {
    if (tecnico === "ninguno") {
      datos.sin_tecnico = true;
    } else {
      const id = aEnteroPositivo(tecnico);
      if (id === null || id === undefined) {
        errores.push({
          campo: "tecnico_id",
          mensaje: "tecnico_id debe ser un entero positivo o la palabra ninguno"
        });
      } else {
        datos.tecnico_id = id;
      }
    }
  }

  return { valido: errores.length === 0, errores, datos };
}

function validarId(valor) {
  const id = aEnteroPositivo(valor);
  return id === null || id === undefined ? null : id;
}

module.exports = {
  validarNuevoIncidente,
  validarPaginacion,
  validarFiltros,
  validarId,
  TITULO_MIN,
  TITULO_MAX,
  DESCRIPCION_MIN,
  PAGE_SIZE_POR_DEFECTO,
  PAGE_SIZE_MAX
};
