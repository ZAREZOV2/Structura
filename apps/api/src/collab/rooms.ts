import { eq } from 'drizzle-orm';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import * as Y from 'yjs';
import { getDb } from '../db/context';
import { pages } from '../db/schema';

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;
const PERSIST_DEBOUNCE_MS = 2_000;

export interface CollabSocket {
  send(data: Uint8Array): void;
  readyState: number;
}

interface Room {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  /** Maps each connection to the set of awareness client IDs it controls. */
  conns: Map<CollabSocket, Set<number>>;
  persistTimer: ReturnType<typeof setTimeout> | null;
}

const rooms = new Map<string, Room>();

// ── helpers ──────────────────────────────────────────────────────────────────

function broadcastToRoom(room: Room, msg: Uint8Array, exclude: CollabSocket | null) {
  for (const [ws] of room.conns) {
    if (ws !== exclude && ws.readyState === 1) {
      ws.send(msg);
    }
  }
}

function schedulePersist(pageId: string, room: Room) {
  if (room.persistTimer) clearTimeout(room.persistTimer);
  room.persistTimer = setTimeout(() => {
    void persistDoc(pageId, room.doc);
  }, PERSIST_DEBOUNCE_MS);
}

async function persistDoc(pageId: string, doc: Y.Doc) {
  const state = Y.encodeStateAsUpdate(doc);
  try {
    await getDb()
      .update(pages)
      .set({ yjsState: Buffer.from(state), updatedAt: new Date() })
      .where(eq(pages.id, pageId));
  } catch {
    // DB might not be available during tests; silently ignore
  }
}

async function loadDocFromDb(pageId: string, doc: Y.Doc) {
  try {
    const row = await getDb().query.pages.findFirst({
      where: eq(pages.id, pageId),
      columns: { yjsState: true },
    });
    if (row?.yjsState) {
      const state =
        row.yjsState instanceof Uint8Array
          ? row.yjsState
          : new Uint8Array(row.yjsState as ArrayBuffer);
      Y.applyUpdate(doc, state);
    }
  } catch {
    // ignore when DB is not available
  }
}

function getOrCreateRoom(pageId: string): Room {
  const existing = rooms.get(pageId);
  if (existing) return existing;

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  awareness.setLocalState(null);

  const room: Room = { doc, awareness, conns: new Map(), persistTimer: null };

  // Broadcast doc updates to all connected clients (except the one that sent it).
  doc.on('update', (update: Uint8Array, origin: CollabSocket | null) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const msg = encoding.toUint8Array(encoder);
    broadcastToRoom(room, msg, origin);
  });

  // Broadcast awareness changes.
  awareness.on(
    'update',
    ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const changedClients = [...added, ...updated, ...removed];
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients),
      );
      broadcastToRoom(room, encoding.toUint8Array(encoder), null);
    },
  );

  rooms.set(pageId, room);
  return room;
}

// ── public API ───────────────────────────────────────────────────────────────

export async function handleOpen(ws: CollabSocket, pageId: string) {
  const room = getOrCreateRoom(pageId);

  // Load persisted state on first connection to a fresh room.
  if (room.conns.size === 0) {
    await loadDocFromDb(pageId, room.doc);
  }

  room.conns.set(ws, new Set());

  // Send sync step 1 so the client replies with its state.
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MSG_SYNC);
  syncProtocol.writeSyncStep1(encoder, room.doc);
  ws.send(encoding.toUint8Array(encoder));

  // Send the full awareness state so the new client sees who is already here.
  const states = room.awareness.getStates();
  if (states.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, [...states.keys()]),
    );
    ws.send(encoding.toUint8Array(awarenessEncoder));
  }
}

export function handleMessage(ws: CollabSocket, pageId: string, data: Uint8Array) {
  const room = rooms.get(pageId);
  if (!room) return;

  const decoder = decoding.createDecoder(data);
  const messageType = decoding.readVarUint(decoder);

  switch (messageType) {
    case MSG_SYNC: {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MSG_SYNC);
      // readSyncMessage applies updates to doc (with ws as origin for broadcast filtering).
      syncProtocol.readSyncMessage(decoder, encoder, room.doc, ws);
      // If the encoder has a response (sync step 2), send it back.
      if (encoding.length(encoder) > 1) {
        ws.send(encoding.toUint8Array(encoder));
      }
      schedulePersist(pageId, room);
      break;
    }
    case MSG_AWARENESS: {
      const update = decoding.readVarUint8Array(decoder);
      awarenessProtocol.applyAwarenessUpdate(room.awareness, update, ws);
      // Track which awareness client IDs this connection controls.
      const controlledIds = room.conns.get(ws);
      if (controlledIds) {
        const decoder2 = decoding.createDecoder(update);
        const len = decoding.readVarUint(decoder2);
        for (let i = 0; i < len; i++) {
          const clientId = decoding.readVarUint(decoder2);
          controlledIds.add(clientId);
        }
      }
      break;
    }
  }
}

export function handleClose(ws: CollabSocket, pageId: string) {
  const room = rooms.get(pageId);
  if (!room) return;

  const controlledIds = room.conns.get(ws);
  room.conns.delete(ws);

  if (controlledIds && controlledIds.size > 0) {
    awarenessProtocol.removeAwarenessStates(room.awareness, [...controlledIds], null);
  }

  if (room.conns.size === 0) {
    // Persist final state, then tear down the room.
    void persistDoc(pageId, room.doc);
    if (room.persistTimer) clearTimeout(room.persistTimer);
    room.awareness.destroy();
    room.doc.destroy();
    rooms.delete(pageId);
  }
}
