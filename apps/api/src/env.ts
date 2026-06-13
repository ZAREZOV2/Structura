/**
 * Centralised access to configuration. Values come from `process.env`, which is
 * populated by Bun locally and by the Workers runtime (with `nodejs_compat`,
 * Cloudflare exposes `[vars]` and secrets on `process.env`).
 */

const proc: { env: Record<string, string | undefined>; uptime?: () => number } =
  typeof process !== 'undefined'
    ? (process as unknown as { env: Record<string, string | undefined>; uptime?: () => number })
    : { env: {} };

function optional(name: string, fallback: string): string {
  return proc.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction: proc.env.NODE_ENV === 'production',
  port: Number(optional('API_PORT', '3000')),
  // Local Bun/bun:sqlite database file (ignored on Workers, which use the D1 binding).
  databasePath: optional('DATABASE_PATH', './local.db'),
  jwt: {
    accessSecret: optional('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
    refreshSecret: optional('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    accessTtl: Number(optional('JWT_ACCESS_TTL', '900')),
    refreshTtl: Number(optional('JWT_REFRESH_TTL', '2592000')),
  },
  webOrigin: optional('WEB_ORIGIN', 'http://localhost:5173'),
} as const;

export const uptime = (): number => proc.uptime?.() ?? 0;
