/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CardsAndInvoices } from './components/CardsAndInvoices';
import { TransactionsList } from './components/TransactionsList';
import { CategoriesAndBudgets } from './components/CategoriesAndBudgets';
import { FamilyMembersAndAccounts } from './components/FamilyMembersAndAccounts';
import { AIAdvisor } from './components/AIAdvisor';
import { Statements } from './components/Statements';
import { ArchitectureDocModal } from './components/ArchitectureDocModal';
import { TransactionModal } from './components/TransactionModal';

import { 
  CreditCard, 
  Transaction, 
  Category, 
  BankAccount, 
  FamilyMember 
} from './types';

import { 
  INITIAL_CARDS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_CATEGORIES, 
  INITIAL_ACCOUNTS, 
  INITIAL_MEMBERS 
} from './data/initialData';

import { calculateUsedCardLimit, applyAccountDelta, generateId, toLocalDateString, formatCurrency } from './utils/finance';

const STORAGE_KEY = 'siluar_family_data_v3';
const TRANSFER_CATEGORY_ID = 'cat_system_transfer';
const INVOICE_PAYMENT_CATEGORY_ID = 'cat_system_invoice_payment';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function ensureSystemCategory(
  categories: Category[],
  id: string,
  category: Omit<Category, 'id'>
): Category[] {
  return categories.some((c) => c.id === id) ? categories : [...categories, { ...category, id }];
}

