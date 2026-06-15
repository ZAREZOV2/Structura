import { Elysia, t } from 'elysia';
import { authGuard } from '../middleware/auth';
import {
  createCategory,
  createMovement,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategoryOrThrow,
  getDashboardStats,
  getProductOrThrow,
  listCategories,
  listMovements,
  listProducts,
  updateCategory,
  updateProduct,
} from './sklad.service';
import { requireMember, requireWriteAccess } from './workspaces.service';

export const skladModule = new Elysia({ name: 'sklad', prefix: '/sklad' })
  .use(authGuard)
  .guard({ auth: true })

  /* ─── Dashboard ─── */
  .get(
    '/:workspaceId/stats',
    async ({ user, params }) => {
      await requireMember(params.workspaceId, user.id);
      return getDashboardStats(params.workspaceId);
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      detail: { tags: ['Sklad'], summary: 'Get inventory dashboard stats' },
    },
  )

  /* ─── Categories ─── */
  .get(
    '/:workspaceId/categories',
    async ({ user, params }) => {
      await requireMember(params.workspaceId, user.id);
      return listCategories(params.workspaceId);
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      detail: { tags: ['Sklad'], summary: 'List all categories' },
    },
  )
  .post(
    '/:workspaceId/categories',
    async ({ user, params, body }) => {
      await requireWriteAccess(params.workspaceId, user.id);
      return createCategory({ workspaceId: params.workspaceId, ...body });
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        color: t.Optional(t.String()),
        icon: t.Optional(t.String()),
      }),
      detail: { tags: ['Sklad'], summary: 'Create a category' },
    },
  )
  .patch(
    '/categories/:id',
    async ({ user, params, body }) => {
      const cat = await getCategoryOrThrow(params.id);
      await requireWriteAccess(cat.workspaceId, user.id);
      return updateCategory(params.id, body);
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        color: t.Optional(t.String()),
        icon: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Sklad'], summary: 'Update a category' },
    },
  )
  .delete(
    '/categories/:id',
    async ({ user, params }) => {
      const cat = await getCategoryOrThrow(params.id);
      await requireWriteAccess(cat.workspaceId, user.id);
      await deleteCategory(params.id);
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Sklad'], summary: 'Delete a category' },
    },
  )

  /* ─── Products ─── */
  .get(
    '/:workspaceId/products',
    async ({ user, params, query }) => {
      await requireMember(params.workspaceId, user.id);
      return listProducts(params.workspaceId, {
        categoryId: query.categoryId,
        search: query.search,
      });
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      query: t.Object({
        categoryId: t.Optional(t.String()),
        search: t.Optional(t.String()),
      }),
      detail: { tags: ['Sklad'], summary: 'List products with optional filters' },
    },
  )
  .get(
    '/products/:id',
    async ({ user, params }) => {
      const product = await getProductOrThrow(params.id);
      await requireMember(product.workspaceId, user.id);
      return product;
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Sklad'], summary: 'Get a single product' },
    },
  )
  .post(
    '/:workspaceId/products',
    async ({ user, params, body }) => {
      await requireWriteAccess(params.workspaceId, user.id);
      return createProduct({ workspaceId: params.workspaceId, ...body });
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 200 }),
        categoryId: t.Optional(t.Union([t.String(), t.Null()])),
        sku: t.Optional(t.Union([t.String(), t.Null()])),
        unit: t.Optional(t.String()),
        quantity: t.Optional(t.Number({ minimum: 0 })),
        minQuantity: t.Optional(t.Number({ minimum: 0 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        imageUrl: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Sklad'], summary: 'Create a product' },
    },
  )
  .patch(
    '/products/:id',
    async ({ user, params, body }) => {
      const product = await getProductOrThrow(params.id);
      await requireWriteAccess(product.workspaceId, user.id);
      return updateProduct(params.id, body);
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
        categoryId: t.Optional(t.Union([t.String(), t.Null()])),
        sku: t.Optional(t.Union([t.String(), t.Null()])),
        unit: t.Optional(t.String()),
        minQuantity: t.Optional(t.Number({ minimum: 0 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        imageUrl: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Sklad'], summary: 'Update a product' },
    },
  )
  .delete(
    '/products/:id',
    async ({ user, params }) => {
      const product = await getProductOrThrow(params.id);
      await requireWriteAccess(product.workspaceId, user.id);
      await deleteProduct(params.id);
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['Sklad'], summary: 'Delete a product' },
    },
  )

  /* ─── Movements ─── */
  .get(
    '/:workspaceId/movements',
    async ({ user, params, query }) => {
      await requireMember(params.workspaceId, user.id);
      return listMovements(params.workspaceId, {
        productId: query.productId,
        limit: query.limit ? Number(query.limit) : undefined,
      });
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      query: t.Object({
        productId: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { tags: ['Sklad'], summary: 'List inventory movements' },
    },
  )
  .post(
    '/:workspaceId/movements',
    async ({ user, params, body }) => {
      await requireWriteAccess(params.workspaceId, user.id);
      return createMovement({
        workspaceId: params.workspaceId,
        productId: body.productId,
        type: body.type,
        quantity: body.quantity,
        note: body.note,
        createdBy: user.id,
      });
    },
    {
      params: t.Object({ workspaceId: t.String() }),
      body: t.Object({
        productId: t.String(),
        type: t.Union([t.Literal('in'), t.Literal('out'), t.Literal('adjustment')]),
        quantity: t.Number({ minimum: 0 }),
        note: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { tags: ['Sklad'], summary: 'Create an inventory movement (in/out/adjustment)' },
    },
  );
