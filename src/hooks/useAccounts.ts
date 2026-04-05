import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAccounts(workspaceId: string | null) {
  return useQuery({
    queryKey: ['accounts', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, name, type }: { workspaceId: string; name: string; type: 'cash' | 'credit_card' | 'bank' }) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert({ workspace_id: workspaceId, name, type })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['accounts', variables.workspaceId] });
    },
  });
}
