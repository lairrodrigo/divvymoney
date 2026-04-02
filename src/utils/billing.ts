import { CreditCard } from '@/types/finance';

/**
 * Calcula o mês da fatura (billing_month) com base na data da compra
 * e no dia de fechamento do cartão.
 * 
 * Se a compra foi feita ANTES do fechamento → entra na fatura do mês atual
 * Se a compra foi feita DEPOIS do fechamento → entra na fatura do próximo mês
 */
export function calculateBillingMonth(
  transactionDate: string,
  card: CreditCard
): string {
  const date = new Date(transactionDate);
  const day = date.getDate();
  let month = date.getMonth(); // 0-indexed
  let year = date.getFullYear();

  if (day > card.fechamento_dia) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Gera reference_months para cada parcela de um parcelamento
 */
export function generateInstallmentMonths(
  firstBillingMonth: string,
  totalParcelas: number
): string[] {
  const months: string[] = [];
  const [year, month] = firstBillingMonth.split('-').map(Number);
  
  for (let i = 0; i < totalParcelas; i++) {
    let m = month + i;
    let y = year;
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    months.push(`${y}-${String(m).padStart(2, '0')}`);
  }
  
  return months;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-');
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}
