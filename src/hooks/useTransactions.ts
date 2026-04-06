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
        .order('transaction_date', { ascending: false });
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
      tipo: 'receita' | 'despesa';
      subtipo: 'dinheiro' | 'cartao';
      valor: number;
      descricao: string;
      categoria: string;
      transaction_date: string;
      reference_month: string;
      reference_year: number;
      cartao_id?: string;
      parcelado?: boolean;
      parcela_atual?: number;
      total_parcelas?: number;
      origem?: string;
    }) => {
      const { data, error } = await supabase.from('transactions').insert({
        ...tx,
        user_id: user!.id,
        created_by: user!.id,
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
