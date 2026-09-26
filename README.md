# Lead Intake Service

Receives Meta Ads lead webhooks, stores them in PostgreSQL, records an audit trail for every change, and displays leads in a React dashboard.

## Stack
- API: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL
- Web: React, TypeScript, Vite
- Deployment: Docker

## Structure
- `apps/api` — Express + TypeScript API
- `apps/web` — React + TypeScript frontend

_Architecture, setup, deployment, trade-offs, and scaling notes to follow._
