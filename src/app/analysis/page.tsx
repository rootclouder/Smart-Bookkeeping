"use client";
import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { Trash2, ArrowUpRight, ArrowDownRight, Tag, CreditCard, Clock, Filter, X, ChevronDown, Maximize2, Minimize2, ChevronRight } from 'lucide-react';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export default function Analysis() {
  const [mounted, setMounted] = useState(false);
  const { transactions, accounts, deleteTransaction } = useStore();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Analysis State
  const [dateRange, setDateRange] = useState<'thisMonth' | 'lastMonth' | 'allTime'>('thisMonth');
  const [analysisType, setAnalysisType] = useState<'expense' | 'income'>('expense');

  // Transactions List State
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || '未知账户';

  // --- Analysis Data ---
  const analysisTransactions = useMemo(() => {
    const now = new Date();
    let start, end;

    if (dateRange === 'thisMonth') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (dateRange === 'lastMonth') {
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
    }

    return transactions.filter(t => {
      if (t.type === 'transfer') return false;
      if (dateRange === 'allTime') return true;
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: start!, end: end! });
    });
  }, [transactions, dateRange]);

  const categoryData = useMemo(() => {
    const typeTransactions = analysisTransactions.filter(t => t.type === analysisType);
    
    const grouped = typeTransactions.reduce((acc, t) => {
      const mainCat = t.category.split(' - ')[0];
      if (!acc[mainCat]) acc[mainCat] = 0;
      acc[mainCat] += t.amount;
      return acc;
    }, {} as Record<string, number>);

    return (Object.entries(grouped)
      .map(([name, value]) => ({ name, value })) as { name: string; value: number }[])
      .sort((a, b) => b.value - a.value);
  }, [analysisTransactions, analysisType]);

  const trendData = useMemo(() => {
    const grouped = transactions.reduce((acc, t) => {
      if (t.type === 'transfer') return acc;
      
      const month = t.date.substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, income: 0, expense: 0 };
      }
      
      if (t.type === 'income') acc[month].income += t.amount;
      if (t.type === 'expense') acc[month].expense += t.amount;
      
      return acc;
    }, {} as Record<string, { month: string; income: number; expense: number }>);

    return (Object.values(grouped) as { month: string; income: number; expense: number }[])
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [transactions]);

  const totalAmount = categoryData.reduce((sum, item) => sum + item.value, 0);

  // --- Transactions List Data ---
  const filteredTransactions = useMemo(() => transactions.filter(t => {
    if (activeTab !== 'all' && t.type !== activeTab) return false;
    if (filterDate && t.date !== filterDate) return false;
    if (filterAccount !== 'all' && t.accountId !== filterAccount) return false;
    if (filterKeyword) {
      const keyword = filterKeyword.toLowerCase();
      const matchCategory = t.category.toLowerCase().includes(keyword);
      const matchNote = t.note?.toLowerCase().includes(keyword);
      if (!matchCategory && !matchNote) return false;
    }
    return true;
  }), [transactions, activeTab, filterDate, filterAccount, filterKeyword]);

  const grouped = useMemo(() => filteredTransactions.reduce((acc, curr) => {
    const month = curr.date.substring(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(curr);
    return acc;
  }, {} as Record<string, typeof transactions>), [filteredTransactions]);

  const sortedMonths = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  const toggleMonth = (month: string) => {
    setCollapsedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  const isAllCollapsed = sortedMonths.every(month => collapsedMonths[month]);

  const toggleAll = () => {
    const newState = !isAllCollapsed;
    const newCollapsedState: Record<string, boolean> = {};
    sortedMonths.forEach(month => {
      newCollapsedState[month] = newState;
    });
    setCollapsedMonths(newCollapsedState);
  };

  if (!mounted) return <div className="p-8 text-center text-zinc-500">加载中...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">收支分析与明细</h1>
          <p className="text-zinc-500">多维度洞察并追踪您的每一笔资金流向</p>
        </div>
        
        <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl w-fit">
          {(['thisMonth', 'lastMonth', 'allTime'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap",
                dateRange === range 
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {range === 'thisMonth' ? '本月' : range === 'lastMonth' ? '上月' : '全部时间'}
            </button>
          ))}
        </div>
      </header>

      {/* Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-6 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">分类构成</h2>
            <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
              {(['expense', 'income'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setAnalysisType(type)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    analysisType === type 
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
                      : "text-zinc-500"
                  )}
                >
                  {type === 'expense' ? '支出' : '收入'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `¥${value.toFixed(2)}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                该时间段暂无{analysisType === 'expense' ? '支出' : '收入'}记录
              </div>
            )}
            
            {categoryData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-10%' }}>
                <span className="text-sm text-zinc-500 mb-1">总{analysisType === 'expense' ? '支出' : '收入'}</span>
                <span className="text-2xl font-bold font-mono">¥{totalAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-6 flex flex-col h-[400px]">
          <div className="mb-6">
            <h2 className="text-xl font-bold">收支趋势 (近6个月)</h2>
          </div>
          <div className="flex-1 min-h-0">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f4f4f5', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => `¥${value.toFixed(2)}`}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '20px' }}
                  />
                  <Bar dataKey="expense" name="支出" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="income" name="收入" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400">
                暂无历史趋势数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">收支明细</h2>
          
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar">
            <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
              {(['all', 'expense', 'income'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap",
                    activeTab === tab 
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {tab === 'all' ? '全部' : tab === 'expense' ? '支出' : '收入'}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "p-2.5 rounded-xl border transition-colors flex-shrink-0",
                isFilterOpen || filterDate || filterKeyword || filterAccount !== 'all'
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
              title="筛选"
            >
              <Filter className="w-5 h-5" />
            </button>
            {sortedMonths.length > 0 && (
              <button 
                onClick={toggleAll}
                className="p-2.5 rounded-xl border bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
                title={isAllCollapsed ? "全部展开" : "全部收起"}
              >
                {isAllCollapsed ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-2">日期筛选</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-2">账户筛选</label>
                  <select
                    value={filterAccount}
                    onChange={(e) => setFilterAccount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                  >
                    <option value="all">所有账户</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-2">关键词搜索</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filterKeyword}
                      onChange={(e) => setFilterKeyword(e.target.value)}
                      placeholder="搜索分类、备注..."
                      className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all pr-8"
                    />
                    {filterKeyword && (
                      <button 
                        onClick={() => setFilterKeyword('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {(filterDate || filterKeyword || filterAccount !== 'all') && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
                  <button
                    onClick={() => {
                      setFilterDate('');
                      setFilterKeyword('');
                      setFilterAccount('all');
                    }}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    清除所有筛选
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 opacity-50" />
            </div>
            <p>暂无收支记录</p>
            <p className="text-sm mt-1">点击右下角按钮记一笔</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedMonths.map(month => {
              const monthTxs = grouped[month].sort((a, b) => b.date.localeCompare(a.date));
              const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
              const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

              return (
                <div key={month} className="space-y-4">
                  <div 
                    className="flex items-center justify-between sticky top-0 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md py-3 z-10 border-b border-zinc-200 dark:border-zinc-800 cursor-pointer group"
                    onClick={() => toggleMonth(month)}
                  >
                    <div className="flex items-center space-x-2">
                      <button className="p-1 rounded-md text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
                        {collapsedMonths[month] ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <h2 className="text-lg font-bold">{format(parseISO(`${month}-01`), 'yyyy年MM月')}</h2>
                    </div>
                    <div className="flex space-x-4 text-sm font-medium">
                      <span className="text-emerald-500">收入: ¥{income.toFixed(2)}</span>
                      <span className="text-rose-500">支出: ¥{expense.toFixed(2)}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {!collapsedMonths[month] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        {monthTxs.map((tx, idx) => (
                          <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                            className="bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors relative group"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-start md:items-center space-x-4">
                                <div className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center shadow-inner shrink-0",
                                  tx.type === 'income' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10'
                                )}>
                                  {tx.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                                </div>
                                <div className="space-y-1.5">
                                  <div className="font-semibold text-lg">{tx.category}</div>
                                  <div className="flex flex-wrap items-center text-xs text-zinc-500 gap-y-1.5 gap-x-3">
                                    <span className="flex items-center bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-400">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {tx.createdAt ? format(parseISO(tx.createdAt), 'yyyy-MM-dd HH:mm:ss') : `${tx.date} 00:00:00`}
                                    </span>
                                    <span className="flex items-center text-zinc-600 dark:text-zinc-400">
                                      <CreditCard className="w-3 h-3 mr-1" />
                                      {getAccountName(tx.accountId)}
                                    </span>
                                    {tx.note && (
                                      <span className="flex-1 min-w-0 md:max-w-md text-zinc-600 dark:text-zinc-400 border-l border-zinc-200 dark:border-zinc-700 pl-3">
                                        {tx.note}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-4 pt-4 md:pt-0 border-t border-zinc-100 dark:border-zinc-800 md:border-t-0 mt-4 md:mt-0">
                                <div className={cn(
                                  "text-xl font-bold font-mono tracking-tight",
                                  tx.type === 'income' ? 'text-emerald-500' : 'text-zinc-900 dark:text-white'
                                )}>
                                  {tx.type === 'income' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                                </div>
                                <button
                                  onClick={() => deleteTransaction(tx.id)}
                                  className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 md:opacity-0 group-hover:opacity-100 transition-all"
                                  title="删除记录"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
