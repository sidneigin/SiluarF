import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3,
  Plus, 
  ListFilter, 
  CreditCard as CreditCardIcon, 
  Building2, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import { Transaction, Category, FamilyMember, CreditCard, BankAccount } from '../types';
import { formatCurrency, formatDate, formatMonthYear, getInvoiceMonthYearForDate, getNextMonthYear } from '../utils/finance';

interface TransactionsListProps {
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  cards: CreditCard[];
  accounts: BankAccount[];
  selectedMemberId: string;
  onNewTransactionClick: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  categories,
  members,
  cards,
  accounts,
  selectedMemberId,
  onNewTransactionClick,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  // Edit transaction state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editingTx.description || editingTx.amount <= 0) return;

    let finalTx: Transaction = { ...editingTx };

    if (finalTx.paymentMethod === 'account') {
      if (!finalTx.bankAccountId) {
        finalTx.bankAccountId = accounts[0]?.id || '';
      }
      delete finalTx.creditCardId;
      delete finalTx.invoiceMonthYear;
    } else if (finalTx.paymentMethod === 'credit_card') {
      if (!finalTx.creditCardId) {
        finalTx.creditCardId = cards[0]?.id || '';
      }
      const card = cards.find((c) => c.id === finalTx.creditCardId);
      if (card) {
        // Transactions that are part of an installment purchase all share the
        // same purchase `date`; only invoiceMonthYear differs between them.
        // Recalculating naively from `date` would always land on the 1st
        // installment's invoice, so we re-apply this transaction's own
        // installment offset (installmentCurrent) on top of the base invoice.
        const baseInvoiceMonthYear = getInvoiceMonthYearForDate(finalTx.date, card.closingDay);
        const offset = finalTx.installmentCurrent ? finalTx.installmentCurrent - 1 : 0;
        finalTx.invoiceMonthYear = getNextMonthYear(baseInvoiceMonthYear, offset);
      }
      delete finalTx.bankAccountId;
    }

