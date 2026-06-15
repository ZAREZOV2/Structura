import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/* ─── Types ─── */

export interface SkladCategory {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkladProduct {
  id: string;
  workspaceId: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  unit: string;
  quantity: number;
  minQuantity: number;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkladMovement {
  id: string;
  workspaceId: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalQuantity: number;
  totalCategories: number;
  lowStockCount: number;
  lowStockProducts: SkladProduct[];
  recentMovements: SkladMovement[];
}

// Eden Treaty helper - cast to suppress deep inference issues on dynamic paths.
// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty dynamic path access
const sklad = api.sklad as any;

/* ─── Dashboard ─── */

export function useSkladStats(workspaceId: string | null) {
  return useQuery({
    queryKey: ['sklad', 'stats', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const { data, error } = await sklad({ workspaceId }).stats.get();
      if (error) throw error;
      return data as DashboardStats;
    },
    enabled: !!workspaceId,
  });
}

/* ─── Categories ─── */

export function useSkladCategories(workspaceId: string | null) {
  return useQuery({
    queryKey: ['sklad', 'categories', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await sklad({ workspaceId }).categories.get();
      if (error) throw error;
      return data as SkladCategory[];
    },
    enabled: !!workspaceId,
  });
}

export function useSkladCategoryMutations(workspaceId: string | null) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['sklad', 'categories', workspaceId] });
    qc.invalidateQueries({ queryKey: ['sklad', 'stats', workspaceId] });
  };

  const create = useMutation({
    mutationFn: async (input: { name: string; color?: string; icon?: string }) => {
      if (!workspaceId) throw new Error('No workspace');
      const { data, error } = await sklad({ workspaceId }).categories.post(input);
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      color?: string;
      icon?: string | null;
    }) => {
      const { id, ...patch } = input;
      const { data, error } = await sklad.categories({ id }).patch(patch);
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sklad.categories({ id }).delete();
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

/* ─── Products ─── */

export function useSkladProducts(
  workspaceId: string | null,
  opts?: { categoryId?: string; search?: string },
) {
  return useQuery({
    queryKey: ['sklad', 'products', workspaceId, opts?.categoryId, opts?.search],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await sklad({ workspaceId }).products.get({
        query: { categoryId: opts?.categoryId, search: opts?.search },
      });
      if (error) throw error;
      return data as SkladProduct[];
    },
    enabled: !!workspaceId,
  });
}

export function useSkladProduct(productId: string | null) {
  return useQuery({
    queryKey: ['sklad', 'product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await sklad.products({ id: productId }).get();
      if (error) throw error;
      return data as SkladProduct;
    },
    enabled: !!productId,
  });
}

export function useSkladProductMutations(workspaceId: string | null) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['sklad', 'products', workspaceId] });
    qc.invalidateQueries({ queryKey: ['sklad', 'stats', workspaceId] });
  };

  const create = useMutation({
    mutationFn: async (input: {
      name: string;
      categoryId?: string | null;
      sku?: string | null;
      unit?: string;
      quantity?: number;
      minQuantity?: number;
      description?: string | null;
    }) => {
      if (!workspaceId) throw new Error('No workspace');
      const { data, error } = await sklad({ workspaceId }).products.post(input);
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      categoryId?: string | null;
      sku?: string | null;
      unit?: string;
      minQuantity?: number;
      description?: string | null;
    }) => {
      const { id, ...patch } = input;
      const { data, error } = await sklad.products({ id }).patch(patch);
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sklad.products({ id }).delete();
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

/* ─── Movements ─── */

export function useSkladMovements(workspaceId: string | null, opts?: { productId?: string }) {
  return useQuery({
    queryKey: ['sklad', 'movements', workspaceId, opts?.productId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await sklad({ workspaceId }).movements.get({
        query: { productId: opts?.productId },
      });
      if (error) throw error;
      return data as SkladMovement[];
    },
    enabled: !!workspaceId,
  });
}

export function useSkladMovementMutations(workspaceId: string | null) {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: {
      productId: string;
      type: 'in' | 'out' | 'adjustment';
      quantity: number;
      note?: string | null;
    }) => {
      if (!workspaceId) throw new Error('No workspace');
      const { data, error } = await sklad({ workspaceId }).movements.post(input);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sklad'] });
    },
  });

  return { create };
}
