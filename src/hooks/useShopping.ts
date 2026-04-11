import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useShoppingLists(workspaceId: string | null) {
  return useQuery({
    queryKey: ['shopping_lists', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { workspace_id: string; user_id: string; nome: string }) => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['shopping_lists', v.workspace_id] }),
  });
}

export function useUpdateShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; workspace_id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from('shopping_lists')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['shopping_lists', v.workspace_id] }),
  });
}

export function useDeleteShoppingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workspace_id }: { id: string; workspace_id: string }) => {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['shopping_lists', v.workspace_id] }),
  });
}

// Shopping Items
export function useShoppingItems(listId: string | null) {
  return useQuery({
    queryKey: ['shopping_items', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('list_id', listId!)
        .order('comprado', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!listId,
  });
}

export function useAddShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { list_id: string; nome: string; quantidade?: number; unidade?: string; preco_estimado?: number }) => {
      const { data, error } = await supabase
        .from('shopping_items')
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['shopping_items', d.list_id] }),
  });
}

export function useUpdateShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, list_id, ...updates }: { id: string; list_id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from('shopping_items')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      return { list_id };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['shopping_items', d.list_id] }),
  });
}

export function useDeleteShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, list_id }: { id: string; list_id: string }) => {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { list_id };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ['shopping_items', d.list_id] }),
  });
}
