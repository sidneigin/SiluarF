import React, { useState } from 'react';
import { Users, Building2, Plus, ArrowRightLeft, Wallet, ShieldCheck, X, Edit3, Trash2 } from 'lucide-react';
import { FamilyMember, BankAccount, Transaction } from '../types';
import { formatCurrency } from '../utils/finance';

interface FamilyMembersAndAccountsProps {
  members: FamilyMember[];
  accounts: BankAccount[];
  transactions: Transaction[];
  onAddMember: (member: Omit<FamilyMember, 'id'>) => void;
  onEditMember?: (member: FamilyMember) => void;
  onDeleteMember?: (memberId: string) => void;
  onAddAccount: (account: Omit<BankAccount, 'id'>) => void;
  onEditAccount?: (account: BankAccount) => void;
  onDeleteAccount?: (accountId: string) => void;
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number) => void;
}

export const FamilyMembersAndAccounts: React.FC<FamilyMembersAndAccountsProps> = ({
  members,
  accounts,
  transactions,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onTransfer,
}) => {
  // Transfer modal state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAccId, setFromAccId] = useState(accounts[0]?.id || '');
  const [toAccId, setToAccId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');

  // New member modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberAvatar, setMemberAvatar] = useState('👨‍👩‍👧');

  // New account modal state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accName, setAccName] = useState('');
  const [accBank, setAccBank] = useState('');
  const [accBalance, setAccBalance] = useState('5000');
  const [accType, setAccType] = useState<'checking' | 'savings' | 'investment'>('checking');

  // Edit Account state
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Edit Member state
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editingAccount.name) return;
    if (onEditAccount) {
      onEditAccount(editingAccount);
    }
    setEditingAccount(null);
  };

  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.name) return;
    if (onEditMember) {
      onEditMember(editingMember);
    }
    setEditingMember(null);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(transferAmount) || 0;
    if (val <= 0 || fromAccId === toAccId) return;

    onTransfer(fromAccId, toAccId, val);
    setIsTransferOpen(false);
    setTransferAmount('');
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName) return;

    onAddMember({
      name: memberName,
      avatar: memberAvatar,
      role: 'member',
      color: 'bg-emerald-600',
    });

    setIsMemberModalOpen(false);
    setMemberName('');
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName) return;

    onAddAccount({
      name: accName,
      bankName: accBank || 'Banco',
      type: accType,
      balance: parseFloat(accBalance) || 0,
      color: 'from-slate-700 to-slate-900',
    });

    setIsAccountModalOpen(false);
    setAccName('');
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: Bank Accounts */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-emerald-400" />
              <span>Contas Bancárias da Família</span>
            </h2>
            <p className="text-slate-400 text-sm">
              Saldos disponíveis em contas correntes, poupanças e reservas de emergência
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsTransferOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center space-x-2 transition-all"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>Transferir Entre Contas</span>
            </button>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nova Conta</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${acc.color} opacity-20 rounded-bl-full pointer-events-none`} />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium uppercase">{acc.bankName}</span>
                  <h3 className="font-bold text-white text-base">{acc.name}</h3>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setEditingAccount({ ...acc })}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Editar conta"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteAccount && (
                    <button
                      onClick={() => onDeleteAccount(acc.id)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                      title="Excluir conta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-semibold uppercase">
                    {acc.type === 'checking' ? 'Corrente' : acc.type === 'savings' ? 'Poupança' : 'Investimento'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Saldo em Conta</p>
                <p className="text-2xl font-extrabold text-emerald-400">{formatCurrency(acc.balance)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Family Members */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <Users className="w-6 h-6 text-emerald-400" />
              <span>Integrantes da Família</span>
            </h2>
            <p className="text-slate-400 text-sm">
              Perfis de conta conjunta para cada membro lançar suas receitas e despesas
            </p>
          </div>

          <button
            onClick={() => setIsMemberModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Membro</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {members.map((m) => {
            const memberSpent = transactions
              .filter((t) => t.type === 'expense' && t.memberId === m.id)
              .reduce((acc, t) => acc + t.amount, 0);

            const memberEarned = transactions
              .filter((t) => t.type === 'income' && t.memberId === m.id)
              .reduce((acc, t) => acc + t.amount, 0);

            return (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                      {m.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{m.name}</h3>
                      <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{m.role === 'admin' ? 'Administrador' : 'Membro'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setEditingMember({ ...m })}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Editar Membro"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {onDeleteMember && (
                      <button
                        onClick={() => onDeleteMember(m.id)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        title="Excluir Membro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Entradas:</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(memberEarned)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Saídas:</span>
                    <span className="font-bold text-rose-400">{formatCurrency(memberSpent)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transfer Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleTransferSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                <span>Transferência Entre Contas</span>
              </h3>
              <button type="button" onClick={() => setIsTransferOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Origem (Sairá de):</label>
              <select
                value={fromAccId}
                onChange={(e) => setFromAccId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Saldo: {formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Destino (Entrará em):</label>
              <select
                value={toAccId}
                onChange={(e) => setToAccId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Saldo: {formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Valor da Transferência (R$)</label>
              <input
                type="number"
                required
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Efetuar Transferência
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleMemberSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Adicionar Novo Integrante</h3>
              <button type="button" onClick={() => setIsMemberModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome</label>
              <input
                type="text"
                required
                placeholder="Ex: Beatriz, Thiago, Vovó"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Avatar Emoji</label>
              <select
                value={memberAvatar}
                onChange={(e) => setMemberAvatar(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="👩‍💼">👩‍💼 Mãe / Profissional</option>
                <option value="👨‍💼">👨‍💼 Pai / Profissional</option>
                <option value="👦">👦 Filho</option>
                <option value="👧">👧 Filha</option>
                <option value="👵">👵 Avó / Avô</option>
                <option value="🐶">🐶 Pet da Família</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Adicionar Integrante
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAccountSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Cadastrar Nova Conta Bancária</h3>
              <button type="button" onClick={() => setIsAccountModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Conta</label>
              <input
                type="text"
                required
                placeholder="Ex: Santander Principal, XP Investimentos"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Instituição / Banco</label>
              <input
                type="text"
                placeholder="Ex: Santander, Banco do Brasil"
                value={accBank}
                onChange={(e) => setAccBank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Saldo Inicial (R$)</label>
              <input
                type="number"
                required
                value={accBalance}
                onChange={(e) => setAccBalance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-bold"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Salvar Conta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditAccount}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Editar Conta Bancária</span>
              </h3>
              <button type="button" onClick={() => setEditingAccount(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Conta</label>
              <input
                type="text"
                required
                value={editingAccount.name}
                onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Instituição / Banco</label>
              <input
                type="text"
                value={editingAccount.bankName}
                onChange={(e) => setEditingAccount({ ...editingAccount, bankName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Conta</label>
              <select
                value={editingAccount.type}
                onChange={(e) =>
                  setEditingAccount({
                    ...editingAccount,
                    type: e.target.value as BankAccount['type'],
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="checking">Corrente</option>
                <option value="savings">Poupança</option>
                <option value="investment">Investimento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Saldo Atual (R$)</label>
              <input
                type="number"
                required
                value={editingAccount.balance}
                onChange={(e) => setEditingAccount({ ...editingAccount, balance: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm font-bold"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditMember}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Editar Membro da Família</span>
              </h3>
              <button type="button" onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Integrante</label>
              <input
                type="text"
                required
                value={editingMember.name}
                onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Avatar Emoji</label>
              <select
                value={editingMember.avatar}
                onChange={(e) => setEditingMember({ ...editingMember, avatar: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="👩‍💼">👩‍💼 Mãe / Profissional</option>
                <option value="👨‍💼">👨‍💼 Pai / Profissional</option>
                <option value="👦">👦 Filho</option>
                <option value="👧">👧 Filha</option>
                <option value="👵">👵 Avó / Avô</option>
                <option value="🐶">🐶 Pet da Família</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Função / Papel</label>
              <select
                value={editingMember.role}
                onChange={(e) =>
                  setEditingMember({
                    ...editingMember,
                    role: e.target.value as FamilyMember['role'],
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              >
                <option value="admin">Administrador</option>
                <option value="member">Membro</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
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
