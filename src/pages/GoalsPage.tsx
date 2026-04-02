import { Plus, Target } from 'lucide-react';
import { mockGoals } from '@/data/mockData';
import { formatCurrency } from '@/utils/billing';

export default function GoalsPage() {
  return (
    <div className="animate-fade-in px-5 pt-14 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Metas</h1>
        <button className="flex h-9 w-9 items-center justify-center rounded-full gradient-gold">
          <Plus className="h-4 w-4 text-primary-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        {mockGoals.map(goal => {
          const pct = Math.min((goal.valor_atual / goal.valor_alvo) * 100, 100);
          const prazo = new Date(goal.prazo);
          const now = new Date();
          const daysLeft = Math.max(0, Math.ceil((prazo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          const monthsLeft = Math.ceil(daysLeft / 30);
          const remaining = goal.valor_alvo - goal.valor_atual;
          const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;

          return (
            <div key={goal.id} className="rounded-2xl bg-card p-5 space-y-4">
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
                <span className="text-lg font-bold text-gradient-gold">{pct.toFixed(0)}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full gradient-gold transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(goal.valor_atual)}</span>
                <span>{formatCurrency(goal.valor_alvo)}</span>
              </div>

              {/* Prediction */}
              <div className="rounded-xl bg-surface-elevated p-3">
                <p className="text-xs text-muted-foreground">
                  💡 Para atingir sua meta, economize{' '}
                  <span className="font-semibold text-primary">{formatCurrency(monthlyNeeded)}/mês</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
