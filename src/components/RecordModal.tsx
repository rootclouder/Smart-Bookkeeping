"use client";
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronRight } from 'lucide-react';
import { useStore, Category } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecordModal({ isOpen, onClose }: RecordModalProps) {
  const { accounts, categories, addTransaction } = useStore();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [createItem, setCreateItem] = useState(false);
  const [itemName, setItemName] = useState('');
  
  // Categorization
  const relevantCategories = useMemo(() => categories.filter(c => c.type === type), [categories, type]);
  const topLevelCategories = useMemo(() => relevantCategories.filter(c => !c.parentId), [relevantCategories]);

  useEffect(() => {
    if (isOpen && accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [isOpen, accounts, accountId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || !category || !accountId) return;

    addTransaction(
      {
        accountId,
        type,
        amount: Number(amount),
        category,
        date,
        note,
      },
      createItem,
      itemName
    );
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategory('');
    setNote('');
    setCreateItem(false);
    setItemName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] p-6 md:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold tracking-tight mb-6">记一笔</h2>

            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-6 shrink-0">
              <button
                type="button"
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                  type === 'expense'
                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-rose-500'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                )}
                onClick={() => setType('expense')}
              >
                支出
              </button>
              <button
                type="button"
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                  type === 'income'
                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-500'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                )}
                onClick={() => {
                  setType('income');
                  setCreateItem(false);
                }}
              >
                收入
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar -mx-2 px-2 pb-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">金额</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg font-semibold">
                      ¥
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all text-xl font-semibold"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">分类</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all text-sm appearance-none cursor-pointer pr-10"
                        required
                      >
                        <option value="" disabled>选择分类...</option>
                        {topLevelCategories.map(cat => {
                          const subcats = relevantCategories.filter(c => c.parentId === cat.id);
                          if (subcats.length === 0) {
                            return <option key={cat.id} value={cat.name}>{cat.name}</option>;
                          }
                          return (
                            <optgroup key={cat.id} label={cat.name}>
                              {subcats.map(sub => (
                                <option key={sub.id} value={`${cat.name} - ${sub.name}`}>
                                  {sub.name}
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">日期</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">账户</label>
                  <div className="relative">
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all appearance-none text-sm cursor-pointer pr-10"
                      required
                    >
                      <option value="" disabled>选择账户</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type === 'credit' ? '已用额度' : '余额'}: ¥{acc.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                {type === 'expense' && (
                  <div className="pt-2">
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                      <div
                        className={cn(
                          'w-5 h-5 rounded flex items-center justify-center border transition-all',
                          createItem
                            ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900'
                            : 'border-zinc-300 dark:border-zinc-700'
                        )}
                        onClick={() => setCreateItem(!createItem)}
                      >
                        {createItem && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm font-medium">同时记录到物品管理</span>
                    </label>
                    
                    <AnimatePresence>
                      {createItem && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all text-sm"
                            placeholder="输入物品名称 (如: MacBook Pro)"
                            required={createItem}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">备注 (可选)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all text-sm"
                    placeholder="写点什么..."
                  />
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold transition-all shadow-lg shadow-zinc-500/20 active:scale-[0.98]"
                >
                  保存记录
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
