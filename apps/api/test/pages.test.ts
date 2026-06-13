import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { app } from '../src/app';
import { db } from '../src/db';
import { users } from '../src/db/schema';

const email = `tree-${crypto.randomUUID()}@example.com`;
const password = 'super-secret-123';
const extraEmails: string[] = [];
let token = '';

function req(method: string, path: string, body?: unknown) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

beforeAll(async () => {
  const res = await req('POST', '/auth/register', { email, password, displayName: 'Tree User' });
  const data = (await res.json()) as { accessToken: string };
  token = data.accessToken;
});

afterAll(async () => {
  for (const e of [email, ...extraEmails]) {
    await db.delete(users).where(eq(users.email, e));
  }
});

describe('workspaces & pages', () => {
  let workspaceId = '';
  let rootId = '';
  let childId = '';

  it('requires authentication', async () => {
    const saved = token;
    token = '';
    const res = await req('GET', '/workspaces');
    token = saved;
    expect(res.status).toBe(401);
  });

  it('creates and lists a workspace', async () => {
    const created = await req('POST', '/workspaces', { name: 'My Workspace' });
    expect(created.status).toBe(200);
    const ws = (await created.json()) as { id: string; role: string };
    expect(ws.role).toBe('owner');
    workspaceId = ws.id;

    const list = await req('GET', '/workspaces');
    const workspaces = (await list.json()) as Array<{ id: string }>;
    expect(workspaces.some((w) => w.id === workspaceId)).toBe(true);
  });

  it('creates a root page and a child page', async () => {
    const root = await req('POST', `/workspaces/${workspaceId}/pages`, { title: 'Root' });
    expect(root.status).toBe(200);
    rootId = ((await root.json()) as { id: string }).id;

    const child = await req('POST', `/workspaces/${workspaceId}/pages`, {
      title: 'Child',
      parentId: rootId,
    });
    childId = ((await child.json()) as { id: string }).id;

    const list = await req('GET', `/workspaces/${workspaceId}/pages`);
    const pages = (await list.json()) as Array<{ id: string; parentId: string | null }>;
    expect(pages).toHaveLength(2);
    expect(pages.find((p) => p.id === childId)?.parentId).toBe(rootId);
  });

  it('orders pages by fractional position', async () => {
    await req('POST', `/workspaces/${workspaceId}/pages`, { title: 'Second root' });
    const list = await req('GET', `/workspaces/${workspaceId}/pages`);
    const pages = (await list.json()) as Array<{ position: string }>;
    const positions = pages.map((p) => p.position);
    expect([...positions].sort()).toEqual(positions);
  });

  it('updates a page title', async () => {
    const res = await req('PATCH', `/pages/${rootId}`, { title: 'Root renamed' });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { title: string }).title).toBe('Root renamed');
  });

  it('moves a child page to the root', async () => {
    const res = await req('POST', `/pages/${childId}/move`, { parentId: null });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { parentId: string | null }).parentId).toBeNull();
  });

  it('archives a page so it leaves the tree', async () => {
    await req('POST', `/pages/${childId}/archive`, { isArchived: true });
    const list = await req('GET', `/workspaces/${workspaceId}/pages`);
    const pages = (await list.json()) as Array<{ id: string }>;
    expect(pages.some((p) => p.id === childId)).toBe(false);
  });

  it('cascades deletes to descendants', async () => {
    const parent = await req('POST', `/workspaces/${workspaceId}/pages`, { title: 'Parent' });
    const parentId = ((await parent.json()) as { id: string }).id;
    const sub = await req('POST', `/workspaces/${workspaceId}/pages`, {
      title: 'Sub',
      parentId,
    });
    const subId = ((await sub.json()) as { id: string }).id;

    await req('DELETE', `/pages/${parentId}`);
    const res = await req('GET', `/pages/${subId}`);
    expect(res.status).toBe(404);
  });

  it('blocks access to a workspace the user is not a member of', async () => {
    const outsiderEmail = `outsider-${crypto.randomUUID()}@example.com`;
    extraEmails.push(outsiderEmail);
    const other = await req('POST', '/auth/register', {
      email: outsiderEmail,
      password,
      displayName: 'Outsider',
    });
    const otherToken = ((await other.json()) as { accessToken: string }).accessToken;

    const res = await app.handle(
      new Request(`http://localhost/workspaces/${workspaceId}/pages`, {
        headers: { authorization: `Bearer ${otherToken}` },
      }),
    );
    expect(res.status).toBe(404);
  });
});
