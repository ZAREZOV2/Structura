import { Database as BunDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { env } from '../env';
import { type Database, setDefaultDb } from './context';
import { schema } from './schema';

/**
 * Bun runtime database (local dev & tests). Production runs on Cloudflare D1 via
 * `db/d1.ts`; importing this module pulls in `bun:sqlite`, so it must never be
 * reachable from the Workers bundle — only the Bun entrypoint and tests import it.
 */
const sqlite = new BunDatabase(env.databasePath);
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

const bunDb = drizzle(sqlite, { schema });

migrate(bunDb, { migrationsFolder: `${import.meta.dir}/../../drizzle` });

// bun:sqlite is synchronous; await still works, so expose it via the shared
// async-typed `Database` interface used across the app.
export const db = bunDb as unknown as Database;

setDefaultDb(db);

export type { Database } from './context';
