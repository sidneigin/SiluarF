import React, { useState } from 'react';
import { 
  CreditCard as CreditCardIcon, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Check, 
  Building2, 
  HelpCircle,
  Receipt,
  X,
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react';
import { CreditCard, Transaction, BankAccount, FamilyMember, Category } from '../types';
import { 
  formatCurrency, 
  formatDate, 
  formatMonthYear, 
  getInvoiceDates, 
  getInvoiceMonthYearForDate,
  getCurrentMonthYear,
  getNextMonthYear,
  calculateUsedCardLimit,
  toLocalDateString,
} from '../utils/finance';

interface CardsAndInvoicesProps {
  cards: CreditCard[];
  transactions: Transaction[];
  accounts: BankAccount[];
  members: FamilyMember[];
  categories: Category[];
  paidInvoices: Record<string, boolean>;
  onPayInvoice: (cardId: string, monthYear: string, bankAccountId: string, amount: number) => boolean;
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
  onEditCard?: (card: CreditCard) => void;
  onDeleteCard?: (cardId: string) => void;
  selectedCardIdFromNav?: string;
  selectedMonthFromNav?: string;
}

export const CardsAndInvoices: React.FC<CardsAndInvoicesProps> = ({
  cards,
  transactions,
  accounts,
  members,
  categories,
  paidInvoices,
  onPayInvoice,
  onAddCard,
  onEditCard,
  onDeleteCard,
  selectedCardIdFromNav,
  selectedMonthFromNav,
}) => {
  const currentMonthYear = getCurrentMonthYear();

  // Active Card state
  const [selectedCardId, setSelectedCardId] = useState<string>(
    selectedCardIdFromNav || cards[0]?.id || ''
  );

  // Active Invoice Month state
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(
    selectedMonthFromNav || currentMonthYear
  );

  // Pay Invoice Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [selectedAccountIdForPayment, setSelectedAccountIdForPayment] = useState<string>(
    accounts[0]?.id || ''
  );

  // New Card Modal state
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState<boolean>(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardBank, setNewCardBank] = useState('');
  const [newCardDigits, setNewCardDigits] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('10000');
  const [newCardClosing, setNewCardClosing] = useState('5');
  const [newCardDue, setNewCardDue] = useState('12');
  const [newCardBrand, setNewCardBrand] = useState<'visa' | 'mastercard' | 'elo' | 'amex'>('visa');
  const [newCardColor, setNewCardColor] = useState('from-indigo-600 via-purple-600 to-pink-600');

  // Edit Card Modal state
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const handleStartEditCard = (e: React.MouseEvent, card: CreditCard) => {
    e.stopPropagation();
    setEditingCard({ ...card });
  };

  const handleSaveEditCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !editingCard.name) return;
    if (onEditCard) {
      onEditCard(editingCard);
    }
    setEditingCard(null);
  };

  const activeCard = cards.find(c => c.id === selectedCardId) || cards[0];

  // Month options range (past 3 months to next 6 months)
  const monthOptions = [-3, -2, -1, 0, 1, 2, 3, 4, 5].map(offset => 
    getNextMonthYear(currentMonthYear, offset)
  );

  // Invoice calculations for selected month & card (safe guards if activeCard is null)
  const invoiceKey = activeCard ? `${activeCard.id}_${selectedMonthYear}` : '';
  const isInvoicePaid = !!paidInvoices[invoiceKey];

  const invoiceDates = activeCard
    ? getInvoiceDates(selectedMonthYear, activeCard.closingDay, activeCard.dueDay)
    : { closingDate: '', dueDate: '' };

  // Get transactions for this specific invoice
  const invoiceTransactions = activeCard
    ? transactions.filter(
        t =>
          t.paymentMethod === 'credit_card' &&
          t.creditCardId === activeCard.id &&
          t.invoiceMonthYear === selectedMonthYear
      )
    : [];

  const totalInvoiceAmount = invoiceTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Calculate card limit status
  const totalUsedLimit = activeCard ? calculateUsedCardLimit(activeCard.id, transactions, paidInvoices) : 0;
  const availableLimit = activeCard ? Math.max(0, activeCard.totalLimit - totalUsedLimit) : 0;

  // Today status vs invoice
  const todayStr = toLocalDateString();
  const isClosed = todayStr >= invoiceDates.closingDate;

  // Handle Pay Invoice
  const handleConfirmPayment = () => {
    if (!activeCard || !selectedAccountIdForPayment || totalInvoiceAmount <= 0) return;
    const success = onPayInvoice(activeCard.id, selectedMonthYear, selectedAccountIdForPayment, totalInvoiceAmount);
    if (success) setIsPayModalOpen(false);
  };

  // Handle Add Card
  const handleCreateCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName || !newCardLimit) return;

    onAddCard({
      name: newCardName,
      bankName: newCardBank || 'Banco',
      lastFourDigits: newCardDigits || '1234',
      totalLimit: parseFloat(newCardLimit) || 5000,
      closingDay: parseInt(newCardClosing, 10) || 5,
      dueDay: parseInt(newCardDue, 10) || 12,
      color: newCardColor,
      brand: newCardBrand,
    });

    setIsNewCardModalOpen(false);
    setNewCardName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Add Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <CreditCardIcon className="w-6 h-6 text-amber-400" />
            <span>Gestão de Cartões & Faturas</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Acompanhe o fechamento das faturas, parcelamentos e o limite de cada cartão
          </p>
        </div>

        <button
          onClick={() => setIsNewCardModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-md hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Novo Cartão</span>
        </button>
      </div>

      {/* Credit Cards Horizontal Selection Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const isSelected = card.id === selectedCardId;
          const usedLimit = calculateUsedCardLimit(card.id, transactions, paidInvoices);
          const avail = Math.max(0, card.totalLimit - usedLimit);

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`p-5 rounded-2xl cursor-pointer transition-all relative overflow-hidden border ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.02] shadow-xl'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900 opacity-80 hover:opacity-100'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-25`} />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-base">{card.name}</span>
                    <span className="text-[10px] text-slate-300 uppercase tracking-widest bg-slate-950/60 px-2 py-0.5 rounded font-mono">
                      {card.brand}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-mono text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded mr-1">
                      •••• {card.lastFourDigits}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleStartEditCard(e, card)}
                      className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-300 hover:text-white transition-colors"
                      title="Editar cartão"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteCard && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCard(card.id);
                        }}
                        className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        title="Excluir cartão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <p className="text-[10px] text-slate-300 uppercase tracking-wider">Limite Total</p>
                    <p className="text-lg font-extrabold text-white">{formatCurrency(card.totalLimit)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-300 uppercase tracking-wider">Disponível</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(avail)}</p>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/50">
                  <span>Fechamento: Dia {card.closingDay}</span>
                  <span>Vencimento: Dia {card.dueDay}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Details Section */}
      {activeCard ? (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Month Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>Fatura do Cartão: {activeCard.name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Selecione o mês para visualizar as compras lançadas e o status de pagamento
            </p>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            <span className="text-xs text-slate-400 font-medium">Mês da Fatura:</span>
            <div className="flex space-x-1">
              {monthOptions.map((m) => {
                const isCurMonth = m === currentMonthYear;
                const isSel = m === selectedMonthYear;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMonthYear(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isSel
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                        : isCurMonth
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {formatMonthYear(m).split(' de ')[0]} / {m.split('-')[0].slice(2)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Invoice Summary Status Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-950 border border-slate-800 rounded-2xl p-5">
          {/* Status & Amount */}
          <div className="space-y-2 lg:col-span-2">
            <div className="flex items-center space-x-3">
              {isInvoicePaid ? (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>FATURA PAGA</span>
                </span>
              ) : isClosed ? (
                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>FATURA FECHADA (AGUARDANDO PAGAMENTO)</span>
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>FATURA ABERTA</span>
                </span>
              )}

              <span className="text-xs text-slate-400">
                {formatMonthYear(selectedMonthYear)}
              </span>
            </div>

            <div className="flex items-baseline space-x-3 pt-1">
              <span className="text-3xl font-extrabold text-white">
                {formatCurrency(totalInvoiceAmount)}
              </span>
              <span className="text-xs text-slate-400">
                ({invoiceTransactions.length} {invoiceTransactions.length === 1 ? 'item' : 'itens'} nesta fatura)
              </span>
            </div>

            <p className="text-xs text-slate-400 pt-1">
              📅 Fechamento da Fatura: <strong className="text-slate-200">{formatDate(invoiceDates.closingDate)}</strong> • Vencimento: <strong className="text-slate-200">{formatDate(invoiceDates.dueDate)}</strong>
            </p>
          </div>

          {/* Action Column */}
          <div className="flex flex-col justify-center items-start lg:items-end space-y-2 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
            {isInvoicePaid ? (
              <div className="text-right">
                <p className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Fatura Paga com Sucesso</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  O limite do cartão foi restabelecido e a despesa foi debitada da conta.
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsPayModalOpen(true)}
                  disabled={totalInvoiceAmount <= 0}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Pagar Fatura Agora</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center lg:text-right">
                  Debita o valor diretamente da sua conta bancária e restabelece o limite.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Informative Tip Box about Best Shopping Day */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-300">
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-400 block mb-0.5">💡 Dica de Ouro de Cartão de Crédito:</span>
            <span>
              O dia de fechamento deste cartão é <strong>Dia {activeCard.closingDay}</strong>. Compras efetuadas a partir do dia {activeCard.closingDay} entram automaticamente na fatura do mês seguinte!
            </span>
          </div>
        </div>

        {/* Transactions Table for Selected Invoice */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-200">
            Compras da Fatura ({formatMonthYear(selectedMonthYear)})
          </h4>

          {invoiceTransactions.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Membro</th>
                    <th className="px-4 py-3 text-center">Parcela</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {invoiceTransactions.map((tx) => {
                    const cat = categories.find(c => c.id === tx.categoryId);
                    const member = members.find(m => m.id === tx.memberId);

                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {tx.description}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${cat?.color || '#64748b'}20`, color: cat?.color || '#94a3b8' }}
                          >
                            {cat?.name || 'Geral'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300">
                          <span className="flex items-center space-x-1.5">
                            <span>{member?.avatar}</span>
                            <span>{member?.name}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tx.installmentTotal ? (
                            <span className="bg-slate-800 text-amber-400 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-slate-700">
                              {tx.installmentCurrent}/{tx.installmentTotal}x
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">1/1x (À vista)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-white font-mono whitespace-nowrap">
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <span>Nenhuma compra registrada na fatura deste mês para este cartão.</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Pay Invoice */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Pagar Fatura de Cartão</span>
              </h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400">Cartão / Fatura:</p>
                <p className="font-bold text-white text-base">{activeCard.name} • {formatMonthYear(selectedMonthYear)}</p>
                <p className="text-2xl font-extrabold text-emerald-400 mt-2">{formatCurrency(totalInvoiceAmount)}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Selecione a Conta Bancária para Débito:
                </label>
                <select
                  value={selectedAccountIdForPayment}
                  onChange={(e) => setSelectedAccountIdForPayment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo Atual: {formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4 shadow-xl">
          <CreditCardIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-lg text-slate-200 font-bold">Nenhum cartão cadastrado</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Adicione um cartão de crédito para gerenciar faturas, parcelamentos e limites da família de forma organizada.
          </p>
          <button
            type="button"
            onClick={() => setIsNewCardModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm inline-flex items-center space-x-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Primeiro Cartão</span>
          </button>
        </div>
      )}

      {/* MODAL: New Credit Card */}
      {isNewCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCardSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <CreditCardIcon className="w-5 h-5 text-amber-400" />
                <span>Cadastrar Novo Cartão de Crédito</span>
              </h3>
              <button type="button" onClick={() => setIsNewCardModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Itaú Personalité, Nubank, C6 Carbon"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Banco Emissor</label>
                <input
                  type="text"
                  placeholder="Ex: Itaú, Nubank, Bradesco"
                  value={newCardBank}
                  onChange={(e) => setNewCardBank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Últimos 4 Dígitos</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={newCardDigits}
                  onChange={(e) => setNewCardDigits(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Limite Total (R$)</label>
                <input
                  type="number"
                  required
                  value={newCardLimit}
                  onChange={(e) => setNewCardLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bandeira</label>
                <select
                  value={newCardBrand}
                  onChange={(e) => setNewCardBrand(e.target.value as CreditCard['brand'])}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="elo">Elo</option>
                  <option value="amex">Amex</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dia de Fechamento</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={newCardClosing}
                  onChange={(e) => setNewCardClosing(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dia de Vencimento</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={newCardDue}
                  onChange={(e) => setNewCardDue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewCardModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm transition-all"
              >
                Salvar Cartão
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditCard}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Editar Cartão: {editingCard.name}</span>
              </h3>
              <button type="button" onClick={() => setEditingCard(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  required
                  value={editingCard.name}
                  onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Banco Emissor</label>
                <input
                  type="text"
                  value={editingCard.bankName}
                  onChange={(e) => setEditingCard({ ...editingCard, bankName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Últimos 4 Dígitos</label>
                <input
                  type="text"
                  maxLength={4}
                  value={editingCard.lastFourDigits}
                  onChange={(e) => setEditingCard({ ...editingCard, lastFourDigits: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Limite Total (R$)</label>
                <input
                  type="number"
                  required
                  value={editingCard.totalLimit}
                  onChange={(e) => setEditingCard({ ...editingCard, totalLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bandeira</label>
                <select
                  value={editingCard.brand}
                  onChange={(e) => setEditingCard({ ...editingCard, brand: e.target.value as CreditCard['brand'] })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="elo">Elo</option>
                  <option value="amex">Amex</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dia de Fechamento</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={editingCard.closingDay}
                  onChange={(e) => setEditingCard({ ...editingCard, closingDay: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dia de Vencimento</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={editingCard.dueDay}
                  onChange={(e) => setEditingCard({ ...editingCard, dueDay: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
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