export default function App() {
  // State Initialization with LocalStorage fallback
  const [cards, setCards] = useState<CreditCard[]>(() =>
    loadFromStorage(`${STORAGE_KEY}_cards`, INITIAL_CARDS)
  );

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage(`${STORAGE_KEY}_transactions`, INITIAL_TRANSACTIONS)
  );

  const [categories, setCategories] = useState<Category[]>(() =>
    loadFromStorage(`${STORAGE_KEY}_categories`, INITIAL_CATEGORIES)
  );

  const [accounts, setAccounts] = useState<BankAccount[]>(() =>
    loadFromStorage(`${STORAGE_KEY}_accounts`, INITIAL_ACCOUNTS)
  );

  const [members, setMembers] = useState<FamilyMember[]>(() =>
    loadFromStorage(`${STORAGE_KEY}_members`, INITIAL_MEMBERS)
  );

  const [paidInvoices, setPaidInvoices] = useState<Record<string, boolean>>(() =>
    loadFromStorage(`${STORAGE_KEY}_paid_invoices`, {})
  );

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);

  // Selected Card/Month for deep navigation
  const [navCardId, setNavCardId] = useState<string>('');
  const [navMonthYear, setNavMonthYear] = useState<string>('');

  // Save to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cards`, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_accounts`, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_members`, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_paid_invoices`, JSON.stringify(paidInvoices));
  }, [paidInvoices]);

  // Derived totals
  const totalAccountBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const totalOpenInvoices = cards.reduce((sum, card) => {
    const used = calculateUsedCardLimit(card.id, transactions, paidInvoices);
    return sum + used;
  }, 0);

  // HANDLER: Add New Transaction(s)
  const handleSaveTransactions = (newTxs: Omit<Transaction, 'id'>[]) => {
    const preparedTxs: Transaction[] = newTxs.map((t) => ({
      ...t,
      id: generateId('tx_'),
    }));

    // Update account balances for direct debit or income
    setAccounts((prevAccounts) => {
      let updated = [...prevAccounts];
      preparedTxs.forEach((tx) => {
        if (tx.paymentMethod === 'account' && tx.bankAccountId) {
          updated = updated.map((acc) => {
            if (acc.id === tx.bankAccountId) {
              const delta = tx.type === 'income' ? tx.amount : -tx.amount;
              return { ...acc, balance: acc.balance + delta };
            }
            return acc;
          });
        }
      });
      return updated;
    });

    setTransactions((prev) => [...preparedTxs, ...prev]);
  };

  // HANDLER: Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    const targetTx = transactions.find((t) => t.id === id);
    if (!targetTx) return;

    // Reverse bank account balance change if applicable
    if (targetTx.paymentMethod === 'account' && targetTx.bankAccountId) {
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => {
          if (acc.id === targetTx.bankAccountId) {
            const delta = targetTx.type === 'income' ? -targetTx.amount : targetTx.amount;
            return { ...acc, balance: acc.balance + delta };
          }
          return acc;
        })
      );
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // HANDLER: Pay Invoice
  const handlePayInvoice = (
    cardId: string,
    monthYear: string,
    bankAccountId: string,
    amount: number
  ): boolean => {
    const invoiceKey = `${cardId}_${monthYear}`;

    if (paidInvoices[invoiceKey]) {
      alert('Esta fatura já foi paga.');
      return false;
    }

    const account = accounts.find((acc) => acc.id === bankAccountId);
    if (!account || account.balance < amount) {
      alert(
        `Saldo insuficiente na conta selecionada. Saldo disponível: ${formatCurrency(account?.balance || 0)}.`
      );
      return false;
    }

    setCategories((prev) =>
      ensureSystemCategory(prev, INVOICE_PAYMENT_CATEGORY_ID, {
        name: 'Pagamento de Fatura',
        icon: 'CreditCard',
        color: '#64748b',
        type: 'expense',
      })
    );

    // Mark invoice as paid
    setPaidInvoices((prev) => ({ ...prev, [invoiceKey]: true }));

    // Deduct amount from selected bank account
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === bankAccountId) {
          return { ...acc, balance: acc.balance - amount };
        }
        return acc;
      })
    );

    // Register a payment transaction record in history
    const card = cards.find((c) => c.id === cardId);
    const paymentRecord: Transaction = {
      id: generateId('tx_pay_'),
      description: `Pagamento Fatura ${card?.name || 'Cartão'} (${monthYear})`,
      amount,
      type: 'expense',
      date: toLocalDateString(),
      categoryId: INVOICE_PAYMENT_CATEGORY_ID,
      memberId: members[0]?.id || 'm1',
      paymentMethod: 'account',
      bankAccountId,
      notes: `Quitação da fatura referente a ${monthYear}`,
    };

    setTransactions((prev) => [paymentRecord, ...prev]);
    return true;
  };

  // HANDLER: Edit Transaction
  const handleEditTransaction = (updatedTx: Transaction) => {
    const oldTx = transactions.find((t) => t.id === updatedTx.id);
    if (!oldTx) return;

    setAccounts((prevAccounts) => {
      let updated = [...prevAccounts];

      // Revert old transaction effect on bank account balance if applicable
      if (oldTx.paymentMethod === 'account' && oldTx.bankAccountId) {
        updated = applyAccountDelta(updated, oldTx.bankAccountId, oldTx.type, oldTx.amount, true);
      }

      // Apply new transaction effect on bank account balance if applicable
      if (updatedTx.paymentMethod === 'account' && updatedTx.bankAccountId) {
        updated = applyAccountDelta(updated, updatedTx.bankAccountId, updatedTx.type, updatedTx.amount, false);
      }

      return updated;
    });

    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
  };

  // HANDLER: Add Credit Card
  const handleAddCard = (newCardData: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...newCardData,
      id: generateId('card_'),
    };
    setCards((prev) => [...prev, newCard]);
  };

  // HANDLER: Edit Credit Card
  const handleEditCard = (updatedCard: CreditCard) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  // HANDLER: Delete Credit Card
  const handleDeleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  // HANDLER: Add Category
  const handleAddCategory = (newCatData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...newCatData,
      id: generateId('cat_'),
    };
    setCategories((prev) => [...prev, newCat]);
  };

  // HANDLER: Edit Category
  const handleEditCategory = (updatedCat: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
  };

  // HANDLER: Delete Category
  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  // HANDLER: Update Category Budget
  const handleUpdateCategoryBudget = (catId: string, newBudget: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, budgetLimit: newBudget } : c))
    );
  };

  // HANDLER: Add Member
  const handleAddMember = (newMemData: Omit<FamilyMember, 'id'>) => {
    const newMem: FamilyMember = {
      ...newMemData,
      id: generateId('m_'),
    };
    setMembers((prev) => [...prev, newMem]);
  };

  // HANDLER: Edit Member
  const handleEditMember = (updatedMember: FamilyMember) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
  };

  // HANDLER: Delete Member
  const handleDeleteMember = (memberId: string) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  // HANDLER: Add Account
  const handleAddAccount = (newAccData: Omit<BankAccount, 'id'>) => {
    const newAcc: BankAccount = {
      ...newAccData,
      id: generateId('acc_'),
    };
    setAccounts((prev) => [...prev, newAcc]);
  };

  // HANDLER: Edit Account
  const handleEditAccount = (updatedAcc: BankAccount) => {
    setAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));
  };

  // HANDLER: Delete Account
  const handleDeleteAccount = (accId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accId));
  };

  // HANDLER: Transfer Between Accounts
  const handleTransfer = (fromAccountId: string, toAccountId: string, amount: number): boolean => {
    const fromAccountCheck = accounts.find((acc) => acc.id === fromAccountId);
    if (!fromAccountCheck || fromAccountCheck.balance < amount) {
      alert(
        `Saldo insuficiente na conta de origem. Saldo disponível: ${formatCurrency(fromAccountCheck?.balance || 0)}.`
      );
      return false;
    }

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) {
          return { ...acc, balance: acc.balance - amount };
        }
        if (acc.id === toAccountId) {
          return { ...acc, balance: acc.balance + amount };
        }
        return acc;
      })
    );

    setCategories((prev) =>
      ensureSystemCategory(prev, TRANSFER_CATEGORY_ID, {
        name: 'Transferência entre Contas',
        icon: 'ArrowLeftRight',
        color: '#64748b',
        type: 'both',
      })
    );

    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);
    const todayStr = toLocalDateString();
    const transferGroupId = generateId('transfer_');

    // Record both legs so the movement shows up in extratos / lista de transações,
    // but flagged with isTransfer so it's excluded from income/expense totals elsewhere.
    const outTx: Transaction = {
      id: generateId('tx_'),
      description: `Transferência para ${toAcc?.name || 'Conta'}`,
      amount,
      type: 'expense',
      date: todayStr,
      categoryId: TRANSFER_CATEGORY_ID,
      memberId: members[0]?.id || 'm1',
      paymentMethod: 'account',
      bankAccountId: fromAccountId,
      notes: `Transferência interna entre contas`,
      tags: [transferGroupId],
      isTransfer: true,
    };

    const inTx: Transaction = {
      id: generateId('tx_'),
      description: `Transferência de ${fromAcc?.name || 'Conta'}`,
      amount,
      type: 'income',
      date: todayStr,
      categoryId: TRANSFER_CATEGORY_ID,
      memberId: members[0]?.id || 'm1',
      paymentMethod: 'account',
      bankAccountId: toAccountId,
      notes: `Transferência interna entre contas`,
      tags: [transferGroupId],
      isTransfer: true,
    };

    setTransactions((prev) => [outTx, inTx, ...prev]);
    return true;
  };

  // HANDLER: Reset Data to Original Demo State
  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os dados demonstrativos de exemplo da família?')) {
      localStorage.removeItem(`${STORAGE_KEY}_cards`);
      localStorage.removeItem(`${STORAGE_KEY}_transactions`);
      localStorage.removeItem(`${STORAGE_KEY}_categories`);
      localStorage.removeItem(`${STORAGE_KEY}_accounts`);
      localStorage.removeItem(`${STORAGE_KEY}_members`);
      localStorage.removeItem(`${STORAGE_KEY}_paid_invoices`);

      setCards(INITIAL_CARDS);
      setTransactions(INITIAL_TRANSACTIONS);
      setCategories(INITIAL_CATEGORIES);
      setAccounts(INITIAL_ACCOUNTS);
      setMembers(INITIAL_MEMBERS);
      setPaidInvoices({});
    }
  };

  // HANDLER: Export Data JSON
  const handleExportData = () => {
    const exportPayload = {
      cards,
      transactions,
      categories,
      accounts,
      members,
      paidInvoices,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Siluar_Export_${toLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // HANDLER: Import Data JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (data.cards && Array.isArray(data.cards)) setCards(data.cards);
        if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
        if (data.accounts && Array.isArray(data.accounts)) setAccounts(data.accounts);
        if (data.members && Array.isArray(data.members)) setMembers(data.members);
        if (data.paidInvoices && typeof data.paidInvoices === 'object') setPaidInvoices(data.paidInvoices);

        alert('Backup importado com sucesso! Os dados foram salvos no navegador.');
      } catch (err) {
        alert('Erro ao ler o arquivo JSON de backup. Certifique-se de que é um arquivo válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Navigate to Card Invoice
  const handleSelectCardInvoice = (cardId: string, monthYear: string) => {
    setNavCardId(cardId);
    setNavMonthYear(monthYear);
    setActiveTab('cards');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        members={members}
        selectedMemberId={selectedMemberId}
        setSelectedMemberId={setSelectedMemberId}
        totalAccountBalance={totalAccountBalance}
        totalOpenInvoices={totalOpenInvoices}
        onNewTransactionClick={() => setIsTransactionModalOpen(true)}
        onResetDataClick={handleResetData}
        onExportDataClick={handleExportData}
        onImportDataClick={handleImportData}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            cards={cards}
            transactions={transactions}
            categories={categories}
            members={members}
            accounts={accounts}
            paidInvoices={paidInvoices}
            selectedMemberId={selectedMemberId}
            onNavigateTab={setActiveTab}
            onNewTransactionClick={() => setIsTransactionModalOpen(true)}
            onSelectCardInvoice={handleSelectCardInvoice}
          />
        )}

        {activeTab === 'cards' && (
          <CardsAndInvoices
            cards={cards}
            transactions={transactions}
            accounts={accounts}
            members={members}
            categories={categories}
            paidInvoices={paidInvoices}
            onPayInvoice={handlePayInvoice}
            onAddCard={handleAddCard}
            onEditCard={handleEditCard}
            onDeleteCard={handleDeleteCard}
            selectedCardIdFromNav={navCardId}
            selectedMonthFromNav={navMonthYear}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsList
            transactions={transactions}
            categories={categories}
            members={members}
            cards={cards}
            accounts={accounts}
            selectedMemberId={selectedMemberId}
            onNewTransactionClick={() => setIsTransactionModalOpen(true)}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activeTab === 'budgets' && (
          <CategoriesAndBudgets
            categories={categories}
            transactions={transactions}
            onUpdateCategoryBudget={handleUpdateCategoryBudget}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'family' && (
          <FamilyMembersAndAccounts
            members={members}
            accounts={accounts}
            transactions={transactions}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onAddAccount={handleAddAccount}
            onEditAccount={handleEditAccount}
            onDeleteAccount={handleDeleteAccount}
            onTransfer={handleTransfer}
          />
        )}

        {activeTab === 'statements' && (
          <Statements
            accounts={accounts}
            cards={cards}
            transactions={transactions}
            categories={categories}
            members={members}
            paidInvoices={paidInvoices}
          />
        )}

        {activeTab === 'ai' && (
          <AIAdvisor
            cards={cards}
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            members={members}
          />
        )}

        {activeTab === 'docs' && <ArchitectureDocModal />}
      </main>

      {/* Modal for New Transaction */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransactions}
        cards={cards}
        accounts={accounts}
        members={members}
        categories={categories}
      />
    </div>
  );
}
