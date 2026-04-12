"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Investment } from '@/store/useStore';
import { Plus, TrendingUp, TrendingDown, DollarSign, Activity, X, ChevronRight, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

type TabType = 'stock' | 'fund' | 'gold';

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'stock', label: '股票', icon: Activity },
  { id: 'fund', label: '基金', icon: PieChart },
  { id: 'gold', label: '黄金', icon: DollarSign },
];

export default function Investments() {
  const [mounted, setMounted] = useState(false);
  const { investments, addInvestment, updateInvestment, deleteInvestment, addInvestmentRecord } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('fund');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Modal states
  const [newInvestment, setNewInvestment] = useState<Partial<Investment>>({
    name: '',
    amount: 0,
    returns: 0
  });

  const [recordModal, setRecordModal] = useState<{
    isOpen: boolean;
    investmentId: string;
    amount: number;
    date: string;
  }>({
    isOpen: false,
    investmentId: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [tradeModal, setTradeModal] = useState<{
    isOpen: boolean;
    type: 'buy' | 'sell';
    investmentId: string;
    amount: number;
    accountId: string;
  }>({
    isOpen: false,
    type: 'buy',
    investmentId: '',
    amount: 0,
    accountId: ''
  });

  const activeInvestments = investments.filter(inv => inv.type === activeTab);
  
  const totalAmount = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReturns = activeInvestments.reduce((sum, inv) => sum + inv.returns, 0);
  const returnRate = totalAmount > 0 ? (totalReturns / totalAmount) * 100 : 0;

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestment.name) return;

    if (editingId) {
      updateInvestment(editingId, {
        name: newInvestment.name,
        amount: Number(newInvestment.amount),
        returns: Number(newInvestment.returns)
      });
    } else {
      addInvestment({
        name: newInvestment.name,
        type: activeTab,
        amount: Number(newInvestment.amount),
        returns: 0,
      });
    }
    
    setIsAdding(false);
    setEditingId(null);
    setNewInvestment({ name: '', amount: 0, returns: 0 });
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordModal.investmentId) return;

    addInvestmentRecord(recordModal.investmentId, {
      amount: Number(recordModal.amount),
      date: recordModal.date
    });

    setRecordModal({ ...recordModal, isOpen: false, amount: 0 });
  };

  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const { investmentId, type, amount, accountId } = tradeModal;
    if (!investmentId || !accountId || amount <= 0) return;

    const inv = investments.find(i => i.id === investmentId);
    const account = useStore.getState().accounts.find(a => a.id === accountId);
    if (!inv || !account) return;

    const tradeAmount = Number(amount);
    const tId = crypto.randomUUID();

    if (type === 'buy') {
      // Check if account has enough balance
      if (account.balance < tradeAmount) {
        alert('账户余额不足');
        return;
      }
      
      // Add to investment
      updateInvestment(investmentId, { 
        amount: inv.amount + tradeAmount,
        transactionIds: [...(inv.transactionIds || []), tId]
      });
      
      // Log transaction (this will automatically deduct from account balance)
      useStore.getState().addTransaction({
        id: tId,
        accountId,
        type: 'expense',
        amount: tradeAmount,
        category: '理财买入',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: `买入 ${inv.name}`
      });
    } else {
      // Check if investment has enough amount
      if (inv.amount < tradeAmount) {
        alert('可卖出金额不足');
        return;
      }

      // Deduct from investment
      updateInvestment(investmentId, { 
        amount: inv.amount - tradeAmount,
        transactionIds: [...(inv.transactionIds || []), tId]
      });
      
      // Log transaction (this will automatically add to account balance)
      useStore.getState().addTransaction({
        id: tId,
        accountId,
        type: 'income',
        amount: tradeAmount,
        category: '理财卖出',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: `卖出 ${inv.name}`
      });
    }

    setTradeModal({ ...tradeModal, isOpen: false, amount: 0, accountId: '' });
  };

  const startEdit = (inv: Investment) => {
    setEditingId(inv.id);
    setNewInvestment({
      name: inv.name,
      amount: inv.amount,
      returns: inv.returns
    });
    setIsAdding(true);
  };

  // Render daily returns calendar for an investment
  const renderCalendar = (investment: Investment) => {
    const today = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));

    return (
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-xs font-medium text-zinc-500 mb-3">近7日盈亏记录</div>
        <div className="flex justify-between">
          {days.map(day => {
            const record = investment.records?.find(r => isSameDay(parseISO(r.date), day));
            const hasRecord = !!record;
            const isPositive = record && record.amount >= 0;
            const isNegative = record && record.amount < 0;

            return (
              <div key={day.toString()} className="flex flex-col items-center">
                <div className="text-[10px] text-zinc-400 mb-1.5">{format(day, 'MM/dd')}</div>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors",
                  hasRecord 
                    ? isPositive 
                      ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/50" 
                      : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
                    : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-300 dark:text-zinc-600 border-transparent"
                )}>
                  {hasRecord ? (
                    record.amount > 0 ? `+${record.amount}` : record.amount
                  ) : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!mounted) return <div className="p-8 text-center text-zinc-500">加载中...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">理财管理</h1>
          <p className="text-zinc-500">管理股票、基金与黄金等投资资产</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex space-x-2 p-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                isActive 
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="text-sm font-medium text-zinc-500 mb-1">总持有金额</div>
          <div className="text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
            ¥{totalAmount.toFixed(2)}
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="text-sm font-medium text-zinc-500 mb-1">累计收益</div>
          <div className={cn(
            "text-3xl font-bold font-mono tracking-tight flex items-center",
            totalReturns >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
          )}>
            {totalReturns >= 0 ? <TrendingUp className="w-6 h-6 mr-2" /> : <TrendingDown className="w-6 h-6 mr-2" />}
            {totalReturns > 0 ? '+' : ''}{totalReturns.toFixed(2)}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="text-sm font-medium text-zinc-500 mb-1">累计收益率</div>
          <div className={cn(
            "text-3xl font-bold font-mono tracking-tight",
            returnRate >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
          )}>
            {returnRate > 0 ? '+' : ''}{returnRate.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{TABS.find(t => t.id === activeTab)?.label}列表</h2>
          <button
            onClick={() => {
              setEditingId(null);
              setNewInvestment({ name: '', amount: 0, returns: 0 });
              setIsAdding(true);
            }}
            className="flex items-center px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl transition-colors font-bold text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            新增账户
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {activeInvestments.map((inv) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{inv.name}</h3>
                    <div className="text-sm text-zinc-500">持有金额: ¥{inv.amount.toFixed(2)}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTradeModal({ isOpen: true, type: 'buy', investmentId: inv.id, amount: 0, accountId: '' })}
                      className="text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      买入
                    </button>
                    <button
                      onClick={() => setTradeModal({ isOpen: true, type: 'sell', investmentId: inv.id, amount: 0, accountId: '' })}
                      className="text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      卖出
                    </button>
                    <button
                      onClick={() => startEdit(inv)}
                      className="text-xs font-bold px-2 py-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors ml-2"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deleteInvestment(inv.id)}
                      className="text-xs font-bold px-2 py-1 text-zinc-500 hover:text-rose-500 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="text-xs font-medium text-zinc-500 mb-1">当前市值</div>
                    <div className="text-xl font-bold font-mono">¥{(inv.amount + inv.returns).toFixed(2)}</div>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl",
                    inv.returns >= 0 ? "bg-rose-50 dark:bg-rose-500/5" : "bg-emerald-50 dark:bg-emerald-500/5"
                  )}>
                    <div className="text-xs font-medium text-zinc-500 mb-1">持有收益</div>
                    <div className={cn(
                      "text-xl font-bold font-mono",
                      inv.returns >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {inv.returns > 0 ? '+' : ''}{inv.returns.toFixed(2)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setRecordModal({ isOpen: true, investmentId: inv.id, amount: 0, date: format(new Date(), 'yyyy-MM-dd') })}
                  className="w-full py-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all font-bold text-sm flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  记录今日盈亏
                </button>

                {renderCalendar(inv)}
              </motion.div>
            ))}
          </AnimatePresence>

          {activeInvestments.length === 0 && !isAdding && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-400 bg-white/50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
              {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Activity, { className: "w-12 h-12 mb-4 opacity-20" })}
              <p>暂无{TABS.find(t => t.id === activeTab)?.label}账户，点击上方按钮添加</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Account Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleAddOrUpdate}
              className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-md relative z-10"
            >
              <button type="button" onClick={() => setIsAdding(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">{editingId ? '编辑' : '新增'}{TABS.find(t => t.id === activeTab)?.label}账户</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">账户名称</label>
                  <input
                    type="text" required value={newInvestment.name}
                    onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all"
                    placeholder={`例如：招商白酒、${TABS.find(t => t.id === activeTab)?.label}定投`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">持有本金 (¥)</label>
                    <input
                      type="number" step="0.01" required value={newInvestment.amount || ''}
                      onChange={(e) => setNewInvestment({ ...newInvestment, amount: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">历史累计收益 (¥)</label>
                    <input
                      type="number" step="0.01" required value={newInvestment.returns === 0 ? '0' : newInvestment.returns || ''}
                      onChange={(e) => setNewInvestment({ ...newInvestment, returns: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                <button type="submit" className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold transition-all shadow-lg active:scale-[0.98]">
                  保存
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Record Profit/Loss Modal */}
      <AnimatePresence>
        {recordModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRecordModal({ ...recordModal, isOpen: false })}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleAddRecord}
              className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-sm relative z-10"
            >
              <button type="button" onClick={() => setRecordModal({ ...recordModal, isOpen: false })} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">记录盈亏</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">日期</label>
                  <input
                    type="date" required value={recordModal.date}
                    onChange={(e) => setRecordModal({ ...recordModal, date: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">当日盈亏金额 (¥) <span className="text-zinc-400 font-normal">正数代表盈利，负数代表亏损</span></label>
                  <input
                    type="number" step="0.01" required value={recordModal.amount || ''}
                    onChange={(e) => setRecordModal({ ...recordModal, amount: Number(e.target.value) })}
                    className={cn(
                      "w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all",
                      recordModal.amount > 0 ? "text-rose-600 dark:text-rose-400" : recordModal.amount < 0 ? "text-emerald-600 dark:text-emerald-400" : ""
                    )}
                    placeholder="例如: 150.50 或 -50.20"
                  />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                <button type="submit" className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold transition-all shadow-lg active:scale-[0.98]">
                  确认记录
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Buy/Sell Modal */}
      <AnimatePresence>
        {tradeModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setTradeModal({ ...tradeModal, isOpen: false })}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleTrade}
              className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-sm relative z-10"
            >
              <button type="button" onClick={() => setTradeModal({ ...tradeModal, isOpen: false })} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">
                {tradeModal.type === 'buy' ? '买入' : '卖出'} 
                {investments.find(i => i.id === tradeModal.investmentId)?.name}
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    {tradeModal.type === 'buy' ? '买入金额 (¥)' : '卖出金额 (¥)'}
                  </label>
                  <input
                    type="number" step="0.01" min="0.01" required value={tradeModal.amount || ''}
                    onChange={(e) => setTradeModal({ ...tradeModal, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all"
                    placeholder="0.00"
                  />
                  {tradeModal.type === 'sell' && (
                    <div className="text-xs text-zinc-500 mt-2">
                      最大可卖出: ¥{investments.find(i => i.id === tradeModal.investmentId)?.amount.toFixed(2)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    {tradeModal.type === 'buy' ? '扣款账户' : '收款账户'}
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={tradeModal.accountId}
                      onChange={(e) => setTradeModal({ ...tradeModal, accountId: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all appearance-none text-sm cursor-pointer pr-10"
                    >
                      <option value="" disabled>请选择账户</option>
                      {useStore.getState().accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (余额: ¥{acc.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                <button type="submit" className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold transition-all shadow-lg active:scale-[0.98]">
                  确认{tradeModal.type === 'buy' ? '买入' : '卖出'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}