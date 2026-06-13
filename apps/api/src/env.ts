/**
 * Centralised, validated access to environment variables.
 * Fails fast at startup if a required variable is missing.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(optional('API_PORT', '3000')),
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    accessSecret: optional('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
    refreshSecret: optional('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    accessTtl: Number(optional('JWT_ACCESS_TTL', '900')),
    refreshTtl: Number(optional('JWT_REFRESH_TTL', '2592000')),
  },
  webOrigin: optional('WEB_ORIGIN', 'http://localhost:5173'),
} as const;
