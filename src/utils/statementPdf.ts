import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Transaction,
  BankAccount,
  CreditCard,
  Category,
  FamilyMember,
} from '../types';
import { formatCurrency, formatDate, formatMonthYear } from './finance';
import {
  StatementRange,
  categoryName,
  memberName,
  accountName,
  cardName,
  computeAccountStatement,
  computeCardStatement,
  computeFullReport,
  AccountTransactionWithBalance,
} from './statementData';

// ---------- Shared PDF drawing helpers ----------

const BRAND_COLOR: [number, number, number] = [16, 185, 129]; // emerald-500
const DARK_COLOR: [number, number, number] = [15, 23, 42]; // slate-900
const MUTED_COLOR: [number, number, number] = [100, 116, 139]; // slate-500
const POSITIVE_COLOR: [number, number, number] = [16, 150, 90];
const NEGATIVE_COLOR: [number, number, number] = [190, 40, 55];
const WARN_COLOR: [number, number, number] = [190, 130, 20];

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

function getLastAutoTableY(doc: jsPDF): number {
  return (doc as JsPDFWithAutoTable).lastAutoTable.finalY;
}

function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...DARK_COLOR);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFillColor(...BRAND_COLOR);
  doc.roundedRect(14, 8, 16, 16, 3, 3, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('S', 22, 18, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Siluar', 36, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 220);
  doc.text('Gestão Financeira Familiar', 36, 21);

  doc.setFontSize(9);
  doc.setTextColor(150, 165, 180);
  const generatedAt = new Date().toLocaleString('pt-BR');
  doc.text(`Gerado em ${generatedAt}`, pageWidth - 14, 15, { align: 'right' });

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED_COLOR);
  doc.text(subtitle, 14, 48);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 52, pageWidth - 14, 52);
}

function drawFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.text('Siluar - Documento gerado automaticamente para uso pessoal', 14, pageHeight - 10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }
}

function summaryBlock(
  doc: jsPDF,
  y: number,
  items: { label: string; value: string; color?: [number, number, number] }[]
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - 28;
  const boxWidth = usableWidth / items.length - 4;
  let x = 14;

  items.forEach((item) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, boxWidth, 20, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label.toUpperCase(), x + 4, y + 7);

    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    const color: [number, number, number] = item.color || DARK_COLOR;
    doc.setTextColor(...color);
    doc.text(item.value, x + 4, y + 15.5);

    x += boxWidth + 4;
  });

  return y + 20 + 8;
}

function transactionsTable(
  doc: jsPDF,
  startY: number,
  rows: Transaction[],
  categories: Category[],
  members: FamilyMember[],
  extraColumn?: { header: string; getValue: (t: Transaction) => string }
) {
  const head = [
    ['Data', 'Descrição', 'Categoria', 'Membro', ...(extraColumn ? [extraColumn.header] : []), 'Valor'],
  ];

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));

  const body = sorted.map((t) => [
    formatDate(t.date),
    t.description,
    categoryName(categories, t.categoryId),
    memberName(members, t.memberId),
    ...(extraColumn ? [extraColumn.getValue(t)] : []),
    (t.type === 'income' ? '+ ' : '- ') + formatCurrency(t.amount),
  ]);

  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'striped',
    headStyles: { fillColor: DARK_COLOR, textColor: 255, fontSize: 8.5, halign: 'left' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      [head[0].length - 1]: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === head[0].length - 1) {
        const tx = sorted[data.row.index];
        if (tx) {
          data.cell.styles.textColor = tx.type === 'income' ? POSITIVE_COLOR : NEGATIVE_COLOR;
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  return getLastAutoTableY(doc);
}

function emptyState(doc: jsPDF, y: number, message: string) {
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont('helvetica', 'italic');
  doc.text(message, 14, y + 10);
  return y + 20;
}

function periodLabel(range: StatementRange): string {
  return `Período: ${formatDate(range.start)} a ${formatDate(range.end)}`;
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, '_');
}

