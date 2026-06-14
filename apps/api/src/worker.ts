import type {
  Request as CfRequest,
  D1Database,
  ExecutionContext,
  Fetcher,
} from '@cloudflare/workers-types';
import { createApp } from './app';
import { runWithDb } from './db/context';
import { createDb } from './db/d1';

/** Bindings declared in wrangler.jsonc (D1 database, static assets, JWT secrets via vars). */
interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

// The shared app excludes Swagger (Bun-only), keeping the Workers bundle lean.
// `aot: false` avoids `new Function`, which the Workers runtime forbids.
const app = createApp({ aot: false });

// API routes live at the root of the Elysia app; everything else is the SPA.
const API_PREFIXES = ['/auth', '/workspaces', '/pages', '/health', '/collab'];

function isApiRequest(pathname: string): boolean {
  return API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default {
  fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (isApiRequest(pathname)) {
      return runWithDb(createDb(env.DB), () => app.handle(request));
    }
    // Static SPA assets (with single-page-application fallback to index.html).
    // ASSETS uses Cloudflare's Fetcher types; bridge from the DOM Request/Response.
    return env.ASSETS.fetch(request as unknown as CfRequest) as unknown as Promise<Response>;
  },
};
