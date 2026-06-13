import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';
import { schema } from './schema';

const client = postgres(env.databaseUrl, { max: 10 });

export const db = drizzle(client, { schema });
export type Database = typeof db;
export { client };
