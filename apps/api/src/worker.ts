import type { D1Database, ExecutionContext } from '@cloudflare/workers-types';
import { createApp } from './app';
import { runWithDb } from './db/context';
import { createDb } from './db/d1';

/** Bindings declared in `wrangler.toml` (D1 database + JWT secrets via vars). */
interface Env {
  DB: D1Database;
}

// The shared app excludes Swagger (Bun-only), keeping the Workers bundle lean.
// `aot: false` avoids `new Function`, which the Workers runtime forbids.
const app = createApp({ aot: false });

export default {
  fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return runWithDb(createDb(env.DB), () => app.handle(request));
  },
};
