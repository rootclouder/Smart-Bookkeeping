"use client";
import { useState, useEffect } from 'react';
import { useStore, Category } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, X, ChevronDown, ChevronRight, FolderTree, Tag } from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to render lucide icons dynamically
const IconByName = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Tag className={className} />;
  return <IconComponent className={className} />;
};

const COMMON_ICONS = [
  'Utensils', 'Bus', 'ShoppingBag', 'Home', 'Film', 'HeartPulse', 'CreditCard',
  'Wallet', 'TrendingUp', 'Briefcase', 'Gift', 'PlusCircle', 'Tag', 'Coffee',
  'Car', 'Smartphone', 'Book', 'Music', 'Plane', 'ShoppingCart', 'Zap'
];

export default function Categories() {
  const [mounted, setMounted] = useState(false);
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    type: 'expense',
    icon: 'Tag',
    parentId: undefined
  });

  const filteredCategories = categories.filter(c => c.type === activeTab);
  const topLevelCategories = filteredCategories.filter(c => !c.parentId);

  const getSubcategories = (parentId: string) => {
    return filteredCategories.filter(c => c.parentId === parentId);
  };

  const handleOpenModal = (parentId?: string, editCat?: Category) => {
    if (editCat) {
      setEditingId(editCat.id);
      setFormData({
        name: editCat.name,
        type: editCat.type,
        icon: editCat.icon || 'Tag',
        parentId: editCat.parentId
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        type: activeTab,
        icon: 'Tag',
        parentId: parentId
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', type: activeTab, icon: 'Tag', parentId: undefined });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingId) {
      updateCategory(editingId, formData);
    } else {
      addCategory(formData as Omit<Category, 'id'>);
    }
    handleCloseModal();
  };

  const toggleExpand = (id: string) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!mounted) return <div className="p-8 text-center text-zinc-500">加载中...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">分类管理</h1>
          <p className="text-zinc-500">自定义您的收支分类与层级</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
            {(['expense', 'income'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 text-sm font-bold rounded-lg transition-all",
                  activeTab === tab 
                    ? "bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-900 dark:text-white shadow-sm border border-white/20 dark:border-white/10" 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                {tab === 'expense' ? '支出分类' : '收入分类'}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl transition-colors font-bold text-sm shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增主分类
          </button>
        </div>
      </header>

      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border-white/20 dark:border-white/10 rounded-3xl shadow-sm border overflow-hidden">
        {topLevelCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <FolderTree className="w-8 h-8 opacity-50" />
            </div>
            <p>暂无分类数据</p>
            <p className="text-sm mt-1">点击右上角按钮添加分类</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {topLevelCategories.map(cat => {
              const subcats = getSubcategories(cat.id);
              const isExpanded = expandedCats[cat.id];
              
              return (
                <div key={cat.id} className="group/item">
                  <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => subcats.length > 0 && toggleExpand(cat.id)}
                        className={cn(
                          "p-1 rounded-md transition-colors",
                          subcats.length > 0 ? "text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700" : "opacity-0 cursor-default"
                        )}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                        cat.type === 'income' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10'
                      )}>
                        <IconByName name={cat.icon || 'Tag'} className="w-5 h-5" />
                      </div>
                      
                      <div>
                        <div className="font-bold text-base text-zinc-900 dark:text-zinc-100">{cat.name}</div>
                        {subcats.length > 0 && (
                          <div className="text-xs text-zinc-500 mt-0.5">{subcats.length} 个子分类</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(cat.id)}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors mr-2"
                      >
                        添加子分类
                      </button>
                      <button 
                        onClick={() => handleOpenModal(undefined, cat)} 
                        className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('确定要删除该分类吗？如果是主分类，其下的子分类也会被一并删除。')) {
                            deleteCategory(cat.id);
                          }
                        }} 
                        className="p-2 text-zinc-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && subcats.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50"
                      >
                        <div className="pl-14 pr-4 sm:pr-5 pb-2">
                          <div className="border-l-2 border-zinc-100 dark:border-zinc-800 pl-4 py-2 space-y-1">
                            {subcats.map(sub => (
                              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors group/sub">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{sub.name}</span>
                                </div>
                                
                                <div className="flex items-center space-x-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleOpenModal(cat.id, sub)} 
                                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (window.confirm('确定要删除该子分类吗？')) deleteCategory(sub.id);
                                    }} 
                                    className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
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
              onSubmit={handleSubmit}
              className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-white/30 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl border w-full max-w-md relative z-10"
            >
              <button 
                type="button"
                onClick={handleCloseModal}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">
                {editingId ? '编辑分类' : formData.parentId ? '新增子分类' : '新增主分类'}
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-2">分类名称</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    placeholder="例如：餐饮、购物、工资..."
                  />
                </div>

                {!formData.parentId && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-2">选择图标</label>
                    <div className="grid grid-cols-7 gap-2">
                      {COMMON_ICONS.map(iconName => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: iconName })}
                          className={cn(
                            "aspect-square rounded-xl flex items-center justify-center transition-all",
                            formData.icon === iconName
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                              : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                          )}
                        >
                          <IconByName name={iconName} className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.parentId && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-2">所属主分类</label>
                    <div className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-500 font-medium">
                      {categories.find(c => c.id === formData.parentId)?.name || '未知分类'}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold transition-all shadow-lg shadow-zinc-500/20 active:scale-[0.98]"
                >
                  保存分类
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}