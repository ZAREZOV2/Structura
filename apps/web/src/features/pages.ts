import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { PageNode } from './types';

export function usePageTree(workspaceId: string | null) {
  return useQuery({
    queryKey: ['pages', workspaceId],
    enabled: !!workspaceId,
    queryFn: async (): Promise<PageNode[]> => {
      if (!workspaceId) return [];
      const { data, error } = await api.workspaces({ workspaceId }).pages.get();
      if (error) throw error;
      return data;
    },
  });
}

export function usePage(pageId: string | null) {
  return useQuery({
    queryKey: ['page', pageId],
    enabled: !!pageId,
    queryFn: async () => {
      if (!pageId) return null;
      const { data, error } = await api.pages({ id: pageId }).get();
      if (error) throw error;
      return data;
    },
  });
}

export function usePageMutations(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const invalidateTree = () => queryClient.invalidateQueries({ queryKey: ['pages', workspaceId] });

  const createPage = useMutation({
    mutationFn: async (input: { parentId?: string | null; title?: string }) => {
      if (!workspaceId) throw new Error('No workspace');
      const { data, error } = await api.workspaces({ workspaceId }).pages.post({
        parentId: input.parentId ?? null,
        title: input.title ?? 'Untitled',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateTree,
  });

  const renamePage = useMutation({
    mutationFn: async (input: { id: string; title: string }) => {
      const { data, error } = await api.pages({ id: input.id }).patch({ title: input.title });
      if (error) throw error;
      return data;
    },
    onSuccess: (page) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: ['page', page.id] });
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.pages({ id }).delete();
      if (error) throw error;
      return id;
    },
    onSuccess: invalidateTree,
  });

  const movePage = useMutation({
    mutationFn: async (input: { id: string; parentId: string | null }) => {
      const { data, error } = await api.pages({ id: input.id }).move.post({
        parentId: input.parentId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateTree,
  });

  return { createPage, renamePage, deletePage, movePage };
}
