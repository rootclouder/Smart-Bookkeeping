"use client";
import { useState, useEffect } from 'react';
import { useStore, Account } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, CreditCard, Trash2, Edit3, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Assets() {
  const [mounted, setMounted] = useState(false);
  const { accounts, addAccount, updateAccount, deleteAccount } = useStore();
  const [activeTab, setActiveTab] = useState<'cash' | 'credit'>('cash');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({ type: 'cash', name: '', balance: 0 });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Account>>({});

  const totalCashAssets = accounts
    .filter(acc => acc.type === 'cash')
    .reduce((sum, acc) => sum + acc.balance, 0);
    
  const totalCreditAssets = accounts
    .filter(acc => acc.type === 'credit')
    .reduce((sum, acc) => sum + acc.balance, 0);
    
  const totalAssets = totalCashAssets - totalCreditAssets;

  const handleAddClick = () => {
    setNewAccount({ type: activeTab, name: '', balance: 0 });
    setIsAdding(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name) return;
    
    addAccount({
      name: newAccount.name,
      type: activeTab,
      balance: Number(newAccount.balance) || 0,
      repaymentDay: activeTab === 'credit' ? Number(newAccount.repaymentDay) : undefined,
      dueAmount: activeTab === 'credit' ? Number(newAccount.dueAmount) || 0 : undefined
    });
    setIsAdding(false);
    setNewAccount({ type: activeTab, name: '', balance: 0, repaymentDay: undefined, dueAmount: undefined });
  };

  const startEdit = (acc: Account) => {
    setEditingId(acc.id);
    setEditData({ name: acc.name, type: acc.type, balance: acc.balance, repaymentDay: acc.repaymentDay, dueAmount: acc.dueAmount });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editData.name) return;

    updateAccount(editingId, {
      name: editData.name,
      type: editData.type as 'cash' | 'credit',
      balance: Number(editData.balance) || 0,
      repaymentDay: editData.type === 'credit' ? Number(editData.repaymentDay) : undefined,
      dueAmount: editData.type === 'credit' ? Number(editData.dueAmount) || 0 : undefined
    });
    setEditingId(null);
    setEditData({});
  };

  if (!mounted) return <div className="p-8 text-center text-zinc-500">加载中...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">资产管理</h1>
          <p className="text-zinc-500">管理您的资产和透支账户</p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="text-sm font-medium text-zinc-500">总资产</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">¥{totalCashAssets.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-500">总透支</div>
            <div className="text-xl font-bold text-rose-500">¥{totalCreditAssets.toFixed(2)}</div>
          </div>
          <div className="pl-6 border-l border-zinc-200 dark:border-zinc-800">
            <div className="text-sm font-medium text-zinc-500">净资产</div>
            <div className={cn(
              "text-2xl font-black font-mono tracking-tight",
              totalAssets >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              ¥{totalAssets.toFixed(2)}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex space-x-2 p-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('cash')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-xl transition-all",
            activeTab === 'cash' 
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          资产账户
        </button>
        <button
          onClick={() => setActiveTab('credit')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-xl transition-all",
            activeTab === 'credit' 
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          )}
        >
          透支账户
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.filter(acc => acc.type === activeTab).map((acc, index) => {
          return (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-6 rounded-3xl shadow-sm border relative group flex flex-col justify-between overflow-hidden",
                acc.type === 'cash' 
                  ? "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800" 
                  : "bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-zinc-800"
              )}
            >
              {acc.type === 'credit' && (
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
              )}
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    acc.type === 'cash' 
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" 
                      : "bg-white/10 text-white backdrop-blur-sm"
                  )}>
                    {acc.type === 'cash' ? <Wallet className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button
                      onClick={() => startEdit(acc)}
                      className={cn(
                        "p-2 transition-colors rounded-xl",
                        acc.type === 'cash' ? "text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10" : "text-zinc-400 hover:text-white hover:bg-white/10"
                      )}
                      title="编辑账户"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAccount(acc.id)}
                      className={cn(
                        "p-2 transition-colors rounded-xl",
                        acc.type === 'cash' ? "text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" : "text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20"
                      )}
                      title="删除账户"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xl font-bold mb-2 tracking-tight">{acc.name}</div>
              </div>
              
              <div className="mt-4 relative z-10">
                {acc.type === 'credit' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-zinc-400 mb-1">已用额度</div>
                      <div className="text-2xl font-bold font-mono">¥{acc.balance.toFixed(2)}</div>
                    </div>
                    {acc.dueAmount !== undefined && acc.dueAmount > 0 && (
                      <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/5">
                        <div className="text-xs font-medium text-rose-300 mb-1">本期待还</div>
                        <div className="text-lg font-bold font-mono text-rose-400">¥{acc.dueAmount.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-medium text-zinc-500 mb-1">余额</div>
                    <div className="text-3xl font-black font-mono tracking-tight text-zinc-900 dark:text-zinc-100">¥{acc.balance.toFixed(2)}</div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}

        {!isAdding && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddClick}
            className="h-full min-h-[220px] bg-zinc-50 dark:bg-zinc-800/30 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-3xl flex flex-col items-center justify-center text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="font-medium">添加{activeTab === 'cash' ? '资产' : '透支'}账户</span>
          </motion.button>
        )}
      </div>

      {/* Adding Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onSubmit={handleAdd}
              className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md relative z-10 max-h-[90vh] flex flex-col"
            >
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">添加账户</h3>
              
              <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar -mx-2 px-2 pb-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">名称</label>
                  <input
                    type="text"
                    required
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                    placeholder={activeTab === 'cash' ? "例如：招商银行储蓄卡" : "例如：招商银行信用卡"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    {activeTab === 'credit' ? '已用额度' : '余额'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAccount.balance === 0 ? '' : newAccount.balance}
                    onChange={(e) => setNewAccount({ ...newAccount, balance: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                    placeholder="0.00"
                  />
                </div>
                {activeTab === 'credit' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">还款日 (每月几号)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={newAccount.repaymentDay || ''}
                        onChange={(e) => setNewAccount({ ...newAccount, repaymentDay: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                        placeholder="例如: 15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">待还金额 (¥)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newAccount.dueAmount === 0 ? '' : newAccount.dueAmount || ''}
                        onChange={(e) => setNewAccount({ ...newAccount, dueAmount: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                        placeholder="本期需还款金额"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold transition-all shadow-lg shadow-zinc-500/20 active:scale-[0.98]"
                >
                  保存账户
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Editing Modal */}
      <AnimatePresence>
        {editingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onSubmit={handleUpdate}
              className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md relative z-10 max-h-[90vh] flex flex-col"
            >
              <button 
                type="button"
                onClick={() => setEditingId(null)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">编辑账户</h3>
              
              <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar -mx-2 px-2 pb-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">名称</label>
                  <input
                    type="text"
                    required
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                    placeholder={editData.type === 'cash' ? "例如：招商银行储蓄卡" : "例如：招商银行信用卡"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    {editData.type === 'credit' ? '已用额度' : '余额'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editData.balance === 0 ? '' : editData.balance}
                    onChange={(e) => setEditData({ ...editData, balance: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                    placeholder="0.00"
                  />
                </div>
                {editData.type === 'credit' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">还款日 (每月几号)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={editData.repaymentDay || ''}
                        onChange={(e) => setEditData({ ...editData, repaymentDay: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                        placeholder="例如: 15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">待还金额 (¥)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.dueAmount === 0 ? '' : editData.dueAmount || ''}
                        onChange={(e) => setEditData({ ...editData, dueAmount: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                        placeholder="本期需还款金额"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold transition-all shadow-lg shadow-zinc-500/20 active:scale-[0.98]"
                >
                  保存修改
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
