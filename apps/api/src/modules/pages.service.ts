import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { generateKeyBetween } from 'fractional-indexing';
import { getDb } from '../db/context';
import { pages } from '../db/schema';
import { NotFoundError } from '../lib/errors';

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

type PageRow = typeof pages.$inferSelect;

function toNode(row: PageRow): PageNode {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    parentId: row.parentId,
    title: row.title,
    icon: row.icon,
    position: row.position,
    isArchived: row.isArchived,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listPages(workspaceId: string): Promise<PageNode[]> {
  const rows = await getDb()
    .select()
    .from(pages)
    .where(and(eq(pages.workspaceId, workspaceId), eq(pages.isArchived, false)))
    .orderBy(asc(pages.position));
  return rows.map(toNode);
}

export async function getPageById(id: string): Promise<PageRow | undefined> {
  return getDb().query.pages.findFirst({ where: eq(pages.id, id) });
}

export async function getPageOrThrow(id: string): Promise<PageRow> {
  const page = await getPageById(id);
  if (!page) throw new NotFoundError('Page not found');
  return page;
}

/** Returns the largest position among the given parent's children, or null. */
async function lastChildPosition(
  workspaceId: string,
  parentId: string | null,
): Promise<string | null> {
  const [row] = await getDb()
    .select({ position: pages.position })
    .from(pages)
    .where(
      and(
        eq(pages.workspaceId, workspaceId),
        parentId === null ? isNull(pages.parentId) : eq(pages.parentId, parentId),
      ),
    )
    .orderBy(desc(pages.position))
    .limit(1);

  return row?.position ?? null;
}

export async function createPage(input: {
  workspaceId: string;
  parentId: string | null;
  title: string;
  createdBy: string;
}): Promise<PageNode> {
  const last = await lastChildPosition(input.workspaceId, input.parentId);
  const position = generateKeyBetween(last, null);

  const [page] = await getDb()
    .insert(pages)
    .values({
      workspaceId: input.workspaceId,
      parentId: input.parentId,
      title: input.title,
      position,
      createdBy: input.createdBy,
    })
    .returning();
  if (!page) throw new Error('Failed to create page');
  return toNode(page);
}

export async function updatePage(
  id: string,
  patch: { title?: string; icon?: string | null; coverUrl?: string | null; content?: unknown },
): Promise<PageNode> {
  const [page] = await getDb()
    .update(pages)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(pages.id, id))
    .returning();
  if (!page) throw new NotFoundError('Page not found');
  return toNode(page);
}

async function positionOf(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const row = await getDb().query.pages.findFirst({ where: eq(pages.id, id) });
  return row?.position ?? null;
}

/**
 * Moves a page under `parentId`, placing it between `prevId` and `nextId`
 * (omit both to append to the end of the new parent).
 */
export async function movePage(
  id: string,
  target: { parentId: string | null; prevId?: string | null; nextId?: string | null },
): Promise<PageNode> {
  const page = await getPageOrThrow(id);

  let prevPos: string | null;
  let nextPos: string | null;
  if (target.prevId === undefined && target.nextId === undefined) {
    prevPos = await lastChildPosition(page.workspaceId, target.parentId);
    nextPos = null;
  } else {
    prevPos = await positionOf(target.prevId);
    nextPos = await positionOf(target.nextId);
  }

  const position = generateKeyBetween(prevPos, nextPos);

  const [updated] = await getDb()
    .update(pages)
    .set({ parentId: target.parentId, position, updatedAt: new Date() })
    .where(eq(pages.id, id))
    .returning();
  if (!updated) throw new NotFoundError('Page not found');
  return toNode(updated);
}

export async function setArchived(id: string, isArchived: boolean): Promise<PageNode> {
  const [page] = await getDb()
    .update(pages)
    .set({ isArchived, updatedAt: new Date() })
    .where(eq(pages.id, id))
    .returning();
  if (!page) throw new NotFoundError('Page not found');
  return toNode(page);
}

export async function deletePage(id: string): Promise<void> {
  await getDb().delete(pages).where(eq(pages.id, id));
}

export { toNode };
