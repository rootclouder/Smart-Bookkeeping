"use client";
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Wallet, Box, CreditCard, AlertCircle, Activity, PieChart, DollarSign } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { accounts, transactions, debts, items, investments } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalAccountBalance = accounts
    .filter(acc => acc.type === 'cash')
    .reduce((sum, acc) => sum + acc.balance, 0);
  const totalItemValue = items.reduce((sum, item) => sum + item.value, 0);
  
  const totalDebtAmount = debts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);
  const totalCreditAmount = accounts.filter(acc => acc.type === 'credit').reduce((sum, acc) => sum + acc.balance, 0);

  const fundInvestments = investments.filter(inv => inv.type === 'fund');
  const goldInvestments = investments.filter(inv => inv.type === 'gold');
  const stockInvestments = investments.filter(inv => inv.type === 'stock');

  const fundTotal = fundInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const fundReturns = fundInvestments.reduce((sum, inv) => sum + inv.returns, 0);

  const goldTotal = goldInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const goldReturns = goldInvestments.reduce((sum, inv) => sum + inv.returns, 0);

  const stockTotal = stockInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const stockReturns = stockInvestments.reduce((sum, inv) => sum + inv.returns, 0);

  const currentMonthTransactions = transactions.filter(
    (t) => t.date.startsWith(format(currentDate, 'yyyy-MM'))
  );

  const monthIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Padding days for grid
  const startDay = monthStart.getDay();
  const paddingDays = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }).map((_, i) => i);

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <header>
          <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-2"></div>
          <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800/50 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">总览</h1>
        <p className="text-zinc-500">掌握您的财务全局概况</p>
      </header>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-zinc-500">账户余额</div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight">¥{totalAccountBalance.toFixed(2)}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
              <Box className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-zinc-500">物品总值</div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-emerald-500 dark:text-emerald-400">¥{totalItemValue.toFixed(2)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors" />
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-sm font-bold text-zinc-500">总负债</div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-rose-500">¥{totalDebtAmount.toFixed(2)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
              <CreditCard className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-sm font-bold text-zinc-500">总透支</div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-amber-500">¥{totalCreditAmount.toFixed(2)}</div>
        </motion.div>
      </div>

      {/* Investment Overview */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">理财概况</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <PieChart className="w-5 h-5" />
                </div>
                <div className="font-bold">基金</div>
              </div>
              <div className={cn(
                "text-sm font-bold",
                fundReturns >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {fundReturns >= 0 ? '+' : ''}{fundReturns.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">持有金额</div>
              <div className="text-2xl font-black font-mono">¥{fundTotal.toFixed(2)}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="font-bold">黄金</div>
              </div>
              <div className={cn(
                "text-sm font-bold",
                goldReturns >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {goldReturns >= 0 ? '+' : ''}{goldReturns.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">持有金额</div>
              <div className="text-2xl font-black font-mono">¥{goldTotal.toFixed(2)}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="font-bold">股票</div>
              </div>
              <div className={cn(
                "text-sm font-bold",
                stockReturns >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {stockReturns >= 0 ? '+' : ''}{stockReturns.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">持有金额</div>
              <div className="text-2xl font-black font-mono">¥{stockTotal.toFixed(2)}</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl">
            <h3 className="font-medium mb-6 text-white">本月概况</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm opacity-80 mb-1 text-white">总收入</div>
                <div className="text-2xl font-bold text-emerald-400">
                  +¥{monthIncome.toFixed(2)}
                </div>
              </div>
              <div className="h-px bg-white/20" />
              <div>
                <div className="text-sm opacity-80 mb-1 text-white">总支出</div>
                <div className="text-2xl font-bold text-rose-400">
                  -¥{monthExpense.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">{format(currentDate, 'yyyy年 MM月')}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                上月
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                下月
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-medium text-zinc-500">
            <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {paddingDays.map((i) => (
              <div key={`pad-${i}`} className="aspect-square rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20" />
            ))}
            
            {daysInMonth.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayTxs = transactions.filter((t) => t.date === dayStr);
              const hasExpense = dayTxs.some((t) => t.type === 'expense');
              const hasIncome = dayTxs.some((t) => t.type === 'income');
              
              // Find debts due on this day (simplistic check for day matching)
              const hasDebtDue = debts.some((d) => d.dueDate === dayStr || (d.isInstallment && d.dueDate.endsWith(format(day, '-dd'))));

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'aspect-square rounded-xl p-1 md:p-2 border flex flex-col items-center transition-all hover:border-zinc-300 dark:hover:border-zinc-600',
                    isSameDay(day, new Date()) 
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/50' 
                      : 'border-zinc-100 dark:border-zinc-800'
                  )}
                >
                  <span className={cn(
                    'text-xs md:text-sm font-medium mb-1',
                    isSameDay(day, new Date()) ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  <div className="flex space-x-1 mt-auto pb-1">
                    {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                    {hasDebtDue && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-4 mt-6 text-xs text-zinc-500 justify-center">
            <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span>有收入</span></div>
            <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-rose-400" /><span>有支出</span></div>
            <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span>待还款</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