function accountTransactionsTable(
  doc: jsPDF,
  startY: number,
  rows: AccountTransactionWithBalance[],
  categories: Category[],
  members: FamilyMember[]
) {
  const head = [['Data', 'Descrição', 'Categoria', 'Membro', 'Valor', 'Saldo Apurado']];

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));

  const body = sorted.map((t) => [
    formatDate(t.date),
    t.description,
    categoryName(categories, t.categoryId),
    memberName(members, t.memberId),
    (t.type === 'income' ? '+ ' : '- ') + formatCurrency(t.amount),
    formatCurrency(t.runningBalance),
  ]);

  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'striped',
    headStyles: { fillColor: DARK_COLOR, textColor: 255, fontSize: 8.5, halign: 'left' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const tx = sorted[data.row.index];
        if (tx) {
          data.cell.styles.textColor = tx.type === 'income' ? POSITIVE_COLOR : NEGATIVE_COLOR;
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  return getLastAutoTableY(doc);
}

// ---------- 1. Extrato de Conta Bancária ----------

export function generateAccountStatement(
  account: BankAccount,
  transactions: Transaction[],
  categories: Category[],
  members: FamilyMember[],
  range: StatementRange
) {
  const data = computeAccountStatement(account, transactions, range);
  const doc = new jsPDF();
  drawHeader(doc, `Extrato - ${account.name}`, `${account.bankName} • ${periodLabel(range)}`);

  let y = summaryBlock(doc, 58, [
    { label: 'Saldo Anterior', value: formatCurrency(data.openingBalance), color: data.openingBalance >= 0 ? DARK_COLOR : NEGATIVE_COLOR },
    { label: 'Entradas', value: formatCurrency(data.income), color: POSITIVE_COLOR },
    { label: 'Saídas', value: formatCurrency(data.expense), color: NEGATIVE_COLOR },
    { label: 'Saldo Final', value: formatCurrency(data.closingBalance), color: data.closingBalance >= 0 ? BRAND_COLOR : NEGATIVE_COLOR },
  ]);

  if (data.transactionsWithBalance.length === 0) {
    emptyState(doc, y, 'Nenhuma movimentação encontrada nesta conta para o período selecionado.');
  } else {
    accountTransactionsTable(doc, y, data.transactionsWithBalance, categories, members);
  }

  drawFooter(doc);
  doc.save(`Siluar_Extrato_${sanitize(account.name)}_${range.start}_a_${range.end}.pdf`);
}

// ---------- 2. Extrato de Fatura de Cartão ----------

export function generateCardStatement(
  card: CreditCard,
  transactions: Transaction[],
  categories: Category[],
  members: FamilyMember[],
  paidInvoices: Record<string, boolean>,
  range: StatementRange
) {
  const data = computeCardStatement(card, transactions, paidInvoices, range);
  const doc = new jsPDF();
  drawHeader(doc, `Fatura - ${card.name}`, `${card.bankName} • Final ${card.lastFourDigits} • ${periodLabel(range)}`);

  let y = summaryBlock(doc, 58, [
    { label: 'Limite Total', value: formatCurrency(card.totalLimit), color: DARK_COLOR },
    { label: 'Total no Período', value: formatCurrency(data.total), color: NEGATIVE_COLOR },
    { label: 'Faturas no Período', value: `${data.invoiceGroups.length}`, color: DARK_COLOR },
    { label: 'Faturas Já Pagas', value: `${data.paidCount} de ${data.invoiceGroups.length}`, color: BRAND_COLOR },
  ]);

  if (data.invoiceGroups.length === 0) {
    emptyState(doc, y, 'Nenhuma compra encontrada neste cartão para o período selecionado.');
  } else {
    data.invoiceGroups.forEach((group) => {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK_COLOR);
      doc.text(`Fatura ${formatMonthYear(group.monthYear)}`, 14, y + 6);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const statusColor: [number, number, number] = group.isPaid ? BRAND_COLOR : WARN_COLOR;
      doc.setTextColor(...statusColor);
      doc.text(group.isPaid ? 'PAGA' : 'EM ABERTO', doc.internal.pageSize.getWidth() - 14, y + 6, { align: 'right' });

      doc.setFontSize(9);
      doc.setTextColor(...MUTED_COLOR);
      doc.text(`Subtotal: ${formatCurrency(group.total)}`, 14, y + 11);

      y = transactionsTable(doc, y + 14, group.transactions, categories, members, {
        header: 'Parcela',
        getValue: (t) => (t.installmentTotal ? `${t.installmentCurrent}/${t.installmentTotal}` : '-'),
      });
      y += 8;
    });
  }

  drawFooter(doc);
  doc.save(`Siluar_Fatura_${sanitize(card.name)}_${range.start}_a_${range.end}.pdf`);
}

