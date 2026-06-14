import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import type { PartialBlock } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { useCallback, useEffect, useRef } from 'react';
import type { CollaborationState } from '../collab/useCollaboration';
import { useSaveContent } from '../features/pages';
import { useTheme } from '../theme/ThemeContext';

const SAVE_DEBOUNCE_MS = 600;

export function PageEditor({
  pageId,
  initialContent,
  collab,
}: {
  pageId: string;
  initialContent: PartialBlock[] | undefined;
  collab: CollaborationState | null;
}) {
  const save = useSaveContent();
  const saveRef = useRef(save);
  saveRef.current = save;
  const { resolved } = useTheme();

  const editor = useCreateBlockNote(
    collab
      ? {
          collaboration: {
            fragment: collab.fragment,
            user: collab.user,
            provider: collab.provider,
          },
        }
      : { initialContent },
    [collab ? collab.fragment : initialContent],
  );

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (dirty.current) {
      dirty.current = false;
      saveRef.current.mutate({ id: pageId, content: editor.document });
    }
  }, [editor, pageId]);

  // Persist any pending edits when switching away from this page.
  useEffect(() => () => flush(), [flush]);

  return (
    <BlockNoteView
      editor={editor}
      theme={resolved}
      onChange={() => {
        dirty.current = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
      }}
    />
  );
}
