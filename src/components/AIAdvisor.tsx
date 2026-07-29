import React, { useState } from 'react';
import { Sparkles, Send, Lightbulb, AlertTriangle, CheckCircle2, Bot, ShieldAlert } from 'lucide-react';
import { CreditCard, Transaction, Category, BankAccount, FamilyMember } from '../types';
import { formatCurrency, getCurrentMonthYear, getInvoiceMonthYearForDate, toLocalDateString } from '../utils/finance';

interface AIAdvisorProps {
  cards: CreditCard[];
  transactions: Transaction[];
  categories: Category[];
  accounts: BankAccount[];
  members: FamilyMember[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({
  cards,
  transactions,
  categories,
  accounts,
  members,
}) => {
  const currentMonthYear = getCurrentMonthYear();
  const todayStr = toLocalDateString();

  // Dynamic Heuristic Financial Diagnostics
  const totalBalance = accounts.reduce((a, b) => a + b.balance, 0);

  // Current month income vs expense
  const monthlyIncomes = transactions
    .filter(t => t.type === 'income' && !t.isTransfer && t.date.startsWith(currentMonthYear))
    .reduce((a, b) => a + b.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && !t.isTransfer && t.date.startsWith(currentMonthYear))
    .reduce((a, b) => a + b.amount, 0);

  const savingsRate = monthlyIncomes > 0 
    ? Math.round(((monthlyIncomes - monthlyExpenses) / monthlyIncomes) * 100)
    : 0;

  // Find cards near closing date
  const closingTips = cards.map(c => {
    const targetInvoice = getInvoiceMonthYearForDate(todayStr, c.closingDay);
    const dayOfMonth = new Date().getDate();
    const daysUntilClosing = c.closingDay - dayOfMonth;

    let tipText = '';
    if (daysUntilClosing > 0 && daysUntilClosing <= 5) {
      tipText = `O cartão ${c.name} fecha em ${daysUntilClosing} dias (dia ${c.closingDay}). Espere ${daysUntilClosing + 1} dias para realizar novas compras grandes para pagá-las somente no mês que vem!`;
    } else if (dayOfMonth === c.closingDay) {
      tipText = `Hoje é o dia de fechamento do cartão ${c.name}! Compras a partir de amanhã entrarão na fatura de ${targetInvoice}.`;
    } else {
      tipText = `O cartão ${c.name} tem fechamento todo dia ${c.closingDay}. A melhor data de compra é no dia seguinte ao fechamento.`;
    }

    return { card: c, tipText };
  });

  // Chat conversation
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Olá! Sou seu Assistente Financeiro Familiar. Analisei os dados da sua família este mês:\n\n• Saldo Total em Contas: ${formatCurrency(totalBalance)}\n• Receita Mensal: ${formatCurrency(monthlyIncomes)}\n• Taxa de Poupança Prevista: ${savingsRate}%\n\nComo posso ajudar vocês a economizar ou organizar as faturas dos cartões de crédito hoje?`,
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputQuery('');
    setIsGenerating(true);

    // Smart simulated AI response generator tailored to family finance context
    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('fatura') || lower.includes('cartao') || lower.includes('cartão')) {
        reply = `Para otimizar suas faturas:\n1. Acompanhe a "Melhor Data de Compra" (o dia logo após o fechamento do cartão). Comprando no dia ${cards[0]?.closingDay + 1 || 6}, você ganha até 40 dias para pagar sem juros.\n2. Para compras grandes, use parcelamento sem juros apenas em itens duráveis (eletrônicos, eletrodomésticos), evitando parcelar compras de mercado ou consumo diário.`;
      } else if (lower.includes('economizar') || lower.includes('guardar') || lower.includes('investir')) {
        reply = `Com base nas suas receitas do mês (${formatCurrency(monthlyIncomes)}):\n• Recomendamos destinar 50% para Essenciais (Moradia, Mercado, Escola).\n• 30% para Estilo de Vida (Lazer, Restaurantes, Vestuário).\n• 20% (${formatCurrency(monthlyIncomes * 0.2)}) diretamente para a Reserva de Emergência da família.`;
      } else if (lower.includes('parcela') || lower.includes('parcelamento')) {
        reply = `Ao simular parcelamentos na aba de Transações, o Siluar calcula automaticamente as faturas futuras. Atualmente vocês possuem parcelas compromissadas nos próximos meses. Tente manter o total de parcelas acumuladas abaixo de 30% da renda mensal familiar.`;
      } else {
        reply = `Excelente pergunta! Olhando o balanço atual da família (Saldo: ${formatCurrency(totalBalance)}), vocês estão com um planejamento sólido. Para manter a saúde financeira, recomendamos pagar sempre o valor total da fatura até o dia do vencimento para evitar os juros do rotativo.`;
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Assistente de Inteligência Financeira</h2>
            <p className="text-xs text-slate-400">
              Diagnósticos automatizados, dicas de fechamento de faturas e consultoria para o orçamento da família
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Financial Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insight 1: Savings Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-semibold tracking-wider">Capacidade de Poupança</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{savingsRate}% da renda</p>
          <p className="text-xs text-slate-400">
            {savingsRate >= 20
              ? '🎉 Parabéns! Sua família está conseguindo guardar mais de 20% das receitas este mês.'
              : '⚠️ Dica: Tente reduzir pequenos gastos supérfluos para atingir ao menos 20% de reserva.'}
          </p>
        </div>

        {/* Insight 2: Card Closing Best Days */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-semibold tracking-wider">Melhor Data de Compra</span>
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-amber-300">
            {cards[0] ? `Cartão ${cards[0].name} (Dia ${cards[0].closingDay})` : 'Cartões de Crédito'}
          </p>
          <p className="text-xs text-slate-400">
            {closingTips[0]?.tipText || 'Faça compras logo após o fechamento da fatura.'}
          </p>
        </div>

        {/* Insight 3: Emergency Fund Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase font-semibold tracking-wider">Reserva Familiar</span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-slate-400">
            Saldo acumulado suficiente para cobrir aproximadamente {Math.max(1, Math.round(totalBalance / (monthlyExpenses || 5000)))} meses de despesas essenciais.
          </p>
        </div>
      </div>

      {/* Interactive AI Chat */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[450px]">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
          <Bot className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Conversa com o Consultor Financeiro IA</h3>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-emerald-500 text-slate-950 font-semibold rounded-br-none shadow'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-slate-950 text-slate-400 border border-slate-800 rounded-2xl p-3 text-xs flex items-center space-x-2">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Analisando suas faturas e orçamentos...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Form */}
        <form onSubmit={handleSend} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            placeholder="Pergunte algo sobre suas faturas, metas de economia ou compras parceladas..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isGenerating}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold p-2.5 rounded-xl transition-all"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
