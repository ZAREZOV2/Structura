import { Elysia, t } from 'elysia';
import { ForbiddenError } from '../lib/errors';
import { authGuard } from '../middleware/auth';
import {
  createWorkspace,
  deleteWorkspace,
  listWorkspacesForUser,
  requireMember,
  requireWriteAccess,
  updateWorkspace,
} from './workspaces.service';

export const workspacesModule = new Elysia({ prefix: '/workspaces', name: 'workspaces' })
  .use(authGuard)
  .guard({ auth: true })
  .get('/', ({ user }) => listWorkspacesForUser(user.id), {
    detail: { tags: ['Workspaces'], summary: 'List the current user\u2019s workspaces' },
  })
  .post(
    '/',
    ({ user, body }) => createWorkspace({ name: body.name, icon: body.icon, ownerId: user.id }),
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 120 }),
        icon: t.Optional(t.String({ maxLength: 32 })),
      }),
      detail: { tags: ['Workspaces'], summary: 'Create a workspace' },
    },
  )
  .patch(
    '/:workspaceId',
    async ({ user, params, body }) => {
      await requireWriteAccess(params.workspaceId, user.id);
      await updateWorkspace(params.workspaceId, body);
      return { success: true };
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
        icon: t.Optional(t.Union([t.String({ maxLength: 32 }), t.Null()])),
      }),
      detail: { tags: ['Workspaces'], summary: 'Update a workspace' },
    },
  )
  .delete(
    '/:workspaceId',
    async ({ user, params }) => {
      const role = await requireMember(params.workspaceId, user.id);
      if (role !== 'owner') throw new ForbiddenError('Only the owner can delete a workspace');
      await deleteWorkspace(params.workspaceId);
      return { success: true };
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      detail: { tags: ['Workspaces'], summary: 'Delete a workspace' },
    },
  );
