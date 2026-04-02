import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useWorkspaces() {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: async () => {
      // Get workspaces where user is a member
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
        role: memberships.find(m => m.workspace_id === ws.id)?.role ?? 'viewer',
      }));
    },
    enabled: isReady && !!user,
  });
}

export function useCreateWorkspace() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (nome: string) => {
      // Create workspace
      const { data: ws, error: wsErr } = await supabase
        .from('workspaces')
        .insert({ nome, owner_id: user!.id })
        .select()
        .single();
      if (wsErr) throw wsErr;

      // Add owner as member
      const { error: memErr } = await supabase
        .from('workspace_members')
        .insert({ workspace_id: ws.id, user_id: user!.id, role: 'owner' });
      if (memErr) throw memErr;

      return ws;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
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

export function useInviteMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, email }: { workspaceId: string; email: string }) => {
      // Look up user by email via profiles — we need user_id
      // Since we can't query auth.users, we'll use a workaround:
      // The invited user must already have an account.
      // We search profiles by matching the email in auth metadata isn't possible client-side.
      // Instead, we use supabase admin lookup — but from client we can't.
      // Workaround: store the email as user_id placeholder and resolve on login.
      // Better approach: use an edge function. For now, we'll do a simple RPC or direct approach.
      
      // For MVP: the user provides the target user's email. We'll look them up.
      // Since we can't query auth.users from client, we need the invitee's user_id.
      // We'll ask for user_id directly or use an edge function.
      // Simplest MVP: accept user_id directly from the UI.
      throw new Error('Use inviteByUserId instead');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace_members'] }),
  });
}

export function useInviteByUserId() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, userId, role = 'viewer' }: { workspaceId: string; userId: string; role?: string }) => {
      const { error } = await supabase
        .from('workspace_members')
        .insert({ workspace_id: workspaceId, user_id: userId, role });
      if (error) throw error;
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
