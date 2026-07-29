import React from 'react';
import { FileCode, Layers, Database, Calculator, Rocket, CheckCircle2, Copy } from 'lucide-react';

export const ArchitectureDocModal: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-200">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Especificação Técnica & Visão de Produto (PM & Senior Dev)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Documentação completa da arquitetura, modelagem de banco de dados, lógica de fechamento de faturas e plano de ação.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Arquitetura do Projeto */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-emerald-400" />
          <span>1. Arquitetura do Projeto</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400">Frontend / Interface (Client Web & Mobile)</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
              <li><strong>Framework:</strong> React 19 + TypeScript + Vite para renderização rápida e tipagem estrita.</li>
              <li><strong>Estilização:</strong> Tailwind CSS v4 para UI moderna e responsiva em telas de celular e desktop.</li>
              <li><strong>Animações & Gráficos:</strong> Motion + Recharts para dashboards financeiros interativos.</li>
              <li><strong>Ícones:</strong> Lucide React para iconografia limpa e acessível.</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400">Backend & Banco de Dados (Server Side)</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
              <li><strong>Servidor API:</strong> Node.js com Express para proxy seguro e rotas RESTful (/api/transactions, /api/invoices).</li>
              <li><strong>Banco de Dados:</strong> Firebase Firestore (NoSQL em tempo real) para sincronização multi-dispositivo da família, ou PostgreSQL com Drizzle ORM.</li>
              <li><strong>Autenticação:</strong> Firebase Auth (Google Login, Email/Senha e convites familiares por link).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 2: Estrutura de Dados (Modelagem) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Database className="w-5 h-5 text-emerald-400" />
          <span>2. Estrutura de Dados (Modelagem de Entidades & Relacionamentos)</span>
        </h3>

        <div className="space-y-4 text-xs font-mono">
          {/* Collection 1 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-emerald-400 font-bold text-sm block">1. Usuários / Família (Users / FamilyGroup)</span>
            <pre className="text-slate-300 whitespace-pre-wrap">
{`{
  id: string,               // "usr_123"
  familyGroupId: string,    // "fam_789" (Vincula a conta conjunta)
  name: string,             // "Sidnei"
  role: "admin" | "member", // Papel na família
  avatar: string,           // Emoji ou URL da foto
  createdAt: string
}`}
            </pre>
          </div>

          {/* Collection 2 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold text-sm block">2. Cartões de Crédito (CreditCards)</span>
            <pre className="text-slate-300 whitespace-pre-wrap">
{`{
  id: string,               // "card_nubank"
  familyGroupId: string,    // Relacionamento com a família
  name: string,             // "Nubank Roxinho"
  totalLimit: number,       // 12000.00
  closingDay: number,       // 5 (Dia do Fechamento)
  dueDay: number,           // 12 (Dia do Vencimento)
  lastFourDigits: string,   // "4821"
  brand: "visa" | "mastercard" | "elo" | "amex"
}`}
            </pre>
          </div>

          {/* Collection 3 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-rose-400 font-bold text-sm block">3. Transações / Lançamentos (Transactions)</span>
            <pre className="text-slate-300 whitespace-pre-wrap">
{`{
  id: string,               // "tx_999"
  familyGroupId: string,
  memberId: string,         // Quem realizou o gasto
  description: string,      // "Supermercado Carrefour"
  amount: number,           // 680.40
  type: "expense" | "income",
  date: string,             // "2026-07-12"
  categoryId: string,       // "cat_alimentacao"
  paymentMethod: "account" | "credit_card",
  bankAccountId?: string,   // Se pago à vista
  creditCardId?: string,    // Se pago no cartão
  invoiceMonthYear?: string,// "2026-08" (Mês da fatura alvo)
  installmentCurrent?: number, // Ex: 1
  installmentTotal?: number    // Ex: 10
}`}
            </pre>
          </div>

          {/* Collection 4 */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-teal-400 font-bold text-sm block">4. Faturas de Cartão (Invoices)</span>
            <pre className="text-slate-300 whitespace-pre-wrap">
{`{
  cardId: string,           // "card_nubank"
  monthYear: string,        // "2026-08"
  closingDate: string,      // "2026-08-05"
  dueDate: string,          // "2026-08-12"
  status: "open" | "closed" | "paid",
  totalAmount: number,      // Soma de todas as transações do mês
  paidFromAccountId?: string// Conta usada para liquidação
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* SECTION 3: Lógica de Fechamento */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <span>3. Lógica Algorítmica do Fechamento da Fatura</span>
        </h3>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed">
          <p className="text-sm font-semibold text-amber-300">
            Regra Fundamental: Comparação entre o Dia da Compra (D_compra) e o Dia de Fechamento do Cartão (D_fechamento)
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Caso 1: D_compra &lt; D_fechamento</strong> — A compra ocorre antes do fechamento do mês atual. A transação entra diretamente na fatura do <strong>mês vigente</strong>.
              <p className="text-slate-400 pl-4">Exemplo: Compra no dia 03/Agosto com fechamento no dia 05 &rarr; Fatura de Agosto/2026.</p>
            </li>
            <li>
              <strong>Caso 2: D_compra &ge; D_fechamento</strong> — A compra ocorreu no dia ou após o fechamento. Entrou no "Melhor Dia de Compra"! A transação entra na fatura do <strong>mês seguinte</strong>.
              <p className="text-slate-400 pl-4">Exemplo: Compra no dia 12/Julho com fechamento no dia 05 &rarr; Fatura de Agosto/2026.</p>
            </li>
            <li>
              <strong>Desmembramento de Parcelamento em N vezes:</strong> Se uma compra de R$ 1.000,00 for feita em 10x de R$ 100,00 no dia 12/Julho:
              <br />
              • Parcela 1/10 entra no mês M_0 (Agosto/2026)
              <br />
              • Parcela 2/10 entra no mês M_0 + 1 (Setembro/2026)
              <br />
              • ... Parcela 10/10 entra no mês M_0 + 9 (Maio/2027)
            </li>
          </ul>
        </div>
      </div>

      {/* SECTION 4: Plano de Ação */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Rocket className="w-5 h-5 text-emerald-400" />
          <span>4. Plano de Ação (Roadmap de Desenvolvimento)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase">Fase 1: MVP Frontend (Concluído)</span>
            <ul className="space-y-1 text-slate-300">
              <li>✓ Layout responsivo com Tailwind CSS</li>
              <li>✓ Algoritmo de cálculo de fatura & parcelamentos</li>
              <li>✓ Gestão de múltiplos cartões & contas bancárias</li>
              <li>✓ Gráficos de orçamento por categoria (Recharts)</li>
              <li>✓ Assistente financeiro de inteligência artificial</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded uppercase">Fase 2: Persistência Cloud & Push Notifications</span>
            <ul className="space-y-1 text-slate-300">
              <li>• Conexão com Firestore para sincronização ao vivo</li>
              <li>• Notificações de vencimento de fatura via WhatsApp / Email</li>
              <li>• Leitura automática de comprovantes Pix e faturas via OCR</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
