import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreditCards(workspaceId: string | null) {
  return useQuery({
    queryKey: ['credit_cards', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'credit_card');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useAddCreditCard() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, name, limite }: { workspaceId: string; name: string; limite: number }) => {
      const { data, error } = await supabase.from('accounts').insert({
        workspace_id: workspaceId,
        name,
        type: 'credit_card',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['credit_cards', variables.workspaceId] }),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['credit_cards', variables.workspaceId] }),
  });
}

