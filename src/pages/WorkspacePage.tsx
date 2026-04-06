import { useState } from 'react';
import { Users, Plus, Trash2, UserPlus, ArrowLeft, Receipt, X, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useCreateWorkspace, useWorkspaceMembers, useWorkspaceTransactions, useInviteMemberByEmail, useRemoveMember, useDeleteWorkspace } from '@/hooks/useWorkspaces';
import { formatCurrency, formatDate, formatMonthLabel, getCurrentMonth } from '@/utils/billing';
import { useToast } from '@/hooks/use-toast';

export default function WorkspacePage() {
  const { user } = useAuth();
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const inviteMember = useInviteMemberByEmail();
  const removeMember = useRemoveMember();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [wsName, setWsName] = useState('');
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const selectedWs = workspaces.find(w => w.id === selectedWsId);

  const handleCreate = async () => {
    if (!wsName.trim()) return;
    try {
      await createWorkspace.mutateAsync(wsName.trim());
      toast({ title: 'Espaço criado! ✅' });
      setWsName('');
      setShowCreate(false);
      // Recarrega para garantir que o novo espaço apareça na lista
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      console.error('ERRO AO CRIAR ESPAÇO:', e);
      toast({ 
        title: 'Erro ao criar espaço',
        description: `${e?.message || 'Erro desconhecido'} (código: ${e?.code || 'N/A'})`,
        variant: 'destructive',
      });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedWsId) return;
    try {
      await inviteMember.mutateAsync({ workspaceId: selectedWsId, email: inviteEmail.trim() });
      toast({ title: 'Membro adicionado! ✅' });
      setInviteEmail('');
      setShowInvite(false);
    } catch (e: any) {
      toast({ title: e?.message || 'Erro ao convidar membro', variant: 'destructive' });
    }
  };

  if (selectedWsId && selectedWs) {
    return (
      <WorkspaceDetail
        workspace={selectedWs}
        userId={user!.id}
        onBack={() => setSelectedWsId(null)}
        showInvite={showInvite}
        setShowInvite={setShowInvite}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        onInvite={handleInvite}
        invitePending={inviteMember.isPending}
        onRemoveMember={(uid) => removeMember.mutate({ workspaceId: selectedWsId, userId: uid })}
        onDelete={() => {
          deleteWorkspace.mutate(selectedWsId);
          setSelectedWsId(null);
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-gold">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Espaços</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          {showCreate ? <X className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl bg-card p-4 space-y-3 animate-fade-in">
          <input type="text" value={wsName} onChange={e => setWsName(e.target.value)}
            placeholder="Nome do espaço compartilhado"
            className="w-full rounded-lg bg-secondary px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          <button onClick={handleCreate} disabled={createWorkspace.isPending}
            className="w-full rounded-lg gradient-gold py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
            {createWorkspace.isPending ? 'Criando...' : 'Criar espaço'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center space-y-3">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Crie um espaço compartilhado para gerenciar finanças com outra pessoa.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="rounded-xl gradient-gold px-6 py-3 text-sm font-bold text-primary-foreground">
            Criar primeiro espaço
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workspaces.map(ws => (
            <button key={ws.id} onClick={() => setSelectedWsId(ws.id)}
              className="w-full text-left rounded-xl bg-card p-4 transition-colors hover:bg-card/80 border border-border/40 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{ws.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{ws.role}</p>
                  </div>
                </div>
                {ws.created_by === user?.id && (
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Dono</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkspaceDetail({
  workspace, userId, onBack, showInvite, setShowInvite,
  inviteEmail, setInviteEmail, onInvite, invitePending, onRemoveMember, onDelete,
}: {
  workspace: { id: string; name: string; created_by: string; role: string };
  userId: string; onBack: () => void;
  showInvite: boolean; setShowInvite: (v: boolean) => void;
  inviteEmail: string; setInviteEmail: (v: string) => void;
  onInvite: () => void; invitePending: boolean;
  onRemoveMember: (uid: string) => void; onDelete: () => void;
}) {
  const { data: members = [] } = useWorkspaceMembers(workspace.id);
  const { data: transactions = [], isLoading: loadingTx } = useWorkspaceTransactions(workspace.id);
  const isOwner = workspace.role === 'owner';

  const currentMonth = getCurrentMonth();
  const monthTx = transactions.filter(t => t.date?.startsWith(currentMonth));
  const receitas = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const despesas = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-card">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{workspace.name}</h1>
          <p className="text-xs text-muted-foreground">{members.length} membro(s)</p>
        </div>
        {isOwner && (
          <button onClick={onDelete} className="p-2 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card p-4">
          <p className="text-xs text-muted-foreground">Receitas ({formatMonthLabel(currentMonth)})</p>
          <p className="text-lg font-bold text-success">{formatCurrency(receitas)}</p>
        </div>
        <div className="rounded-xl bg-card p-4">
          <p className="text-xs text-muted-foreground">Despesas ({formatMonthLabel(currentMonth)})</p>
          <p className="text-lg font-bold text-destructive">{formatCurrency(despesas)}</p>
        </div>
      </div>

      {/* Members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Membros</h2>
          </div>
          {isOwner && (
            <button onClick={() => setShowInvite(!showInvite)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              {showInvite ? <X className="h-3.5 w-3.5 text-primary" /> : <UserPlus className="h-3.5 w-3.5 text-primary" />}
            </button>
          )}
        </div>

        {showInvite && (
          <div className="rounded-xl bg-card p-4 space-y-3 mb-3 animate-fade-in">
            <p className="text-xs text-muted-foreground">
              Informe o email da pessoa que deseja convidar. Ela receberá um convite por email.
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
            <button onClick={onInvite} disabled={invitePending}
              className="w-full rounded-lg gradient-gold py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
              {invitePending ? 'Convidando...' : 'Convidar membro'}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {m.user_id === userId ? 'Você' : m.user_id.slice(0, 8) + '...'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
              </div>
              {isOwner && m.user_id !== userId && (
                <button onClick={() => onRemoveMember(m.user_id)} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Transações do espaço</h2>
        </div>

        {loadingTx ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma transação neste espaço. Ao adicionar transações, vincule ao workspace.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 20).map(tx => (
              <div key={tx.id} className="rounded-xl bg-card px-4 py-3 border border-border/40 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.date ? formatDate(tx.date) : ''}
                      {tx.created_by_user_id && tx.created_by_user_id !== userId && (
                        <span className="ml-1 text-primary"> • por outro membro</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
