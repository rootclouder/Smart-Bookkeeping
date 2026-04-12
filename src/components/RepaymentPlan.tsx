"use client";
import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { format, parseISO, differenceInDays, isSameMonth, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, setDate, isBefore, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, CreditCard, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RepaymentItem {
  id: string;
  title: string;
  platform: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  isPaid: boolean;
  source: 'debt' | 'installment' | 'credit';
  originalId: string;
  originalAmount?: number;
}

interface RepaymentPlanProps {
  onBack: () => void;
}

export default function RepaymentPlan({ onBack }: RepaymentPlanProps) {
  const { debts, accounts } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [repayModal, setRepayModal] = useState<{
    isOpen: boolean;
    item?: RepaymentItem;
    accountId: string;
  }>({ isOpen: false, accountId: accounts[0]?.id || '' });

  const repaymentItems = useMemo(() => {
    const items: RepaymentItem[] = [];

    // 1. Regular Debts
    debts.forEach(debt => {
      if (!debt.isInstallment) {
        const remaining = debt.totalAmount - debt.paidAmount;
        if (remaining > 0) {
          items.push({
            id: `debt-${debt.id}`,
            title: debt.name,
            platform: debt.platform || '其他负债',
            amount: remaining,
            dueDate: debt.dueDate,
            isPaid: false,
            source: 'debt',
            originalId: debt.id,
            originalAmount: debt.totalAmount + (debt.installmentInterest || 0) - debt.paidAmount
          });
        }
      } else {
        // 2. Installment Debts
        debt.installments?.forEach((inst, index) => {
          if (!inst.isPaid) {
            items.push({
              id: `inst-${inst.id}`,
              title: `${debt.name} (第${index + 1}期)`,
              platform: debt.platform || '其他负债',
              amount: (inst.principal || 0) + (inst.interest || 0),
              originalAmount: (inst.principal || 0) + (inst.interest || 0),
              dueDate: inst.dueDate,
              isPaid: inst.isPaid,
              source: 'installment',
              originalId: debt.id
            });
          }
        });
      }
    });

    // 3. Credit Accounts
    const today = startOfDay(new Date());
    accounts.forEach(acc => {
      if (acc.type === 'credit' && acc.balance > 0) {
        // Calculate next due date
        let dueDate = new Date();
        if (acc.repaymentDay) {
          dueDate = setDate(new Date(), acc.repaymentDay);
          if (isBefore(dueDate, today)) {
            dueDate = addMonths(dueDate, 1);
          }
        } else {
          // Default to end of current month if no repayment day set
          dueDate = endOfMonth(new Date());
        }

        items.push({
          id: `credit-${acc.id}`,
          title: `${acc.name}账单`,
          platform: '透支', // Unified platform name for all credit accounts
          amount: acc.dueAmount && acc.dueAmount > 0 ? acc.dueAmount : acc.balance,
          dueDate: format(dueDate, 'yyyy-MM-dd'),
          isPaid: false,
          source: 'credit',
          originalId: acc.id
        });
      }
    });

    return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [debts, accounts]);

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = monthStart;
  const endDate = monthEnd;
  const dateFormat = "yyyy-MM-dd";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Current month items
  const currentMonthItems = repaymentItems.filter(item => isSameMonth(parseISO(item.dueDate), currentDate));
  const currentMonthTotal = currentMonthItems.reduce((sum, item) => sum + item.amount, 0);

  // Group items by platform for the list view
  const groupedItems = repaymentItems.reduce((groups, item) => {
    if (!groups[item.platform]) groups[item.platform] = [];
    groups[item.platform].push(item);
    return groups;
  }, {} as Record<string, RepaymentItem[]>);

  const platformNames = Object.keys(groupedItems).sort((a, b) => {
    if (a === '其他负债') return 1;
    if (b === '其他负债') return -1;
    return a.localeCompare(b);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">还款计划</h1>
            <p className="text-zinc-500 text-sm mt-1">日历视图与所有待还列表</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Calendar View */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-indigo-500" />
                {format(currentDate, 'yyyy年MM月')}
              </h2>
              <div className="flex space-x-2">
                <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-900/30">
              <div className="text-sm font-medium text-indigo-600/80 dark:text-indigo-400/80 mb-1">本月待还总额</div>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight font-mono">
                ¥{currentMonthTotal.toFixed(2)}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-zinc-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: getDay(monthStart) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 md:h-24 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/20" />
              ))}
              
              {days.map(day => {
                const dayItems = currentMonthItems.filter(item => isSameDay(parseISO(item.dueDate), day));
                const dayTotal = dayItems.reduce((sum, item) => sum + item.amount, 0);
                const isToday = isSameDay(day, new Date());
                const isPast = isBefore(day, startOfDay(new Date()));
                const hasItems = dayItems.length > 0;
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <div 
                    key={day.toString()} 
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "h-20 md:h-24 rounded-2xl p-1.5 md:p-2 flex flex-col border transition-all cursor-pointer hover:shadow-md",
                      isSelected 
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-500/20"
                        : isToday 
                          ? "bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600" 
                          : hasItems 
                            ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-indigo-300" 
                            : "bg-zinc-50/50 dark:bg-zinc-800/30 border-transparent hover:border-zinc-300"
                    )}
                  >
                    <div className={cn(
                      "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                      isSelected ? "bg-indigo-500 text-white" : isToday ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900" : "text-zinc-500"
                    )}>
                      {format(day, 'd')}
                    </div>
                    
                    {hasItems && (
                      <div className="mt-auto">
                        <div className={cn(
                          "text-[10px] md:text-xs font-mono font-bold truncate",
                          isPast ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"
                        )}>
                          ¥{dayTotal.toFixed(0)}
                        </div>
                        <div className="flex space-x-0.5 mt-1">
                          {dayItems.slice(0, 3).map((item, i) => (
                            <div key={i} className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.source === 'credit' ? "bg-blue-400" : "bg-indigo-400"
                            )} />
                          ))}
                          {dayItems.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: List View Grouped by Platform */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-6 flex flex-col h-full max-h-[800px]">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h2 className="text-xl font-bold flex items-center">
                <List className="w-5 h-5 mr-2 text-indigo-500" />
                {selectedDate ? `${format(selectedDate, 'MM月dd日')} 待还计划` : '所有待还计划'}
              </h2>
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                >
                  查看全部
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-6">
              {(() => {
                // Filter items by selected date if applicable
                const displayItems = selectedDate 
                  ? repaymentItems.filter(item => isSameDay(parseISO(item.dueDate), selectedDate))
                  : repaymentItems;

                if (displayItems.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-400">
                      <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon className="w-8 h-8 opacity-50" />
                      </div>
                      <p>{selectedDate ? '当天没有待还计划' : '当前没有待还计划'}</p>
                    </div>
                  );
                }

                // Group the filtered items
                const displayGroups = displayItems.reduce((groups, item) => {
                  if (!groups[item.platform]) groups[item.platform] = [];
                  groups[item.platform].push(item);
                  return groups;
                }, {} as Record<string, RepaymentItem[]>);

                const displayPlatformNames = Object.keys(displayGroups).sort((a, b) => {
                  if (a === '其他负债') return 1;
                  if (b === '其他负债') return -1;
                  return a.localeCompare(b);
                });

                return displayPlatformNames.map(platform => {
                  const items = displayGroups[platform];
                  const platformTotal = items.reduce((sum, item) => sum + item.amount, 0);

                  return (
                    <div key={platform} className="space-y-3">
                      <div className="flex items-center justify-between sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm py-2 z-10">
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
                          {platform}
                          <span className="ml-2 text-xs font-normal text-zinc-500 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                            {items.length}项
                          </span>
                        </div>
                        <div className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                          ¥{platformTotal.toFixed(2)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {items.map(item => {
                          const isPast = isBefore(parseISO(item.dueDate), startOfDay(new Date()));
                          
                          return (
                            <div 
                              key={item.id} 
                              className={cn(
                                "flex flex-col p-3 rounded-2xl border transition-colors",
                                isPast 
                                  ? "bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30" 
                                  : "bg-zinc-50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="overflow-hidden pr-3">
                                  <div className="text-sm font-medium truncate mb-1 text-zinc-900 dark:text-zinc-100">
                                    {item.title}
                                  </div>
                                  <div className={cn(
                                    "text-xs font-medium flex items-center",
                                    isPast ? "text-rose-600 dark:text-rose-400" : "text-zinc-500"
                                  )}>
                                    {format(parseISO(item.dueDate), 'yyyy-MM-dd')}
                                    {isPast && <span className="ml-2 px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded text-[10px]">已逾期</span>}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <div className={cn(
                                    "text-base font-bold font-mono flex-shrink-0",
                                    item.source === 'credit' ? "text-blue-600 dark:text-blue-400" : "text-indigo-600 dark:text-indigo-400"
                                  )}>
                                    ¥{item.amount.toFixed(2)}
                                  </div>
                                  {item.source !== 'credit' && (
                                    <button
                                      onClick={() => setRepayModal({ isOpen: true, item, accountId: accounts[0]?.id || '' })}
                                      className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors"
                                    >
                                      还款
                                    </button>
                                  )}
                                  {item.source === 'credit' && (
                                    <button
                                      onClick={() => setRepayModal({ isOpen: true, item: { ...item, originalAmount: item.amount }, accountId: accounts[0]?.id || '' })}
                                      className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors"
                                    >
                                      还款
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {repayModal.isOpen && repayModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRepayModal({ ...repayModal, isOpen: false })}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onSubmit={(e) => {
                e.preventDefault();
                // We'll dispatch an event or call a prop to handle the actual repayment
                // For now, since useStore is available, we can do it directly
                const account = accounts.find(a => a.id === repayModal.accountId);
                if (!account || !repayModal.item) return;

                // Fire custom event to notify parent (Debts.tsx) to handle payment
                const event = new CustomEvent('repay-plan-item', { 
                  detail: { 
                    item: repayModal.item, 
                    accountId: repayModal.accountId 
                  } 
                });
                window.dispatchEvent(event);
                setRepayModal({ ...repayModal, isOpen: false });
              }}
              className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-indigo-100 dark:border-indigo-900/30 w-full max-w-md relative z-10 flex flex-col"
            >
              <button 
                type="button"
                onClick={() => setRepayModal({ ...repayModal, isOpen: false })}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">还款确认</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">还款项目</label>
                  <div className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium">
                    {repayModal.item.title}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">还款金额 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={repayModal.item.originalAmount || repayModal.item.amount}
                    required
                    value={repayModal.item.amount || ''}
                    onChange={(e) => setRepayModal(prev => prev.item ? { ...prev, item: { ...prev.item, amount: Number(e.target.value) } } : prev)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                      repayModal.item.source === 'debt'
                        ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-200 dark:border-zinc-700" 
                        : "bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                    )}
                    readOnly={repayModal.item.source === 'debt'}
                  />
                  {repayModal.item.source !== 'debt' && (
                    <div className="text-xs text-zinc-500 mt-2">
                      最大可还款: ¥{(repayModal.item.originalAmount || repayModal.item.amount).toFixed(2)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">支付账户</label>
                  <div className="relative">
                    <select
                      required
                      value={repayModal.accountId}
                      onChange={(e) => setRepayModal({ ...repayModal, accountId: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer pr-10"
                    >
                      <option value="" disabled>请选择支付账户</option>
                      {accounts.map(acc => (
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
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold transition-all shadow-lg shadow-zinc-500/20 active:scale-[0.98]"
                >
                  确认还款
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}