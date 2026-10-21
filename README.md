# TecniSoporte

Sistema web de gestión de incidentes de TI. Proyecto integrador DevOps — Análisis de Sistemas II, Universidad Mariano Gálvez.

> El README se completa en la semana 3 (Task *"Actualizar README y ensayar la demo de punta a punta"*). Por ahora cubre cómo levantar el proyecto y qué expone la API.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL 16 (Docker) |
| Pruebas | Jest + Supertest |
| CI/CD | Azure Pipelines (self-hosted agent) + GitHub Actions |

## Requisitos

- Node.js 20 o superior
- Docker y Docker Compose
- Git

## Puertos

No son los de por defecto, porque en la máquina de desarrollo hay otros proyectos ocupando el 5432 y el 3000.

| Servicio | Puerto |
|---|---|
| Frontend | 5173 |
| API | 3100 |
| PostgreSQL | 5435 |

## Todo con Docker

Es la forma más rápida de ver el sistema funcionando. Levanta base, API y frontend.

```bash
git clone <url-del-repo>
cd incident

cp .env.example .env
# edita .env y pon tus valores locales

docker compose --env-file .env -f devops/docker-compose.yml up -d --build
```

Luego abre <http://localhost:5173>.

El `--env-file .env` es necesario: sin él, Compose busca el archivo junto al `docker-compose.yml`, que está en `devops/`, y la contraseña de Postgres queda vacía.

## En modo desarrollo

Útil cuando se está programando, porque trae recarga automática.

```bash
# Solo la base de datos en Docker
docker compose --env-file .env -f devops/docker-compose.yml up -d db

# Backend, en una terminal
cd backend && npm ci && npm run dev     # http://localhost:3100

# Frontend, en otra terminal
cd frontend && npm ci && npm run dev    # http://localhost:5173
```

El frontend lee la URL de la API de `frontend/.env`; copia el `.env.example` de esa carpeta si no existe.

## Scripts

| Carpeta | Comando | Qué hace |
|---|---|---|
| backend | `npm run dev` | Levanta la API con recarga automática |
| backend | `npm start` | Levanta la API |
| backend | `npm test` | Corre la suite de pruebas |
| backend | `npm run lint` | Analiza el código con ESLint |
| frontend | `npm run dev` | Levanta Vite con recarga automática |
| frontend | `npm run build` | Compila a `dist/` |

## API

Todo cuelga de `/api`. Por ejemplo, el listado es `http://localhost:3100/api/incidents`.

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

### Estados de un incidente

```
NUEVO → ASIGNADO → EN_PROCESO → RESUELTO → CERRADO
```

El flujo es de un solo sentido. Cualquier otro salto responde 409, e incluye en la respuesta el estado actual y las transiciones que sí son posibles.

### Ejemplo

```bash
curl -X POST http://localhost:3100/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"titulo":"No tengo internet","descripcion":"Ninguna maquina del area conecta.","categoria":"RED","prioridad":"ALTA","usuario_id":1}'
```

## Documentación

Toda la documentación del proceso está en [`docs/`](docs/): arquitectura, convención de ramas, deuda técnica, seguridad, dependencias y estrategia de release.

## Responsable

Maynor Amílcar Poz Hernández — carné 2323759
