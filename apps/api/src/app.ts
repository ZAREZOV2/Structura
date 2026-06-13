import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { env } from './env';
import { AppError } from './lib/errors';
import { authModule } from './modules/auth';
import { healthModule } from './modules/health';
import { pagesModule } from './modules/pages';
import { workspacesModule } from './modules/workspaces';

/**
 * Builds the Elysia application. Kept free of Node/Bun-only plugins (e.g. Swagger)
 * so the same instance runs on the Cloudflare Workers runtime; the Bun entrypoint
 * layers Swagger on top. Used by the Workers entrypoint, the Bun runtime, tests
 * and the Eden Treaty client for end-to-end types.
 *
 * `aot` (ahead-of-time handler compilation) relies on `new Function`, which the
 * Workers runtime forbids — the Workers entrypoint passes `aot: false`.
 */
export function createApp(options: { aot?: boolean } = {}) {
  return new Elysia({ aot: options.aot ?? true })
    .use(
      cors({
        origin: env.webOrigin,
        credentials: true,
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
    .use(authModule)
    .use(workspacesModule)
    .use(pagesModule);
}

/** Default application instance used by Bun, tests & Eden. */
export const app = createApp();

export type App = typeof app;
