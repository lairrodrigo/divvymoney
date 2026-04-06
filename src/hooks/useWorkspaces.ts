import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useWorkspaces() {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: async () => {
      const { data: memberships, error: mErr } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user!.id);
      if (mErr) throw mErr;
      if (!memberships || memberships.length === 0) return [];

      const ids = memberships.map(m => m.workspace_id);
      const { data: workspaces, error: wErr } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', ids);
      if (wErr) throw wErr;

      return (workspaces ?? []).map(ws => ({
        ...ws,
        role: (memberships.find(m => m.workspace_id === ws.id)?.role as "owner" | "editor" | "viewer") ?? 'viewer',
      }));
    },
    enabled: isReady && !!user,
    staleTime: 30000,
  });
}

export function useCreateWorkspace() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      // Usa função SQL segura que cria workspace + membro atomicamente (SECURITY DEFINER)
      const { data, error } = await (supabase as any)
        .rpc('create_workspace_with_owner', { workspace_name: name });

      if (error) throw error;
      if (!data || !Array.isArray(data) || data.length === 0) throw new Error('Função não retornou dados');

      // Mapeia os campos renomeados da função para o formato padrão do novo schema
      const row = data[0];
      return { id: row.ws_id, nome: row.ws_name, owner_id: row.ws_created_by, created_at: row.ws_created_at };
    },
    onSuccess: () => {
      // Recarrega para mostrar o novo espaço na lista
      setTimeout(() => window.location.reload(), 600);
    },
  });
}

export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace_members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useWorkspaceTransactions(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace_transactions', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('workspace_id', workspaceId!)
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workspaceId,
  });
}

export function useInviteMemberByEmail() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, email }: { workspaceId: string; email: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        },
        body: JSON.stringify({ workspace_id: workspaceId, email }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao convidar membro. O Edge Function retornou status ' + response.status);
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace_members'] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, userId }: { workspaceId: string; userId: string }) => {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace_members'] }),
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspaces').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}
