import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { usePageMutations } from '../features/pages';
import type { TreeNode } from '../features/types';

type Mutations = ReturnType<typeof usePageMutations>;

function collectDescendantIds(node: TreeNode, acc: Set<string>) {
  for (const child of node.children) {
    acc.add(child.id);
    collectDescendantIds(child, acc);
  }
}

function PageTreeItem({
  node,
  depth,
  selectedId,
  expanded,
  onToggle,
  onSelect,
  mutations,
  draggedId,
  setDraggedId,
  forbidden,
}: {
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  mutations: Mutations;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  forbidden: Set<string>;
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const isOpen = expanded.has(node.id);
  const hasChildren = node.children.length > 0;

  const canDrop = (): boolean => !!draggedId && !forbidden.has(node.id);

  return (
    <div>
      <div
        draggable
        onDragStart={() => setDraggedId(node.id)}
        onDragEnd={() => setDraggedId(null)}
        onDragOver={(e) => {
          if (canDrop()) {
            e.preventDefault();
            setIsDropTarget(true);
          }
        }}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDropTarget(false);
          if (draggedId && draggedId !== node.id) {
            mutations.movePage.mutate({ id: draggedId, parentId: node.id });
            if (!expanded.has(node.id)) onToggle(node.id);
          }
        }}
        className={`group flex items-center gap-1 rounded-md px-2 py-1 text-sm ${
          selectedId === node.id
            ? 'bg-neutral-200 dark:bg-neutral-800'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
        } ${isDropTarget ? 'ring-1 ring-neutral-900 dark:ring-neutral-400' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          className="w-4 shrink-0 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          {hasChildren ? (isOpen ? '▾' : '▸') : '·'}
        </button>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex-1 truncate text-left"
        >
          {node.icon ? `${node.icon} ` : ''}
          {node.title || 'Untitled'}
        </button>
        <button
          type="button"
          title="Add subpage"
          onClick={() => {
            mutations.createPage.mutate({ parentId: node.id });
            if (!expanded.has(node.id)) onToggle(node.id);
          }}
          className="hidden h-5 w-5 shrink-0 rounded text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 group-hover:block dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
        >
          +
        </button>
        <button
          type="button"
          title="Delete page"
          onClick={() => mutations.deletePage.mutate(node.id)}
          className="hidden h-5 w-5 shrink-0 rounded text-neutral-400 hover:bg-neutral-200 hover:text-red-600 group-hover:block dark:hover:bg-neutral-700 dark:hover:text-red-400"
        >
          ×
        </button>
      </div>

      {isOpen &&
        node.children.map((child) => (
          <PageTreeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
            mutations={mutations}
            draggedId={draggedId}
            setDraggedId={setDraggedId}
            forbidden={forbidden}
          />
        ))}
    </div>
  );
}

function findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

export function Sidebar({
  workspaceName,
  tree,
  selectedId,
  onSelect,
  mutations,
}: {
  workspaceName: string;
  tree: TreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  mutations: Mutations;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isRootDropTarget, setIsRootDropTarget] = useState(false);

  const forbidden = new Set<string>();
  const draggedNode = draggedId ? findNode(tree, draggedId) : undefined;
  if (draggedNode) {
    forbidden.add(draggedNode.id);
    collectDescendantIds(draggedNode, forbidden);
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="truncate text-sm font-semibold">{workspaceName}</span>
        <button
          type="button"
          title="New page"
          onClick={() => mutations.createPage.mutate({})}
          className="rounded px-2 py-0.5 text-neutral-500 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          +
        </button>
      </div>

      <Link
        to="/sklad"
        className="mx-2 mb-2 flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <span>🏭</span>
        <span>Sklad</span>
      </Link>

      <div
        className={`flex-1 overflow-y-auto px-2 pb-4 ${
          isRootDropTarget ? 'bg-neutral-100 dark:bg-neutral-800/60' : ''
        }`}
        onDragOver={(e) => {
          if (draggedId) {
            e.preventDefault();
            setIsRootDropTarget(true);
          }
        }}
        onDragLeave={() => setIsRootDropTarget(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsRootDropTarget(false);
          if (draggedId) mutations.movePage.mutate({ id: draggedId, parentId: null });
        }}
      >
        {tree.length === 0 && (
          <p className="px-2 py-4 text-sm text-neutral-400 dark:text-neutral-500">
            No pages yet. Click + to create one.
          </p>
        )}
        {tree.map((node) => (
          <PageTreeItem
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            expanded={expanded}
            onToggle={toggle}
            onSelect={onSelect}
            mutations={mutations}
            draggedId={draggedId}
            setDraggedId={setDraggedId}
            forbidden={forbidden}
          />
        ))}
      </div>
    </aside>
  );
}
