import { useState } from 'react';
import { Search, Filter, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { mockTransactions, mockCards } from '@/data/mockData';
import { formatCurrency, formatDate, formatMonthLabel, getCurrentYear } from '@/utils/billing';
import { CATEGORIES } from '@/types/finance';

export default function HistoryPage() {
  const [year, setYear] = useState(getCurrentYear());
  const [view, setView] = useState<'mensal' | 'anual'>('mensal');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const yearTx = mockTransactions.filter(t => t.reference_year === year);
  const filtered = yearTx.filter(t => {
    if (search && !t.descricao.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && t.categoria !== filterCat) return false;
    return true;
  });

  // Group by month
  const byMonth = filtered.reduce((acc, t) => {
    if (!acc[t.reference_month]) acc[t.reference_month] = [];
    acc[t.reference_month].push(t);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const sortedMonths = Object.keys(byMonth).sort().reverse();

  const totalReceitas = filtered.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const totalDespesas = filtered.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-5">
      <h1 className="text-xl font-bold text-foreground">Histórico</h1>

      {/* Year selector */}
      <div className="flex items-center gap-3">
        {[year - 1, year, year + 1].map(y => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              y === year ? 'gradient-gold text-primary-foreground' : 'bg-card text-muted-foreground'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {(['mensal', 'anual'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              view === v ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground outline-none"
        >
          <option value="">Todas</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Annual summary */}
      {view === 'anual' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card p-4">
            <p className="text-xs text-muted-foreground">Total receitas</p>
            <p className="text-lg font-bold text-success">{formatCurrency(totalReceitas)}</p>
          </div>
          <div className="rounded-xl bg-card p-4">
            <p className="text-xs text-muted-foreground">Total despesas</p>
            <p className="text-lg font-bold text-destructive">{formatCurrency(totalDespesas)}</p>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="space-y-5 pb-4">
        {sortedMonths.map(month => {
          const txs = byMonth[month];
          const monthTotal = txs.reduce((s, t) => s + (t.tipo === 'receita' ? t.valor : -t.valor), 0);
          return (
            <div key={month}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{formatMonthLabel(month)}</span>
                <span className={`text-xs font-semibold ${monthTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(monthTotal)}
                </span>
              </div>
              <div className="space-y-1.5">
                {txs.map(t => {
                  const card = t.cartao_id ? mockCards.find(c => c.id === t.cartao_id) : null;
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.descricao}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t.categoria}</span>
                          {card && <span>• {card.nome}</span>}
                          {t.parcelado && <span>• {t.parcela_atual}/{t.total_parcelas}</span>}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <p className={`text-sm font-semibold ${t.tipo === 'receita' ? 'text-success' : 'text-foreground'}`}>
                          {t.tipo === 'despesa' ? '-' : '+'}{formatCurrency(t.valor)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(t.transaction_date)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {sortedMonths.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">
            Nenhuma transação encontrada.
          </p>
        )}
      </div>
    </div>
  );
}
