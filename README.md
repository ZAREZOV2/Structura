# Structura

> Working title. An open-source, Notion-style collaborative notes app.

Built with **Bun**, **ElysiaJS**, and **PostgreSQL**. The frontend is **React + Vite + Tailwind**
with the **BlockNote** block editor and realtime collaboration over **Yjs (CRDT)**.

## Stack

| Layer    | Tech                                                              |
| -------- | ---------------------------------------------------------------- |
| Runtime  | Bun                                                              |
| API      | ElysiaJS, Eden Treaty, Swagger, JWT                              |
| Database | PostgreSQL 16, Drizzle ORM (`drizzle-kit` migrations)           |
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query, BlockNote         |
| Realtime | Yjs + WebSocket (planned)                                        |

## Monorepo layout

```
apps/
  api/        ElysiaJS backend (Bun)
  web/        React + Vite frontend
packages/
  shared/     Shared types & constants
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh) >= 1.3
- Docker (for the PostgreSQL container)

### Setup

```bash
# 1. install dependencies
bun install

# 2. copy env and adjust as needed
cp .env.example .env

# 3. start PostgreSQL
docker compose up -d

# 4. apply database migrations
bun run db:migrate

# 5. run API + web in dev mode
bun run dev
```

- API: http://localhost:3000 (Swagger at `/swagger`)
- Web: http://localhost:5173

## Scripts

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `bun run dev`         | Run API and web concurrently         |
| `bun run dev:api`     | Run API only                         |
| `bun run dev:web`     | Run web only                         |
| `bun run typecheck`   | Type-check all workspaces            |
| `bun run lint`        | Lint with Biome                      |
| `bun run test`        | Run API tests                        |
| `bun run db:generate` | Generate a new migration from schema |
| `bun run db:migrate`  | Apply migrations                     |
| `bun run db:studio`   | Open Drizzle Studio                  |

## Roadmap

Notion-first direction. Current stage: **Stage 0 — scaffolding**. Next: authentication,
workspaces + page tree, the BlockNote editor with realtime collaboration, then Notion-style
databases.

## License

Licensed under the [Apache License 2.0](./LICENSE).
