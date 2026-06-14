import { useEffect, useMemo, useRef } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

const RANDOM_COLORS = [
  '#FF6633',
  '#FFB399',
  '#FF33FF',
  '#00B3E6',
  '#E6B333',
  '#3366E6',
  '#999966',
  '#B34D4D',
  '#80B300',
  '#E6B3B3',
  '#6680B3',
  '#66991A',
];

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return RANDOM_COLORS[Math.abs(hash) % RANDOM_COLORS.length]!;
}

function getWsUrl(): string {
  const apiUrl =
    (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_API_URL ??
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  return apiUrl.replace(/^http/, 'ws');
}

export interface CollaborationState {
  doc: Y.Doc;
  provider: WebsocketProvider;
  fragment: Y.XmlFragment;
  user: { name: string; color: string };
}

export function useCollaboration(pageId: string, userName: string): CollaborationState | null {
  const stateRef = useRef<CollaborationState | null>(null);

  const state = useMemo(() => {
    // Clean up previous state when pageId/userName changes.
    if (stateRef.current) {
      stateRef.current.provider.disconnect();
      stateRef.current.provider.destroy();
      stateRef.current.doc.destroy();
      stateRef.current = null;
    }

    const doc = new Y.Doc();
    const wsUrl = getWsUrl();
    const provider = new WebsocketProvider(wsUrl, `collab/${pageId}`, doc, {
      connect: true,
    });

    const color = pickColor(userName);
    provider.awareness.setLocalStateField('user', { name: userName, color });

    const fragment = doc.getXmlFragment('document-store');

    const s: CollaborationState = { doc, provider, fragment, user: { name: userName, color } };
    stateRef.current = s;
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, userName]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (stateRef.current) {
        stateRef.current.provider.disconnect();
        stateRef.current.provider.destroy();
        stateRef.current.doc.destroy();
        stateRef.current = null;
      }
    };
  }, []);

  return state;
}
