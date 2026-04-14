"use client";
import { useState, useEffect } from 'react';
import { useStore, Debt, InstallmentRecord } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Trash2, Edit3, CalendarClock, AlertCircle, X, ChevronDown, ChevronUp, Calendar as CalendarIcon, Banknote, CheckCircle2 } from 'lucide-react';
import { format, parseISO, differenceInDays, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import RepaymentPlan from '@/components/RepaymentPlan';

export default function Debts() {
  const { debts, addDebt, deleteDebt, updateDebt, accounts, updateAccount, addTransaction, deleteTransaction } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'plan'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempInstallments, setTempInstallments] = useState<InstallmentRecord[]>([]);
  const [collapsedPlatforms, setCollapsedPlatforms] = useState<Record<string, boolean>>({});
  
  const [repayModal, setRepayModal] = useState<{
    isOpen: boolean;
    debtId: string;
    installmentId?: string;
    currentPaid: number;
    total: number;
    isCurrentlyPaid?: boolean;
    principal?: number;
    interest?: number;
    amount: number;
    accountId: string;
  }>({ isOpen: false, debtId: '', currentPaid: 0, total: 0, amount: 0, accountId: accounts[0]?.id || '' });

  const [newDebt, setNewDebt] = useState<Partial<Debt>>({ 
    name: '', 
    platform: '',
    totalAmount: 0, 
    paidAmount: 0, 
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    isInstallment: false,
    installmentPrincipal: 0,
    installmentInterest: 0
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically initialize first installment when toggled
  useEffect(() => {
    if (newDebt.isInstallment && tempInstallments.length === 0) {
      setTempInstallments([{
        id: crypto.randomUUID(),
        dueDate: newDebt.dueDate || format(new Date(), 'yyyy-MM-dd'),
        principal: 0,
        interest: 0,
        isPaid: false
      }]);
    }
  }, [newDebt.isInstallment, newDebt.dueDate, tempInstallments.length]);

  // Calculate total amount based on principal and interest if it's an installment
  useEffect(() => {
    if (newDebt.isInstallment) {
      const totalPrincipal = tempInstallments.reduce((sum, item) => sum + (Number(item.principal) || 0), 0);
      const totalInterest = tempInstallments.reduce((sum, item) => sum + (Number(item.interest) || 0), 0);
      
      setNewDebt(prev => ({ 
        ...prev, 
        installmentPrincipal: totalPrincipal,
        totalAmount: totalPrincipal,
        installmentInterest: totalInterest
      }));
    }
  }, [tempInstallments, newDebt.isInstallment]);

  const creditCardDebts = accounts
    .filter(acc => acc.type === 'credit')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const regularDebts = debts.reduce((sum, d) => sum + Math.max(0, (d.totalAmount || 0) + (d.installmentInterest || 0) - (d.paidAmount || 0)), 0);
  const totalDebts = regularDebts + creditCardDebts;

  // Handle cross-component repayment from RepaymentPlan
  useEffect(() => {
    const handleRepayPlanItem = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { item, accountId } = customEvent.detail;
      const account = accounts.find(a => a.id === accountId);
      
      if (!account) return;

      const amount = Number(item.amount);
      if (isNaN(amount) || amount <= 0) return;

      if (item.source === 'credit') {
        const creditAccount = accounts.find(a => a.id === item.originalId);
        if (!creditAccount) return;

        // Pay from payment account
        updateAccount(account.id, { balance: account.balance - amount });

        // Update credit account
        const newDueAmount = Math.max(0, (creditAccount.dueAmount || 0) - amount);
        const newBalance = Math.max(0, creditAccount.balance - amount);
        
        updateAccount(creditAccount.id, { 
          balance: newBalance,
          dueAmount: newDueAmount === 0 ? undefined : newDueAmount
        });

        // Log transaction
        addTransaction({
          accountId: account.id,
          type: 'expense',
          amount: amount,
          category: '还款',
          date: format(new Date(), 'yyyy-MM-dd'),
          note: `信用卡还款: ${creditAccount.name}`
        });
        return;
      }

      const debt = debts.find(d => d.id === item.originalId);
      if (!debt) return;

      // Deduct from account balance
      updateAccount(account.id, { balance: account.balance - amount });

      // Log transaction
      const tId = crypto.randomUUID();
      addTransaction({
        id: tId,
        accountId: account.id,
        type: 'expense',
        amount: amount,
        category: '还款',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: `还款: ${item.title}`
      });

      if (item.source === 'installment') {
        if (!debt.installments) return;
        const instId = item.id.replace('inst-', '');
        const updatedInstallments = debt.installments.map(inst => 
          inst.id === instId ? { ...inst, isPaid: true, transactionId: tId } : inst
        );
        const newPaidAmount = Math.max(0, (debt.paidAmount || 0) + amount);

        updateDebt(debt.id, {
          installments: updatedInstallments,
          paidAmount: newPaidAmount,
          transactionIds: [...(debt.transactionIds || []), tId]
        });
      } else {
        updateDebt(debt.id, { 
          paidAmount: Math.min((debt.totalAmount || 0) + (debt.installmentInterest || 0), (debt.paidAmount || 0) + amount),
          transactionIds: [...(debt.transactionIds || []), tId]
        });
      }
    };

    window.addEventListener('repay-plan-item', handleRepayPlanItem);
    return () => window.removeEventListener('repay-plan-item', handleRepayPlanItem);
  }, [accounts, debts, updateAccount, addTransaction, updateDebt]);

  const handleCloseModal = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewDebt({ 
      name: '', 
      platform: '',
      totalAmount: 0, 
      paidAmount: 0, 
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      isInstallment: false,
      installmentPrincipal: 0,
      installmentInterest: 0
    });
    setTempInstallments([]);
  };

  const handleEdit = (debt: Debt) => {
    setNewDebt({
      name: debt.name,
      platform: debt.platform || '',
      totalAmount: debt.totalAmount,
      paidAmount: debt.paidAmount,
      dueDate: debt.dueDate,
      isInstallment: debt.isInstallment,
      installmentPrincipal: debt.installmentPrincipal,
      installmentInterest: debt.installmentInterest
    });
    if (debt.isInstallment && debt.installments) {
      setTempInstallments([...debt.installments]);
    } else {
      setTempInstallments([]);
    }
    setEditingId(debt.id);
    setIsAdding(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebt.name) return;
    if (!newDebt.isInstallment && !newDebt.dueDate) return;
    
    const submittedTotalAmount = Number(newDebt.totalAmount) || 0;
    
    let paidAmount = Number(newDebt.paidAmount) || 0;
    if (newDebt.isInstallment) {
      paidAmount = tempInstallments.reduce((sum, inst) => sum + (inst.isPaid ? Number(inst.principal) + Number(inst.interest) : 0), 0);
    }
    
    let updatedTransactionIds: string[] | undefined = undefined;

    if (editingId) {
      const existingDebt = debts.find(d => d.id === editingId);
      updatedTransactionIds = existingDebt?.transactionIds ? [...existingDebt.transactionIds] : [];
      
      if (existingDebt?.isInstallment && existingDebt.installments) {
        const newInstallmentIds = new Set(tempInstallments.map(i => i.id));
        const deletedInstallments = existingDebt.installments.filter(i => !newInstallmentIds.has(i.id));
        
        const installmentsToDelete = newDebt.isInstallment ? deletedInstallments : existingDebt.installments;

        installmentsToDelete.forEach(inst => {
          if (inst.isPaid && inst.transactionId) {
            deleteTransaction(inst.transactionId);
            updatedTransactionIds = updatedTransactionIds?.filter(id => id !== inst.transactionId);
          }
        });
      }
    }

    const debtData = {
      name: newDebt.name,
      platform: newDebt.platform || '',
      totalAmount: submittedTotalAmount,
      paidAmount: paidAmount,
      dueDate: newDebt.isInstallment && tempInstallments.length > 0 ? tempInstallments[0].dueDate : (newDebt.dueDate || format(new Date(), 'yyyy-MM-dd')),
      isInstallment: newDebt.isInstallment || false,
      installmentPrincipal: Number(newDebt.installmentPrincipal) || 0,
      installmentInterest: Number(newDebt.installmentInterest) || 0,
      installments: newDebt.isInstallment ? tempInstallments : [],
      transactionIds: updatedTransactionIds,
      isCreditAccount: newDebt.isCreditAccount || false,
      accountId: newDebt.accountId || '',
      dueAmount: Number(newDebt.dueAmount) || 0,
      repaymentDay: Number(newDebt.repaymentDay) || 1
    };

    if (editingId) {
      updateDebt(editingId, debtData as unknown as Debt);
    } else {
      addDebt(debtData as unknown as Debt);
    }
    
    handleCloseModal();
  };

  const handlePay = (id: string, currentPaid: number, total: number) => {
    // Make sure we don't pre-fill with more than what's remaining
    const remaining = Math.max(0, total - currentPaid);
    
    setRepayModal({
      isOpen: true,
      debtId: id,
      currentPaid,
      total,
      amount: remaining,
      accountId: accounts[0]?.id || ''
    });
  };

  const handlePayInstallment = (debtId: string, installmentId: string, principal: number, interest: number, isCurrentlyPaid: boolean) => {
    if (isCurrentlyPaid) {
      // Revert payment without selecting an account
      const debt = debts.find(d => d.id === debtId);
      if (!debt || !debt.installments) return;

      const inst = debt.installments.find(i => i.id === installmentId);
      if (!inst) return;

      if (inst.transactionId) {
        deleteTransaction(inst.transactionId);
        return; // deleteTransaction handles reverting the debt
      }

      const updatedInstallments = debt.installments.map(i => 
        i.id === installmentId ? { ...i, isPaid: false, transactionId: undefined } : i
      );
      const amountToUpdate = principal + interest;
      const newPaidAmount = Math.max(0, (debt.paidAmount || 0) - amountToUpdate);

      updateDebt(debtId, {
        installments: updatedInstallments,
        paidAmount: newPaidAmount,
        transactionIds: debt.transactionIds?.filter(id => id !== inst.transactionId)
      });
      return;
    }

    setRepayModal({
      isOpen: true,
      debtId,
      installmentId,
      principal,
      interest,
      isCurrentlyPaid,
      currentPaid: 0,
      total: principal + interest,
      amount: principal + interest,
      accountId: accounts[0]?.id || ''
    });
  };

  const submitRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModal.debtId || !repayModal.accountId || !repayModal.amount) return;

    const account = accounts.find(a => a.id === repayModal.accountId);
    if (!account) return;

    const amount = Number(repayModal.amount);
    if (isNaN(amount) || amount <= 0) return;

    // Special handling for credit accounts
    if (repayModal.debtId.startsWith('credit-')) {
      const creditAccountId = repayModal.debtId.replace('credit-', '');
      const creditAccount = accounts.find(a => a.id === creditAccountId);
      if (!creditAccount) return;

      // Pay from payment account
      updateAccount(account.id, { balance: account.balance - amount });

      // Update credit account
      const newDueAmount = Math.max(0, (creditAccount.dueAmount || 0) - amount);
      const newBalance = Math.max(0, creditAccount.balance - amount);
      
      updateAccount(creditAccount.id, { 
        balance: newBalance,
        dueAmount: newDueAmount === 0 ? undefined : newDueAmount
      });

      // Log transaction
      addTransaction({
        accountId: account.id,
        type: 'expense',
        amount: amount,
        category: '还款',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: `信用卡还款: ${creditAccount.name}`
      });

      setRepayModal({ ...repayModal, isOpen: false });
      return;
    }

    const debt = debts.find(d => d.id === repayModal.debtId);
    if (!debt) return;

    // Deduct from account balance
    updateAccount(account.id, { balance: account.balance - amount });

    const tId = crypto.randomUUID();
    // Log transaction
    addTransaction({
      id: tId,
      accountId: account.id,
      type: 'expense',
      amount: amount,
      category: '还款',
      date: format(new Date(), 'yyyy-MM-dd'),
      note: `还款: ${debt.name}`
    });

    if (repayModal.installmentId) {
      // Handle installment payment
      if (!debt.installments) return;

      const updatedInstallments = debt.installments.map(inst => 
        inst.id === repayModal.installmentId ? { ...inst, isPaid: true, transactionId: tId } : inst
      );
      
      const newPaidAmount = Math.max(0, (debt.paidAmount || 0) + amount);

      updateDebt(debt.id, {
        installments: updatedInstallments,
        paidAmount: newPaidAmount,
        transactionIds: [...(debt.transactionIds || []), tId]
      });
    } else {
      // Handle regular debt payment
      // Instead of using Math.min which caps at total, we just add the amount to paidAmount.
      // We still cap it visually if needed, but for multiple payments we want to accumulate correctly.
      updateDebt(debt.id, { 
        paidAmount: (debt.paidAmount || 0) + amount,
        transactionIds: [...(debt.transactionIds || []), tId]
      });
    }

    setRepayModal({ ...repayModal, isOpen: false });
  };

  const togglePlatform = (platform: string) => {
    setCollapsedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  // Process data to group by platform
  // Find all credit accounts and map them into debt-like structures for display
  const creditAccountsAsDebts = accounts
    .filter(acc => acc.type === 'credit')
    .map(acc => ({
      id: `credit-${acc.id}`,
      name: acc.name,
      platform: '透支', // Force platform to be '透支' for all credit accounts
      totalAmount: acc.balance,
      paidAmount: 0,
      dueDate: format(new Date(), 'yyyy-MM-dd'), // Default or dummy date for credit accounts
      isInstallment: false,
      isCreditAccount: true, // Marker to distinguish from real debts
      accountId: acc.id,
      dueAmount: acc.dueAmount,
      repaymentDay: acc.repaymentDay
    }));

  const allDebtsForDisplay = [...debts, ...creditAccountsAsDebts];

  const groupedDebts = allDebtsForDisplay.reduce((groups, debt) => {
    const platform = debt.platform || '其他负债';
    if (!groups[platform]) groups[platform] = [];
    groups[platform].push(debt);
    return groups;
  }, {} as Record<string, typeof allDebtsForDisplay>);

  const platformNames = Object.keys(groupedDebts).sort((a, b) => {
    if (a === '其他负债') return 1;
    if (b === '其他负债') return -1;
    return a.localeCompare(b);
  });

  if (!mounted) return <div className="p-8 text-center text-zinc-500">加载中...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">负债管理</h1>
          <p className="text-zinc-500">管理借款与分期，规划还款计划</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:space-x-6">
          <div className="text-left sm:text-right">
            <div className="text-sm font-medium text-zinc-500 mb-1">总待还金额</div>
            <div className="text-2xl font-bold text-rose-500 dark:text-rose-400 leading-none">¥{totalDebts.toFixed(2)}</div>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            {viewMode === 'list' && (
              <button
                onClick={() => setViewMode('plan')}
                className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors font-bold text-sm shadow-sm"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                还款计划
              </button>
            )}
            {viewMode === 'list' && !isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex-1 sm:flex-none flex items-center justify-center px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl transition-colors font-bold text-sm shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增负债
              </button>
            )}
          </div>
        </div>
      </header>

      {viewMode === 'plan' ? (
        <RepaymentPlan onBack={() => setViewMode('list')} />
      ) : (
        <>
          <div className="space-y-12">
        {platformNames.map(platform => {
          const isCollapsed = collapsedPlatforms[platform];
          const platformDebts = groupedDebts[platform];
          const platformTotal = platformDebts.reduce((sum, d) => sum + Math.max(0, ((d as Debt).totalAmount || 0) + ((d as Debt).installmentInterest || 0) - ((d as Debt).paidAmount || 0)), 0);

          return (
            <div key={platform} className="space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => togglePlatform(platform)}
              >
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {platform}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-medium">
                    {platformDebts.length} 项
                  </span>
                  <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400 ml-2">
                    待还: ¥{platformTotal.toFixed(2)}
                  </span>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                  {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
              </div>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start overflow-hidden"
                  >
                    {platformDebts.map((_debt, index) => {
                        const debt = _debt as Debt;
                        const totalDebtAmount = (debt.totalAmount || 0) + (debt.installmentInterest || 0);
                      const remaining = totalDebtAmount - (debt.paidAmount || 0);
                      const isPaidOff = remaining <= 0 && !debt.isCreditAccount;
                      const daysToDue = differenceInDays(parseISO(debt.dueDate), new Date());
                      const isOverdue = daysToDue < 0 && !isPaidOff;
                      const isNearDue = daysToDue >= 0 && daysToDue <= 7 && !isPaidOff;

                      if (debt.isCreditAccount) {
                        return (
                          <motion.div
                            key={debt.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-6 rounded-3xl shadow-sm border bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative group overflow-hidden transition-all flex flex-col h-full border-zinc-700"
                          >
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl transition-transform group-hover:scale-110" />
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                                    <CreditCard className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg text-white tracking-wide">{debt.name}</h3>
                                    <span className="text-xs text-zinc-400">信用卡 / 透支</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mb-6 relative z-10">
                                <div className="text-sm text-zinc-400 mb-1">本期待还</div>
                                <div className="text-3xl font-black font-mono text-white">
                                  ¥{debt.dueAmount ? debt.dueAmount.toFixed(2) : '0.00'}
                                </div>
                                <div className="text-xs text-zinc-400 mt-2">已用额度: ¥{debt.totalAmount.toFixed(2)}</div>
                              </div>
                            </div>
                            
                            <div className="mt-auto">
                              <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
                                <div className="flex items-center text-sm text-zinc-300">
                                  <CalendarClock className="w-4 h-4 mr-1.5" />
                                  {debt.repaymentDay ? `每月 ${debt.repaymentDay} 日还款` : '未设置还款日'}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setRepayModal({
                                      isOpen: true,
                                      debtId: debt.id,
                                      currentPaid: 0,
                                      total: debt.dueAmount || debt.totalAmount,
                                      amount: debt.dueAmount || debt.totalAmount,
                                      accountId: accounts[0]?.id || ''
                                    });
                                  }}
                                  className="px-4 py-2 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl text-sm font-bold shadow-sm transition-colors"
                                >
                                  立即还款
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }

                      if (debt.isInstallment) {
                        const nextUnpaidInst = debt.installments?.find(inst => !inst.isPaid);
                        const nextInstIndex = debt.installments?.findIndex(inst => !inst.isPaid) ?? -1;
                        const nextInstAmount = nextUnpaidInst ? nextUnpaidInst.principal + nextUnpaidInst.interest : 0;
                        const paidCount = debt.installments?.filter(inst => inst.isPaid).length || 0;
                        const totalCount = debt.installments?.length || 0;

                        return (
                          <motion.div
                            key={debt.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "p-6 rounded-3xl shadow-sm border relative group overflow-hidden transition-all flex flex-col h-full",
                              isPaidOff ? "bg-white/40 dark:bg-zinc-800/40 backdrop-blur-sm border-white/10 opacity-60" : "bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-white/20 dark:border-white/10"
                            )}
                          >
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="flex items-center space-x-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    isPaidOff ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-500" : "bg-indigo-50 dark:bg-indigo-950 text-indigo-500"
                                  )}>
                                    <CalendarClock className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{debt.name}</h3>
                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md font-medium">分期 · 共 {totalCount} 期</span>
                                  </div>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.preventDefault(); handleEdit(debt); }} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button onClick={(e) => { e.preventDefault(); if (window.confirm('确定要删除该负债吗？这也会删除所有相关的还款流水记录。')) deleteDebt(debt.id); }} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="mb-6 relative z-10">
                                {isPaidOff ? (
                                  <div className="text-emerald-500 font-bold flex items-center mb-2">
                                    <CheckCircle2 className="w-5 h-5 mr-2" /> 已全部结清
                                  </div>
                                ) : nextUnpaidInst ? (
                                  <>
                                    <div className="text-sm text-zinc-500 mb-1">本期待还 (第 {nextInstIndex + 1} 期)</div>
                                    <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                                      ¥{nextInstAmount.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-1">含本金 ¥{nextUnpaidInst.principal.toFixed(2)} + 利息 ¥{nextUnpaidInst.interest.toFixed(2)}</div>
                                  </>
                                ) : (
                                  <div className="text-zinc-500">无待还分期</div>
                                )}
                              </div>
                            </div>
                            <div className="mt-auto">
                              {!isPaidOff && nextUnpaidInst && (
                                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mb-4 relative z-10">
                                  <div className={cn(
                                    "text-sm font-medium",
                                    differenceInDays(parseISO(nextUnpaidInst.dueDate), new Date()) < 0 ? "text-rose-500" : "text-amber-500"
                                  )}>
                                    {differenceInDays(parseISO(nextUnpaidInst.dueDate), new Date()) < 0 ? '已逾期' : `${differenceInDays(parseISO(nextUnpaidInst.dueDate), new Date())}天后`} ({format(parseISO(nextUnpaidInst.dueDate), 'MM-dd')})
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePayInstallment(debt.id, nextUnpaidInst.id, nextUnpaidInst.principal, nextUnpaidInst.interest, nextUnpaidInst.isPaid);
                                    }}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold transition-colors"
                                  >
                                    本期还款
                                  </button>
                                </div>
                              )}

                              <details className="group relative z-10" onToggle={(e) => {
                                const details = e.currentTarget;
                                if (details.open) {
                                  const allDetails = document.querySelectorAll('details');
                                  allDetails.forEach((otherDetails) => {
                                    if (otherDetails !== details && otherDetails.open) {
                                      otherDetails.open = false;
                                    }
                                  });
                                }
                              }}>
                                <summary className="flex justify-between items-center text-xs font-medium cursor-pointer list-none py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors select-none bg-zinc-50 dark:bg-zinc-800/50 px-3 rounded-lg">
                                  <span>进度: {paidCount}/{totalCount} 期 (剩余总额 ¥{Math.max(0, remaining).toFixed(2)})</span>
                                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="mt-2 space-y-1.5 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                                  {debt.installments?.map((inst, i) => {
                                    const instDate = parseISO(inst.dueDate);
                                    const isInstOverdue = differenceInDays(instDate, new Date()) < 0 && !inst.isPaid;
                                    return (
                                      <div key={inst.id} className={cn(
                                        "flex items-center justify-between p-2 rounded-lg border text-xs transition-colors",
                                        inst.isPaid ? "bg-zinc-50 dark:bg-zinc-800/30 border-transparent text-zinc-400" :
                                        isInstOverdue ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30" :
                                        "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700"
                                      )}>
                                        <div className="flex items-center">
                                          <button onClick={(e) => { e.preventDefault(); handlePayInstallment(debt.id, inst.id, Number(inst.principal), Number(inst.interest), inst.isPaid); }} className={cn(
                                            "w-4 h-4 rounded-full border flex items-center justify-center mr-2 transition-colors",
                                            inst.isPaid ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 dark:border-zinc-600 hover:border-rose-500 bg-white dark:bg-zinc-900"
                                          )}>
                                            {inst.isPaid && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                          </button>
                                          <span className={cn("font-medium", inst.isPaid && "line-through")}>第 {i + 1} 期</span>
                                        </div>
                                        <div className={cn("font-mono", inst.isPaid ? "line-through" : isInstOverdue ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100")}>
                                          ¥{((Number(inst.principal) || 0) + (Number(inst.interest) || 0)).toFixed(2)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </details>
                            </div>
                          </motion.div>
                        );
                      }

                      // One-time Debt
                      return (
                        <motion.div
                            key={debt.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "p-6 rounded-3xl shadow-sm border relative group overflow-hidden transition-all flex flex-col h-full",
                              isPaidOff ? "bg-white/40 dark:bg-zinc-800/40 backdrop-blur-sm border-white/10 opacity-60" : "bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-white/20 dark:border-white/10"
                            )}
                          >
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="flex items-center space-x-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    isPaidOff ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-500" : "bg-rose-50 dark:bg-rose-950 text-rose-500"
                                  )}>
                                    <Banknote className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{debt.name}</h3>
                                    <span className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-md font-medium">一次性还款</span>
                                  </div>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.preventDefault(); handleEdit(debt); }} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button onClick={(e) => { e.preventDefault(); if (window.confirm('确定要删除该负债吗？这也会删除所有相关的还款流水记录。')) deleteDebt(debt.id); }} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="mb-6 relative z-10">
                                <div className="text-sm text-zinc-500 mb-1">待还本息</div>
                                <div className={cn(
                                  "text-3xl font-black font-mono",
                                  isPaidOff ? "text-zinc-400 dark:text-zinc-600 line-through" : "text-rose-600 dark:text-rose-400"
                                )}>
                                  ¥{Math.max(0, remaining).toFixed(2)}
                                </div>
                              </div>

                              <div className="space-y-2 mb-6 relative z-10">
                                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div 
                                    className={cn("h-full rounded-full transition-all", isPaidOff ? "bg-emerald-500" : "bg-rose-500")}
                                    style={{ width: `${Math.min(100, ((debt.paidAmount || 0) / (totalDebtAmount || 1)) * 100)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-zinc-500 font-medium">
                                  <span>总额: ¥{totalDebtAmount.toFixed(2)}</span>
                                  <span>已还: ¥{(debt.paidAmount || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-auto">
                              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 relative z-10">
                                <div className={cn(
                                  "flex items-center text-sm font-medium",
                                  isPaidOff ? "text-emerald-500" : isOverdue ? "text-rose-600" : isNearDue ? "text-amber-500" : "text-zinc-500"
                                )}>
                                  {isPaidOff ? (
                                    <><CheckCircle2 className="w-4 h-4 mr-1.5" /> 已结清</>
                                  ) : isOverdue ? (
                                    <><AlertCircle className="w-4 h-4 mr-1.5" /> 已逾期 {Math.abs(daysToDue)} 天</>
                                  ) : (
                                    <><CalendarClock className="w-4 h-4 mr-1.5" /> {format(parseISO(debt.dueDate), 'yyyy-MM-dd')} {isNearDue && `(${daysToDue}天后)`}</>
                                  )}
                                </div>
                                
                                {!isPaidOff && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePay(debt.id, debt.paidAmount || 0, totalDebtAmount);
                                    }}
                                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold transition-colors"
                                  >
                                    还款
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      </>
      )}

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onSubmit={handleAdd}
              className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-white/30 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl border w-full max-w-2xl relative z-10 max-h-[90vh] flex flex-col"
            >
              <button 
                type="button"
                onClick={handleCloseModal}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">{editingId ? '编辑负债' : '新增负债'}</h3>
              <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar -mx-2 px-2 pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">负债名称</label>
                    <input
                      type="text"
                      required
                      value={newDebt.name}
                      onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      placeholder="例如：房贷、车贷、借呗"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">负债平台 / 账户</label>
                    <input
                      type="text"
                      list="credit-accounts"
                      value={newDebt.platform}
                      onChange={(e) => setNewDebt({ ...newDebt, platform: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      placeholder="例如：招商银行、支付宝"
                    />
                    <datalist id="credit-accounts">
                      {accounts.filter(a => a.type === 'credit').map(acc => (
                        <option key={acc.id} value={acc.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">总本金 (¥)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      readOnly={newDebt.isInstallment}
                      value={newDebt.totalAmount === 0 ? '' : newDebt.totalAmount}
                      onChange={(e) => setNewDebt({ ...newDebt, totalAmount: Number(e.target.value) })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-sm font-mono focus:ring-2 focus:ring-rose-500 outline-none transition-all",
                        newDebt.isInstallment 
                          ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-200 dark:border-zinc-700" 
                          : "bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                      )}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">总利息 (¥)</label>
                    <input
                      type="number"
                      step="0.01"
                      readOnly={newDebt.isInstallment}
                      value={newDebt.installmentInterest === 0 ? '' : newDebt.installmentInterest}
                      onChange={(e) => setNewDebt({ ...newDebt, installmentInterest: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-sm font-mono focus:ring-2 focus:ring-rose-500 outline-none transition-all",
                        newDebt.isInstallment 
                          ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-200 dark:border-zinc-700" 
                          : "bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                      )}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">总待还 (¥)</label>
                    <div className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono text-zinc-500 flex items-center">
                      {Math.max(0, (Number(newDebt.totalAmount) || 0) + (Number(newDebt.installmentInterest) || 0) - (Number(newDebt.paidAmount) || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>

                {!newDebt.isInstallment && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">还款日期</label>
                      <input
                        type="date"
                        required
                        value={newDebt.dueDate}
                        onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}
                
                <div className="bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 overflow-hidden transition-all">
                  <label className="flex items-center justify-between p-4 cursor-pointer select-none">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">这是一个分期项目 (每月还款)</span>
                    </div>
                    <div className={cn(
                      "w-10 h-6 rounded-full transition-colors flex items-center px-1",
                      newDebt.isInstallment ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"
                    )}>
                      <input 
                        type="checkbox"
                        checked={newDebt.isInstallment}
                        onChange={(e) => setNewDebt({ ...newDebt, isInstallment: e.target.checked })}
                        className="sr-only"
                      />
                      <motion.div 
                        animate={{ x: newDebt.isInstallment ? 16 : 0 }}
                        className="w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </div>
                  </label>

                  <AnimatePresence>
                    {newDebt.isInstallment && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 border-t border-indigo-100/50 dark:border-indigo-900/20 mt-2">
                            <div className="space-y-3 mt-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">分期明细</h4>
                              </div>

                            <div className="space-y-2 max-h-[35vh] overflow-y-auto custom-scrollbar -mx-2 px-2 pb-2">
                              <div className="flex items-center space-x-2 px-2 pb-1 text-xs font-medium text-zinc-500">
                                <div className="w-6 text-center">期数</div>
                                <div className="flex-1 grid grid-cols-[1fr_1fr_1.2fr_1.3fr] gap-2 text-center">
                                   <div>本金 (¥)</div>
                                   <div>利息 (¥)</div>
                                   <div>总待还 (¥)</div>
                                   <div>还款日期</div>
                                 </div>
                                <div className="w-6"></div>
                              </div>
                              {tempInstallments.map((inst, index) => {
                                const instTotal = (Number(inst.principal) || 0) + (Number(inst.interest) || 0);
                                return (
                                  <div key={inst.id} className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                    <div className="w-6 text-center text-xs font-bold text-indigo-300 dark:text-indigo-700">{index + 1}</div>
                                    <div className="flex-1 grid grid-cols-[1fr_1fr_1.2fr_1.3fr] gap-2">
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="本金"
                                        required
                                        value={inst.principal === 0 ? '' : inst.principal}
                                        onChange={(e) => {
                                          const newInsts = [...tempInstallments];
                                          newInsts[index].principal = Number(e.target.value);
                                          setTempInstallments(newInsts);
                                        }}
                                        className="w-full px-1.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center"
                                       />
                                         <input 
                                          type="number" 
                                          step="0.01"
                                          placeholder="利息"
                                          value={inst.interest === 0 ? '' : inst.interest}
                                          onChange={(e) => {
                                            const newInsts = [...tempInstallments];
                                            newInsts[index].interest = e.target.value === '' ? 0 : Number(e.target.value);
                                            setTempInstallments(newInsts);
                                          }}
                                          className="w-full px-1.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center"
                                        />
                                       <div className="w-full px-1.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-900/30 rounded-lg text-xs font-mono text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                          {instTotal.toFixed(2)}
                                        </div>
                                       <input 
                                         type="date" 
                                         required
                                         value={inst.dueDate}
                                         onChange={(e) => {
                                           const newInsts = [...tempInstallments];
                                           newInsts[index].dueDate = e.target.value;
                                           setTempInstallments(newInsts);
                                         }}
                                         className="w-full px-1.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] sm:text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                                      />
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={() => setTempInstallments(tempInstallments.filter((_, i) => i !== index))}
                                      className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            <button 
                              type="button"
                              onClick={() => {
                                const lastInst = tempInstallments[tempInstallments.length - 1];
                                const nextDate = lastInst ? format(addMonths(parseISO(lastInst.dueDate), 1), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                                setTempInstallments([...tempInstallments, {
                                  id: crypto.randomUUID(),
                                  dueDate: nextDate,
                                  principal: 0,
                                  interest: 0,
                                  isPaid: false
                                }]);
                              }}
                              className="w-full py-2 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/50 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors flex items-center justify-center text-xs font-bold"
                            >
                              <Plus className="w-4 h-4 mr-1" /> 新增一期
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold transition-all shadow-lg shadow-zinc-500/20 active:scale-[0.98]"
                >
                  {editingId ? '保存修改' : '保存负债记录'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {repayModal.isOpen && (
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
              onSubmit={submitRepayment}
              className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-white/30 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl border w-full max-w-md relative z-10 flex flex-col"
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
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">还款金额 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={repayModal.installmentId ? undefined : Math.max(0, repayModal.total - repayModal.currentPaid)}
                    required
                    value={repayModal.amount || ''}
                    onChange={(e) => setRepayModal({ ...repayModal, amount: Number(e.target.value) })}
                    readOnly={!!repayModal.installmentId}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-sm font-mono focus:ring-2 focus:ring-rose-500 outline-none transition-all",
                      repayModal.installmentId
                        ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-200 dark:border-zinc-700" 
                        : "bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                    )}
                  />
                  {!repayModal.installmentId && (
                    <div className="text-xs text-zinc-500 mt-2">
                      剩余待还: ¥{Math.max(0, repayModal.total - repayModal.currentPaid).toFixed(2)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">支付账户</label>
                  <select
                    required
                    value={repayModal.accountId}
                    onChange={(e) => setRepayModal({ ...repayModal, accountId: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                  >
                    <option value="" disabled>请选择支付账户</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (余额: ¥{acc.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
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
    </div>
  );
}
