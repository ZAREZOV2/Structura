import { treaty } from '@elysiajs/eden';
import type { App } from '@structura/api/app';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

let accessToken: string | null = null;

/** Update the in-memory access token used for authenticated requests. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** End-to-end typed client generated from the API's Elysia types. */
export const api = treaty<App>(API_URL, {
  fetch: { credentials: 'include' },
  headers() {
    return accessToken ? { authorization: `Bearer ${accessToken}` } : {};
  },
});
