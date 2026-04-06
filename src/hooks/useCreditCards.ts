import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCreditCards(workspaceId?: string | null) {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['credit_cards', workspaceId ?? user?.id],
    queryFn: async () => {
      let query = supabase.from('credit_cards').select('*');
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      } else {
        query = query.eq('user_id', user!.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: isReady && !!user,
  });
}

export function useAddCreditCard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, nome, limite, fechamento_dia, vencimento_dia }: {
      workspaceId?: string;
      nome: string;
      limite: number;
      fechamento_dia: number;
      vencimento_dia: number;
    }) => {
      const { data, error } = await supabase.from('credit_cards').insert({
        user_id: user!.id,
        workspace_id: workspaceId ?? null,
        nome,
        limite,
        fechamento_dia,
        vencimento_dia,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credit_cards'] }),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_cards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credit_cards'] }),
  });
}
