import { describe, expect, it } from 'bun:test';
import { app } from '../src/app';

describe('health', () => {
  it('returns ok status', async () => {
    const res = await app.handle(new Request('http://localhost/health'));
    expect(res.status).toBe(200);

    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });

  it('returns api metadata at root', async () => {
    const res = await app.handle(new Request('http://localhost/'));
    expect(res.status).toBe(200);

    const body = (await res.json()) as { name: string };
    expect(body.name).toBe('structura-api');
  });
});
