import { useState } from 'react';
import { LogOut, CreditCard, Tag, Building2, Plus, Trash2, X, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspacesContext } from '@/contexts/WorkspaceContext';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useCreditCards, useAddCreditCard, useDeleteCreditCard } from '@/hooks/useCreditCards';
import { formatCurrency, getCurrentMonth } from '@/utils/billing';
import { CATEGORIES } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { signOut, user } = useAuth();
  const { activeWorkspaceId } = useWorkspacesContext();
  const { data: profile } = useProfile();
  const { data: transactions = [] } = useTransactions(activeWorkspaceId);
  const { data: cards = [] } = useCreditCards(activeWorkspaceId);
  const addCard = useAddCreditCard();
  const deleteCard = useDeleteCreditCard();
  const { toast } = useToast();

  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNome, setCardNome] = useState('');
  const [cardLimite, setCardLimite] = useState('');
  const [cardFechamento, setCardFechamento] = useState('');
  const [cardVencimento, setCardVencimento] = useState('');

  const currentMonth = getCurrentMonth();
  const monthTx = transactions.filter(t => t.reference_month === currentMonth);
  const receitas = monthTx.filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0);
  const impostos = profile?.pj_ativo ? receitas * 0.15 : 0;

  const handleAddCard = async () => {
    if (!cardNome || !cardLimite || !cardFechamento || !cardVencimento) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    try {
      await addCard.mutateAsync({
        workspaceId: activeWorkspaceId ?? undefined,
        nome: cardNome,
        limite: parseFloat(cardLimite),
        fechamento_dia: parseInt(cardFechamento),
        vencimento_dia: parseInt(cardVencimento),
      });
      toast({ title: 'Cartão adicionado! ✅' });
      setShowCardForm(false);
      setCardNome(''); setCardLimite(''); setCardFechamento(''); setCardVencimento('');
    } catch {
      toast({ title: 'Erro ao salvar cartão', variant: 'destructive' });
    }
  };

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-gold">
          <Wallet className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{profile?.nome || 'Usuário'}</h1>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground">{profile?.tipo_pessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card p-4">
          <p className="text-xs text-muted-foreground">Renda principal</p>
          <p className="text-sm font-bold text-foreground">{formatCurrency(Number(profile?.renda_principal || 0))}</p>
        </div>
        <div className="rounded-xl bg-card p-4">
          <p className="text-xs text-muted-foreground">Saldo inicial</p>
          <p className="text-sm font-bold text-foreground">{formatCurrency(Number(profile?.saldo_inicial || 0))}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Cartões</h2>
          </div>
          <button onClick={() => setShowCardForm(!showCardForm)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            {showCardForm ? <X className="h-3.5 w-3.5 text-primary" /> : <Plus className="h-3.5 w-3.5 text-primary" />}
          </button>
        </div>

        {showCardForm && (
          <div className="rounded-xl bg-card p-4 space-y-3 mb-3 animate-fade-in">
            <input type="text" value={cardNome} onChange={e => setCardNome(e.target.value)} placeholder="Nome do cartão"
              className="w-full rounded-lg bg-secondary px-3 py-2 text-sm text-foreground outline-none" />
            <input type="number" value={cardLimite} onChange={e => setCardLimite(e.target.value)} placeholder="Limite"
              className="w-full rounded-lg bg-secondary px-3 py-2 text-sm text-foreground outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={cardFechamento} onChange={e => setCardFechamento(e.target.value)} placeholder="Dia fechamento"
                className="w-full rounded-lg bg-secondary px-3 py-2 text-sm text-foreground outline-none" />
              <input type="number" value={cardVencimento} onChange={e => setCardVencimento(e.target.value)} placeholder="Dia vencimento"
                className="w-full rounded-lg bg-secondary px-3 py-2 text-sm text-foreground outline-none" />
            </div>
            <button onClick={handleAddCard} disabled={addCard.isPending}
              className="w-full rounded-lg gradient-gold py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
              {addCard.isPending ? 'Salvando...' : 'Salvar cartão'}
            </button>
          </div>
        )}

        {cards.length === 0 && !showCardForm ? (
          <p className="text-sm text-muted-foreground rounded-xl bg-card p-4">Nenhum cartão cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {cards.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">Limite: {formatCurrency(Number(c.limite))} • Fecha dia {c.fechamento_dia}</p>
                </div>
                <button onClick={() => deleteCard.mutate(c.id)} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Categorias</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <span key={c} className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground">{c}</span>
          ))}
        </div>
      </div>

      {profile?.pj_ativo && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Módulo PJ</h2>
          </div>
          <div className="rounded-xl bg-card p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Regime</span>
              <span className="text-foreground font-medium">{profile.regime_tributario || 'Simples Nacional'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Receitas do mês</span>
              <span className="text-success font-medium">{formatCurrency(receitas)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impostos estimados</span>
              <span className="text-primary font-medium">{formatCurrency(impostos)}</span>
            </div>
          </div>
        </div>
      )}

      <button onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20">
        <LogOut className="h-4 w-4" />
        Sair da conta
      </button>
    </div>
  );
}
