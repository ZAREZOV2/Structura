import { afterAll, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { app } from '../src/app';
import { db } from '../src/db';
import { users } from '../src/db/schema';

const email = `test-${crypto.randomUUID()}@example.com`;
const password = 'super-secret-123';

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  );
}

function extractRefreshCookie(res: Response): string | undefined {
  const setCookie = res.headers.get('set-cookie');
  return setCookie?.split(';')[0];
}

afterAll(async () => {
  await db.delete(users).where(eq(users.email, email));
});

describe('auth', () => {
  let accessToken = '';
  let refreshCookie = '';

  it('registers a new user', async () => {
    const res = await post('/auth/register', { email, password, displayName: 'Test User' });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { accessToken: string; user: { email: string } };
    expect(body.user.email).toBe(email.toLowerCase());
    expect(body.accessToken.length).toBeGreaterThan(0);

    accessToken = body.accessToken;
    refreshCookie = extractRefreshCookie(res) ?? '';
    expect(refreshCookie).toContain('refresh_token=');
  });

  it('rejects duplicate registration', async () => {
    const res = await post('/auth/register', { email, password, displayName: 'Dup' });
    expect(res.status).toBe(409);
  });

  it('returns the current user from /me with a bearer token', async () => {
    const res = await app.handle(
      new Request('http://localhost/auth/me', {
        headers: { authorization: `Bearer ${accessToken}` },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { email: string } };
    expect(body.user.email).toBe(email.toLowerCase());
  });

  it('rejects /me without a token', async () => {
    const res = await app.handle(new Request('http://localhost/auth/me'));
    expect(res.status).toBe(401);
  });

  it('rejects login with the wrong password', async () => {
    const res = await post('/auth/login', { email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('logs in with valid credentials', async () => {
    const res = await post('/auth/login', { email, password });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { accessToken: string };
    expect(body.accessToken.length).toBeGreaterThan(0);
  });

  it('refreshes the access token using the refresh cookie', async () => {
    const res = await post('/auth/refresh', {}, { cookie: refreshCookie });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { accessToken: string };
    expect(body.accessToken.length).toBeGreaterThan(0);
  });

  it('rejects refresh without a cookie', async () => {
    const res = await post('/auth/refresh', {});
    expect(res.status).toBe(401);
  });
});
