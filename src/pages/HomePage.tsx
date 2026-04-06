import { TrendingUp, TrendingDown, CreditCard, Target, Receipt, Plus } from 'lucide-react';
import AIInsights from '@/components/AIInsights';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspacesContext } from '@/contexts/WorkspaceContext';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useGoals } from '@/hooks/useGoals';
import { formatCurrency, getCurrentMonth, formatMonthLabel } from '@/utils/billing';
import { useNavigate } from 'react-router-dom';
import WorkspaceSelector from '@/components/WorkspaceSelector';

function calculateSummary(
  transactions: any[],
  month: string,
  pjAtivo: boolean
) {
  const monthTx = transactions.filter(t => t.reference_month === month);
  const receitas = monthTx.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0);
  const despDinheiro = monthTx.filter(t => t.tipo === 'despesa' && t.subtipo === 'dinheiro').reduce((s, t) => s + Number(t.valor), 0);
  const despCartao = monthTx.filter(t => t.tipo === 'despesa' && t.subtipo === 'cartao').reduce((s, t) => s + Number(t.valor), 0);
  const impostos = pjAtivo ? receitas * 0.15 : 0;
  return {
    receitas,
    despesas_dinheiro: despDinheiro,
    despesas_cartao: despCartao,
    impostos,
    saldo_disponivel: receitas - despDinheiro,
    saldo_comprometido: receitas - despDinheiro - despCartao - impostos,
  };
}

export default function HomePage() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspacesContext();
  const { data: profile } = useProfile();
  const { data: transactions = [], isLoading: loadingTx } = useTransactions(activeWorkspaceId);
  const { data: cards = [] } = useCreditCards(activeWorkspaceId);
  const { data: goals = [] } = useGoals(activeWorkspaceId);

  const currentMonth = getCurrentMonth();
  const pjAtivo = profile?.pj_ativo ?? false;
  const summary = calculateSummary(transactions, currentMonth, pjAtivo);

  return (
    <div className="animate-fade-in space-y-6 px-5 pt-14">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 transition-transform active:scale-95">
            <img src="/logo.png" alt="DivvyMoney" className="h-full w-full object-contain" />
          </div>
          <WorkspaceSelector />
        </div>
        <button
          onClick={() => navigate('/perfil')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm border border-border/40 transition-transform active:scale-95"
        >
          <span className="text-sm font-bold text-primary">
            {(profile?.nome || 'U').charAt(0).toUpperCase()}
          </span>
        </button>
      </div>

      {/* Balance Card */}
      <div className="glass-card rounded-2xl p-6 animate-slide-up">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saldo disponível</p>
        <p className="mt-1 text-3xl font-bold text-gradient-gold balance-glow">
          {formatCurrency(summary.saldo_disponivel)}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Comprometido:</span>
          <span className={`font-semibold ${summary.saldo_comprometido >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(summary.saldo_comprometido)}
          </span>
        </div>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="rounded-xl bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <span className="text-xs text-muted-foreground">Receitas</span>
          </div>
          <p className="mt-2 text-lg font-bold text-success">{formatCurrency(summary.receitas)}</p>
        </div>
        <div className="rounded-xl bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-xs text-muted-foreground">Despesas</span>
          </div>
          <p className="mt-2 text-lg font-bold text-destructive">
            {formatCurrency(summary.despesas_dinheiro + summary.despesas_cartao)}
          </p>
        </div>
      </div>

      {/* Credit Cards */}
      <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Cartões de crédito</h2>
        </div>
        {cards.length === 0 ? (
          <button
            onClick={() => navigate('/perfil')}
            className="w-full rounded-xl border border-dashed border-muted-foreground/30 py-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
          >
            <Plus className="mx-auto h-5 w-5 mb-1" />
            Adicionar cartão
          </button>
        ) : (
          <div className="space-y-2">
            {cards.map(card => {
              const cardTotal = transactions
                .filter(t => t.cartao_id === card.id && t.reference_month === currentMonth)
                .reduce((s, t) => s + Number(t.valor), 0);
              const limit = Number(card.limite) || 0;
              const pct = limit > 0 ? Math.min((cardTotal / limit) * 100, 100) : 0;
              return (
                <div key={card.id} className="rounded-xl bg-card p-4 shadow-sm border border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{card.nome}</span>
                    <span className="text-xs text-muted-foreground">Fecha dia {card.fechamento_dia}</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-lg font-bold text-foreground">{formatCurrency(cardTotal)}</span>
                    {limit > 0 && <span className="text-xs text-muted-foreground">de {formatCurrency(limit)}</span>}
                  </div>
                  {limit > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-secondary">
                      <div className="h-full rounded-full gradient-gold transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <AIInsights />
      </div>

      {/* PJ */}
      {pjAtivo && (
        <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Impostos (PJ)</h2>
          </div>
          <div className="rounded-xl bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{profile?.regime_tributario || 'Simples Nacional'}</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(summary.impostos)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Estimado em 15% sobre receita do mês</p>
          </div>
        </div>
      )}

      {/* Goals */}
      <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Metas</h2>
          </div>
          <button onClick={() => navigate('/metas')} className="text-xs text-primary font-medium">Ver todas</button>
        </div>
        {goals.length === 0 ? (
          <button
            onClick={() => navigate('/metas')}
            className="w-full rounded-xl border border-dashed border-muted-foreground/30 py-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
          >
            <Plus className="mx-auto h-5 w-5 mb-1" />
            Criar sua primeira meta
          </button>
        ) : (
          <div className="space-y-2">
            {goals.slice(0, 3).map(goal => {
              const pct = Math.min((Number(goal.valor_atual) / Number(goal.valor_alvo)) * 100, 100);
              return (
                <button key={goal.id} onClick={() => navigate('/metas')} className="w-full text-left rounded-xl bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{goal.nome}</span>
                    <span className="text-xs text-primary font-semibold">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full gradient-gold transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(Number(goal.valor_atual))}</span>
                    <span>{formatCurrency(Number(goal.valor_alvo))}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty state CTA */}
      {loadingTx ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : transactions.length === 0 && (
        <div className="rounded-2xl bg-card p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Comece adicionando sua primeira receita ou despesa</p>
          <button
            onClick={() => navigate('/adicionar')}
            className="rounded-xl gradient-gold px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Adicionar transação
          </button>
        </div>
      )}
    </div>
  );
}
