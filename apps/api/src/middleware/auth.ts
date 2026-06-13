import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';
import { env } from '../env';
import { findUserById, toPublicUser } from '../modules/auth.service';

export const accessJwt = jwt({
  name: 'accessJwt',
  secret: env.jwt.accessSecret,
  exp: `${env.jwt.accessTtl}s`,
});

export const refreshJwt = jwt({
  name: 'refreshJwt',
  secret: env.jwt.refreshSecret,
  exp: `${env.jwt.refreshTtl}s`,
});

/**
 * Reusable guard plugin. Apply `.use(authGuard)` then add `{ auth: true }` to a
 * route to require authentication; the resolved `user` is injected into context.
 */
export const authGuard = new Elysia({ name: 'auth-guard' }).use(accessJwt).macro({
  auth: {
    async resolve({ accessJwt, headers, status }) {
      const header = headers.authorization;
      const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
      if (!token) {
        return status(401, { error: 'UNAUTHORIZED', message: 'Missing token', statusCode: 401 });
      }

      const payload = await accessJwt.verify(token);
      if (!payload || typeof payload.sub !== 'string') {
        return status(401, { error: 'UNAUTHORIZED', message: 'Invalid token', statusCode: 401 });
      }

      const user = await findUserById(payload.sub);
      if (!user) {
        return status(401, { error: 'UNAUTHORIZED', message: 'User not found', statusCode: 401 });
      }

      return { user: toPublicUser(user) };
    },
  },
});
