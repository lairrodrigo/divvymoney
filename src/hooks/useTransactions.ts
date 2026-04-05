import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTransactions(workspaceId: string | null) {
  return useQuery({
    queryKey: ['transactions', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useAddTransaction() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tx: {
      workspace_id: string;
      category_id: string;
      account_id: string;
      type: 'income' | 'expense';
      amount: number;
      description: string;
      date: string;
      paid_by_user_id?: string;
      assigned_to_user_id?: string;
      is_shared?: boolean;
    }) => {
      const { data, error } = await supabase.from('transactions').insert({
        ...tx,
        created_by_user_id: user!.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['transactions', variables.workspace_id] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => qc.invalidateQueries({ queryKey: ['transactions', variables.workspaceId] }),
  });
}

