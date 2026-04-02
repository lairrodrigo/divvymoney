import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CreditCard, Check } from 'lucide-react';
import { mockCards } from '@/data/mockData';
import { CATEGORIES, TransactionType, TransactionSubtype } from '@/types/finance';
import { calculateBillingMonth, formatCurrency, formatMonthLabel, getCurrentMonth } from '@/utils/billing';
import { useToast } from '@/hooks/use-toast';

type TxMode = 'receita' | 'dinheiro' | 'cartao';

export default function AddTransactionPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<TxMode>('dinheiro');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [cartaoId, setCartaoId] = useState(mockCards[0]?.id || '');
  const [parcelado, setParcelado] = useState(false);
  const [parcelas, setParcelas] = useState('1');

  const selectedCard = mockCards.find(c => c.id === cartaoId);
  const billingMonth = mode === 'cartao' && selectedCard
    ? calculateBillingMonth(data, selectedCard)
    : getCurrentMonth();

  const handleSubmit = () => {
    if (!valor || !descricao || !categoria) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    toast({
      title: 'Transação adicionada! ✅',
      description: mode === 'cartao'
        ? `Fatura: ${formatMonthLabel(billingMonth)}${parcelado ? ` • ${parcelas}x de ${formatCurrency(parseFloat(valor) / parseInt(parcelas))}` : ''}`
        : `${formatCurrency(parseFloat(valor))} em ${categoria}`,
    });
    setValor('');
    setDescricao('');
    setCategoria('');
    setParcelado(false);
    setParcelas('1');
  };

  const modes: { key: TxMode; label: string; icon: typeof ArrowUpCircle }[] = [
    { key: 'receita', label: 'Receita', icon: ArrowUpCircle },
    { key: 'dinheiro', label: 'Dinheiro', icon: ArrowDownCircle },
    { key: 'cartao', label: 'Cartão', icon: CreditCard },
  ];

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-6">
      <h1 className="text-xl font-bold text-foreground">Adicionar</h1>

      {/* Mode selector */}
      <div className="flex gap-2">
        {modes.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
              mode === key
                ? key === 'receita'
                  ? 'bg-success/20 text-success'
                  : 'gradient-gold text-primary-foreground'
                : 'bg-card text-muted-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Valor */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Valor (R$)</label>
          <input
            type="number"
            value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="0,00"
            className="w-full rounded-xl bg-card px-4 py-3 text-lg font-bold text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Descrição</label>
          <input
            type="text"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Ex: Supermercado"
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Categoria</label>
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Selecione</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Data */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Data</label>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Card selection */}
        {mode === 'cartao' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Cartão</label>
              <select
                value={cartaoId}
                onChange={e => setCartaoId(e.target.value)}
                className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                {mockCards.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Billing month info */}
            <div className="rounded-xl bg-primary/10 px-4 py-3">
              <p className="text-xs text-primary">
                📅 Fatura: <span className="font-semibold">{formatMonthLabel(billingMonth)}</span>
              </p>
            </div>

            {/* Installments */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setParcelado(!parcelado)}
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  parcelado ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}
              >
                {parcelado && <Check className="h-3 w-3 text-primary-foreground" />}
              </button>
              <span className="text-sm text-foreground">Parcelado</span>
            </div>

            {parcelado && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Parcelas</label>
                <select
                  value={parcelas}
                  onChange={e => setParcelas(e.target.value)}
                  className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}x{valor ? ` de ${formatCurrency(parseFloat(valor) / n)}` : ''}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full rounded-xl gradient-gold py-4 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          {mode === 'receita' ? 'Adicionar receita' : 'Adicionar despesa'}
        </button>
      </div>
    </div>
  );
}
