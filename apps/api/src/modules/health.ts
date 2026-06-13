import { sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from '../db';

export const healthModule = new Elysia({ name: 'health' }).get(
  '/health',
  async () => {
    let database = 'ok';
    try {
      await db.execute(sql`select 1`);
    } catch {
      database = 'unavailable';
    }

    return {
      status: 'ok' as const,
      uptime: process.uptime(),
      database,
      timestamp: new Date().toISOString(),
    };
  },
  {
    detail: { tags: ['Health'], summary: 'Service health check' },
    response: t.Object({
      status: t.Literal('ok'),
      uptime: t.Number(),
      database: t.String(),
      timestamp: t.String(),
    }),
  },
);
