import React, { useState } from 'react';
import { Wallet, AlertTriangle, Plus, CheckCircle2, Edit3, Trash2, X } from 'lucide-react';
import { Category, Transaction } from '../types';
import { formatCurrency, getCurrentMonthYear } from '../utils/finance';

interface CategoriesAndBudgetsProps {
  categories: Category[];
  transactions: Transaction[];
  onUpdateCategoryBudget: (categoryId: string, newBudget: number) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (categoryId: string) => void;
}

export const CategoriesAndBudgets: React.FC<CategoriesAndBudgetsProps> = ({
  categories,
  transactions,
  onUpdateCategoryBudget,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const currentMonthYear = getCurrentMonthYear();

  // Calculate total spent per category in current month
  const categorySpentMap: Record<string, number> = {};

  transactions
    .filter((t) => t.type === 'expense' && !t.isTransfer && t.date.startsWith(currentMonthYear))
    .forEach((t) => {
      categorySpentMap[t.categoryId] = (categorySpentMap[t.categoryId] || 0) + t.amount;
    });

  // Modal editing budget
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');

  // Modal full category edit
  const [editingFullCategory, setEditingFullCategory] = useState<Category | null>(null);

  // Modal new category
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('1000');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setBudgetInput(String(cat.budgetLimit || 1000));
  };

  const handleStartFullEdit = (cat: Category) => {
    setEditingFullCategory({ ...cat });
  };

  const handleSaveFullCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFullCategory || !editingFullCategory.name) return;
    if (onEditCategory) {
      onEditCategory(editingFullCategory);
    }
    setEditingFullCategory(null);
  };

  const handleSaveBudget = (catId: string) => {
    const val = parseFloat(budgetInput) || 0;
    onUpdateCategoryBudget(catId, val);
    setEditingCatId(null);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    onAddCategory({
      name: newCatName,
      icon: 'Tag',
      color: newCatColor,
      type: 'expense',
      budgetLimit: parseFloat(newCatBudget) || 1000,
    });

    setIsNewCatModalOpen(false);
    setNewCatName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <span>Categorias & Metas de Orçamento</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Defina limites de gastos por categoria e receba alertas para manter as finanças da família sob controle
          </p>
        </div>

        <button
          onClick={() => setIsNewCatModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-md hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const spent = categorySpentMap[cat.id] || 0;
          const limit = cat.budgetLimit || 0;
          const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

          const isOver = limit > 0 && spent > limit;
          const isWarning = limit > 0 && percent >= 80 && !isOver;

          return (
            <div
              key={cat.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden"
            >
              {/* Top Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    ●
                  </div>
                  <span className="font-bold text-white text-base">{cat.name}</span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleStartFullEdit(cat)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center space-x-1"
                    title="Editar Categoria"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  {onDeleteCategory && (
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors text-xs"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress & Amounts */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <p className="text-slate-400">Gasto no Mês:</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(spent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400">Teto Estipulado:</p>
                    <p className="text-sm font-semibold text-slate-300">
                      {limit > 0 ? formatCurrency(limit) : 'Sem limite'}
                    </p>
                  </div>
                </div>

                {limit > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{percent}% utilizado</span>
                      {isOver ? (
                        <span className="text-rose-400 font-bold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Excedido em {formatCurrency(spent - limit)}</span>
                        </span>
                      ) : isWarning ? (
                        <span className="text-amber-400 font-semibold">⚠️ Perto do limite</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">✓ Dentro da meta</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {editingCatId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Editar Meta de Orçamento</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Limite Mensal em R$
              </label>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingCatId(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveBudget(editingCatId)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs"
              >
                Salvar Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {isNewCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCategory}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Nova Categoria</h3>
              <button type="button" onClick={() => setIsNewCatModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Categoria</label>
              <input
                type="text"
                required
                placeholder="Ex: Pets, Assinaturas, Viagens"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Meta de Orçamento (R$)</label>
              <input
                type="number"
                value={newCatBudget}
                onChange={(e) => setNewCatBudget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-bold"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewCatModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Criar Categoria
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Full Category Modal */}
      {editingFullCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveFullCategory}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Editar Categoria</span>
              </h3>
              <button type="button" onClick={() => setEditingFullCategory(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Categoria</label>
              <input
                type="text"
                required
                value={editingFullCategory.name}
                onChange={(e) => setEditingFullCategory({ ...editingFullCategory, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Meta de Orçamento (R$)</label>
              <input
                type="number"
                value={editingFullCategory.budgetLimit || 0}
                onChange={(e) => setEditingFullCategory({ ...editingFullCategory, budgetLimit: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cor</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={editingFullCategory.color || '#3b82f6'}
                  onChange={(e) => setEditingFullCategory({ ...editingFullCategory, color: e.target.value })}
                  className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border border-slate-700 p-0.5"
                />
                <span className="text-xs font-mono text-slate-300">{editingFullCategory.color}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingFullCategory(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Salvar Categoria
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
