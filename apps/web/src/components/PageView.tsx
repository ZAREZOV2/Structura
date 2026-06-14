import type { PartialBlock } from '@blocknote/core';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useCollaboration } from '../collab/useCollaboration';
import { usePage, usePageMutations } from '../features/pages';
import { PageEditor } from './PageEditor';

export function PageView({
  pageId,
  workspaceId,
}: {
  pageId: string;
  workspaceId: string;
}) {
  const { data: page, isLoading } = usePage(pageId);
  const { renamePage } = usePageMutations(workspaceId);
  const { user } = useAuth();
  const [title, setTitle] = useState('');

  const collab = useCollaboration(pageId, user?.displayName ?? user?.email ?? 'Anonymous');

  useEffect(() => {
    if (page) setTitle(page.title);
  }, [page]);

  if (isLoading || !page) {
    return <div className="p-10 text-neutral-400 dark:text-neutral-500">Loading…</div>;
  }

  function commitTitle() {
    const next = title.trim() || 'Untitled';
    if (page && next !== page.title) {
      renamePage.mutate({ id: page.id, title: next });
    }
  }

  const blocks =
    Array.isArray(page.content) && page.content.length > 0
      ? (page.content as PartialBlock[])
      : undefined;

  return (
    <div className="mx-auto max-w-3xl px-12 py-12">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        placeholder="Untitled"
        className="mb-4 w-full bg-transparent text-4xl font-bold text-neutral-900 outline-none placeholder:text-neutral-300 dark:text-neutral-50 dark:placeholder:text-neutral-600"
      />
      <PageEditor key={pageId} pageId={page.id} initialContent={blocks} collab={collab} />
    </div>
  );
}
