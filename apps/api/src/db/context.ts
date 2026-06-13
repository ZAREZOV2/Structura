import { AsyncLocalStorage } from 'node:async_hooks';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { schema } from './schema';

/**
 * The application talks to the database through a single `Database` shape that is
 * satisfied by both the Cloudflare D1 driver (production) and bun:sqlite
 * (local dev & tests). Both share the `BaseSQLiteDatabase` query API; the
 * concrete driver is cast to this async-typed base at its boundary. The instance
 * is provided per-request on Workers (the D1 binding only exists inside `fetch`)
 * and as a process-wide default under Bun.
 */
export type Database = BaseSQLiteDatabase<'async', unknown, typeof schema>;

const storage = new AsyncLocalStorage<Database>();

let defaultDb: Database | null = null;

/** Sets the process-wide fallback database (used by the Bun runtime & tests). */
export function setDefaultDb(db: Database): void {
  defaultDb = db;
}

/** Runs `fn` with `db` bound as the request-scoped database (used on Workers). */
export function runWithDb<T>(db: Database, fn: () => T): T {
  return storage.run(db, fn);
}

/** Returns the database for the current request, falling back to the default. */
export function getDb(): Database {
  const db = storage.getStore() ?? defaultDb;
  if (!db) {
    throw new Error('Database is not initialised for this context');
  }
  return db;
}
