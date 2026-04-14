"use client";
import { useState, useEffect } from 'react';
import { useStore, Item, ItemCategory } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Plus, Trash2, Edit3, Calendar, X, Settings2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Items() {
  const [mounted, setMounted] = useState(false);
  const { items, itemCategories, addItem, deleteItem, updateItem, addItemCategory, updateItemCategory, deleteItemCategory } = useStore();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // State for active category tab ('all' or category ID)
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Add/Edit Item Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<Item>>({ name: '', value: 0, purchaseDate: format(new Date(), 'yyyy-MM-dd'), categoryId: '' });

  // Category Management Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const filteredItems = items.filter(item => activeCategory === 'all' || item.categoryId === activeCategory);
  const totalValue = filteredItems.reduce((sum, item) => sum + item.value, 0);

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.purchaseDate) return;
    
    if (editingId) {
      updateItem(editingId, {
        name: newItem.name,
        value: Number(newItem.value) || 0,
        purchaseDate: newItem.purchaseDate,
        categoryId: newItem.categoryId || undefined
      });
    } else {
      addItem({
        name: newItem.name,
        value: Number(newItem.value) || 0,
        purchaseDate: newItem.purchaseDate,
        categoryId: newItem.categoryId || undefined
      });
    }
    
    setIsAdding(false);
    setEditingId(null);
    setNewItem({ name: '', value: 0, purchaseDate: format(new Date(), 'yyyy-MM-dd'), categoryId: '' });
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setNewItem({
      name: item.name,
      value: item.value,
      purchaseDate: item.purchaseDate,
      categoryId: item.categoryId || ''
    });
    setIsAdding(true);
  };

  const closeItemModal = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewItem({ name: '', value: 0, purchaseDate: format(new Date(), 'yyyy-MM-dd'), categoryId: '' });
  };

  // Category Management Handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addItemCategory({ name: newCatName.trim() });
    setNewCatName('');
  };

  const handleUpdateCategory = (id: string) => {
    if (!editingCatName.trim()) return;
    updateItemCategory(id, { name: editingCatName.trim() });
    setEditingCatId(null);
    setEditingCatName('');
  };

  const startEditCategory = (cat: ItemCategory) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleDeleteCategory = (id: string) => {
    if (activeCategory === id) setActiveCategory('all');
    deleteItemCategory(id);
  };

  if (!mounted) return <div className="p-8 text-center text-zinc-500">加载中...</div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">物品管理</h1>
          <p className="text-zinc-500">记录和估算您的高价值物品资产</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-zinc-500">
            {activeCategory === 'all' ? '总估值' : `${itemCategories.find(c => c.id === activeCategory)?.name} 总估值`}
          </div>
          <div className="text-2xl font-bold text-indigo-500 dark:text-indigo-400">¥{totalValue.toFixed(2)}</div>
        </div>
      </header>

      {/* Categories Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl min-w-fit">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap",
              activeCategory === 'all' 
                ? "bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-900 dark:text-white shadow-sm border border-white/20 dark:border-white/10" 
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            全部物品
          </button>
          {itemCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap",
                activeCategory === cat.id 
                  ? "bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-900 dark:text-white shadow-sm border border-white/20 dark:border-white/10" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setIsCatModalOpen(true)}
          className="flex items-center justify-center p-2.5 rounded-xl border bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md border-white/20 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors flex-shrink-0 shadow-sm"
          title="分类管理"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border-white/20 dark:border-white/10 p-6 rounded-3xl shadow-sm border relative group overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
            
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shadow-inner">
                <Box className="w-6 h-6" />
              </div>
              <div className="flex">
                <button
                  onClick={() => startEdit(item)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-400 hover:text-indigo-500"
                  title="编辑物品"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-400 hover:text-rose-500"
                  title="删除物品"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-1">{item.name}</h3>
              {item.categoryId && (
                <div className="inline-block px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 rounded-md mb-2">
                  {itemCategories.find(c => c.id === item.categoryId)?.name || '未知分类'}
                </div>
              )}
              <div className="text-2xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400 mb-4">
                ¥{item.value.toFixed(2)}
              </div>
              <div className="text-sm font-medium text-zinc-500">
                <Calendar className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                {format(parseISO(item.purchaseDate), 'yyyy-MM-dd')}
              </div>
            </div>
          </motion.div>
        ))}

        {!isAdding && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdding(true)}
            className="h-full min-h-[220px] bg-zinc-50 dark:bg-zinc-800/30 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-3xl flex flex-col items-center justify-center text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors"
          >
            <Plus className="w-8 h-8 mb-3" />
            <span className="font-medium text-lg">新增物品</span>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeItemModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onSubmit={handleAddOrUpdate}
              className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-white/30 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl border w-full max-w-md relative z-10 max-h-[90vh] flex flex-col"
            >
              <button 
                type="button"
                onClick={closeItemModal}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">{editingId ? '编辑物品' : '新增物品'}</h3>
              
              <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar -mx-2 px-2 pb-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">物品名称</label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="例如：MacBook Pro M3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">当前估值 (¥)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItem.value === 0 ? '' : newItem.value}
                    onChange={(e) => setNewItem({ ...newItem, value: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">物品分类</label>
                  <select
                    value={newItem.categoryId || ''}
                    onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">无分类</option>
                    {itemCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">购入日期</label>
                  <input
                    type="date"
                    required
                    value={newItem.purchaseDate}
                    onChange={(e) => setNewItem({ ...newItem, purchaseDate: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98]"
                >
                  {editingId ? '保存修改' : '保存物品'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <AnimatePresence>
        {isCatModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCatModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-white/30 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl border w-full max-w-md relative z-10 flex flex-col max-h-[80vh]"
            >
              <button 
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">物品分类管理</h3>

              <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-2">
                <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                    placeholder="输入新分类名称"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                  >
                    添加
                  </button>
                </form>

                <div className="space-y-2">
                  {itemCategories.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">暂无自定义分类</div>
                  ) : (
                    itemCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl group">
                        {editingCatId === cat.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateCategory(cat.id)}
                              className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setEditingCatId(null)}
                              className="text-xs font-bold text-zinc-500 bg-zinc-200/50 px-2 py-1.5 rounded-lg"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditCategory(cat)}
                                className="p-1.5 text-zinc-400 hover:text-indigo-500 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                title="编辑"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
