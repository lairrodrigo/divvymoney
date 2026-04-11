import { useState } from 'react';
import { ShoppingCart, Plus, ArrowLeft, Trash2, Check, X, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspacesContext } from '@/contexts/WorkspaceContext';
import {
  useShoppingLists, useCreateShoppingList, useDeleteShoppingList,
  useShoppingItems, useAddShoppingItem, useUpdateShoppingItem, useDeleteShoppingItem,
} from '@/hooks/useShopping';
import { formatCurrency } from '@/utils/billing';
import { useToast } from '@/hooks/use-toast';

export default function ComprasPage() {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspacesContext();
  const { data: lists = [], isLoading } = useShoppingLists(activeWorkspaceId);
  const createList = useCreateShoppingList();
  const deleteList = useDeleteShoppingList();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [listName, setListName] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const selectedList = lists.find(l => l.id === selectedListId);

  const handleCreate = async () => {
    if (!listName.trim() || !activeWorkspaceId || !user) return;
    try {
      const newList = await createList.mutateAsync({
        workspace_id: activeWorkspaceId,
        user_id: user.id,
        nome: listName.trim(),
      });
      setListName('');
      setShowCreate(false);
      setSelectedListId(newList.id);
      toast({ title: 'Lista criada! 🛒' });
    } catch {
      toast({ title: 'Erro ao criar lista', variant: 'destructive' });
    }
  };

  if (selectedListId && selectedList) {
    return (
      <ShoppingListDetail
        list={selectedList}
        onBack={() => setSelectedListId(null)}
        onDelete={() => {
          deleteList.mutate({ id: selectedListId, workspace_id: activeWorkspaceId! });
          setSelectedListId(null);
        }}
      />
    );
  }

  if (!activeWorkspaceId) {
    return (
      <div className="animate-fade-in px-5 pt-14 space-y-6 pb-24">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-gold">
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Compras</h1>
        </div>
        <div className="rounded-2xl bg-card p-8 text-center space-y-3">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Selecione ou crie um espaço compartilhado para usar listas de compras.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-gold">
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Compras</h1>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          {showCreate ? <X className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl bg-card p-4 space-y-3 animate-fade-in">
          <input type="text" value={listName} onChange={e => setListName(e.target.value)}
            placeholder="Nome da lista (ex: Mercado, Feira)"
            className="w-full rounded-lg bg-secondary px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} disabled={createList.isPending}
            className="w-full rounded-lg gradient-gold py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
            {createList.isPending ? 'Criando...' : 'Criar lista'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : lists.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center space-y-3">
          <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Crie sua primeira lista de compras para organizar suas idas ao mercado.
          </p>
          <button onClick={() => setShowCreate(true)}
            className="rounded-xl gradient-gold px-6 py-3 text-sm font-bold text-primary-foreground">
            Criar lista
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(list => {
            const isActive = list.status === 'ativa';
            return (
              <button key={list.id} onClick={() => setSelectedListId(list.id)}
                className="w-full text-left rounded-xl bg-card p-4 transition-colors hover:bg-card/80 border border-border/40 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                      <ShoppingCart className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{list.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {isActive ? 'Ativa' : 'Finalizada'}
                        {Number(list.valor_estimado) > 0 && ` • Est: ${formatCurrency(Number(list.valor_estimado))}`}
                        {Number(list.valor_real) > 0 && ` • Real: ${formatCurrency(Number(list.valor_real))}`}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ShoppingListDetail({ list, onBack, onDelete }: {
  list: { id: string; nome: string; status: string };
  onBack: () => void;
  onDelete: () => void;
}) {
  const { data: items = [], isLoading } = useShoppingItems(list.id);
  const addItem = useAddShoppingItem();
  const updateItem = useUpdateShoppingItem();
  const deleteItem = useDeleteShoppingItem();
  const { toast } = useToast();

  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const totalEstimado = items.reduce((s, i) => s + Number(i.quantidade) * Number(i.preco_estimado || 0), 0);
  const totalReal = items.filter(i => i.comprado).reduce((s, i) => s + Number(i.quantidade) * Number(i.preco_real || i.preco_estimado || 0), 0);
  const progress = items.length > 0 ? (items.filter(i => i.comprado).length / items.length) * 100 : 0;

  const handleAddItem = async () => {
    if (!itemName.trim()) return;
    try {
      await addItem.mutateAsync({
        list_id: list.id,
        nome: itemName.trim(),
        quantidade: Number(itemQty) || 1,
        preco_estimado: Number(itemPrice) || 0,
      });
      setItemName('');
      setItemQty('1');
      setItemPrice('');
    } catch {
      toast({ title: 'Erro ao adicionar item', variant: 'destructive' });
    }
  };

  const toggleComprado = (item: any) => {
    updateItem.mutate({
      id: item.id,
      list_id: list.id,
      comprado: !item.comprado,
      preco_real: item.comprado ? null : (item.preco_real || item.preco_estimado),
    });
  };

  return (
    <div className="animate-fade-in px-5 pt-14 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-card">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{list.nome}</h1>
          <p className="text-xs text-muted-foreground">{items.length} itens</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          {showAdd ? <X className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
        </button>
        <button onClick={onDelete} className="p-2 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card p-3">
          <p className="text-xs text-muted-foreground">Estimado</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalEstimado)}</p>
        </div>
        <div className="rounded-xl bg-card p-3">
          <p className="text-xs text-muted-foreground">Gasto real</p>
          <p className={`text-lg font-bold ${totalReal > totalEstimado ? 'text-destructive' : 'text-success'}`}>
            {formatCurrency(totalReal)}
          </p>
        </div>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{items.filter(i => i.comprado).length} de {items.length} itens</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full gradient-gold transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Add Item */}
      {showAdd && (
        <div className="rounded-xl bg-card p-4 space-y-3 animate-fade-in">
          <input type="text" value={itemName} onChange={e => setItemName(e.target.value)}
            placeholder="Nome do item"
            className="w-full rounded-lg bg-secondary px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            onKeyDown={e => e.key === 'Enter' && handleAddItem()} />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground">Qtd</label>
              <input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)}
                className="w-full rounded-lg bg-secondary px-3 py-2 text-sm text-foreground outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground">Preço est. (R$)</label>
              <input type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)} step="0.01"
                placeholder="0,00"
                className="w-full rounded-lg bg-secondary px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <button onClick={handleAddItem} disabled={addItem.isPending}
            className="w-full rounded-lg gradient-gold py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
            {addItem.isPending ? 'Adicionando...' : 'Adicionar item'}
          </button>
        </div>
      )}

      {/* Items */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhum item na lista. Toque + para adicionar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id}
              className={`flex items-center gap-3 rounded-xl bg-card px-4 py-3 border border-border/40 transition-opacity ${item.comprado ? 'opacity-60' : ''}`}>
              <button onClick={() => toggleComprado(item)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                  item.comprado ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                {item.comprado && <Check className="h-4 w-4 text-primary-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-foreground ${item.comprado ? 'line-through' : ''}`}>
                  {item.nome}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number(item.quantidade)} {item.unidade}
                  {Number(item.preco_estimado) > 0 && ` • ${formatCurrency(Number(item.preco_estimado))}/un`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(Number(item.quantidade) * Number(item.preco_real || item.preco_estimado || 0))}
                </p>
              </div>
              <button onClick={() => deleteItem.mutate({ id: item.id, list_id: list.id })}
                className="p-1 text-muted-foreground hover:text-destructive shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Comparison */}
      {items.some(i => i.comprado) && totalEstimado > 0 && (
        <div className="rounded-xl bg-card p-4 space-y-2">
          <h3 className="text-xs font-semibold text-foreground">📊 Comparação</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimado</span>
            <span className="text-foreground">{formatCurrency(totalEstimado)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Real</span>
            <span className={totalReal > totalEstimado ? 'text-destructive' : 'text-success'}>
              {formatCurrency(totalReal)}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-muted-foreground">Diferença</span>
            <span className={totalReal > totalEstimado ? 'text-destructive' : 'text-success'}>
              {totalReal > totalEstimado ? '+' : ''}{formatCurrency(totalReal - totalEstimado)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
