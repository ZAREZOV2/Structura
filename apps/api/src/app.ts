import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { env } from './env';
import { AppError } from './lib/errors';
import { authModule } from './modules/auth';
import { healthModule } from './modules/health';

/**
 * Builds the Elysia application. Exported separately from the entrypoint so it
 * can be imported by tests and by the Eden Treaty client for end-to-end types.
 */
export const app = new Elysia()
  .use(
    cors({
      origin: env.webOrigin,
      credentials: true,
    }),
  )
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: 'Structura API',
          version: '0.0.0',
          description: 'API for Structura — a Notion-style collaborative notes app.',
        },
        tags: [
          { name: 'Health', description: 'Service health' },
          { name: 'Auth', description: 'Authentication & sessions' },
        ],
      },
    }),
  )
  .onError(({ code, error, set }) => {
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return { error: error.code, message: error.message, statusCode: error.statusCode };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'NOT_FOUND', message: 'Route not found', statusCode: 404 };
    }

    if (code === 'VALIDATION') {
      set.status = 422;
      return { error: 'VALIDATION', message: error.message, statusCode: 422 };
    }

    set.status = 500;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return { error: 'INTERNAL', message, statusCode: 500 };
  })
  .get('/', () => ({ name: 'structura-api', version: '0.0.0' }))
  .use(healthModule)
  .use(authModule);

export type App = typeof app;
