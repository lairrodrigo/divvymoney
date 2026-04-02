export type TransactionType = 'receita' | 'despesa';
export type TransactionSubtype = 'dinheiro' | 'cartao';
export type TransactionOrigin = 'manual' | 'importado';
export type PersonType = 'PF' | 'PJ';

export interface CreditCard {
  id: string;
  user_id: string;
  nome: string;
  limite: number;
  fechamento_dia: number;
  vencimento_dia: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  tipo: TransactionType;
  subtipo: TransactionSubtype;
  valor: number;
  descricao: string;
  categoria: string;
  transaction_date: string; // ISO date
  reference_month: string; // YYYY-MM
  reference_year: number;
  cartao_id?: string;
  parcelado: boolean;
  parcela_atual: number;
  total_parcelas: number;
  origem: TransactionOrigin;
  parent_transaction_id?: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  nome: string;
  valor_alvo: number;
  valor_atual: number;
  prazo: string; // ISO date
  created_at: string;
}

export interface UserProfile {
  id: string;
  nome: string;
  tipo_pessoa: PersonType;
  saldo_inicial: number;
  renda_principal: number;
  pj_ativo: boolean;
  regime_tributario?: string;
  onboarding_complete: boolean;
}

export interface MonthSummary {
  receitas: number;
  despesas_dinheiro: number;
  despesas_cartao: number;
  impostos: number;
  saldo_disponivel: number;
  saldo_comprometido: number;
}

export const CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
  'Lazer', 'Vestuário', 'Serviços', 'Salário', 'Freelance',
  'Investimentos', 'Outros'
] as const;
