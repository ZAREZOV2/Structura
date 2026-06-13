import { and, eq } from 'drizzle-orm';
import { getDb } from '../db/context';
import { type WorkspaceRole, workspaceMembers, workspaces } from '../db/schema';
import { ForbiddenError, NotFoundError } from '../lib/errors';

export type { WorkspaceRole };

export interface WorkspaceSummary {
  id: string;
  name: string;
  icon: string | null;
  role: WorkspaceRole;
  createdAt: string;
}

const WRITE_ROLES: WorkspaceRole[] = ['owner', 'admin', 'editor'];

export async function listWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]> {
  const rows = await getDb()
    .select({
      id: workspaces.id,
      name: workspaces.name,
      icon: workspaces.icon,
      role: workspaceMembers.role,
      createdAt: workspaces.createdAt,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(workspaces.createdAt);

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function getMembershipRole(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole | null> {
  const member = await getDb().query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
  });
  return member?.role ?? null;
}

/** Ensures the user can read the workspace; returns their role or throws. */
export async function requireMember(workspaceId: string, userId: string): Promise<WorkspaceRole> {
  const role = await getMembershipRole(workspaceId, userId);
  if (!role) throw new NotFoundError('Workspace not found');
  return role;
}

/** Ensures the user can write to the workspace; throws if viewer or non-member. */
export async function requireWriteAccess(workspaceId: string, userId: string): Promise<void> {
  const role = await requireMember(workspaceId, userId);
  if (!WRITE_ROLES.includes(role)) {
    throw new ForbiddenError('You do not have write access to this workspace');
  }
}

export async function createWorkspace(input: {
  name: string;
  icon?: string | null;
  ownerId: string;
}): Promise<WorkspaceSummary> {
  // D1 has no interactive transactions, so insert sequentially and roll back the
  // workspace by hand if attaching the owner membership fails.
  const db = getDb();
  const [workspace] = await db
    .insert(workspaces)
    .values({ name: input.name, icon: input.icon ?? null, ownerId: input.ownerId })
    .returning();
  if (!workspace) throw new Error('Failed to create workspace');

  try {
    await db
      .insert(workspaceMembers)
      .values({ workspaceId: workspace.id, userId: input.ownerId, role: 'owner' });
  } catch (error) {
    await db.delete(workspaces).where(eq(workspaces.id, workspace.id));
    throw error;
  }

  return {
    id: workspace.id,
    name: workspace.name,
    icon: workspace.icon,
    role: 'owner' as const,
    createdAt: workspace.createdAt.toISOString(),
  };
}

export async function updateWorkspace(
  id: string,
  patch: { name?: string; icon?: string | null },
): Promise<void> {
  await getDb()
    .update(workspaces)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(workspaces.id, id));
}

export async function deleteWorkspace(id: string): Promise<void> {
  await getDb().delete(workspaces).where(eq(workspaces.id, id));
}
