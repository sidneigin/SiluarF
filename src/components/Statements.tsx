import React, { useMemo, useState } from 'react';
import {
  FileText,
  Landmark,
  CreditCard as CreditCardIcon,
  Download,
  CalendarRange,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  BankAccount,
  CreditCard,
  Category,
  FamilyMember,
  Transaction,
} from '../types';
import { formatCurrency, formatDate, formatMonthYear, toLocalDateString } from '../utils/finance';
import {
  computeAccountStatement,
  computeCardStatement,
  computeFullReport,
  categoryName,
  memberName,
  accountName,
  cardName,
} from '../utils/statementData';
import {
  generateAccountStatement,
  generateCardStatement,
  generateFullReport,
} from '../utils/statementPdf';

interface StatementsProps {
  accounts: BankAccount[];
  cards: CreditCard[];
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  paidInvoices: Record<string, boolean>;
}

type ReportType = 'full' | 'account' | 'card';

function getDefaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toLocalDateString(start), end: toLocalDateString(end) };
}

const REPORT_TABS: { id: ReportType; label: string; icon: typeof FileText }[] = [
  { id: 'full', label: 'Relatório Completo', icon: FileText },
  { id: 'account', label: 'Extrato de Conta', icon: Landmark },
  { id: 'card', label: 'Extrato de Cartão', icon: CreditCardIcon },
];

