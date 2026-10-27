# Cuentas y revisión de PR en un proyecto individual

El catedrático autorizó trabajar con una sola cuenta por ser proyecto individual, así que la regla del PDF que pide integrantes con contribuciones verificables no aplica. Este documento explica cómo quedó configurado el proyecto para que la revisión siga teniendo valor con una sola persona.

## La cuenta

| Qué | Valor |
|---|---|
| Organización | `dev.azure.com/devopsmaynor` |
| Proyecto | `incident` |
| Usuario único | `mpozh@miumg.edu.gt` |

No se crearon cuentas adicionales. Con una sola persona tampoco hizo falta invitar usuarios externos a la organización.

## La revisión sin un segundo revisor

El PDF pide PRs "con descripción, revisión y evidencia de validación". Con un solo usuario no existe la revisión de un tercero, así que el peso de la evidencia lo cargan dos cosas: las políticas automáticas de `main` y la autorevisión.

### Las políticas de `main`

Configuradas en *Project Settings → Repositories → incident → Policies → main*. Las cuatro bloquean el merge:

| Política | Configuración | Qué asegura |
|---|---|---|
| Mínimo de revisores | 1, con auto-aprobación permitida | Que todo entre por PR, nunca por push directo |
| Work items vinculados | Obligatoria | Que cada PR quede amarrado a su work item |
| Resolución de comentarios | Obligatoria | Que ninguna observación quede abierta al mergear |
| Validación del build | El pipeline, obligatorio | Que el código pase lint, pruebas y revisión de dependencias antes de entrar |

La combinación de work item vinculado, build en verde y comentarios resueltos es lo que reemplaza al revisor humano. Un PR que no se puede mergear hasta que el pipeline pasa es validación real, no simbólica.

### La autorevisión

En los PRs leí mi propio diff y dejé comentarios sobre las líneas que no me convencían, cada uno con su respuesta. Cuando el comentario señalaba un error, lo corregí en un commit aparte dentro del mismo PR y marqué el hilo como resuelto; cuando era una decisión, la respuesta explica por qué se quedó así.

Varios de esos comentarios terminaron siendo deuda técnica registrada en `docs/deuda-tecnica.md`, y otros encontraron errores antes del merge, como los dos del PR 19.

Las descripciones de los PRs están escritas en prosa: qué hace el cambio, con qué work item va, qué decidí y cómo lo validé.

## La aprobación de prod

El environment `tecnisoporte-prod` tiene un check de aprobación manual, configurado en *Pipelines → Environments → tecnisoporte-prod → Approvals and checks*. Soy el único aprobador.

Azure permite que quien dispara una ejecución también la apruebe, y con una sola cuenta esa opción tiene que estar permitida; si no, el despliegue a prod se quedaría esperando para siempre. Lo que asegura la aprobación es una pausa deliberada después de revisar staging, y queda registrada con fecha y sobre qué build se dio.

## Lo demás no cambia

Las otras condiciones del PDF (ramas, trazabilidad, deuda técnica, pipeline, fallo controlado, agente autohospedado, secretos, GitHub Actions, dependencias, versionado y release) se cumplen igual con un solo usuario.
