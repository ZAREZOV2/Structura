import { useEffect, useState } from 'react';
import { usePage, usePageMutations } from '../features/pages';

export function PageView({
  pageId,
  workspaceId,
}: {
  pageId: string;
  workspaceId: string;
}) {
  const { data: page, isLoading } = usePage(pageId);
  const { renamePage } = usePageMutations(workspaceId);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (page) setTitle(page.title);
  }, [page]);

  if (isLoading || !page) {
    return <div className="p-10 text-neutral-400">Loading…</div>;
  }

  function commitTitle() {
    const next = title.trim() || 'Untitled';
    if (page && next !== page.title) {
      renamePage.mutate({ id: page.id, title: next });
    }
  }

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
        className="w-full bg-transparent text-4xl font-bold text-neutral-900 outline-none placeholder:text-neutral-300"
      />
      <p className="mt-6 text-neutral-400">
        This page is empty. A rich block editor arrives in Stage 3.
      </p>
    </div>
  );
}
