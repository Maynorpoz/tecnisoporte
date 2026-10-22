# Deuda técnica

Qué deuda tiene TecniSoporte, de dónde salió cada una y en qué orden la voy a pagar.

Ninguna de estas deudas salió de una revisión hecha al final. Las fui anotando en la autorevisión de cada pull request, en el momento en que tomaba el atajo, y cada una dice en qué PR quedó registrada. Este documento las junta en un solo lugar para poder priorizarlas.

## Cómo se prioriza

Cada deuda tiene un impacto, que es lo que pasa si no se paga, y un esfuerzo, que es lo que cuesta pagarla. La prioridad sale de cruzar las dos cosas: es alta cuando el daño posible es serio o cuando arreglarla es tan barato que no tiene sentido seguir cargándola. Una deuda de impacto bajo y esfuerzo alto se queda abierta a propósito.

## Registro

| # | Deuda | Detectada en | Impacto | Esfuerzo | Prioridad | Estado |
|---|---|---|---|---|---|---|
| D1 | Manejo de errores repetido en cada ruta | PR 1, 4 y 5 | Medio | Bajo | Alta | Pagada en PR 21 |
| D2 | Validación de parámetros repetida en las rutas | PR 5, 15 y 18 | Medio | Bajo | Alta | Pagada en PR 22 |
| D3 | Las pruebas borran la base sin revisar cuál es | PR 9 | Alto | Muy bajo | Alta | Pagada en PR 23 |
| D4 | Catálogos escritos en tres lugares | PR 4, 6 y 19 | Medio | Medio | Media | Abierta |
| D5 | El frontend no tiene pruebas automatizadas | PR 19 | Medio | Medio | Media | Abierta |
| D6 | El detalle concentra demasiadas responsabilidades | PR 6 y 16 | Medio | Medio | Media | Abierta |
| D7 | Base de pruebas compartida entre la máquina local y el pipeline | PR 10 y 12 | Medio | Bajo | Media | Abierta |
| D8 | Pool de conexiones sin límites | PR 1 | Bajo | Bajo | Baja | Abierta |
| D9 | Autor de los comentarios como texto libre | PR 3 | Bajo | Alto | Baja | Abierta |
| D10 | Seed con ids escritos a mano | PR 3 | Bajo | Bajo | Baja | Abierta |
| D11 | Sin migraciones: los cambios de esquema no llegan a bases existentes | PR 30 | Medio | Medio | Media | Abierta |

## Las deudas

**D1. Manejo de errores repetido en cada ruta.** Cada endpoint tiene su propio try/catch que hace console.error y devuelve un 500 con un mensaje propio. Hoy son nueve bloques casi iguales en cuatro archivos. El riesgo no es que fallen, es que divergen: basta con que en uno se cuele el error.message para filtrar detalles de la base al cliente. Se paga con un middleware único de errores en la rama refactor/manejo-errores.

**D2. Validación de parámetros repetida en las rutas.** La respuesta 400 para un id inválido está copiada cinco veces. Además, en el listado uno a mano los errores de dos validadores, la función que convierte enteros devuelve tres cosas distintas según el caso, y la validación de la nota corta en el primer error mientras las demás los acumulan. Se paga sacando todo eso a un módulo compartido en la rama refactor/validaciones.

**D3. Las pruebas borran la base sin revisar cuál es.** La suite hace DROP SCHEMA antes de correr. La única protección es que la base de pruebas está en otra variable de entorno, así que un error en el .env borraría la base de desarrollo completa. Arreglarlo es una línea: negarse a correr si el nombre de la base no termina en _test. Es la más barata del registro y la que más daño puede hacer, por eso va primero después de los dos refactor.

**D4. Catálogos escritos en tres lugares.** Las categorías, prioridades y estados existen como tipos en el SQL, como listas en el backend y otra vez como listas en el frontend. Si alguien agrega una categoría en un solo lugar, el formulario no la ofrece o la base la rechaza con un 500. Lo correcto es que la API exponga los catálogos y el frontend los pida al cargar.

**D5. El frontend no tiene pruebas automatizadas.** Las 60 pruebas cubren solo el backend. En el PR 19 encontré dos errores probando la pantalla a mano, y el pipeline los habría dejado pasar en verde. Se paga con Vitest y Testing Library, empezando por el listado.

