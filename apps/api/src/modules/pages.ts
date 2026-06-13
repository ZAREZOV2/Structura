import { Elysia, t } from 'elysia';
import { authGuard } from '../middleware/auth';
import {
  createPage,
  deletePage,
  getPageOrThrow,
  listPages,
  movePage,
  setArchived,
  updatePage,
} from './pages.service';
import { requireMember, requireWriteAccess } from './workspaces.service';

export const pagesModule = new Elysia({ name: 'pages' })
  .use(authGuard)
  .guard({ auth: true })
  .get(
    '/workspaces/:workspaceId/pages',
    async ({ user, params }) => {
      await requireMember(params.workspaceId, user.id);
      return listPages(params.workspaceId);
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      detail: { tags: ['Pages'], summary: 'List pages in a workspace (flat, ordered)' },
    },
  )
  .post(
    '/workspaces/:workspaceId/pages',
    async ({ user, params, body }) => {
      await requireWriteAccess(params.workspaceId, user.id);
      return createPage({
        workspaceId: params.workspaceId,
        parentId: body.parentId ?? null,
        title: body.title ?? 'Untitled',
        createdBy: user.id,
      });
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      body: t.Object({
        parentId: t.Optional(t.Union([t.String(), t.Null()])),
        title: t.Optional(t.String({ maxLength: 200 })),
      }),
      detail: { tags: ['Pages'], summary: 'Create a page' },
    },
  )
  .get(
    '/pages/:id',
    async ({ user, params }) => {
      const page = await getPageOrThrow(params.id);
      await requireMember(page.workspaceId, user.id);
      return {
        id: page.id,
        workspaceId: page.workspaceId,
        parentId: page.parentId,
        title: page.title,
        icon: page.icon,
        coverUrl: page.coverUrl,
        position: page.position,
        content: page.content,
        isArchived: page.isArchived,
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
      };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Pages'], summary: 'Get a single page with content' },
    },
  )
  .patch(
    '/pages/:id',
    async ({ user, params, body }) => {
      const page = await getPageOrThrow(params.id);
      await requireWriteAccess(page.workspaceId, user.id);
      return updatePage(params.id, body);
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        title: t.Optional(t.String({ maxLength: 200 })),
        icon: t.Optional(t.Union([t.String(), t.Null()])),
        coverUrl: t.Optional(t.Union([t.String(), t.Null()])),
        content: t.Optional(t.Unknown()),
      }),
      detail: { tags: ['Pages'], summary: 'Update page metadata or content' },
    },
  )
  .post(
    '/pages/:id/move',
    async ({ user, params, body }) => {
      const page = await getPageOrThrow(params.id);
      await requireWriteAccess(page.workspaceId, user.id);
      return movePage(params.id, body);
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        parentId: t.Union([t.String(), t.Null()]),
        prevId: t.Optional(t.Union([t.String(), t.Null()])),
        nextId: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Pages'], summary: 'Move/reorder a page within the tree' },
    },
  )
  .post(
    '/pages/:id/archive',
    async ({ user, params, body }) => {
      const page = await getPageOrThrow(params.id);
      await requireWriteAccess(page.workspaceId, user.id);
      return setArchived(params.id, body.isArchived);
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ isArchived: t.Boolean() }),
      detail: { tags: ['Pages'], summary: 'Archive or restore a page' },
    },
  )
  .delete(
    '/pages/:id',
    async ({ user, params }) => {
      const page = await getPageOrThrow(params.id);
      await requireWriteAccess(page.workspaceId, user.id);
      await deletePage(params.id);
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Pages'], summary: 'Delete a page (and its descendants)' },
    },
  );
