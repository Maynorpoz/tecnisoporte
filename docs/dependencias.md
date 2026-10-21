# Análisis de dependencias

Cómo reviso las dependencias de TecniSoporte, qué encontré y qué decidí con cada hallazgo.

## Cómo se revisa

Con `npm audit`, que compara el árbol de dependencias contra la base de avisos de seguridad de npm. Corre en tres lugares:

- A mano, cuando agrego o actualizo un paquete
- En el pipeline de Azure, en los pasos de revisión de dependencias
- En el workflow de GitHub Actions, en cada push y cada pull request

En los dos CI el umbral es el mismo: **solo una vulnerabilidad crítica detiene la entrega**. Si fueran distintos tendría dos sistemas contradiciéndose, y acabaría ignorando al más estricto.

## Qué encontré

La primera revisión completa, el 19 de octubre, dio esto:

| Proyecto | Total | Críticas | Altas | Moderadas |
|---|---|---|---|---|
| Backend | 33 | 0 | 28 | 5 |
| Frontend | 0 | 0 | 0 | 0 |

Las 33 del backend salían de solo dos paquetes raíz, los dos arrastrados por `jest`:

**`braces`, severidad alta.** Denegación de servicio por agotamiento de pila con patrones muy anidados. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)

**`sprintf-js`, severidad moderada.** Denegación de servicio por especificadores de precisión sin límite, en versiones hasta la 1.1.3. [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)

El frontend no tiene ninguna, lo cual tiene sentido: son 8 dependencias de producción contra 91 del backend.

## Qué hice

**Actualicé jest de 29 a 30.** Era un cambio de versión mayor, así que podía romper las pruebas. Lo probé antes de decidir: las 34 pruebas siguen pasando y `jest-junit` sigue generando el reporte que el pipeline publica.

Con eso las 28 altas desaparecieron. Quedan 19 moderadas, todas de `sprintf-js`.

| Después de actualizar | Total | Críticas | Altas | Moderadas |
|---|---|---|---|---|
| Backend | 19 | 0 | 0 | 19 |
| Frontend | 0 | 0 | 0 | 0 |

## Las 19 que quedan: acepto el riesgo

`npm audit fix --force` propone resolverlas bajando a **jest 25**, una versión de 2019. Eso no es un arreglo: cambiaría una denegación de servicio en una herramienta de desarrollo por seis años de parches de seguridad sin aplicar, y casi con seguridad rompería la suite.

Las acepto por tres razones, en orden de peso:

**1. No llegan a producción.** El `Dockerfile` del backend instala con `npm ci --omit=dev`, así que las dependencias de desarrollo no entran a la imagen. Lo comprobé en lugar de suponerlo:

```
$ docker run --rm --entrypoint sh incident-hub-api -c 'ls node_modules | wc -l'
97

jest          ausente
jest-junit    ausente
supertest     ausente
eslint        ausente
braces        ausente
sprintf-js    ausente
micromatch    ausente

express       presente
pg            presente
dotenv        presente
cors          presente
```

97 paquetes en la imagen contra 441 en desarrollo. Los paquetes vulnerables literalmente no existen en lo que se despliega.

**2. El vector de ataque no aplica.** Las dos son denegación de servicio procesando entradas maliciosas. En este proyecto quien le da entrada a jest soy yo, con mis propios archivos de prueba. No hay un atacante del otro lado.

**3. Ninguna es crítica.** Que es exactamente donde puse el umbral de los dos CI.

## Recharts en el frontend

El 21 de octubre agregué Recharts para la gráfica del dashboard. Es la primera dependencia nueva de producción desde este análisis, así que la medí antes de quedarme con ella.

Las dependencias de producción del frontend pasaron de 8 a 47, porque Recharts trae su propio manejo de estado. `npm audit` sigue en cero vulnerabilidades. La fijé en la versión exacta, 3.10.1, sin el ^, para que una actualización no entre sin pasar por un PR.

El peso sí era un problema: Recharts solo ocupa más que todo el resto de la aplicación. Por eso el dashboard se carga de forma diferida. El bundle principal quedó prácticamente igual, en 87 kB comprimido, y Recharts va en un archivo aparte de 108 kB que solo se descarga al abrir el dashboard.

## Cuándo lo vuelvo a mirar

- Cada vez que el pipeline reporte una **crítica**, que detiene la entrega y hay que resolverla antes de seguir
- Cada vez que una vulnerabilidad toque una dependencia de **producción**, sin importar la severidad, porque ahí sí llega a la imagen
- Al cerrar el proyecto, para dejar el estado final documentado

## Lo que no cubre este análisis

`npm audit` solo ve vulnerabilidades ya publicadas en la base de npm. No detecta paquetes abandonados, ni dependencias que alguien podría sustituir, ni problemas en el código propio. Para esto último está el lint y las pruebas; lo demás queda fuera del alcance del proyecto.
