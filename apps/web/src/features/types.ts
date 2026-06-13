export interface PageNode {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  position: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TreeNode extends PageNode {
  children: TreeNode[];
}

/** Builds a nested tree from a flat, position-ordered page list. */
export function buildTree(pages: PageNode[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const page of pages) {
    byId.set(page.id, { ...page, children: [] });
  }

  for (const page of pages) {
    const node = byId.get(page.id);
    if (!node) continue;
    const parent = page.parentId ? byId.get(page.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
