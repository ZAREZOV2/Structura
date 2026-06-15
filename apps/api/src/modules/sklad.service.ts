import { and, desc, eq, like, sql } from 'drizzle-orm';
import { getDb } from '../db/context';
import { skladCategories, skladMovements, skladProducts } from '../db/schema';
import { NotFoundError } from '../lib/errors';

/* ─── Categories ─── */

export async function listCategories(workspaceId: string) {
  return getDb().select().from(skladCategories).where(eq(skladCategories.workspaceId, workspaceId));
}

export async function createCategory(input: {
  workspaceId: string;
  name: string;
  color?: string;
  icon?: string;
}) {
  const [row] = await getDb()
    .insert(skladCategories)
    .values({
      workspaceId: input.workspaceId,
      name: input.name,
      color: input.color ?? '#6366f1',
      icon: input.icon ?? null,
    })
    .returning();
  if (!row) throw new Error('Failed to create category');
  return row;
}

export async function updateCategory(
  id: string,
  patch: { name?: string; color?: string; icon?: string | null },
) {
  const [row] = await getDb()
    .update(skladCategories)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(skladCategories.id, id))
    .returning();
  if (!row) throw new NotFoundError('Category not found');
  return row;
}

export async function deleteCategory(id: string) {
  await getDb().delete(skladCategories).where(eq(skladCategories.id, id));
}

export async function getCategoryOrThrow(id: string) {
  const row = await getDb().query.skladCategories.findFirst({
    where: eq(skladCategories.id, id),
  });
  if (!row) throw new NotFoundError('Category not found');
  return row;
}

/* ─── Products ─── */

export async function listProducts(
  workspaceId: string,
  opts?: { categoryId?: string; search?: string },
) {
  const conditions = [eq(skladProducts.workspaceId, workspaceId)];
  if (opts?.categoryId) {
    conditions.push(eq(skladProducts.categoryId, opts.categoryId));
  }
  if (opts?.search) {
    conditions.push(like(skladProducts.name, `%${opts.search}%`));
  }
  return getDb()
    .select()
    .from(skladProducts)
    .where(and(...conditions))
    .orderBy(skladProducts.name);
}

export async function getProductOrThrow(id: string) {
  const row = await getDb().query.skladProducts.findFirst({
    where: eq(skladProducts.id, id),
  });
  if (!row) throw new NotFoundError('Product not found');
  return row;
}

export async function createProduct(input: {
  workspaceId: string;
  categoryId?: string | null;
  name: string;
  sku?: string | null;
  unit?: string;
  quantity?: number;
  minQuantity?: number;
  description?: string | null;
  imageUrl?: string | null;
}) {
  const [row] = await getDb()
    .insert(skladProducts)
    .values({
      workspaceId: input.workspaceId,
      categoryId: input.categoryId ?? null,
      name: input.name,
      sku: input.sku ?? null,
      unit: input.unit ?? 'шт',
      quantity: input.quantity ?? 0,
      minQuantity: input.minQuantity ?? 0,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
    })
    .returning();
  if (!row) throw new Error('Failed to create product');
  return row;
}

export async function updateProduct(
  id: string,
  patch: {
    categoryId?: string | null;
    name?: string;
    sku?: string | null;
    unit?: string;
    minQuantity?: number;
    description?: string | null;
    imageUrl?: string | null;
  },
) {
  const [row] = await getDb()
    .update(skladProducts)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(skladProducts.id, id))
    .returning();
  if (!row) throw new NotFoundError('Product not found');
  return row;
}

export async function deleteProduct(id: string) {
  await getDb().delete(skladProducts).where(eq(skladProducts.id, id));
}

/* ─── Movements ─── */

export async function createMovement(input: {
  workspaceId: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  note?: string | null;
  createdBy: string;
}) {
  const product = await getProductOrThrow(input.productId);

  let newQuantity: number;
  if (input.type === 'in') {
    newQuantity = product.quantity + input.quantity;
  } else if (input.type === 'out') {
    newQuantity = product.quantity - input.quantity;
  } else {
    newQuantity = input.quantity;
  }

  const [movement] = await getDb()
    .insert(skladMovements)
    .values({
      workspaceId: input.workspaceId,
      productId: input.productId,
      type: input.type,
      quantity: input.quantity,
      note: input.note ?? null,
      createdBy: input.createdBy,
    })
    .returning();

  await getDb()
    .update(skladProducts)
    .set({ quantity: newQuantity, updatedAt: new Date() })
    .where(eq(skladProducts.id, input.productId));

  if (!movement) throw new Error('Failed to create movement');
  return movement;
}

export async function listMovements(
  workspaceId: string,
  opts?: { productId?: string; limit?: number },
) {
  const conditions = [eq(skladMovements.workspaceId, workspaceId)];
  if (opts?.productId) {
    conditions.push(eq(skladMovements.productId, opts.productId));
  }
  return getDb()
    .select()
    .from(skladMovements)
    .where(and(...conditions))
    .orderBy(desc(skladMovements.createdAt))
    .limit(opts?.limit ?? 50);
}

/* ─── Dashboard stats ─── */

export async function getDashboardStats(workspaceId: string) {
  const products = await getDb()
    .select()
    .from(skladProducts)
    .where(eq(skladProducts.workspaceId, workspaceId));

  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStock = products.filter((p) => p.quantity <= p.minQuantity);
  const categories = await listCategories(workspaceId);
  const recentMovements = await listMovements(workspaceId, { limit: 10 });

  return {
    totalProducts,
    totalQuantity,
    totalCategories: categories.length,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.slice(0, 5),
    recentMovements,
  };
}
