import { Transaction, CreditCard, FinancialGoal, UserProfile } from '@/types/finance';
import { getCurrentMonth, calculateBillingMonth } from '@/utils/billing';

const currentMonth = getCurrentMonth();
const [cy, cm] = currentMonth.split('-').map(Number);
const prevMonth = `${cm === 1 ? cy - 1 : cy}-${String(cm === 1 ? 12 : cm - 1).padStart(2, '0')}`;

export const mockProfile: UserProfile = {
  id: '1',
  nome: 'Carlos',
  tipo_pessoa: 'PJ',
  saldo_inicial: 15000,
  renda_principal: 12000,
  pj_ativo: true,
  regime_tributario: 'Simples Nacional',
  onboarding_complete: true,
};

export const mockCards: CreditCard[] = [
  { id: 'c1', user_id: '1', nome: 'Nubank', limite: 8000, fechamento_dia: 15, vencimento_dia: 22 },
  { id: 'c2', user_id: '1', nome: 'C6 Bank', limite: 12000, fechamento_dia: 5, vencimento_dia: 12 },
];

export const mockTransactions: Transaction[] = [
  {
    id: 't1', user_id: '1', tipo: 'receita', subtipo: 'dinheiro',
    valor: 12000, descricao: 'Salário', categoria: 'Salário',
    transaction_date: `${currentMonth}-05`, reference_month: currentMonth,
    reference_year: cy, parcelado: false, parcela_atual: 1, total_parcelas: 1, origem: 'manual',
  },
  {
    id: 't2', user_id: '1', tipo: 'despesa', subtipo: 'dinheiro',
    valor: 2500, descricao: 'Aluguel', categoria: 'Moradia',
    transaction_date: `${currentMonth}-01`, reference_month: currentMonth,
    reference_year: cy, parcelado: false, parcela_atual: 1, total_parcelas: 1, origem: 'manual',
  },
  {
    id: 't3', user_id: '1', tipo: 'despesa', subtipo: 'cartao',
    valor: 450, descricao: 'Supermercado', categoria: 'Alimentação',
    transaction_date: `${currentMonth}-10`, reference_month: currentMonth,
    reference_year: cy, cartao_id: 'c1', parcelado: false, parcela_atual: 1, total_parcelas: 1, origem: 'manual',
  },
  {
    id: 't4', user_id: '1', tipo: 'despesa', subtipo: 'cartao',
    valor: 200, descricao: 'Uber', categoria: 'Transporte',
    transaction_date: `${currentMonth}-08`, reference_month: currentMonth,
    reference_year: cy, cartao_id: 'c1', parcelado: false, parcela_atual: 1, total_parcelas: 1, origem: 'manual',
  },
  {
    id: 't5', user_id: '1', tipo: 'despesa', subtipo: 'cartao',
    valor: 300, descricao: 'iPhone Case (1/3)', categoria: 'Outros',
    transaction_date: `${prevMonth}-20`, reference_month: currentMonth,
    reference_year: cy, cartao_id: 'c2', parcelado: true, parcela_atual: 2, total_parcelas: 3, origem: 'manual',
  },
  {
    id: 't6', user_id: '1', tipo: 'despesa', subtipo: 'dinheiro',
    valor: 180, descricao: 'Farmácia', categoria: 'Saúde',
    transaction_date: `${currentMonth}-12`, reference_month: currentMonth,
    reference_year: cy, parcelado: false, parcela_atual: 1, total_parcelas: 1, origem: 'manual',
  },
  {
    id: 't7', user_id: '1', tipo: 'receita', subtipo: 'dinheiro',
    valor: 3500, descricao: 'Freelance', categoria: 'Freelance',
    transaction_date: `${currentMonth}-15`, reference_month: currentMonth,
    reference_year: cy, parcelado: false, parcela_atual: 1, total_parcelas: 1, origem: 'manual',
  },
  // Previous month
  {
    id: 't8', user_id: '1', tipo: 'receita', subtipo: 'dinheiro',
    valor: 12000, descricao: 'Salário', categoria: 'Salário',
    transaction_date: `${prevMonth}-05`, reference_month: prevMonth,
    reference_year: cm === 1 ? cy - 1 : cy, parcelado: false, parcela_atual: 1, total_parcelas: 1, origem: 'manual',
  },
  {
    id: 't9', user_id: '1', tipo: 'despesa', subtipo: 'dinheiro',
    valor: 2500, descricao: 'Aluguel', categoria: 'Moradia',
    transaction_date: `${prevMonth}-01`, reference_month: prevMonth,
    reference_year: cm === 1 ? cy - 1 : cy, parcelado: false, parcela_atual: 1, total_parcelas: 1, origem: 'manual',
  },
];

export const mockGoals: FinancialGoal[] = [
  {
    id: 'g1', user_id: '1', nome: 'Reserva de emergência',
    valor_alvo: 50000, valor_atual: 18500, prazo: '2026-12-31', created_at: '2025-01-01',
  },
  {
    id: 'g2', user_id: '1', nome: 'Viagem Europa',
    valor_alvo: 15000, valor_atual: 4200, prazo: '2026-06-30', created_at: '2025-03-01',
  },
];

export function calculateMonthSummary(
  transactions: Transaction[],
  month: string,
  rendaPrincipal: number,
  pjAtivo: boolean
) {
  const monthTx = transactions.filter(t => t.reference_month === month);
  const receitas = monthTx.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const despesas_dinheiro = monthTx.filter(t => t.tipo === 'despesa' && t.subtipo === 'dinheiro').reduce((s, t) => s + t.valor, 0);
  const despesas_cartao = monthTx.filter(t => t.tipo === 'despesa' && t.subtipo === 'cartao').reduce((s, t) => s + t.valor, 0);
  const impostos = pjAtivo ? receitas * 0.15 : 0;
  
  return {
    receitas,
    despesas_dinheiro,
    despesas_cartao,
    impostos,
    saldo_disponivel: receitas - despesas_dinheiro,
    saldo_comprometido: receitas - despesas_dinheiro - despesas_cartao - impostos,
  };
}
