# IT Incident

Sistema web de gestión de incidentes de TI. Proyecto integrador DevOps — Análisis de Sistemas II, Universidad Mariano Gálvez.

> Este README se completa en la semana 3 (Task *"Actualizar README y ensayar la demo de punta a punta"*). Por ahora cubre lo mínimo para levantar el proyecto.

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

## Documentación

Toda la documentación del proceso está en [`docs/`](docs/): arquitectura, convención de ramas, deuda técnica, seguridad, dependencias y estrategia de release.

## Responsable

Maynor Amílcar Poz Hernández — carné 2323759
