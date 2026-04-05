import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CreditCard, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspacesContext } from '@/contexts/WorkspaceContext';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useWorkspaceMembers } from '@/hooks/useWorkspaces';
import { useAddTransaction } from '@/hooks/useTransactions';
import { formatCurrency, getCurrentMonth } from '@/utils/billing';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type TxMode = 'receita' | 'dinheiro' | 'cartao';

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspacesContext();
  
  const { data: categories = [] } = useCategories(activeWorkspaceId);
  const { data: accounts = [] } = useAccounts(activeWorkspaceId);
  const { data: members = [] } = useWorkspaceMembers(activeWorkspaceId);
  const addTx = useAddTransaction();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidByUserId, setPaidByUserId] = useState('');
  const [isShared, setIsShared] = useState(false);

  const filteredCategories = categories.filter(c => c.type === type);
  const creditCards = accounts.filter(a => a.type === 'credit_card');

  const handleSubmit = async () => {
    if (!activeWorkspaceId) return;
    if (!amount || !description || !categoryId || !accountId) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    try {
      await addTx.mutateAsync({
        workspace_id: activeWorkspaceId,
        type,
        amount: parseFloat(amount),
        description,
        category_id: categoryId,
        account_id: accountId,
        date,
        paid_by_user_id: paidByUserId || undefined,
        is_shared: isShared,
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

  const modes: { key: TxMode; label: string; icon: typeof ArrowUpCircle }[] = [
    { key: 'receita', label: 'Receita', icon: ArrowUpCircle },
    { key: 'dinheiro', label: 'Dinheiro', icon: ArrowDownCircle },
    { key: 'cartao', label: 'Cartão', icon: CreditCard },
  ];

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-6">
      <h1 className="text-xl font-bold text-foreground">Adicionar</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setType('expense')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
            type === 'expense' ? 'gradient-gold text-primary-foreground' : 'bg-card text-muted-foreground'
          }`}
        >
          <ArrowDownCircle className="h-4 w-4" />
          Despesa
        </button>
        <button
          onClick={() => setType('income')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
            type === 'income' ? 'bg-success/20 text-success' : 'bg-card text-muted-foreground'
          }`}
        >
          <ArrowUpCircle className="h-4 w-4" />
          Receita
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
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
            <option value="">Selecione Categoria</option>
            {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Conta de Origem</label>
          <select value={accountId} onChange={e => setAccountId(e.target.value)}
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
            <option value="">Selecione Conta</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => setIsShared(!isShared)}
            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${isShared ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
            {isShared && <Check className="h-3 w-3 text-primary-foreground" />}
          </button>
          <span className="text-sm text-foreground">É compartilhado?</span>
        </div>

        {isShared && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Quem pagou?</label>
            <select value={paidByUserId} onChange={e => setPaidByUserId(e.target.value)}
              className="w-full rounded-xl bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
              <option value="">Selecione Membro</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.user_id === user?.id ? 'Eu' : 'Membro'}</option>
              ))}
            </select>
          </div>
        )}

        <button onClick={handleSubmit} disabled={addTx.isPending}
          className="w-full rounded-xl gradient-gold py-4 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50">
          {addTx.isPending ? 'Salvando...' : type === 'income' ? 'Adicionar receita' : 'Adicionar despesa'}
        </button>
      </div>
    </div>
  );
}
