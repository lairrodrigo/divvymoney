import { TrendingUp, TrendingDown, CreditCard, Lightbulb, Target, Receipt } from 'lucide-react';
import { mockProfile, mockTransactions, mockCards, mockGoals, calculateMonthSummary } from '@/data/mockData';
import { formatCurrency, getCurrentMonth, formatMonthLabel } from '@/utils/billing';

export default function HomePage() {
  const currentMonth = getCurrentMonth();
  const summary = calculateMonthSummary(mockTransactions, currentMonth, mockProfile.renda_principal, mockProfile.pj_ativo);

  const faturaAtual = mockTransactions
    .filter(t => t.reference_month === currentMonth && t.subtipo === 'cartao')
    .reduce((s, t) => s + t.valor, 0);

  return (
    <div className="animate-fade-in space-y-6 px-5 pt-14">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="text-2xl font-bold text-foreground">{mockProfile.nome} 👋</h1>
      </div>

      {/* Balance Card */}
      <div className="glass-card rounded-2xl p-6 animate-slide-up">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Saldo disponível
        </p>
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

      {/* Credit Card */}
      <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Cartão de crédito</h2>
        </div>
        <div className="space-y-2">
          {mockCards.map(card => {
            const cardTotal = mockTransactions
              .filter(t => t.cartao_id === card.id && t.reference_month === currentMonth)
              .reduce((s, t) => s + t.valor, 0);
            const pct = Math.min((cardTotal / card.limite) * 100, 100);
            return (
              <div key={card.id} className="rounded-xl bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{card.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    Fecha dia {card.fechamento_dia}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-lg font-bold text-foreground">{formatCurrency(cardTotal)}</span>
                  <span className="text-xs text-muted-foreground">
                    de {formatCurrency(card.limite)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full gradient-gold transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Insights</h2>
        </div>
        <div className="rounded-xl bg-card p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            📊 Você gastou <span className="font-semibold text-foreground">{formatCurrency(summary.despesas_dinheiro + summary.despesas_cartao)}</span> até agora em {formatMonthLabel(currentMonth)}.
          </p>
          <p className="text-sm text-muted-foreground">
            💡 Se mantiver esse ritmo, terá <span className="font-semibold text-success">{formatCurrency(summary.saldo_comprometido)}</span> ao final do mês.
          </p>
        </div>
      </div>

      {/* Taxes (PJ) */}
      {mockProfile.pj_ativo && (
        <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Impostos (PJ)</h2>
          </div>
          <div className="rounded-xl bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{mockProfile.regime_tributario}</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(summary.impostos)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimado em 15% sobre receita do mês
            </p>
          </div>
        </div>
      )}

      {/* Goals */}
      <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Metas</h2>
        </div>
        <div className="space-y-2">
          {mockGoals.map(goal => {
            const pct = Math.min((goal.valor_atual / goal.valor_alvo) * 100, 100);
            return (
              <div key={goal.id} className="rounded-xl bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{goal.nome}</span>
                  <span className="text-xs text-primary font-semibold">{pct.toFixed(0)}%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full gradient-gold transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(goal.valor_atual)}</span>
                  <span>{formatCurrency(goal.valor_alvo)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
