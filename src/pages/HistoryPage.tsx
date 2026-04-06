import { useState } from 'react';
import { Search, Trash2, Upload } from 'lucide-react';
import { useWorkspacesContext } from '@/contexts/WorkspaceContext';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import ImportWizard from '@/components/ImportWizard';
import { CATEGORIES } from '@/types/finance';
import { formatCurrency, formatDate, formatMonthLabel, getCurrentYear } from '@/utils/billing';

export default function HistoryPage() {
  const { activeWorkspaceId } = useWorkspacesContext();
  const [year, setYear] = useState(getCurrentYear());
  const [view, setView] = useState<'mensal' | 'anual'>('mensal');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showImport, setShowImport] = useState(false);

  const { data: allTx = [], isLoading } = useTransactions(activeWorkspaceId);
  const deleteTx = useDeleteTransaction();

  const filtered = allTx.filter(t => {
    if (year && !t.transaction_date?.startsWith(year.toString())) return false;
    if (search && !t.descricao?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && t.categoria !== filterCat) return false;
    return true;
  });

  const byMonth = filtered.reduce((acc, t) => {
    const month = t.reference_month || t.transaction_date?.substring(0, 7) || 'Unknown';
    if (!acc[month]) acc[month] = [];
    acc[month].push(t);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const sortedMonths = Object.keys(byMonth).sort().reverse();
  const totalReceitas = filtered.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesas = filtered.filter(t => t.tipo === 'despesa').reduce((s, t) => s + Number(t.valor), 0);

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Histórico</h1>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Upload className="h-3.5 w-3.5" />
          Importar planilha
        </button>
      </div>

      {showImport && <ImportWizard onClose={() => setShowImport(false)} />}

      <div className="flex items-center gap-3">
        {[year - 1, year, year + 1].map(y => (
          <button key={y} onClick={() => setYear(y)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${y === year ? 'gradient-gold text-primary-foreground' : 'bg-card text-muted-foreground'}`}>
            {y}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(['mensal', 'anual'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-colors ${view === v ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}>
            {v}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground outline-none">
          <option value="">Todas Categorias</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

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

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-5 pb-4">
          {sortedMonths.map(month => {
            const txs = byMonth[month];
            const monthTotal = txs.reduce((s, t) => s + (t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor)), 0);
            return (
              <div key={month}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{formatMonthLabel(month)}</span>
                  <span className={`text-xs font-semibold ${monthTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(monthTotal)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {txs.map(t => (
                    <div key={t.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 group border border-border/40 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.descricao}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t.categoria}</span>
                          <span>• {t.subtipo}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${t.tipo === 'receita' ? 'text-success' : 'text-foreground'}`}>
                            {t.tipo === 'despesa' ? '-' : '+'}{formatCurrency(Number(t.valor))}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(t.transaction_date)}</p>
                        </div>
                        <button
                          onClick={() => deleteTx.mutate({ id: t.id, workspaceId: activeWorkspaceId! })}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {sortedMonths.length === 0 && (
            <div className="text-center py-16 space-y-2">
              <p className="text-sm text-muted-foreground">Nenhuma transação em {year}.</p>
              <p className="text-xs text-muted-foreground">Adicione receitas e despesas para acompanhar suas finanças.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
