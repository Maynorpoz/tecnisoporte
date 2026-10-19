# Convención de ramas y commits

Este es el flujo que sigo en el repo. Es un proyecto individual, así que no hay reglas de equipo que negociar, pero igual uso el ciclo completo porque la trazabilidad es lo que se califica.

## El ciclo

Nada entra a `main` sin pasar por aquí:

```
Task en Boards -> rama -> commits con AB#<id> -> Pull Request -> merge
```

Todo cambio nace de una Task del tablero. Si voy a hacer algo que no tiene Task, primero creo la Task.

## Ramas

`main` es la única rama permanente y siempre tiene que estar estable. No acepta push directo, lo bloquean las políticas del repositorio.

El trabajo va en ramas temporales, nombradas con el id del work item y una descripción corta en minúsculas:

- `feature/<id>-<descripcion>` para funcionalidad nueva
- `fix/<id>-<descripcion>` para corregir errores
- `refactor/<id>-<descripcion>` para pagar deuda técnica, sin cambiar comportamiento

Por ejemplo `feature/32-estructura-inicial` o `fix/48-validacion-estados`.

La rama se borra al mergear. El Pull Request conserva el nombre, así que el historial no se pierde.

## Commits

El mensaje lleva un tipo, una descripción en presente y el work item al final:

```
feat: agrega endpoint para crear incidentes

AB#6
```

Los tipos que uso son `feat`, `fix`, `refactor`, `docs`, `test`, `chore` y `ci`.

El `AB#<id>` es lo importante. Azure lo detecta solo y enlaza el commit con el work item, que es de donde sale la trazabilidad. Un commit sin eso queda huérfano.

Si un commit no cabe en una línea, dejo una línea en blanco y explico abajo qué hice y por qué.

## Pull Requests

Cada PR describe qué hace, con qué work item va y cómo lo validé. Como trabajo solo, no hay un segundo revisor, así que el peso lo cargan las políticas automáticas y la autorevisión: leo mi propio diff, dejo comentarios sobre lo que no me convence, lo corrijo en commits aparte y marco los hilos como resueltos.

Esos commits de corrección los dejo separados a propósito. Si hago squash al mergear, se colapsan en uno y se pierde la evidencia de que hubo revisión.

## Lo que protege main

Las políticas configuradas en el repositorio son tres, y las tres bloquean el merge:

- Mínimo un revisor, con auto-aprobación permitida porque soy el único usuario.
- Work item vinculado obligatorio.
- Comentarios resueltos antes de completar.

Desde la semana 2 se agrega una cuarta: el pipeline tiene que pasar en verde. Esa es la que convierte el PR en evidencia de validación real.

## Cuando algo sale mal

Si el pipeline falla o encuentro un error ya mergeado, no lo arreglo directo en `main`. Abro un Bug o una Task en el tablero, trabajo en una rama `fix/*` y entra por PR como todo lo demás. Es más lento, pero el historial queda completo y eso es justamente lo que se pide.
