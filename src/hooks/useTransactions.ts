import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTransactions(referenceYear?: number) {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id, referenceYear],
    queryFn: async () => {
      let q = supabase.from('transactions').select('*').eq('user_id', user!.id);
      if (referenceYear) q = q.eq('reference_year', referenceYear);
      const { data, error } = await q.order('transaction_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isReady && !!user,
  });
}

export function useAddTransaction() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tx: {
      tipo: string;
      subtipo: string;
      valor: number;
      descricao: string;
      categoria: string;
      transaction_date: string;
      reference_month: string;
      reference_year: number;
      cartao_id?: string | null;
      parcelado: boolean;
      parcela_atual: number;
      total_parcelas: number;
    }) => {
      const { data, error } = await supabase.from('transactions').insert({
        ...tx,
        user_id: user!.id,
        created_by: user!.id,
        origem: 'manual' as const,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
