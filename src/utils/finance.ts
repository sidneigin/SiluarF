import { CreditCard, Transaction, TransactionType, BankAccount } from '../types';

/**
 * Formats a Date into YYYY-MM-DD using local timezone (avoids UTC shift from toISOString).
 */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely parses a YYYY-MM-DD date string into a Date object at noon local time.
 * Avoids UTC timezone conversion shifts.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 12, 0, 0);
}

/**
 * Generates a short random id suffix for entity keys.
 */
export function generateId(prefix: string): string {
  return `${prefix}${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Splits a total into N installments; remainder cents go to the last installment.
 */
export function splitInstallmentAmounts(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor((total / count) * 100) / 100;
  const amounts = Array.from({ length: count }, () => base);
  const remainder = Math.round((total - base * count) * 100) / 100;
  amounts[count - 1] += remainder;
  return amounts;
}

/**
 * Clamps a day-of-month to the last valid day in the given month/year at noon local time.
 */
function dateWithClampedDay(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay), 12, 0, 0);
}

/**
 * Applies or reverses an account balance change for a non-transfer transaction.
 */
export function applyAccountDelta(
  accounts: BankAccount[],
  accountId: string,
  type: TransactionType,
  amount: number,
  reverse: boolean
): BankAccount[] {
  return accounts.map((acc) => {
    if (acc.id !== accountId) return acc;
    const sign = type === 'income' ? 1 : -1;
    const delta = reverse ? -sign * amount : sign * amount;
    return { ...acc, balance: acc.balance + delta };
  });
}

/**
 * Formats currency values into Brazilian Real (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

/**
 * Formats date string YYYY-MM-DD into pt-BR format DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

/**
 * Formats "YYYY-MM" into month name and year (e.g., "08/2026" -> "Agosto de 2026")
 */
export function formatMonthYear(monthYear: string): string {
  if (!monthYear) return '';
  const [yearStr, monthStr] = monthYear.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const year = parseInt(yearStr, 10);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return `${monthNames[monthIndex] || ''} de ${year}`;
}

/**
 * Short month label (e.g., "Ago/26")
 */
export function formatShortMonthYear(monthYear: string): string {
  if (!monthYear) return '';
  const [yearStr, monthStr] = monthYear.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${shortMonths[monthIndex]}/${yearStr.slice(2)}`;
}

/**
 * Core Logic for Credit Card Invoice Month Calculation:
 * Given purchase date (YYYY-MM-DD) and credit card closingDay (1..31):
 * - If purchase day < closingDay, purchase enters current month's invoice.
 * - If purchase day >= closingDay, purchase enters NEXT month's invoice.
 */
export function getInvoiceMonthYearForDate(purchaseDateStr: string, closingDay: number): string {
  const date = parseLocalDate(purchaseDateStr);
  const day = date.getDate();
  let month = date.getMonth(); // 0-indexed
  let year = date.getFullYear();

  if (day >= closingDay) {
    // Falls into the next month's invoice
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  const formattedMonth = String(month + 1).padStart(2, '0');
  return `${year}-${formattedMonth}`;
}

/**
 * Calculates Closing Date (YYYY-MM-DD) and Due Date (YYYY-MM-DD) for a given invoice monthYear (YYYY-MM)
 */
export function getInvoiceDates(monthYear: string, closingDay: number, dueDay: number): { closingDate: string; dueDate: string } {
  const [yearStr, monthStr] = monthYear.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  // Closing date is in the invoice month if closingDay > dueDay, or month before if dueDay < closingDay
  // Standard rule: Invoice monthYear represents the month when the invoice closes/is due.
  // Closing date: year-month-closingDay
  const closingDateObj = dateWithClampedDay(year, month, closingDay);

  // Due date: if dueDay < closingDay, due date is in the following month
  let dueYear = year;
  let dueMonth = month;
  if (dueDay < closingDay) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }
  const dueDateObj = dateWithClampedDay(dueYear, dueMonth, dueDay);

  return {
    closingDate: toLocalDateString(closingDateObj),
    dueDate: toLocalDateString(dueDateObj),
  };
}

/**
 * Gets next month string in YYYY-MM format
 */
export function getNextMonthYear(monthYear: string, offsetMonths: number = 1): string {
  const [yearStr, monthStr] = monthYear.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1 + offsetMonths;

  while (month > 11) {
    month -= 12;
    year += 1;
  }
  while (month < 0) {
    month += 12;
    year -= 1;
  }

  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Generate installment transaction array when user buys something in N installments
 */
export function generateInstallmentTransactions(
  baseTransaction: Omit<Transaction, 'id' | 'invoiceMonthYear'>,
  card: CreditCard,
  totalInstallments: number
): Transaction[] {
  const parentId = generateId('tx_');
  const installmentAmounts = splitInstallmentAmounts(baseTransaction.amount, totalInstallments);

  const baseInvoiceMonthYear = getInvoiceMonthYearForDate(baseTransaction.date, card.closingDay);

  const transactions: Transaction[] = [];

  for (let i = 0; i < totalInstallments; i++) {
    const targetInvoice = getNextMonthYear(baseInvoiceMonthYear, i);
    const txId = i === 0 ? parentId : generateId('tx_');

    transactions.push({
      ...baseTransaction,
      id: txId,
      amount: installmentAmounts[i],
      installmentCurrent: i + 1,
      installmentTotal: totalInstallments,
      parentTransactionId: parentId,
      invoiceMonthYear: targetInvoice,
      description: totalInstallments > 1 
        ? `${baseTransaction.description} (${i + 1}/${totalInstallments})`
        : baseTransaction.description
    });
  }

  return transactions;
}

/**
 * Computes used limit for a specific credit card from all unpaid credit card transactions
 */
export function calculateUsedCardLimit(cardId: string, transactions: Transaction[], paidInvoices: Record<string, boolean>): number {
  return transactions
    .filter(t => t.paymentMethod === 'credit_card' && t.creditCardId === cardId)
    .filter(t => {
      if (!t.invoiceMonthYear) return true;
      const invoiceKey = `${cardId}_${t.invoiceMonthYear}`;
      return !paidInvoices[invoiceKey]; // Count if invoice is not yet paid
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Get current month string YYYY-MM (e.g. "2026-07")
 */
export function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Helper to get status of an invoice (open, closed, paid)
 */
export function getInvoiceStatus(
  cardId: string,
  monthYear: string,
  card: CreditCard,
  paidInvoices: Record<string, boolean>
): 'open' | 'closed' | 'paid' {
  const invoiceKey = `${cardId}_${monthYear}`;
  if (paidInvoices[invoiceKey]) {
    return 'paid';
  }

  const { closingDate } = getInvoiceDates(monthYear, card.closingDay, card.dueDay);
  const todayStr = toLocalDateString();

  if (todayStr >= closingDate) {
    return 'closed';
  }

  return 'open';
}
