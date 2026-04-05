import { useState } from 'react';
import { Plus, Target, Trash2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspacesContext } from '@/contexts/WorkspaceContext';
import { useGoals, useAddGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals';
import { formatCurrency } from '@/utils/billing';
import { useToast } from '@/hooks/use-toast';

export default function GoalsPage() {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspacesContext();
  const { data: goals = [], isLoading } = useGoals(activeWorkspaceId);
  const addGoal = useAddGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [valorAtual, setValorAtual] = useState('');
  const [prazo, setPrazo] = useState('');

  const resetForm = () => {
    setNome('');
    setValorAlvo('');
    setValorAtual('');
    setPrazo('');
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (goal: typeof goals[0]) => {
    setNome(goal.nome);
    setValorAlvo(String(goal.valor_alvo));
    setValorAtual(String(goal.valor_atual));
    setPrazo(goal.prazo);
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!nome || !valorAlvo || !prazo) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    try {
      if (!activeWorkspaceId) return;
      if (editingId) {
        await updateGoal.mutateAsync({
          id: editingId,
          workspaceId: activeWorkspaceId,
          nome,
          valor_alvo: parseFloat(valorAlvo),
          valor_atual: parseFloat(valorAtual || '0'),
          prazo,
        });
        toast({ title: 'Meta atualizada! ✅' });
      } else {
        await addGoal.mutateAsync({
          workspace_id: activeWorkspaceId,
          nome,
          valor_alvo: parseFloat(valorAlvo),
          valor_atual: parseFloat(valorAtual || '0'),
          prazo,
        });
        toast({ title: 'Meta criada! ✅' });
      }
      resetForm();
    } catch {
      toast({ title: 'Erro ao salvar meta', variant: 'destructive' });
    }
  };

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Metas</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex h-9 w-9 items-center justify-center rounded-full gradient-gold">
          <Plus className="h-4 w-4 text-primary-foreground" />
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl bg-card p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Editar meta' : 'Nova meta'}</h2>
            <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da meta"
            className="w-full rounded-xl bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor alvo (R$)</label>
              <input type="number" value={valorAlvo} onChange={e => setValorAlvo(e.target.value)} placeholder="50000"
                className="w-full rounded-xl bg-secondary px-4 py-3 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor atual (R$)</label>
              <input type="number" value={valorAtual} onChange={e => setValorAtual(e.target.value)} placeholder="0"
                className="w-full rounded-xl bg-secondary px-4 py-3 text-sm text-foreground outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prazo</label>
            <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)}
              className="w-full rounded-xl bg-secondary px-4 py-3 text-sm text-foreground outline-none" />
          </div>
          <button onClick={handleSave} disabled={addGoal.isPending || updateGoal.isPending}
            className="w-full rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {addGoal.isPending || updateGoal.isPending ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar meta'}
          </button>
        </div>
      )}

      {/* Goals list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : goals.length === 0 && !showForm ? (
        <div className="text-center py-16 space-y-3">
          <Target className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhuma meta criada ainda.</p>
          <p className="text-xs text-muted-foreground">Toque no + para criar sua primeira meta financeira.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const pct = Math.min((Number(goal.valor_atual) / Number(goal.valor_alvo)) * 100, 100);
            const prazo = new Date(goal.prazo);
            const now = new Date();
            const daysLeft = Math.max(0, Math.ceil((prazo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const monthsLeft = Math.ceil(daysLeft / 30);
            const remaining = Number(goal.valor_alvo) - Number(goal.valor_atual);
            const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;

            return (
              <button key={goal.id} onClick={() => openEdit(goal)}
                className="w-full text-left rounded-2xl bg-card p-5 space-y-4 transition-all hover:ring-1 hover:ring-primary/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{goal.nome}</p>
                      <p className="text-xs text-muted-foreground">{daysLeft} dias restantes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-lg font-bold text-gradient-gold">{pct.toFixed(0)}%</span>
                    <button onClick={e => { e.stopPropagation(); deleteGoal.mutate({ id: goal.id, workspaceId: activeWorkspaceId! }); console.log("Deleting", goal.id); }}
                      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-secondary">
                  <div className="h-full rounded-full gradient-gold transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(Number(goal.valor_atual))}</span>
                  <span>{formatCurrency(Number(goal.valor_alvo))}</span>
                </div>

                <div className="rounded-xl bg-surface-elevated p-3">
                  <p className="text-xs text-muted-foreground">
                    💡 Para atingir sua meta, economize{' '}
                    <span className="font-semibold text-primary">{formatCurrency(monthlyNeeded)}/mês</span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
