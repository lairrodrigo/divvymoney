import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCategories(workspaceId: string | null) {
  return useQuery({
    queryKey: ['categories', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, name, type }: { workspaceId: string; name: string; type: 'income' | 'expense' }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ workspace_id: workspaceId, name, type })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['categories', variables.workspaceId] });
    },
  });
}
