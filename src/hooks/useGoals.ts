import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useGoals(workspaceId: string | null) {
  return useQuery({
    queryKey: ['goals', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useAddGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (goal: { workspace_id: string; nome: string; valor_alvo: number; valor_atual: number; prazo: string }) => {
      const { data, error } = await supabase.from('goals').insert({
        ...goal,
        user_id: user!.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['goals', variables.workspace_id] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workspaceId, ...updates }: { id: string; workspaceId: string; nome?: string; valor_alvo?: number; valor_atual?: number; prazo?: string }) => {
      const { error } = await supabase.from('goals').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['goals', variables.workspaceId] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['goals', variables.workspaceId] }),
  });
}

