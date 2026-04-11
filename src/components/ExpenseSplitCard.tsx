import { useState } from 'react';
import { Wallet, Calculator } from 'lucide-react';
import { useExpenseSplits, useUpsertExpenseSplit } from '@/hooks/useExpenseSplits';
import { formatCurrency, getCurrentMonth, formatMonthLabel } from '@/utils/billing';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  user_id: string;
  role: string;
}

export default function ExpenseSplitCard({
  workspaceId,
  members,
  totalDespesas,
  userId,
}: {
  workspaceId: string;
  members: Member[];
  totalDespesas: number;
  userId: string;
}) {
  const month = getCurrentMonth();
  const { data: splits = [] } = useExpenseSplits(workspaceId, month);
  const upsertSplit = useUpsertExpenseSplit();
  const { toast } = useToast();

  const [editMode, setEditMode] = useState(false);
  const [rendas, setRendas] = useState<Record<string, string>>({});

  // Initialize rendas from existing splits
  const getRendaForUser = (uid: string) => {
    if (rendas[uid] !== undefined) return rendas[uid];
    const existing = splits.find(s => s.user_id === uid);
    return existing ? String(existing.renda_declarada) : '0';
  };

  const totalRenda = members.reduce((s, m) => s + (Number(getRendaForUser(m.user_id)) || 0), 0);

  const getPercentual = (uid: string) => {
    const renda = Number(getRendaForUser(uid)) || 0;
    return totalRenda > 0 ? (renda / totalRenda) * 100 : 0;
  };

  const getValorDevido = (uid: string) => {
    return totalDespesas * (getPercentual(uid) / 100);
  };

  const handleSave = async () => {
    try {
      for (const m of members) {
        const renda = Number(getRendaForUser(m.user_id)) || 0;
        const pct = getPercentual(m.user_id);
        const devido = getValorDevido(m.user_id);
        const existingSplit = splits.find(s => s.user_id === m.user_id);

        await upsertSplit.mutateAsync({
          workspace_id: workspaceId,
          reference_month: month,
          user_id: m.user_id,
          renda_declarada: renda,
          percentual: pct,
          valor_devido: devido,
          valor_pago: existingSplit ? Number(existingSplit.valor_pago) : 0,
        });
      }
      setEditMode(false);
      toast({ title: 'Divisão salva! ✅' });
    } catch {
      toast({ title: 'Erro ao salvar divisão', variant: 'destructive' });
    }
  };

  if (members.length < 2) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Divisão de despesas</h2>
        </div>
        <button onClick={() => setEditMode(!editMode)}
          className="text-xs text-primary font-medium">
          {editMode ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        {formatMonthLabel(month)} • Total: {formatCurrency(totalDespesas)}
      </p>

      <div className="space-y-2">
        {members.map(m => {
          const pct = getPercentual(m.user_id);
          const devido = getValorDevido(m.user_id);
          const existingSplit = splits.find(s => s.user_id === m.user_id);
          const pago = existingSplit ? Number(existingSplit.valor_pago) : 0;
          const saldo = pago - devido;

          return (
            <div key={m.id} className="rounded-xl bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {m.user_id === userId ? 'Você' : m.user_id.slice(0, 8) + '...'}
                </span>
                <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
              </div>

              {editMode ? (
                <div>
                  <label className="text-[10px] text-muted-foreground">Renda (R$)</label>
                  <input type="number" value={getRendaForUser(m.user_id)}
                    onChange={e => setRendas(prev => ({ ...prev, [m.user_id]: e.target.value }))}
                    className="w-full rounded-lg bg-secondary px-3 py-1.5 text-sm text-foreground outline-none" />
                </div>
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Deve: {formatCurrency(devido)}</span>
                  <span className={saldo >= 0 ? 'text-success' : 'text-destructive'}>
                    {saldo >= 0 ? 'Pago ✅' : `Falta: ${formatCurrency(Math.abs(saldo))}`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editMode && (
        <button onClick={handleSave} disabled={upsertSplit.isPending}
          className="w-full rounded-lg gradient-gold py-2 text-xs font-bold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2">
          <Calculator className="h-3.5 w-3.5" />
          {upsertSplit.isPending ? 'Salvando...' : 'Calcular e salvar divisão'}
        </button>
      )}

      {/* Who owes whom */}
      {!editMode && splits.length >= 2 && (
        <div className="rounded-xl bg-card/50 p-3">
          <p className="text-xs font-semibold text-foreground mb-1">💰 Acerto</p>
          {(() => {
            const balances = members.map(m => {
              const s = splits.find(sp => sp.user_id === m.user_id);
              return {
                userId: m.user_id,
                label: m.user_id === userId ? 'Você' : m.user_id.slice(0, 8) + '...',
                balance: s ? Number(s.valor_pago) - Number(s.valor_devido) : 0,
              };
            });
            const devedores = balances.filter(b => b.balance < 0);
            const credores = balances.filter(b => b.balance > 0);

            if (devedores.length === 0 && credores.length === 0) {
              return <p className="text-xs text-success">Tudo acertado! ✅</p>;
            }

            return devedores.map(d => {
              const credor = credores[0];
              if (!credor) return null;
              return (
                <p key={d.userId} className="text-xs text-muted-foreground">
                  {d.label} deve {formatCurrency(Math.abs(d.balance))} para {credor.label}
                </p>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