// ---------- 3. Relatório Completo ----------

export function generateFullReport(
  accounts: BankAccount[],
  cards: CreditCard[],
  transactions: Transaction[],
  categories: Category[],
  members: FamilyMember[],
  paidInvoices: Record<string, boolean>,
  range: StatementRange
) {
  const data = computeFullReport(accounts, cards, transactions, categories, range);
  const doc = new jsPDF();
  drawHeader(doc, 'Relatório Financeiro Completo', periodLabel(range));

  let y = summaryBlock(doc, 58, [
    { label: 'Saldo em Contas', value: formatCurrency(data.totalAccountBalance), color: BRAND_COLOR },
    { label: 'Receitas no Período', value: formatCurrency(data.income), color: POSITIVE_COLOR },
    { label: 'Despesas no Período', value: formatCurrency(data.expense), color: NEGATIVE_COLOR },
    { label: 'Saldo do Período', value: formatCurrency(data.net), color: data.net >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR },
  ]);

  // --- Section: Contas Bancárias ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text('Contas Bancárias', 14, y + 6);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Conta', 'Banco', 'Tipo', 'Saldo Atual']],
    body: accounts.map((a) => [
      a.name,
      a.bankName,
      a.type === 'checking' ? 'Corrente' : a.type === 'savings' ? 'Poupança' : 'Investimento',
      formatCurrency(a.balance),
    ]),
    theme: 'striped',
    headStyles: { fillColor: DARK_COLOR, textColor: 255, fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });
  y = getLastAutoTableY(doc) + 12;

  // --- Section: Cartões de Crédito ---
  if (y > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text('Cartões de Crédito', 14, y + 6);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Cartão', 'Banco', 'Limite Total', 'Gasto no Período']],
    body: data.cardRows.map((row) => [row.card.name, row.card.bankName, formatCurrency(row.card.totalLimit), formatCurrency(row.total)]),
    theme: 'striped',
    headStyles: { fillColor: DARK_COLOR, textColor: 255, fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });
  y = getLastAutoTableY(doc) + 12;

  // --- Section: Despesas por Categoria ---
  if (y > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text('Despesas por Categoria', 14, y + 6);
  y += 10;

  if (data.categoryRows.length === 0) {
    y = emptyState(doc, y, 'Nenhuma despesa registrada no período.');
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Categoria', 'Total Gasto', '% do Total']],
      body: data.categoryRows.map((row) => [row.name, formatCurrency(row.total), `${row.percent.toFixed(1)}%`]),
      theme: 'striped',
      headStyles: { fillColor: DARK_COLOR, textColor: 255, fontSize: 8.5 },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
    y = getLastAutoTableY(doc) + 12;
  }

  // --- Section: Todas as Transações ---
  doc.addPage();
  y = 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text('Todas as Transações do Período', 14, y + 6);
  y += 10;

  if (data.transactions.length === 0) {
    emptyState(doc, y, 'Nenhuma transação encontrada no período selecionado.');
  } else {
    transactionsTable(doc, y, data.transactions, categories, members, {
      header: 'Origem',
      getValue: (t) =>
        t.paymentMethod === 'account' ? accountName(accounts, t.bankAccountId) : cardName(cards, t.creditCardId),
    });
  }

  drawFooter(doc);
  doc.save(`Siluar_Relatorio_Completo_${range.start}_a_${range.end}.pdf`);
}