    if (onEditTransaction) {
      onEditTransaction(finalTx);
    }
    setEditingTx(null);
  };

  // Filter logic
  const filtered = transactions.filter((t) => {
    // Member filter
    if (selectedMemberId !== 'all' && t.memberId !== selectedMemberId) return false;

    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(term);
      const matchNotes = t.notes?.toLowerCase().includes(term);
      if (!matchDesc && !matchNotes) return false;
    }

    // Type filter
    if (filterType === 'income' && t.type !== 'income') return false;
    if (filterType === 'expense' && t.type !== 'expense') return false;

    // Category filter
    if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;

    // Payment method filter
    if (filterPayment === 'credit_card' && t.paymentMethod !== 'credit_card') return false;
    if (filterPayment === 'account' && t.paymentMethod !== 'account') return false;

    return true;
  });

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ListFilter className="w-6 h-6 text-emerald-400" />
            <span>Extrato de Transações</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Histórico completo de entradas, saídas à vista e compras nos cartões de crédito
          </p>
        </div>

        <button
          onClick={onNewTransactionClick}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-md hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Transação</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200"
          >
            <option value="all">Todas os Tipos (Receitas + Saídas)</option>
            <option value="income">🟢 Apenas Receitas (Entradas)</option>
            <option value="expense">🔴 Apenas Despesas (Saídas)</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200"
          >
            <option value="all">Todas as Formas de Pagamento</option>
            <option value="credit_card">💳 Cartão de Crédito</option>
            <option value="account">🏦 Débito / Conta Bancária</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>
            Exibindo <strong className="text-white">{sorted.length}</strong> de {transactions.length} lançamentos
          </span>
          {(searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterPayment !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterCategory('all');
                setFilterPayment('all');
              }}
              className="text-emerald-400 hover:underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Membro</th>
                  <th className="px-4 py-3">Forma / Detalhes</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900">
                {sorted.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const member = members.find((m) => m.id === tx.memberId);
                  const card = cards.find((c) => c.id === tx.creditCardId);
                  const acc = accounts.find((a) => a.id === tx.bankAccountId);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      <td className="px-4 py-3.5 font-medium text-white">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`p-1 rounded-md text-xs font-bold ${
                              isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {isIncome ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          </span>
                          <span>{tx.description}</span>
                        </div>
                        {tx.notes && <p className="text-xs text-slate-500 mt-0.5">{tx.notes}</p>}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${cat?.color || '#64748b'}20`,
                            color: cat?.color || '#94a3b8',
                          }}
                        >
                          {cat?.name || 'Geral'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-300 whitespace-nowrap">
                        <span className="flex items-center space-x-1.5">
                          <span>{member?.avatar}</span>
                          <span>{member?.name}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        {tx.paymentMethod === 'credit_card' ? (
                          <div className="flex items-center space-x-1">
                            <CreditCardIcon className="w-3.5 h-3.5 text-amber-400" />
                            <span>{card?.name || 'Cartão'}</span>
                            {tx.invoiceMonthYear && (
                              <span className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                                Fatura {formatMonthYear(tx.invoiceMonthYear).split(' de ')[0]}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{acc?.name || 'Conta Bancária'}</span>
                          </div>
                        )}
                      </td>

                      <td
                        className={`px-4 py-3.5 text-right font-bold font-mono whitespace-nowrap ${
                          isIncome ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setEditingTx({ ...tx })}
                            title="Editar lançamento"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            title="Excluir lançamento"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ListFilter className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-300">Nenhuma transação encontrada</p>
            <p className="text-xs text-slate-500">Tente ajustar seus filtros de busca ou cadastre um novo lançamento.</p>
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditTx}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Editar Lançamento</span>
              </h3>
              <button type="button" onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={editingTx.description}
                  onChange={(e) => setEditingTx({ ...editingTx, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingTx.amount}
                  onChange={(e) => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={editingTx.date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setEditingTx((prev) => {
                      if (!prev) return null;
                      if (prev.paymentMethod === 'credit_card') {
                        const card = cards.find((c) => c.id === (prev.creditCardId || cards[0]?.id));
                        const offset = prev.installmentCurrent ? prev.installmentCurrent - 1 : 0;
                        const invoiceMonthYear = card
                          ? getNextMonthYear(getInvoiceMonthYearForDate(newDate, card.closingDay), offset)
                          : prev.invoiceMonthYear;
                        return { ...prev, date: newDate, invoiceMonthYear };
                      }
                      return { ...prev, date: newDate };
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo</label>
                <select
                  value={editingTx.type}
                  onChange={(e) =>
                    setEditingTx({ ...editingTx, type: e.target.value as Transaction['type'] })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="expense">Saída (Despesa)</option>
                  <option value="income">Entrada (Receita)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                <select
                  value={editingTx.categoryId}
                  onChange={(e) => setEditingTx({ ...editingTx, categoryId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Integrante Família</label>
                <select
                  value={editingTx.memberId}
                  onChange={(e) => setEditingTx({ ...editingTx, memberId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.avatar} {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Forma de Pagamento</label>
                <select
                  value={editingTx.paymentMethod}
                  onChange={(e) => {
                    const method = e.target.value as Transaction['paymentMethod'];
                    setEditingTx((prev) => {
                      if (!prev) return null;
                      if (method === 'account') {
                        return {
                          ...prev,
                          paymentMethod: 'account',
                          bankAccountId: prev.bankAccountId || accounts[0]?.id || '',
                        };
                      } else {
                        const cardId = prev.creditCardId || cards[0]?.id || '';
                        const card = cards.find((c) => c.id === cardId);
                        const offset = prev.installmentCurrent ? prev.installmentCurrent - 1 : 0;
                        const invoiceMonthYear = card
                          ? getNextMonthYear(getInvoiceMonthYearForDate(prev.date, card.closingDay), offset)
                          : prev.invoiceMonthYear;
                        return {
                          ...prev,
                          paymentMethod: 'credit_card',
                          creditCardId: cardId,
                          invoiceMonthYear,
                        };
                      }
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="account">Débito / Dinheiro / Conta</option>
                </select>
              </div>

              {editingTx.paymentMethod === 'credit_card' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cartão de Crédito</label>
                  <select
                    value={editingTx.creditCardId || ''}
                    onChange={(e) => {
                      const newCardId = e.target.value;
                      setEditingTx((prev) => {
                        if (!prev) return null;
                        const card = cards.find((c) => c.id === newCardId);
                        const offset = prev.installmentCurrent ? prev.installmentCurrent - 1 : 0;
                        const invoiceMonthYear = card
                          ? getNextMonthYear(getInvoiceMonthYearForDate(prev.date, card.closingDay), offset)
                          : prev.invoiceMonthYear;
                        return { ...prev, creditCardId: newCardId, invoiceMonthYear };
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (•••• {c.lastFourDigits})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Conta Bancária</label>
                  <select
                    value={editingTx.bankAccountId || ''}
                    onChange={(e) => {
                      const accId = e.target.value;
                      setEditingTx((prev) => (prev ? { ...prev, bankAccountId: accId } : null));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.bankName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações</label>
                <input
                  type="text"
                  value={editingTx.notes || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm transition-all"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