**D6. El detalle concentra demasiadas responsabilidades.** DetalleIncidente maneja el incidente, los técnicos, los usuarios, la bitácora, la asignación y el cambio de estado. Además pide los datos de una forma distinta al listado. Lo que corresponde es un hook que concentre las llamadas y el estado de carga.

**D7. Base de pruebas compartida entre la máquina local y el pipeline.** El puerto 5436 está escrito en tres archivos, y el compose de pruebas usa el mismo nombre de proyecto en mi máquina y en el agente. Esto ya hizo daño: el build 20 falló con "password authentication failed" porque el pipeline tomó el contenedor que yo había dejado levantado, que tenía otra contraseña. Se paga leyendo el puerto y el nombre del proyecto de variables, con un nombre distinto para el pipeline.

**D8. Pool de conexiones sin límites.** El pool de pg usa los valores por defecto, sin máximo de conexiones ni timeouts. En local no importa. Hay que ajustarlo antes de tratar staging y producción como ambientes reales.

**D9. Autor de los comentarios como texto libre.** El autor de la bitácora es el nombre que se elige en el frontend y no una llave foránea, porque el proyecto no tiene login. Si un técnico cambia de nombre, sus comentarios viejos conservan el anterior. Pagarla implica tener usuarios autenticados, y eso quedó fuera del alcance.

**D10. Seed con ids escritos a mano.** El seed asume que los ids empiezan en 1, cosa que solo se cumple con la base recién creada. Como el seed corre una sola vez, cuando Docker crea el volumen, hoy no causa problemas.

**D11. Sin migraciones.** El esquema se aplica una sola vez, cuando Docker crea el volumen de la base. Mientras no cambie, no pasa nada; pero si una versión futura agrega una columna a `01-schema.sql`, los ambientes que ya existen no la reciben, y la API nueva fallaría contra la base vieja. Salió al escribir la estrategia de release. Se paga con una herramienta de migraciones que aplique en orden los cambios pendientes en cada despliegue.

## Deuda que ya se pagó

Dos deudas se pagaron antes de este documento, y vale la pena registrarlas porque muestran el ciclo completo.

En el PR 5 anoté que el conteo de la paginación contaba la tabla completa y que el total iba a salir mal en cuanto hubiera filtros. Se pagó en el PR 18, con la Task 21: la consulta de la página y la del total ahora usan el mismo WHERE.

En el PR 6 anoté que la página del listado vivía en el estado del componente, así que se perdía al volver de un detalle. Se pagó en el PR 19, con la Task 22, al pasar los filtros y la página al query string.

La D1, el manejo de errores repetido, se pagó en el PR 21 con la Task 51. Las rutas ya no atrapan sus propios errores: un middleware al final de app.js es el único lugar que responde un 500, con un mensaje genérico. Al hacerlo apareció que el riesgo ya era real: un JSON mal formado devolvía una página HTML con el stack trace y las rutas del disco del servidor. Ahora es un 400 en JSON.

La D2, la validación repetida, se pagó en el PR 22 con la Task 52. El 400 del id inválido se valida una sola vez por router con router.param, en lugar de estar copiado en cinco rutas. Las piezas comunes quedaron en validation/comun.js: la función que lee enteros devuelve campos con nombre en vez de undefined, null o el número, todos los validadores devuelven la misma forma, y los errores de varios validadores se juntan con una función en lugar de a mano.

La D3, las pruebas que podían borrar otra base, se pagó en el PR 23 con la Task 64. Antes de cargar cualquier módulo, la suite revisa que el nombre de la base termine en _test y se detiene si no. Lo probé apuntando la variable a la base de desarrollo: la suite se negó a correr y la base quedó intacta.

## Lo que no está aquí

Hay comentarios de revisión que parecen deuda pero no lo son. El uso de ENUM en la base, el flujo lineal de estados y las tres consultas para asignar un técnico fueron decisiones tomadas a sabiendas, con su motivo escrito en el PR. No hay nada que pagar.

Los hallazgos de seguridad, como el CORS abierto, el mensaje de error de la base en el health y las acciones de GitHub sin fijar por commit, van en docs/seguridad.md. Las vulnerabilidades de paquetes están en docs/dependencias.md.

## Cuándo se actualiza

En cada PR. Si la autorevisión deja una deuda nueva, se agrega aquí en el mismo PR. Si un PR paga una, se mueve a la sección de pagadas con el número del PR que la cerró.