export const Statements: React.FC<StatementsProps> = ({
  accounts,
  cards,
  transactions,
  categories,
  members,
  paidInvoices,
}) => {
  const [range, setRange] = useState(getDefaultRange());
  const [reportType, setReportType] = useState<ReportType>('full');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const rangeValid = range.start <= range.end;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const selectedCard = cards.find((c) => c.id === selectedCardId);

  const accountData = useMemo(
    () => (selectedAccount && rangeValid ? computeAccountStatement(selectedAccount, transactions, range) : null),
    [selectedAccount, transactions, range, rangeValid]
  );

  const cardData = useMemo(
    () => (selectedCard && rangeValid ? computeCardStatement(selectedCard, transactions, paidInvoices, range) : null),
    [selectedCard, transactions, paidInvoices, range, rangeValid]
  );

  const fullData = useMemo(
    () => (rangeValid ? computeFullReport(accounts, cards, transactions, categories, range) : null),
    [accounts, cards, transactions, categories, range, rangeValid]
  );

  const applyQuickRange = (type: 'thisMonth' | 'lastMonth' | 'thisYear' | 'all') => {
    const now = new Date();

    if (type === 'thisMonth') {
      setRange(getDefaultRange());
    } else if (type === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setRange({ start: toLocalDateString(start), end: toLocalDateString(end) });
    } else if (type === 'thisYear') {
      setRange({ start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` });
    } else if (type === 'all') {
      const dates = transactions.map((t) => t.date).sort();
      setRange({
        start: dates[0] || toLocalDateString(new Date(now.getFullYear(), 0, 1)),
        end: dates[dates.length - 1] || toLocalDateString(now),
      });
    }
  };

  const handleDownload = async () => {
    if (!rangeValid) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 30));
    try {
      if (reportType === 'full') {
        generateFullReport(accounts, cards, transactions, categories, members, paidInvoices, range);
      } else if (reportType === 'account' && selectedAccount) {
        generateAccountStatement(selectedAccount, transactions, categories, members, range);
      } else if (reportType === 'card' && selectedCard) {
        generateCardStatement(selectedCard, transactions, categories, members, paidInvoices, range);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const canDownload =
    rangeValid &&
    ((reportType === 'full') ||
      (reportType === 'account' && !!selectedAccount) ||
      (reportType === 'card' && !!selectedCard));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Extratos e Relatórios</h2>
            <p className="text-xs text-slate-400">
              Visualize na tela ou baixe em PDF: relatório completo, extrato de conta ou fatura de cartão
            </p>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all border ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-inner'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls: Period + Account/Card selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 text-sm font-semibold text-white">
          <CalendarRange className="w-4 h-4 text-emerald-400" />
          <span>Período</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">Data Inicial</label>
            <input
              type="date"
              value={range.start}
              onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">Data Final</label>
            <input
              type="date"
              value={range.end}
              onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {reportType === 'account' && (
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Conta</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
              >
                {accounts.length === 0 && <option value="">Nenhuma conta cadastrada</option>}
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'card' && (
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Cartão</label>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                {cards.length === 0 && <option value="">Nenhum cartão cadastrado</option>}
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} • final {c.lastFourDigits}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!rangeValid && (
          <p className="text-xs text-rose-400">A data inicial deve ser anterior ou igual à data final.</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'thisMonth', label: 'Este Mês' },
              { key: 'lastMonth', label: 'Mês Passado' },
              { key: 'thisYear', label: 'Este Ano' },
              { key: 'all', label: 'Todo o Histórico' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => applyQuickRange(opt.key as 'thisMonth' | 'lastMonth' | 'thisYear' | 'all')}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            disabled={!canDownload || isGenerating}
            onClick={handleDownload}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}</span>
          </button>
        </div>
      </div>

      {/* On-screen Preview */}
      {!rangeValid ? null : reportType === 'full' && fullData ? (
        <FullReportPreview data={fullData} cards={cards} accounts={accounts} categories={categories} members={members} />
      ) : reportType === 'account' ? (
        accountData ? (
          <AccountPreview account={selectedAccount!} data={accountData} categories={categories} members={members} />
        ) : (
          <EmptyPanel message="Cadastre uma conta bancária para visualizar o extrato." />
        )
      ) : reportType === 'card' ? (
        cardData ? (
          <CardPreview card={selectedCard!} data={cardData} categories={categories} members={members} />
        ) : (
          <EmptyPanel message="Cadastre um cartão de crédito para visualizar a fatura." />
        )
      ) : null}
    </div>
  );
};

// ---------- Shared bits ----------

function SummaryCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative' | 'brand';
}) {
  const toneClasses: Record<string, string> = {
    default: 'text-white',
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
    brand: 'text-emerald-400',
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

const TransactionRow: React.FC<{
  tx: Transaction;
  categories: Category[];
  members: FamilyMember[];
  extraLabel?: string;
}> = ({ tx, categories, members, extraLabel }) => {
  const isIncome = tx.type === 'income';
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-slate-800/70 last:border-b-0 hover:bg-slate-800/30 transition-colors">
      <div className="flex items-center space-x-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}
        >
          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{tx.description}</p>
          <p className="text-[11px] text-slate-500 truncate">
            {formatDate(tx.date)} • {categoryName(categories, tx.categoryId)} • {memberName(members, tx.memberId)}
            {extraLabel ? ` • ${extraLabel}` : ''}
            {tx.installmentTotal ? ` • Parcela ${tx.installmentCurrent}/${tx.installmentTotal}` : ''}
          </p>
        </div>
      </div>
      <p className={`text-sm font-bold shrink-0 ml-3 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isIncome ? '+ ' : '- '}
        {formatCurrency(tx.amount)}
      </p>
    </div>
  );
};

// ---------- Account Preview ----------

function AccountPreview({
  account,
  data,
  categories,
  members,
}: {
  account: BankAccount;
  data: ReturnType<typeof computeAccountStatement>;
  categories: Category[];
  members: FamilyMember[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>{account.bankName} • {account.name}</span>
        <span>Saldo Atual Hoje: <strong className="text-emerald-400 font-bold">{formatCurrency(data.currentBalance)}</strong></span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Saldo Anterior (Inicial)" value={formatCurrency(data.openingBalance)} tone={data.openingBalance >= 0 ? 'default' : 'negative'} />
        <SummaryCard label="Entradas no Período" value={formatCurrency(data.income)} tone="positive" />
        <SummaryCard label="Saídas no Período" value={formatCurrency(data.expense)} tone="negative" />
        <SummaryCard
          label="Saldo Final (Período)"
          value={formatCurrency(data.closingBalance)}
          tone={data.closingBalance >= 0 ? 'brand' : 'negative'}
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Extrato Detalhado de Movimentações</h3>
          <span className="text-xs text-slate-500">{data.transactionsWithBalance.length} lançamento(s)</span>
        </div>
        {data.transactionsWithBalance.length === 0 ? (
          <EmptyPanel message="Nenhuma movimentação encontrada nesta conta para o período selecionado." />
        ) : (
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/70">
            {data.transactionsWithBalance.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 px-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{tx.description}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {formatDate(tx.date)} • {categoryName(categories, tx.categoryId)} • {memberName(members, tx.memberId)}
                        {tx.installmentTotal ? ` • Parcela ${tx.installmentCurrent}/${tx.installmentTotal}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isIncome ? '+ ' : '- '}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Saldo: <span className="font-semibold text-slate-200">{formatCurrency(tx.runningBalance)}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Card Preview ----------

function CardPreview({
  card,
  data,
  categories,
  members,
}: {
  card: CreditCard;
  data: ReturnType<typeof computeCardStatement>;
  categories: Category[];
  members: FamilyMember[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Limite Total" value={formatCurrency(card.totalLimit)} />
        <SummaryCard label="Total no Período" value={formatCurrency(data.total)} tone="negative" />
        <SummaryCard label="Faturas no Período" value={`${data.invoiceGroups.length}`} />
        <SummaryCard label="Faturas Já Pagas" value={`${data.paidCount} de ${data.invoiceGroups.length}`} tone="brand" />
      </div>

      {data.invoiceGroups.length === 0 ? (
        <EmptyPanel message="Nenhuma compra encontrada neste cartão para o período selecionado." />
      ) : (
        data.invoiceGroups.map((group) => (
          <div key={group.monthYear} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Fatura {formatMonthYear(group.monthYear)}</h3>
                <p className="text-xs text-slate-500">Subtotal: {formatCurrency(group.total)}</p>
              </div>
              <span
                className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  group.isPaid
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {group.isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                <span>{group.isPaid ? 'PAGA' : 'EM ABERTO'}</span>
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {group.transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} categories={categories} members={members} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ---------- Full Report Preview ----------

function FullReportPreview({
  data,
  cards,
  accounts,
  categories,
  members,
}: {
  data: ReturnType<typeof computeFullReport>;
  cards: CreditCard[];
  accounts: BankAccount[];
  categories: Category[];
  members: FamilyMember[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Saldo em Contas" value={formatCurrency(data.totalAccountBalance)} tone="brand" />
        <SummaryCard label="Receitas no Período" value={formatCurrency(data.income)} tone="positive" />
        <SummaryCard label="Despesas no Período" value={formatCurrency(data.expense)} tone="negative" />
        <SummaryCard
          label="Saldo do Período"
          value={formatCurrency(data.net)}
          tone={data.net >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Accounts table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Contas Bancárias</h3>
          </div>
          <div className="divide-y divide-slate-800/70">
            {data.accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm text-white">{a.name}</p>
                  <p className="text-[11px] text-slate-500">{a.bankName}</p>
                </div>
                <p className="text-sm font-bold text-emerald-400">{formatCurrency(a.balance)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cards table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Cartões de Crédito</h3>
          </div>
          <div className="divide-y divide-slate-800/70">
            {data.cardRows.map((row) => (
              <div key={row.card.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm text-white">{row.card.name}</p>
                  <p className="text-[11px] text-slate-500">{row.card.bankName} • Limite {formatCurrency(row.card.totalLimit)}</p>
                </div>
                <p className="text-sm font-bold text-rose-400">{formatCurrency(row.total)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Despesas por Categoria</h3>
        </div>
        {data.categoryRows.length === 0 ? (
          <EmptyPanel message="Nenhuma despesa registrada no período." />
        ) : (
          <div className="p-4 space-y-3">
            {data.categoryRows.map((row) => (
              <div key={row.categoryId}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">{row.name}</span>
                  <span className="text-slate-400">
                    {formatCurrency(row.total)} ({row.percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{ width: `${Math.min(100, row.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All transactions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Todas as Transações do Período</h3>
          <span className="text-xs text-slate-500">{data.transactions.length} lançamento(s)</span>
        </div>
        {data.transactions.length === 0 ? (
          <EmptyPanel message="Nenhuma transação encontrada no período selecionado." />
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {data.transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                categories={categories}
                members={members}
                extraLabel={
                  tx.paymentMethod === 'account' ? accountName(accounts, tx.bankAccountId) : cardName(cards, tx.creditCardId)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
