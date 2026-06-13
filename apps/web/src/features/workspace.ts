import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data, error } = await api.workspaces.get();
      if (error) throw error;
      return data;
    },
  });
}

/** Loads workspaces and creates a default one if the user has none yet. */
export function useActiveWorkspace() {
  const queryClient = useQueryClient();
  const workspaces = useWorkspaces();

  const createDefault = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.workspaces.post({ name: 'My Workspace' });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });

  const list = workspaces.data;
  useEffect(() => {
    if (list && list.length === 0 && !createDefault.isPending) {
      createDefault.mutate();
    }
  }, [list, createDefault]);

  return {
    isLoading: workspaces.isLoading || createDefault.isPending,
    workspace: list?.[0] ?? null,
  };
}
