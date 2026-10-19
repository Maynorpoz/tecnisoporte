# IT Incident Hub

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

## Instalación

```bash
git clone <url-del-repo>
cd incident

# Variables de entorno
cp .env.example .env
# edita .env y pon tus valores locales

# Base de datos
docker compose -f devops/docker-compose.yml up -d

# Backend
cd backend && npm ci
```

## Ejecución

```bash
# Backend (desde backend/)
npm run dev          # http://localhost:3000
curl http://localhost:3000/api/health
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la API con recarga automática |
| `npm start` | Levanta la API |
| `npm test` | Corre la suite de pruebas |
| `npm run lint` | Analiza el código con ESLint |

## Documentación

Toda la documentación del proceso está en [`docs/`](docs/): arquitectura, convención de ramas, deuda técnica, seguridad, dependencias y estrategia de release.

## Responsable

Maynor Amílcar Poz Hernández — carné 2323759
