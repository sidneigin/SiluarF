import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard as CreditCardIcon, 
  Wallet, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight,
  Plus,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { CreditCard, Transaction, Category, FamilyMember, BankAccount } from '../types';
import { 
  formatCurrency, 
  formatDate, 
  calculateUsedCardLimit, 
  getInvoiceMonthYearForDate, 
  getInvoiceDates,
  getCurrentMonthYear,
  formatShortMonthYear,
  toLocalDateString,
} from '../utils/finance';

interface DashboardProps {
  cards: CreditCard[];
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  accounts: BankAccount[];
  paidInvoices: Record<string, boolean>;
  selectedMemberId: string;
  onNavigateTab: (tab: string) => void;
  onNewTransactionClick: () => void;
  onSelectCardInvoice: (cardId: string, monthYear: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cards,
  transactions,
  categories,
  members,
  accounts,
  paidInvoices,
  selectedMemberId,
  onNavigateTab,
  onNewTransactionClick,
  onSelectCardInvoice,
}) => {
  const currentMonthYear = getCurrentMonthYear();

  // Filter transactions by selected family member if filtered
  const filteredTransactions = transactions.filter(t => 
    selectedMemberId === 'all' || t.memberId === selectedMemberId
  );

  // Calculate Metrics
  const totalAccountBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Income in current month
  const currentMonthIncomes = filteredTransactions
    .filter(t => t.type === 'income' && !t.isTransfer && t.date.startsWith(currentMonthYear))
    .reduce((acc, t) => acc + t.amount, 0);

  // Direct Account Expenses in current month (paid with debit/account)
  const currentMonthAccountExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && !t.isTransfer && t.paymentMethod === 'account' && t.date.startsWith(currentMonthYear))
    .reduce((acc, t) => acc + t.amount, 0);

  // Open credit card invoice totals for each card in the current invoice month
  const cardInvoiceSummaries = cards.map((card) => {
    // Current invoice month depends on today vs closing date
    const todayStr = toLocalDateString();
    const targetInvoiceMonth = getInvoiceMonthYearForDate(todayStr, card.closingDay);
    const invoiceKey = `${card.id}_${targetInvoiceMonth}`;
    const isPaid = !!paidInvoices[invoiceKey];

    // Transactions belonging to this card and target invoice month
    const cardTxs = filteredTransactions.filter(
      t => t.paymentMethod === 'credit_card' && 
           t.creditCardId === card.id && 
           t.invoiceMonthYear === targetInvoiceMonth
    );

    const invoiceTotal = cardTxs.reduce((acc, t) => acc + t.amount, 0);
    const totalUsedLimit = calculateUsedCardLimit(card.id, transactions, paidInvoices);
    const availableLimit = Math.max(0, card.totalLimit - totalUsedLimit);

    const { closingDate, dueDate } = getInvoiceDates(targetInvoiceMonth, card.closingDay, card.dueDay);

    return {
      card,
      targetInvoiceMonth,
      invoiceTotal,
      isPaid,
      closingDate,
      dueDate,
      availableLimit,
      totalUsedLimit,
      txCount: cardTxs.length,
    };
  });

  const totalOpenInvoicesAmount = cardInvoiceSummaries
    .filter(s => !s.isPaid)
    .reduce((acc, s) => acc + s.invoiceTotal, 0);

  const netBalanceForecast = currentMonthIncomes - (currentMonthAccountExpenses + totalOpenInvoicesAmount);

  // Category Pie Chart Data
  const categoryExpensesMap: Record<string, { name: string; amount: number; color: string }> = {};

  filteredTransactions
    .filter(t => t.type === 'expense' && !t.isTransfer)
    .forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const catName = cat?.name || 'Outros';
      const catColor = cat?.color || '#94a3b8';

      if (!categoryExpensesMap[catName]) {
        categoryExpensesMap[catName] = { name: catName, amount: 0, color: catColor };
      }
      categoryExpensesMap[catName].amount += t.amount;
    });

  const categoryPieData = Object.values(categoryExpensesMap)
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Member Spending Data for Bar Chart
  const memberSpendingData = members.map(m => {
    const totalSpent = filteredTransactions
      .filter(t => t.type === 'expense' && !t.isTransfer && t.memberId === m.id)
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      name: m.name,
      Gasto: totalSpent,
      avatar: m.avatar,
    };
  });

  // Recent 5 Transactions
  const recentTransactions = [...filteredTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Mês Vigente: {formatShortMonthYear(currentMonthYear)}</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Painel Financeiro da Família
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Acompanhe receitas, saldos em conta, faturas abertas dos cartões de crédito e o orçamento doméstico do mês.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <button
            onClick={() => onNavigateTab('cards')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center space-x-2"
          >
            <CreditCardIcon className="w-4 h-4 text-amber-400" />
            <span>Ver Faturas</span>
          </button>
          <button
            onClick={onNewTransactionClick}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center space-x-2 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Gasto/Receita</span>
          </button>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Bank Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Total em Conta</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white">{formatCurrency(totalAccountBalance)}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <span>Soma de {accounts.length} contas bancárias</span>
            </p>
          </div>
        </div>

        {/* Card 2: Current Month Incomes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receitas do Mês</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-emerald-400">{formatCurrency(currentMonthIncomes)}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Entradas registradas</span>
            </p>
          </div>
        </div>

        {/* Card 3: Direct Account Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Despesas à Vista (Débito)</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-rose-400">{formatCurrency(currentMonthAccountExpenses)}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              <span>Saídas diretas de conta</span>
            </p>
          </div>
        </div>

        {/* Card 4: Open Credit Card Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Faturas de Cartão</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <CreditCardIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-amber-400">{formatCurrency(totalOpenInvoicesAmount)}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Projeção de Fechamento:</span>
              <span className={`font-semibold ${netBalanceForecast >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(netBalanceForecast)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Credit Cards Section - Carousel / Quick View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <CreditCardIcon className="w-5 h-5 text-amber-400" />
              <span>Status dos Cartões de Crédito</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Valor da fatura aberta atual, limite disponível e datas de fechamento
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('cards')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition-colors"
          >
            <span>Gerenciar Cartões & Faturas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cardInvoiceSummaries.map(({ card, targetInvoiceMonth, invoiceTotal, isPaid, closingDate, dueDate, availableLimit, totalUsedLimit }) => {
            const usagePercent = Math.min(100, Math.round((totalUsedLimit / card.totalLimit) * 100));

            return (
              <div
                key={card.id}
                onClick={() => onSelectCardInvoice(card.id, targetInvoiceMonth)}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all cursor-pointer hover:shadow-lg group relative overflow-hidden"
              >
                {/* Top Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${card.color}`} />
                    <span className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">
                      {card.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    •••• {card.lastFourDigits}
                  </span>
                </div>

                {/* Amount and Status */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Fatura {formatShortMonthYear(targetInvoiceMonth)}</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(invoiceTotal)}</p>
                  </div>
                  {isPaid ? (
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-1 rounded-md flex items-center space-x-1 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Paga</span>
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-2 py-1 rounded-md flex items-center space-x-1 border border-amber-500/30">
                      <Clock className="w-3 h-3" />
                      <span>Aberta</span>
                    </span>
                  )}
                </div>

                {/* Limit Progress Bar */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Uso do Limite ({usagePercent}%)</span>
                    <span>Disponível: {formatCurrency(availableLimit)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        usagePercent > 85 ? 'bg-rose-500' : usagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                {/* Dates Footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Fecha dia {card.closingDay} ({formatDate(closingDate)})</span>
                  <span className="font-medium text-slate-300">Vence dia {card.dueDay}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Expenses by Category */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Despesas por Categoria</h3>
            <p className="text-xs text-slate-400 mb-4">
              Distribuição dos gastos totais do grupo selecionado
            </p>
          </div>

          {categoryPieData.length > 0 ? (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
              <AlertCircle className="w-8 h-8 mb-2 stroke-1" />
              <span>Nenhuma despesa registrada para exibir no gráfico</span>
            </div>
          )}
        </div>

        {/* Chart 2: Spending by Family Member */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Gastos por Membro da Família</h3>
            <p className="text-xs text-slate-400 mb-4">
              Comparativo de gastos divididos entre os integrantes
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberSpendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Total Gastos']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="Gasto" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Lançamentos Recentes</h3>
            <p className="text-xs text-slate-400">Últimas movimentações financeiras registradas</p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>Ver todas ({filteredTransactions.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {recentTransactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const member = members.find((m) => m.id === tx.memberId);
            const card = cards.find((c) => c.id === tx.creditCardId);
            const isIncome = tx.type === 'income';

            return (
              <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                      isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{tx.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="text-slate-300">{cat?.name || 'Geral'}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <span>{member?.avatar}</span>
                        <span>{member?.name}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tx.paymentMethod === 'credit_card'
                      ? `💳 ${card?.name || 'Cartão'} (${tx.installmentTotal ? `${tx.installmentCurrent}/${tx.installmentTotal}x` : 'À vista'})`
                      : '🏦 Saldo em Conta'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
