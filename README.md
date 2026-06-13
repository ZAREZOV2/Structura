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

A **single** Cloudflare Worker serves both the API (Elysia + **D1** serverless SQLite) and the
React SPA's static assets. Because the frontend talks to the API on the same origin, there is no
CORS or cross-site cookie configuration to manage. The root `wrangler.jsonc` defines this Worker;
the build command builds the SPA into `apps/web/dist`, which the Worker serves.

```bash
# from the repo root

# 1. create the D1 database, then paste the returned id into wrangler.jsonc
bunx wrangler d1 create structura

# 2. apply migrations to the remote D1 database
bunx wrangler d1 migrations apply structura --remote

# 3. set the JWT secrets (encrypted)
bunx wrangler secret put JWT_ACCESS_SECRET
bunx wrangler secret put JWT_REFRESH_SECRET

# 4. build the SPA, then deploy the Worker (API + assets)
bun run build:web
bunx wrangler deploy
```

When deploying via the Cloudflare **Workers Builds** Git integration, set:

- **Build command:** `bun install && bun run --filter @structura/web build`
- **Deploy command:** `bunx wrangler deploy` (run from the repo root)

D1 migrations are **not** run by `wrangler deploy` — apply them with
`bun run d1:migrate:remote` (step 2 above) whenever the schema changes. The `migrations_dir`
key in `wrangler.jsonc` points that command at `apps/api/drizzle`.

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

Cloudflare-specific root scripts: `cf:dev` (run the combined Worker locally via Miniflare),
`build:web` (build the SPA), `deploy` (`wrangler deploy`), and `d1:migrate:local` /
`d1:migrate:remote`.

## Roadmap

Notion-first direction. Done: scaffolding, authentication, workspaces + page tree, the BlockNote
editor with autosave, and the Cloudflare Workers + D1 port. Next: realtime collaboration (Yjs +
WebSocket), then Notion-style databases.

## License

Licensed under the [Apache License 2.0](./LICENSE).
