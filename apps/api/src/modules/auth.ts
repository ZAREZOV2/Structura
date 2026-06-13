import { Elysia, t } from 'elysia';
import { env } from '../env';
import { verifyPassword } from '../lib/password';
import { accessJwt, authGuard, refreshJwt } from '../middleware/auth';
import { createUser, findUserByEmail, findUserById, toPublicUser } from './auth.service';

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: env.jwt.refreshTtl,
};

const REFRESH_COOKIE = 'refresh_token';

const cookieSchema = t.Cookie({
  refresh_token: t.Optional(t.String()),
});

const publicUserSchema = t.Object({
  id: t.String(),
  email: t.String(),
  displayName: t.String(),
  avatarUrl: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
});

const authResponseSchema = t.Object({
  user: publicUserSchema,
  accessToken: t.String(),
});

export const authModule = new Elysia({ prefix: '/auth', name: 'auth' })
  .use(accessJwt)
  .use(refreshJwt)
  .use(authGuard)
  .post(
    '/register',
    async ({ body, accessJwt, refreshJwt, cookie, status }) => {
      const existing = await findUserByEmail(body.email);
      if (existing) {
        return status(409, {
          error: 'CONFLICT',
          message: 'Email already in use',
          statusCode: 409,
        });
      }

      const user = await createUser(body);
      const accessToken = await accessJwt.sign({ sub: user.id });
      const refreshToken = await refreshJwt.sign({ sub: user.id });
      cookie[REFRESH_COOKIE].set({ value: refreshToken, ...refreshCookieOptions });

      return { user: toPublicUser(user), accessToken };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8, maxLength: 128 }),
        displayName: t.String({ minLength: 1, maxLength: 80 }),
      }),
      cookie: cookieSchema,
      detail: { tags: ['Auth'], summary: 'Register a new user' },
    },
  )
  .post(
    '/login',
    async ({ body, accessJwt, refreshJwt, cookie, status }) => {
      const user = await findUserByEmail(body.email);
      if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
        return status(401, {
          error: 'UNAUTHORIZED',
          message: 'Invalid email or password',
          statusCode: 401,
        });
      }

      const accessToken = await accessJwt.sign({ sub: user.id });
      const refreshToken = await refreshJwt.sign({ sub: user.id });
      cookie[REFRESH_COOKIE].set({ value: refreshToken, ...refreshCookieOptions });

      return { user: toPublicUser(user), accessToken };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
      cookie: cookieSchema,
      detail: { tags: ['Auth'], summary: 'Log in with email and password' },
    },
  )
  .post(
    '/refresh',
    async ({ accessJwt, refreshJwt, cookie, status }) => {
      const token = cookie[REFRESH_COOKIE].value;
      const payload = token ? await refreshJwt.verify(token) : false;
      if (!payload || typeof payload.sub !== 'string') {
        return status(401, {
          error: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
          statusCode: 401,
        });
      }

      const user = await findUserById(payload.sub);
      if (!user) {
        return status(401, {
          error: 'UNAUTHORIZED',
          message: 'User not found',
          statusCode: 401,
        });
      }

      const accessToken = await accessJwt.sign({ sub: user.id });
      const refreshToken = await refreshJwt.sign({ sub: user.id });
      cookie[REFRESH_COOKIE].set({ value: refreshToken, ...refreshCookieOptions });

      return { user: toPublicUser(user), accessToken };
    },
    {
      cookie: cookieSchema,
      detail: { tags: ['Auth'], summary: 'Exchange refresh cookie for a new access token' },
    },
  )
  .post(
    '/logout',
    ({ cookie }) => {
      cookie[REFRESH_COOKIE].remove();
      return { success: true };
    },
    {
      cookie: cookieSchema,
      detail: { tags: ['Auth'], summary: 'Clear the refresh cookie' },
    },
  )
  .get('/me', ({ user }) => ({ user }), {
    auth: true,
    detail: { tags: ['Auth'], summary: 'Get the current authenticated user' },
    response: {
      200: t.Object({ user: publicUserSchema }),
    },
  });

export { authResponseSchema };
