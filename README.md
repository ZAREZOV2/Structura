# Structura

> Working title. An open-source, Notion-style collaborative notes app.

Built with **Bun**, **ElysiaJS**, and **SQLite** (Cloudflare D1 in production). The frontend is
**React + Vite + Tailwind** with the **BlockNote** block editor and realtime collaboration over
**Yjs (CRDT)**.

## Stack

| Layer    | Tech                                                              |
| -------- | ---------------------------------------------------------------- |
| Runtime  | Bun (local & tests) · Cloudflare Workers (production)            |
| API      | ElysiaJS, Eden Treaty, Swagger, JWT                              |
| Database | SQLite — bun:sqlite locally, Cloudflare D1 in prod; Drizzle ORM |
| Auth     | JWT + PBKDF2 (Web Crypto) password hashing                      |
| Frontend | React 19, Vite, Tailwind CSS, TanStack Query, BlockNote         |
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

### Setup

```bash
# 1. install dependencies
bun install

# 2. copy env and adjust as needed
cp .env.example .env

# 3. apply database migrations (creates the local bun:sqlite file)
cd apps/api && bun run db:migrate && cd ../..

# 4. run API + web in dev mode
bun run dev
```

- API: http://localhost:3000 (Swagger at `/swagger`)
- Web: http://localhost:5173

The local database is a single SQLite file (`apps/api/local.db`); no Docker or PostgreSQL needed.

## Deploying to Cloudflare Workers (D1)

The API runs on the Cloudflare Workers runtime backed by a **D1** (serverless SQLite) database.

```bash
cd apps/api

# 1. create the D1 database, then paste the returned id into wrangler.toml
bunx wrangler d1 create structura

# 2. apply migrations to the remote D1 database
bunx wrangler d1 migrations apply structura --remote

# 3. set the JWT secrets (encrypted)
bunx wrangler secret put JWT_ACCESS_SECRET
bunx wrangler secret put JWT_REFRESH_SECRET

# 4. deploy the Worker
bunx wrangler deploy
```

The React frontend deploys as a static site to **Cloudflare Pages**:

- **Build command:** `bun install && bun run --filter @structura/web build`
- **Output directory:** `apps/web/dist`
- Set `VITE_API_URL` to the deployed Worker URL, and `WEB_ORIGIN` (Worker var) to the Pages URL.

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
| `bun run db:migrate`  | Apply migrations (local bun:sqlite)  |
| `bun run db:studio`   | Open Drizzle Studio                  |

From `apps/api`, Cloudflare-specific scripts: `cf:dev` (run the Worker locally via Miniflare),
`deploy` (`wrangler deploy`), and `d1:migrate:local` / `d1:migrate:remote`.

## Roadmap

Notion-first direction. Done: scaffolding, authentication, workspaces + page tree, the BlockNote
editor with autosave, and the Cloudflare Workers + D1 port. Next: realtime collaboration (Yjs +
WebSocket), then Notion-style databases.

## License

Licensed under the [Apache License 2.0](./LICENSE).
