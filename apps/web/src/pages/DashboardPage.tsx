import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { PageView } from '../components/PageView';
import { Sidebar } from '../components/Sidebar';
import { ThemeToggle } from '../components/ThemeToggle';
import { usePageMutations, usePageTree } from '../features/pages';
import { buildTree } from '../features/types';
import { useActiveWorkspace } from '../features/workspace';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { workspace, isLoading: wsLoading } = useActiveWorkspace();
  const workspaceId = workspace?.id ?? null;

  const { data: pages } = usePageTree(workspaceId);
  const mutations = usePageMutations(workspaceId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tree = pages ? buildTree(pages) : [];

  useEffect(() => {
    if (selectedId && pages && !pages.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [pages, selectedId]);

  if (wsLoading || !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
        Setting up your workspace…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Sidebar
        workspaceName={workspace.name}
        tree={tree}
        selectedId={selectedId}
        onSelect={setSelectedId}
        mutations={mutations}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-neutral-200 px-6 py-2 text-sm dark:border-neutral-800">
          <span className="text-neutral-500 dark:text-neutral-400">{user?.email}</span>
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Log out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {selectedId ? (
            <PageView pageId={selectedId} workspaceId={workspace.id} />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400 dark:text-neutral-500">
              Select or create a page to get started.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
