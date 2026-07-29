import React, { useState, useEffect } from 'react';
import { X, Calculator, Calendar, CreditCard as CreditCardIcon, Building2, Tag, User, AlertCircle, Plus } from 'lucide-react';
import { Transaction, CreditCard, BankAccount, FamilyMember, Category, PaymentMethodType } from '../types';
import { formatCurrency, getInvoiceMonthYearForDate, getNextMonthYear, formatMonthYear, generateId, splitInstallmentAmounts, toLocalDateString } from '../utils/finance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactions: Omit<Transaction, 'id'>[]) => void;
  cards: CreditCard[];
  accounts: BankAccount[];
  members: FamilyMember[];
  categories: Category[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cards,
  accounts,
  members,
  categories,
}) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toLocalDateString());
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('credit_card');
  const [bankAccountId, setBankAccountId] = useState(accounts[0]?.id || '');
  const [creditCardId, setCreditCardId] = useState(cards[0]?.id || '');
  const [installments, setInstallments] = useState(1);
  const [notes, setNotes] = useState('');

  // The component stays mounted (App.tsx renders it unconditionally and just
  // toggles `isOpen`), so we reset the form fields every time it opens.
  useEffect(() => {
    if (isOpen) {
      setType('expense');
      setDescription('');
      setAmount('');
      setDate(toLocalDateString());
      setCategoryId(categories[0]?.id || '');
      setMemberId(members[0]?.id || '');
      setPaymentMethod('credit_card');
      setBankAccountId(accounts[0]?.id || '');
      setCreditCardId(cards[0]?.id || '');
      setInstallments(1);
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // IMPORTANT: this early return must come AFTER all hooks above so the
  // number/order of hooks stays identical across renders of this component
  // (it stays mounted and toggles isOpen, it isn't unmounted when closed).
  if (!isOpen) return null;

  const selectedCard = cards.find(c => c.id === creditCardId) || cards[0];
  const numAmount = parseFloat(amount) || 0;

  // Invoice calculation preview
  let previewTargetInvoice = '';
  let previewInstallmentAmount = 0;
  let previewEndInvoice = '';

  if (paymentMethod === 'credit_card' && selectedCard && numAmount > 0) {
    previewTargetInvoice = getInvoiceMonthYearForDate(date, selectedCard.closingDay);
    const installmentAmounts = splitInstallmentAmounts(numAmount, installments);
    previewInstallmentAmount = installmentAmounts[0];
    previewEndInvoice = getNextMonthYear(previewTargetInvoice, installments - 1);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || numAmount <= 0) return;

    if (type === 'income') {
      // Direct Income to Bank Account
      onSave([{
        description,
        amount: numAmount,
        type: 'income',
        date,
        categoryId,
        memberId,
        paymentMethod: 'account',
        bankAccountId,
        notes,
      }]);
    } else if (paymentMethod === 'account') {
      // Direct Expense from Bank Account
      onSave([{
        description,
        amount: numAmount,
        type: 'expense',
        date,
        categoryId,
        memberId,
        paymentMethod: 'account',
        bankAccountId,
        notes,
      }]);
    } else if (paymentMethod === 'credit_card') {
      if (!selectedCard) {
        alert('Cadastre um cartão de crédito antes de registrar compras no cartão.');
        return;
      }

      // Credit Card Expense (single or multiple installments)
      if (installments === 1) {
        const targetInvoice = getInvoiceMonthYearForDate(date, selectedCard.closingDay);
        onSave([{
          description,
          amount: numAmount,
          type: 'expense',
          date,
          categoryId,
          memberId,
          paymentMethod: 'credit_card',
          creditCardId: selectedCard.id,
          invoiceMonthYear: targetInvoice,
          notes,
        }]);
      } else {
        // Multi-installment creation
        const baseInvoiceMonthYear = getInvoiceMonthYearForDate(date, selectedCard.closingDay);
        const generatedTxs: Omit<Transaction, 'id'>[] = [];
        const parentId = generateId('parent_');
        const installmentAmounts = splitInstallmentAmounts(numAmount, installments);

        for (let i = 0; i < installments; i++) {
          const targetInv = getNextMonthYear(baseInvoiceMonthYear, i);
          generatedTxs.push({
            description: `${description} (${i + 1}/${installments})`,
            amount: installmentAmounts[i],
            type: 'expense',
            date,
            categoryId,
            memberId,
            paymentMethod: 'credit_card',
            creditCardId: selectedCard.id,
            installmentCurrent: i + 1,
            installmentTotal: installments,
            parentTransactionId: parentId,
            invoiceMonthYear: targetInv,
            notes,
          });
        }
        onSave(generatedTxs);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <span>Novo Lançamento Financeiro</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💸 Despesa (Saída)
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💰 Receita (Entrada)
            </button>
          </div>

          {/* Amount & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data do Lançamento</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Supermercado, Abastecimento, Salário"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category & Family Member */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Membro Responsável</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar} {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method Selection (Only for expenses) */}
          {type === 'expense' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  disabled={cards.length === 0}
                  className={`p-3 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'border-amber-500 bg-amber-500/10 text-white font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <CreditCardIcon className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs">Cartão de Crédito</p>
                    <p className="text-[10px] text-slate-400">Entra na fatura</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('account')}
                  className={`p-3 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                    paymentMethod === 'account'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs">À Vista / Débito</p>
                    <p className="text-[10px] text-slate-400">Debita da conta</p>
                  </div>
                </button>
              </div>

              {/* Account Selection */}
              {paymentMethod === 'account' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Selecione a Conta Bancária</label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Saldo: {formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Credit Card & Installments Selection */}
              {paymentMethod === 'credit_card' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {cards.length === 0 ? (
                    <p className="text-xs text-amber-400">
                      Nenhum cartão cadastrado. Adicione um cartão na aba Cartões & Faturas.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Qual Cartão de Crédito?</label>
                          <select
                            value={creditCardId}
                            onChange={(e) => setCreditCardId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          >
                            {cards.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} (Fechamento: Dia {c.closingDay})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Número de Parcelas</label>
                          <select
                            value={installments}
                            onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                          >
                            <option value={1}>1x de {formatCurrency(numAmount)} (À vista)</option>
                            {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                              <option key={n} value={n}>
                                {n}x de {formatCurrency(numAmount / n)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {numAmount > 0 && selectedCard && (
                        <div className="bg-slate-900/90 border border-amber-500/30 rounded-lg p-3 text-xs text-slate-300 space-y-1">
                          <p className="font-semibold text-amber-400 flex items-center space-x-1">
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Previsão de Lançamento na Fatura:</span>
                          </p>
                          <p>
                            • 1ª Parcela: <strong className="text-white">{formatCurrency(previewInstallmentAmount)}</strong> na fatura de <strong className="text-emerald-400">{formatMonthYear(previewTargetInvoice)}</strong> (Fechamento dia {selectedCard.closingDay}).
                          </p>
                          {installments > 1 && (
                            <p>
                              • Última Parcela ({installments}/{installments}x): entrará na fatura de <strong className="text-amber-300">{formatMonthYear(previewEndInvoice)}</strong>.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Income Account Selection */}
          {type === 'income' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Depositar na Conta Bancária</label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Saldo Atual: {formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Observações (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: Compras de supermercado para a semana"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
