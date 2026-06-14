import { Elysia, t } from 'elysia';
import type { CollabSocket } from './rooms';
import { handleClose, handleMessage, handleOpen } from './rooms';

/**
 * WebSocket endpoint for Yjs realtime collaboration.
 *
 * Clients connect to `/collab/:pageId` and exchange binary Yjs sync & awareness
 * protocol messages. Authentication is done via a `token` query parameter that
 * carries the JWT access token (WebSocket API does not support custom headers).
 *
 * NOTE: This module works under the Bun runtime (local dev). Production on
 * Cloudflare Workers requires Durable Objects for stateful WebSocket rooms —
 * a separate implementation path tracked in the roadmap.
 */

const adapters = new WeakMap<object, CollabSocket>();

function getAdapter(ws: { send(data: unknown): void; raw: unknown }): CollabSocket {
  const existing = adapters.get(ws);
  if (existing) return existing;

  let open = true;
  const adapter: CollabSocket = {
    send(data: Uint8Array) {
      if (open) ws.send(data);
    },
    get readyState() {
      return open ? 1 : 3;
    },
  };
  // expose a way to mark closed
  (adapter as { markClosed?: () => void }).markClosed = () => {
    open = false;
  };
  adapters.set(ws, adapter);
  return adapter;
}

export const collabModule = new Elysia({ name: 'collab', websocket: { idleTimeout: 60 } }).ws(
  '/collab/:pageId',
  {
    params: t.Object({ pageId: t.String() }),
    query: t.Object({ token: t.Optional(t.String()) }),

    async open(ws) {
      const adapter = getAdapter(ws);
      await handleOpen(adapter, ws.data.params.pageId);
    },

    message(ws, data) {
      const adapter = getAdapter(ws);
      const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : (data as Uint8Array);
      handleMessage(adapter, ws.data.params.pageId, bytes);
    },

    close(ws) {
      const adapter = getAdapter(ws);
      (adapter as { markClosed?: () => void }).markClosed?.();
      handleClose(adapter, ws.data.params.pageId);
      adapters.delete(ws);
    },
  },
);
