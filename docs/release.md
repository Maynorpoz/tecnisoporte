# Estrategia de release

Cómo se genera cada versión de TecniSoporte, por dónde pasa antes de llegar a prod y qué hacer si una versión sale mal.

## El camino de un cambio

```
PR  ->  validación  ->  merge a main  ->  imágenes  ->  dev  ->  staging  ->  aprobación  ->  prod
```

Ningún cambio llega a un ambiente sin pasar por un Pull Request, y ninguno llega a prod sin que yo lo apruebe a mano.

En el PR corre solo la etapa CI. Con el merge, el mismo pipeline sigue de largo: construye las imágenes, despliega en dev, despliega en staging y se detiene antes de prod a esperar la aprobación.

## Los ambientes

| Ambiente | Puerto | Cuándo se despliega | Qué lo protege |
|---|---|---|---|
| dev | 8110 | Solo, con cada merge a main | Las pruebas de la etapa CI |
| staging | 8120 | Solo, si dev pasó su prueba de humo | La prueba de humo de dev |
| prod | 8130 | Cuando lo apruebo en Azure DevOps | La prueba de humo de staging y la aprobación manual |

Los tres corren en la máquina del agente, cada uno como un stack de Docker separado, con su propia red, su propio volumen de datos y su propia base. Prod usa una contraseña distinta a la de los otros dos.

## Los controles antes de prod

Un cambio tiene que pasar todo esto, en este orden.

**Las políticas del PR.** Work item vinculado, revisión aprobada, comentarios resueltos y build en verde. Sin las cuatro, Azure no deja mergear. El detalle está en `docs/branching.md`.

**La etapa CI.** Lint del backend, compilación del frontend, la suite completa de pruebas contra una base que el pipeline crea y destruye, y la revisión de dependencias, que detiene el build ante cualquier vulnerabilidad crítica.

**Una sola compilación.** Las imágenes se construyen una vez por build y se etiquetan con su número. Dev, staging y prod despliegan esa misma imagen, no una recompilación. Lo que se aprobó en staging es exactamente lo que llega a prod.

**Las pruebas de humo.** Después de cada despliegue, el pipeline entra por nginx como lo haría un usuario y pide la página, el health, las métricas y el listado. Si algo no responde 200, o si la API no alcanza su base, el build falla y la versión no avanza al siguiente ambiente.

**La aprobación manual.** Es un check del environment `tecnisoporte-prod`, configurado en Azure DevOps y no en el YAML. Así nadie puede saltarse la aprobación editando el pipeline en una rama: cambiarla exige permisos sobre el environment. Cada aprobación queda registrada con quién la dio y cuándo.

## Cómo se numera una versión

Hay dos números, y cada uno sirve para algo distinto.

El **número de build** identifica una compilación concreta. Es la etiqueta de las imágenes, así que con él se sabe exactamente qué está corriendo en cada ambiente:

```
docker inspect --format "{{.Config.Image}}" tecnisoporte-prod-api
```

La **versión semántica** identifica un entregable. Mientras empiece en 0, cada entrega semanal sube el número del medio; la 1.0.0 es la versión final. Cada versión es un tag de git sobre el merge que la cerró, y lo que trae cada una está en `CHANGELOG.md`.

## Cómo se publica una versión

1. En un PR, actualizar `CHANGELOG.md` y la versión de los dos `package.json`.
2. Mergear. El pipeline despliega solo en dev y staging.
3. Revisar staging en el puerto 8120 y aprobar prod.
4. Crear el tag anotado sobre el commit del merge y subirlo a los dos remotos:

```
git tag -a v1.0.0 <commit> -m "TecniSoporte 1.0.0"
git push origin v1.0.0
git push github v1.0.0
```

El alias `git espejo` solo sincroniza `main`, así que los tags se suben aparte.

## Si una versión sale mal

Si una prueba de humo falla, el ambiente donde falló ya quedó con la versión nueva, pero los que siguen no la reciben. Una falla en staging nunca llega a prod: el pipeline se detiene ahí, sin que haya que hacer nada.

Si el problema aparece en prod después de aprobar, se vuelve atrás revirtiendo el merge que lo causó. Azure Repos tiene un botón **Revert** en el PR completado: crea una rama con el revert y abre un PR nuevo. Al mergearlo, la versión anterior del código vuelve a pasar por dev y staging y pide aprobación para prod, como cualquier otro cambio.

No sirve lanzar el pipeline a mano sobre el tag de una versión vieja. Las etapas de despliegue solo corren para `main`, y además ese build usaría el pipeline tal como estaba en aquel commit. Revertir es más lento que redesplegar una imagen, pero la versión vieja vuelve a pasar por todos los controles y el historial muestra qué se deshizo y por qué.

Lo que el rollback no deshace son los cambios en la base. El esquema solo se aplica cuando se crea el volumen, así que hoy ningún despliegue modifica una base existente y no hay nada que revertir. Esa misma limitación es un problema hacia adelante: un cambio futuro a `01-schema.sql` no llegaría a los ambientes ya creados. Está registrado como deuda D11 en `docs/deuda-tecnica.md`.

## Los datos de cada ambiente

Los tres ambientes cargan el seed al crear su base, incluido prod. No es lo ideal, pero es consecuencia de no tener login: los usuarios que reportan y los técnicos solo existen si la base los trae, y sin ellos prod no serviría para nada. En una instalación real, ese catálogo vendría del directorio de la organización y el seed de prueba no llegaría a prod.

## Lo que esta estrategia no cubre

Todo corre en una sola máquina, que es también el agente. Con servidores separados, las imágenes tendrían que subirse a un registro de contenedores y cada ambiente las bajaría de ahí. Tampoco hay despliegue sin interrupción: al levantar una versión nueva, el ambiente deja de responder unos segundos mientras se reemplazan los contenedores.
