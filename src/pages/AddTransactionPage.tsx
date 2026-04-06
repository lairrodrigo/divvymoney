import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CreditCard, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspacesContext } from '@/contexts/WorkspaceContext';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAddTransaction } from '@/hooks/useTransactions';
import { formatCurrency, getCurrentMonth } from '@/utils/billing';
import { CATEGORIES } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspacesContext();

  const { data: cards = [] } = useCreditCards(activeWorkspaceId);
  const addTx = useAddTransaction();

  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa');
  const [subtipo, setSubtipo] = useState<'dinheiro' | 'cartao'>('dinheiro');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cartaoId, setCartaoId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const currentMonth = getCurrentMonth();

  const handleSubmit = async () => {
    if (!activeWorkspaceId) return;
    if (!amount || !description || !categoria) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    const [y, m] = date.split('-');
    const refMonth = `${y}-${m}`;

    try {
      await addTx.mutateAsync({
        workspace_id: activeWorkspaceId,
        tipo,
        subtipo,
        valor: parseFloat(amount),
        descricao: description,
        categoria,
        transaction_date: date,
        reference_month: refMonth,
        reference_year: parseInt(y),
        cartao_id: subtipo === 'cartao' && cartaoId ? cartaoId : undefined,
        origem: 'manual',
      });

      toast({
        title: 'Transação adicionada! ✅',
        description: `${formatCurrency(parseFloat(amount))} em ${description}`,
      });
      navigate('/');
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao salvar transação', variant: 'destructive' });
    }
  };

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-6">
      <h1 className="text-xl font-bold text-foreground">Adicionar</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTipo('despesa')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
            tipo === 'despesa' ? 'gradient-gold text-primary-foreground' : 'bg-card text-muted-foreground'
          }`}
        >
          <ArrowDownCircle className="h-4 w-4" />
          Despesa
        </button>
        <button
          onClick={() => setTipo('receita')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
            tipo === 'receita' ? 'bg-success/20 text-success' : 'bg-card text-muted-foreground'
          }`}
        >
          <ArrowUpCircle className="h-4 w-4" />
          Receita
        </button>
      </div>

      {/* Subtipo */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubtipo('dinheiro')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition-all ${
            subtipo === 'dinheiro' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
          }`}
        >
          Dinheiro
        </button>
        <button
          onClick={() => setSubtipo('cartao')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition-all ${
            subtipo === 'cartao' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          Cartão
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Valor (R$)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00"
            className="w-full rounded-xl bg-card px-4 py-3 text-lg font-bold text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Descrição</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Supermercado"
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Categoria</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)}
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
            <option value="">Selecione Categoria</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {subtipo === 'cartao' && cards.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Cartão</label>
            <select value={cartaoId} onChange={e => setCartaoId(e.target.value)}
              className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
              <option value="">Selecione Cartão</option>
              {cards.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <button onClick={handleSubmit} disabled={addTx.isPending}
          className="w-full rounded-xl gradient-gold py-4 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50">
          {addTx.isPending ? 'Salvando...' : tipo === 'receita' ? 'Adicionar receita' : 'Adicionar despesa'}
        </button>
      </div>
    </div>
  );
}
