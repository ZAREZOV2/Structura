import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import type { Database } from './context';
import { schema } from './schema';

/** Builds a Drizzle database bound to a Cloudflare D1 binding (per request). */
export function createDb(d1: D1Database): Database {
  return drizzle(d1, { schema }) as unknown as Database;
}
