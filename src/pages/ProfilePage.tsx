import { LogOut, CreditCard, Tag, Building2, ChevronRight } from 'lucide-react';
import { mockProfile, mockCards, calculateMonthSummary, mockTransactions } from '@/data/mockData';
import { formatCurrency, getCurrentMonth } from '@/utils/billing';
import { CATEGORIES } from '@/types/finance';

export default function ProfilePage() {
  const currentMonth = getCurrentMonth();
  const summary = calculateMonthSummary(mockTransactions, currentMonth, mockProfile.renda_principal, mockProfile.pj_ativo);

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-6">
      {/* User info */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-gold text-xl font-bold text-primary-foreground">
          {mockProfile.nome.charAt(0)}
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">{mockProfile.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {mockProfile.tipo_pessoa} • {mockProfile.pj_ativo ? 'PJ Ativo' : 'Pessoa Física'}
          </p>
        </div>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card p-4">
          <p className="text-xs text-muted-foreground">Renda principal</p>
          <p className="mt-1 text-sm font-bold text-foreground">{formatCurrency(mockProfile.renda_principal)}</p>
        </div>
        <div className="rounded-xl bg-card p-4">
          <p className="text-xs text-muted-foreground">Saldo inicial</p>
          <p className="mt-1 text-sm font-bold text-foreground">{formatCurrency(mockProfile.saldo_inicial)}</p>
        </div>
      </div>

      {/* Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Meus cartões</h2>
        </div>
        <div className="space-y-2">
          {mockCards.map(card => (
            <div key={card.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{card.nome}</p>
                <p className="text-xs text-muted-foreground">
                  Fecha {card.fechamento_dia} • Vence {card.vencimento_dia}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">{formatCurrency(card.limite)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Categorias</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <span key={cat} className="rounded-lg bg-card px-3 py-1.5 text-xs text-muted-foreground">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* PJ Module */}
      {mockProfile.pj_ativo && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Módulo PJ</h2>
          </div>
          <div className="rounded-xl bg-card p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Regime</span>
              <span className="text-sm font-medium text-foreground">{mockProfile.regime_tributario}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Faturamento do mês</span>
              <span className="text-sm font-medium text-foreground">{formatCurrency(summary.receitas)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Imposto estimado</span>
              <span className="text-sm font-medium text-primary">{formatCurrency(summary.impostos)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-semibold text-foreground">Líquido real</span>
              <span className="text-sm font-bold text-success">
                {formatCurrency(summary.saldo_comprometido)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20">
        <LogOut className="h-4 w-4" />
        Sair da conta
      </button>
    </div>
  );
}
