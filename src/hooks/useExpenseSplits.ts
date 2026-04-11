import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useExpenseSplits(workspaceId: string | null, month: string) {
  return useQuery({
    queryKey: ['expense_splits', workspaceId, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_splits')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .eq('reference_month', month);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useUpsertExpenseSplit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      workspace_id: string;
      reference_month: string;
      user_id: string;
      renda_declarada: number;
      percentual: number;
      valor_devido: number;
      valor_pago: number;
    }) => {
      // Try update first, then insert
      const { data: existing } = await supabase
        .from('expense_splits')
        .select('id')
        .eq('workspace_id', params.workspace_id)
        .eq('reference_month', params.reference_month)
        .eq('user_id', params.user_id);

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from('expense_splits')
          .update({
            renda_declarada: params.renda_declarada,
            percentual: params.percentual,
            valor_devido: params.valor_devido,
            valor_pago: params.valor_pago,
          })
          .eq('id', existing[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expense_splits')
          .insert(params);
        if (error) throw error;
      }
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['expense_splits', v.workspace_id, v.reference_month] }),
  });
}
