import { Database as BunDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { env } from '../env';

/** Applies migrations to the local Bun sqlite database. */
const sqlite = new BunDatabase(env.databasePath);
sqlite.exec('PRAGMA foreign_keys = ON;');
migrate(drizzle(sqlite), { migrationsFolder: './drizzle' });
sqlite.close();

console.log(`✅Migrations applied to ${env.databasePath}`);
