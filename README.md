# TecniSoporte

Sistema web de gestión de incidentes de TI. Proyecto integrador DevOps — Análisis de Sistemas II, Universidad Mariano Gálvez.

Un usuario reporta un incidente, un técnico lo toma y lo lleva de NUEVO a CERRADO dejando una bitácora de lo que hizo, y el jefe de TI ve la carga y los pendientes en un dashboard. La aplicación es el medio: lo que este proyecto demuestra es el proceso con el que se construyó, desde el backlog hasta prod.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Backlog, sprints y work items | [Azure Boards](https://dev.azure.com/devopsmaynor/incident/_boards) |
| Repositorio principal y Pull Requests | [Azure Repos](https://dev.azure.com/devopsmaynor/incident/_git/incident) |
| Pipeline de CI/CD y ambientes | [Azure Pipelines](https://dev.azure.com/devopsmaynor/incident/_build) |
| Espejo con GitHub Actions | [GitHub](https://github.com/Maynorpoz/tecnisoporte) |
| Decisiones del proceso | [`docs/`](docs/) |
| Cambios por versión | [`CHANGELOG.md`](CHANGELOG.md) |

## Cómo se trabaja

Ningún cambio entra a `main` sin pasar por este ciclo:

```
Task en Boards -> rama -> commits con AB#<id> -> Pull Request -> pipeline -> merge -> dev -> staging -> aprobación -> prod
```

Cada PR necesita un work item vinculado, la autorevisión con sus comentarios resueltos y el build en verde. Después del merge, el pipeline construye las imágenes una sola vez y las promueve por los tres ambientes; prod espera una aprobación manual. El detalle está en [`docs/branching.md`](docs/branching.md) y [`docs/release.md`](docs/release.md).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite, con Recharts en el dashboard |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL 16 en Docker |
| Pruebas | Jest + Supertest |
| CI/CD | Azure Pipelines con agente autohospedado, más GitHub Actions |
| Despliegue | Docker Compose, un stack por ambiente, con nginx delante del frontend |

## Requisitos

- Node.js 20.19 o superior, o 22.12 o superior. Vite 8 no compila con versiones anteriores
- Docker Desktop con Docker Compose
- Git

## Instalación

```bash
git clone https://github.com/Maynorpoz/tecnisoporte.git
cd tecnisoporte

cp .env.example .env
cp frontend/.env.example frontend/.env
```

En el `cmd` de Windows el comando es `copy` en lugar de `cp`, y la ruta va con barra invertida: `copy frontend\.env.example frontend\.env`.

Edita los dos `.env` con tus valores locales. En el `.env` de la raíz, la misma contraseña va en `POSTGRES_PASSWORD` y dentro de las dos URL de conexión. Ninguno se sube al repositorio. Qué es secreto y dónde vive cada cosa está en [`docs/seguridad.md`](docs/seguridad.md).

## Ejecución

### Todo con Docker

La forma más rápida de ver el sistema funcionando. Levanta la base, la API y el frontend.

```bash
docker compose --env-file .env -f devops/docker-compose.yml up -d --build
```

Luego abre <http://localhost:5173>.

El `--env-file .env` es necesario: sin él, Compose busca el archivo junto al `docker-compose.yml`, que está en `devops/`, y la contraseña de Postgres queda vacía.

### En modo desarrollo

Con recarga automática, para programar.

```bash
# Solo la base de datos en Docker
docker compose --env-file .env -f devops/docker-compose.yml up -d db

# Backend, en una terminal
cd backend && npm ci && npm run dev     # http://localhost:3100

# Frontend, en otra terminal
cd frontend && npm ci && npm run dev    # http://localhost:5173
```

### Pruebas

Las pruebas usan su propia base, en otro contenedor y en el puerto 5436, para no tocar los datos de desarrollo. Es la que apunta `TEST_DATABASE_URL` en el `.env`. No hace falta tener encendida la base de desarrollo, y la suite se niega a correr si el nombre de la base no termina en `_test`.

```bash
docker compose --env-file .env -f devops/docker-compose.test.yml up -d --wait
cd backend && npm test
docker compose --env-file .env -f devops/docker-compose.test.yml down -v
```

Son 94 pruebas, entre unitarias y de API. Conviene bajar esa base al terminar: el pipeline usa el mismo contenedor en esta máquina, y si la encuentra levantada con otra contraseña, el build falla.

## Puertos

No son los de por defecto, porque en la máquina de desarrollo hay otros proyectos ocupando el 5432 y el 3000.

| Servicio | Puerto |
|---|---|
| Frontend en desarrollo | 5173 |
| API en desarrollo | 3100 |
| PostgreSQL de desarrollo | 5435 |
| PostgreSQL de pruebas | 5436 |
| Ambiente dev | 8110 |
| Ambiente staging | 8120 |
| Ambiente prod | 8130 |

Los tres ambientes los levanta el pipeline, no se levantan a mano. En cada uno, nginx sirve el frontend y reenvía `/api` a la API de ese mismo ambiente.

## Pipeline

En un Pull Request corre solo la etapa CI. Con el merge a `main` corre todo:

| Etapa | Qué hace |
|---|---|
| Build, pruebas y empaquetado | Lint, compilación del frontend, la suite completa contra una base efímera, revisión de dependencias y el artefacto |
| Construir imágenes | La imagen de la API y la del frontend, etiquetadas con el número de build |
| Desplegar en dev | Levanta el ambiente y le hace una prueba de humo |
| Desplegar en staging | Igual, solo si dev pasó |
| Desplegar en prod | Espera la aprobación manual, después despliega y prueba |

El workflow de GitHub Actions corre la misma validación en Linux en cada push al espejo.

## Versiones

Versionado semántico con tags de git. Cada entregable semanal tiene su tag, y la 1.0.0 es la versión de la entrega. Lo que trae cada una está en [`CHANGELOG.md`](CHANGELOG.md).

Para saber qué versión corre en un ambiente:

```bash
docker inspect --format "{{.Config.Image}}" tecnisoporte-prod-api
```

## API

Todo cuelga de `/api`. Por ejemplo, el listado en desarrollo es `http://localhost:3100/api/incidents`.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/health` | Dice si la API responde y si alcanza la base |
| POST | `/incidents` | Crea un incidente. Devuelve 400 con el campo que falló |
| GET | `/incidents` | Listado paginado con `page` y `pageSize`. Filtra por `estado`, `prioridad`, `categoria` y `tecnico_id`, que acepta `ninguno` para los que no tienen técnico |
| GET | `/incidents/:id` | Detalle. 404 si no existe |
| PATCH | `/incidents/:id/asignar` | Asigna técnico y mueve el incidente a ASIGNADO |
| PATCH | `/incidents/:id/estado` | Cambia el estado. 409 si la transición no es válida. Al pasar a RESUELTO exige una `nota` que queda en la bitácora |
| GET | `/incidents/:id/comments` | Bitácora del incidente |
| POST | `/incidents/:id/comments` | Agrega una entrada a la bitácora. 409 si el incidente está cerrado |
| GET | `/metrics` | Indicadores del dashboard: resumen y distribución por estado, categoría, prioridad y técnico |
| GET | `/users` | Usuarios que pueden reportar |
| GET | `/technicians` | Técnicos activos |

El flujo de estados es de un solo sentido:

```
NUEVO → ASIGNADO → EN_PROCESO → RESUELTO → CERRADO
```

Cualquier otro salto responde 409, con el estado actual y las transiciones que sí son posibles.

```bash
curl -X POST http://localhost:3100/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"titulo":"No tengo internet","descripcion":"Ninguna maquina del area conecta.","categoria":"RED","prioridad":"ALTA","usuario_id":1}'
```

## Documentación

| Documento | Qué responde |
|---|---|
| [`docs/arquitectura.md`](docs/arquitectura.md) | Cómo está armado el sistema y por qué |
| [`docs/branching.md`](docs/branching.md) | Ramas, commits y Pull Requests |
| [`docs/deuda-tecnica.md`](docs/deuda-tecnica.md) | Qué deuda hay, cuál se pagó y en qué orden va el resto |
| [`docs/dependencias.md`](docs/dependencias.md) | Vulnerabilidades de paquetes y la decisión tomada con cada una |
| [`docs/seguridad.md`](docs/seguridad.md) | Secretos, qué hacer ante una fuga y hallazgos de seguridad |
| [`docs/release.md`](docs/release.md) | Ambientes, controles antes de prod y cómo volver atrás |

## Responsable

Maynor Amílcar Póz Hernández — carné 2323759

Proyecto individual: el backlog, el código, la revisión y las aprobaciones de prod son de la misma persona.
