import {
  Transaction,
  BankAccount,
  CreditCard,
  Category,
  FamilyMember,
} from '../types';

export interface StatementRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export function inRange(dateStr: string, range: StatementRange): boolean {
  return dateStr >= range.start && dateStr <= range.end;
}

export function categoryName(categories: Category[], id: string): string {
  return categories.find((c) => c.id === id)?.name || 'Sem categoria';
}

export function memberName(members: FamilyMember[], id: string): string {
  return members.find((m) => m.id === id)?.name || 'Não atribuído';
}

export function accountName(accounts: BankAccount[], id?: string): string {
  return accounts.find((a) => a.id === id)?.name || '-';
}

export function cardName(cards: CreditCard[], id?: string): string {
  return cards.find((c) => c.id === id)?.name || '-';
}

// ---------- Account Statement ----------

export interface AccountTransactionWithBalance extends Transaction {
  runningBalance: number;
}

export interface AccountStatementData {
  account: BankAccount;
  range: StatementRange;
  transactions: Transaction[];
  transactionsWithBalance: AccountTransactionWithBalance[];
  openingBalance: number;
  income: number;
  expense: number;
  net: number;
  closingBalance: number;
  currentBalance: number;
}

export function computeAccountStatement(
  account: BankAccount,
  transactions: Transaction[],
  range: StatementRange
): AccountStatementData {
  const allAccountTxs = transactions
    .filter((t) => t.paymentMethod === 'account' && t.bankAccountId === account.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalNetAllTxs = allAccountTxs.reduce((s, t) => {
    return s + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);

  const baseInitialBalance = account.balance - totalNetAllTxs;

  const beforeRangeTxs = allAccountTxs.filter((t) => t.date < range.start);
  const netBefore = beforeRangeTxs.reduce((s, t) => {
    return s + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);

  const openingBalance = baseInitialBalance + netBefore;

  const inRangeTxs = allAccountTxs.filter((t) => inRange(t.date, range));

  let running = openingBalance;
  const transactionsWithBalance: AccountTransactionWithBalance[] = inRangeTxs.map((t) => {
    const delta = t.type === 'income' ? t.amount : -t.amount;
    running += delta;
    return {
      ...t,
      runningBalance: running,
    };
  });

  const closingBalance = running;

  const income = inRangeTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = inRangeTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return {
    account,
    range,
    transactions: inRangeTxs,
    transactionsWithBalance,
    openingBalance,
    income,
    expense,
    net: income - expense,
    closingBalance,
    currentBalance: account.balance,
  };
}

// ---------- Card Statement ----------

export interface CardInvoiceGroup {
  monthYear: string;
  transactions: Transaction[];
  total: number;
  isPaid: boolean;
}

export interface CardStatementData {
  card: CreditCard;
  range: StatementRange;
  transactions: Transaction[];
  total: number;
  invoiceGroups: CardInvoiceGroup[];
  paidCount: number;
}

export function computeCardStatement(
  card: CreditCard,
  transactions: Transaction[],
  paidInvoices: Record<string, boolean>,
  range: StatementRange
): CardStatementData {
  const relevant = transactions.filter(
    (t) => t.paymentMethod === 'credit_card' && t.creditCardId === card.id && inRange(t.date, range)
  );

  const total = relevant.reduce((s, t) => s + t.amount, 0);
  const invoiceMonths = Array.from(new Set(relevant.map((t) => t.invoiceMonthYear).filter(Boolean))) as string[];
  invoiceMonths.sort();

  const invoiceGroups: CardInvoiceGroup[] = invoiceMonths.map((monthYear) => {
    const monthTxs = relevant
      .filter((t) => t.invoiceMonthYear === monthYear)
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      monthYear,
      transactions: monthTxs,
      total: monthTxs.reduce((s, t) => s + t.amount, 0),
      isPaid: !!paidInvoices[`${card.id}_${monthYear}`],
    };
  });

  const paidCount = invoiceGroups.filter((g) => g.isPaid).length;

  return { card, range, transactions: relevant, total, invoiceGroups, paidCount };
}

// ---------- Full Report ----------

export interface CategoryBreakdownRow {
  categoryId: string;
  name: string;
  total: number;
  percent: number;
}

export interface CardSummaryRow {
  card: CreditCard;
  total: number;
}

export interface FullReportData {
  range: StatementRange;
  transactions: Transaction[];
  income: number;
  expense: number;
  net: number;
  totalAccountBalance: number;
  accounts: BankAccount[];
  cardRows: CardSummaryRow[];
  categoryRows: CategoryBreakdownRow[];
}

export function computeFullReport(
  accounts: BankAccount[],
  cards: CreditCard[],
  transactions: Transaction[],
  categories: Category[],
  range: StatementRange
): FullReportData {
  const relevant = transactions.filter((t) => inRange(t.date, range)).sort((a, b) => a.date.localeCompare(b.date));

  const income = relevant.filter((t) => t.type === 'income' && !t.isTransfer).reduce((s, t) => s + t.amount, 0);
  const expense = relevant.filter((t) => t.type === 'expense' && !t.isTransfer).reduce((s, t) => s + t.amount, 0);
  const totalAccountBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const cardRows: CardSummaryRow[] = cards.map((c) => {
    const cardTotal = relevant
      .filter((t) => t.paymentMethod === 'credit_card' && t.creditCardId === c.id)
      .reduce((s, t) => s + t.amount, 0);
    return { card: c, total: cardTotal };
  });

  const expenseByCategory = new Map<string, number>();
  relevant
    .filter((t) => t.type === 'expense' && !t.isTransfer)
    .forEach((t) => {
      expenseByCategory.set(t.categoryId, (expenseByCategory.get(t.categoryId) || 0) + t.amount);
    });

  const categoryRows: CategoryBreakdownRow[] = Array.from(expenseByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([catId, total]) => ({
      categoryId: catId,
      name: categoryName(categories, catId),
      total,
      percent: expense > 0 ? (total / expense) * 100 : 0,
    }));

  return { range, transactions: relevant, income, expense, net: income - expense, totalAccountBalance, accounts, cardRows, categoryRows };
}
