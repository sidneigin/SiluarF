import React from 'react';
import { 
  Wallet, 
  CreditCard, 
  ListFilter, 
  PieChart, 
  Users, 
  Sparkles, 
  FileCode, 
  Plus, 
  RotateCcw,
  Download,
  Upload,
  Building2,
  FileText
} from 'lucide-react';
import { FamilyMember } from '../types';
import { formatCurrency } from '../utils/finance';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  members: FamilyMember[];
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  totalAccountBalance: number;
  totalOpenInvoices: number;
  onNewTransactionClick: () => void;
  onResetDataClick: () => void;
  onExportDataClick: () => void;
  onImportDataClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  members,
  selectedMemberId,
  setSelectedMemberId,
  totalAccountBalance,
  totalOpenInvoices,
  onNewTransactionClick,
  onResetDataClick,
  onExportDataClick,
  onImportDataClick,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: PieChart },
    { id: 'cards', label: 'Cartões & Faturas', icon: CreditCard },
    { id: 'transactions', label: 'Transações', icon: ListFilter },
    { id: 'budgets', label: 'Orçamentos', icon: Wallet },
    { id: 'family', label: 'Membros & Contas', icon: Users },
    { id: 'statements', label: 'Extratos', icon: FileText },
    { id: 'ai', label: 'Assistente IA', icon: Sparkles },
    { id: 'docs', label: 'Documentação PM', icon: FileCode },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Wallet className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Siluar</h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Gestão Familiar
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Finanças familiares de Sidnei, Luci Laura e Arthur
            </p>
          </div>
        </div>

        {/* Quick Balance Summary Badges */}
        <div className="flex items-center space-x-3 overflow-x-auto py-1">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Saldo em Contas</p>
              <p className="text-sm font-semibold text-emerald-400">{formatCurrency(totalAccountBalance)}</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Faturas Abertas</p>
              <p className="text-sm font-semibold text-amber-400">{formatCurrency(totalOpenInvoices)}</p>
            </div>
          </div>

          {/* New Transaction Button */}
          <button
            onClick={onNewTransactionClick}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      {/* Filter & Navigation Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 py-2">
          {/* Main Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Member Profile Filter & Data Controls */}
          <div className="flex items-center space-x-2 justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-slate-400 font-medium">Filtro:</span>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs font-medium rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">👨‍👩‍👧‍👦 Toda a Família</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar} {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
              <label
                title="Importar/Restaurar backup JSON local"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Importar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportDataClick}
                  className="hidden"
                />
              </label>
              <button
                onClick={onExportDataClick}
                title="Exportar backup dos dados em JSON"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
              <button
                onClick={onResetDataClick}
                title="Restaurar dados demonstrativos originais"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resetar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
