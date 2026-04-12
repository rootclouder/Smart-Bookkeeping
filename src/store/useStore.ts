import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { fetchInitialData, syncStateToDb } from '@/actions/finance';

const postgresStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const data = await fetchInitialData();
      if (data) {
        return JSON.stringify({ state: data, version: 1 });
      }
    } catch (e) {
      console.warn("Failed to fetch from DB, falling back to local");
    }
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    localStorage.setItem(name, value);
    try {
      const parsed = JSON.parse(value);
      await syncStateToDb(parsed.state);
    } catch (e) {
      console.warn("Failed to sync to DB", e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    localStorage.removeItem(name);
  },
};

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'credit';
  balance: number;
  repaymentDay?: number; // 还款日 (1-31) 仅针对信用卡
  dueAmount?: number; // 还款日待还金额
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  date: string;
  note?: string;
  itemId?: string; // 关联的物品ID
  createdAt?: string; // 记录创建时间(包含时分秒)
}
export interface Item {
  id: string;
  name: string;
  value: number;
  purchaseDate: string;
  categoryId?: string;
}

export interface ItemCategory {
  id: string;
  name: string;
}

export interface InstallmentRecord {
  id: string;
  dueDate: string;
  principal: number;
  interest: number;
  isPaid: boolean;
  transactionId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  parentId?: string; // null means it's a top-level category
}

export interface InvestmentRecord {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // 盈亏金额
}

export interface Investment {
  id: string;
  name: string;
  type: 'stock' | 'fund' | 'gold';
  amount: number; // 持有金额
  returns: number; // 持有收益
  records?: InvestmentRecord[]; // 盈亏记录
  transactionIds?: string[]; // 记录交易流水ID
}

export interface Debt {
  id: string;
  name: string;
  platform?: string; // 负债平台
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  isInstallment: boolean;
  installmentPrincipal?: number;
  installmentInterest?: number;
  installments?: InstallmentRecord[];
  transactionIds?: string[]; // 记录该负债的所有还款流水ID
  isCreditAccount?: boolean;
  accountId?: string;
  dueAmount?: number;
  repaymentDay?: number;
}

interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  items: Item[];
  itemCategories: ItemCategory[];
  debts: Debt[];
  investments: Investment[];
  categories: Category[];
  
  // Actions
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  
  addTransaction: (transaction: Omit<Transaction, 'id'> & { id?: string }, createItem?: boolean, itemName?: string) => void;
  deleteTransaction: (id: string) => void;
  
  addItem: (item: Omit<Item, 'id'>) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, item: Partial<Item>) => void;

  addItemCategory: (category: Omit<ItemCategory, 'id'>) => void;
  updateItemCategory: (id: string, category: Partial<ItemCategory>) => void;
  deleteItemCategory: (id: string) => void;
  
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  updateDebt: (id: string, debt: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;

  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, investment: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  addInvestmentRecord: (investmentId: string, record: Omit<InvestmentRecord, 'id'>) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      accounts: [
        { id: '1', name: '现金钱包', type: 'cash', balance: 0 },
      ],
      transactions: [],
      items: [],
      itemCategories: [
        { id: 'cat_electronics', name: '电子产品' },
        { id: 'cat_vehicle', name: '交通工具' },
        { id: 'cat_jewelry', name: '珠宝首饰' },
        { id: 'cat_furniture', name: '家具家电' },
        { id: 'cat_other', name: '其他物品' },
      ],
      debts: [],
      investments: [],
      categories: [
        // Default Expense Categories
        { id: 'exp-1', name: '餐饮美食', type: 'expense', icon: 'Utensils' },
        { id: 'exp-1-1', name: '早餐', type: 'expense', parentId: 'exp-1' },
        { id: 'exp-1-2', name: '午餐', type: 'expense', parentId: 'exp-1' },
        { id: 'exp-1-3', name: '晚餐', type: 'expense', parentId: 'exp-1' },
        { id: 'exp-2', name: '交通出行', type: 'expense', icon: 'Bus' },
        { id: 'exp-2-1', name: '公交地铁', type: 'expense', parentId: 'exp-2' },
        { id: 'exp-2-2', name: '打车', type: 'expense', parentId: 'exp-2' },
        { id: 'exp-3', name: '购物', type: 'expense', icon: 'ShoppingBag' },
        { id: 'exp-3-1', name: '服饰鞋包', type: 'expense', parentId: 'exp-3' },
        { id: 'exp-3-2', name: '日用品', type: 'expense', parentId: 'exp-3' },
        { id: 'exp-4', name: '居住', type: 'expense', icon: 'Home' },
        { id: 'exp-4-1', name: '房租', type: 'expense', parentId: 'exp-4' },
        { id: 'exp-4-2', name: '水电煤', type: 'expense', parentId: 'exp-4' },
        { id: 'exp-5', name: '娱乐', type: 'expense', icon: 'Film' },
        { id: 'exp-6', name: '医疗', type: 'expense', icon: 'HeartPulse' },
        { id: 'exp-7', name: '还款', type: 'expense', icon: 'CreditCard' },
        
        // Default Income Categories
        { id: 'inc-1', name: '工资', type: 'income', icon: 'Wallet' },
        { id: 'inc-2', name: '理财收益', type: 'income', icon: 'TrendingUp' },
        { id: 'inc-3', name: '兼职', type: 'income', icon: 'Briefcase' },
        { id: 'inc-4', name: '红包', type: 'income', icon: 'Gift' },
        { id: 'inc-5', name: '其他收入', type: 'income', icon: 'PlusCircle' },
      ],

      addAccount: (account) =>
        set((state) => ({
          accounts: [...state.accounts, { ...account, id: crypto.randomUUID() }],
        })),
        
      updateAccount: (id, updatedFields) =>
        set((state) => ({
          accounts: state.accounts.map((acc) =>
            acc.id === id ? { ...acc, ...updatedFields } : acc
          ),
        })),
        
      deleteAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((acc) => acc.id !== id),
          // Option: Also remove related transactions?
        })),

      addTransaction: (transaction, createItem, itemName) =>
        set((state) => {
          const tId = transaction.id || crypto.randomUUID();
          let newItem: Item | null = null;
          
          if (createItem && itemName && transaction.type === 'expense') {
            newItem = {
              id: crypto.randomUUID(),
              name: itemName,
              value: transaction.amount,
              purchaseDate: transaction.date,
            };
            transaction.itemId = newItem.id;
          }

          // Update account balance
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === transaction.accountId) {
              const modifier = transaction.type === 'income' ? 1 : -1;
              return { ...acc, balance: acc.balance + transaction.amount * modifier };
            }
            return acc;
          });

          return {
            transactions: [{ ...transaction, id: tId, createdAt: new Date().toISOString() }, ...state.transactions],
            accounts: updatedAccounts,
            items: newItem ? [newItem, ...state.items] : state.items,
          };
        }),
        
      deleteTransaction: (id) =>
        set((state) => {
          const transaction = state.transactions.find((t) => t.id === id);
          if (!transaction) return state;

          // Revert account balance
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === transaction.accountId) {
              const modifier = transaction.type === 'income' ? -1 : 1; // reverse
              return { ...acc, balance: acc.balance + transaction.amount * modifier };
            }
            return acc;
          });

          // Revert item creation if applicable
          let updatedItems = state.items;
          if (transaction.itemId) {
            updatedItems = state.items.filter((item) => item.id !== transaction.itemId);
          }

          // Revert debt if applicable
          const updatedDebts = state.debts.map((debt) => {
            if (debt.transactionIds?.includes(id)) {
              let newPaidAmount = debt.paidAmount;
              let newInstallments = debt.installments;

              // Revert installment
              if (debt.isInstallment && debt.installments) {
                newInstallments = debt.installments.map(inst => {
                  if (inst.transactionId === id) {
                    newPaidAmount = Math.max(0, newPaidAmount - (inst.principal + inst.interest));
                    return { ...inst, isPaid: false, transactionId: undefined };
                  }
                  return inst;
                });
              } else {
                // Revert regular debt payment
                newPaidAmount = Math.max(0, newPaidAmount - transaction.amount);
              }

              return {
                ...debt,
                paidAmount: newPaidAmount,
                installments: newInstallments,
                transactionIds: debt.transactionIds.filter(tId => tId !== id)
              };
            }
            return debt;
          });

          // Revert investment if applicable
          const updatedInvestments = state.investments.map((inv) => {
            if (inv.transactionIds?.includes(id)) {
              let newAmount = inv.amount;
              // If it was a buy (expense), reverting it decreases investment amount
              // If it was a sell (income), reverting it increases investment amount
              if (transaction.type === 'expense') {
                newAmount = Math.max(0, newAmount - transaction.amount);
              } else if (transaction.type === 'income') {
                newAmount += transaction.amount;
              }
              
              return {
                ...inv,
                amount: newAmount,
                transactionIds: inv.transactionIds.filter(tId => tId !== id)
              };
            }
            return inv;
          });

          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            accounts: updatedAccounts,
            items: updatedItems,
            debts: updatedDebts,
            investments: updatedInvestments
          };
        }),

      addItem: (item) =>
        set((state) => ({
          items: [{ ...item, id: crypto.randomUUID() }, ...state.items],
        })),
        
      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateItem: (id, item) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...item } : i)),
        })),

      addItemCategory: (category) =>
        set((state) => ({
          itemCategories: [{ ...category, id: crypto.randomUUID() }, ...state.itemCategories],
        })),
      updateItemCategory: (id, category) =>
        set((state) => ({
          itemCategories: state.itemCategories.map((c) => (c.id === id ? { ...c, ...category } : c)),
        })),
      deleteItemCategory: (id) =>
        set((state) => ({
          itemCategories: state.itemCategories.filter((c) => c.id !== id),
          items: state.items.map(item => item.categoryId === id ? { ...item, categoryId: undefined } : item)
        })),

      addDebt: (debt) =>
        set((state) => ({
          debts: [{ ...debt, id: crypto.randomUUID() }, ...state.debts],
        })),
        
      updateDebt: (id, updatedFields) =>
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === id ? { ...d, ...updatedFields } : d
          ),
        })),
        
      deleteDebt: (id) =>
        set((state) => {
          const debtToDelete = state.debts.find(d => d.id === id);
          let updatedAccounts = state.accounts;
          let updatedTransactions = state.transactions;

          if (debtToDelete?.transactionIds && debtToDelete.transactionIds.length > 0) {
            debtToDelete.transactionIds.forEach(tId => {
              const transaction = updatedTransactions.find(t => t.id === tId);
              if (transaction) {
                updatedAccounts = updatedAccounts.map((acc) => {
                  if (acc.id === transaction.accountId) {
                    const modifier = transaction.type === 'income' ? -1 : 1; // reverse
                    return { ...acc, balance: acc.balance + transaction.amount * modifier };
                  }
                  return acc;
                });
                updatedTransactions = updatedTransactions.filter(t => t.id !== tId);
              }
            });
          }

          return {
            debts: state.debts.filter((d) => d.id !== id),
            accounts: updatedAccounts,
            transactions: updatedTransactions
          };
        }),

      addInvestment: (investment) =>
        set((state) => ({
          investments: [{ ...investment, id: crypto.randomUUID() }, ...state.investments],
        })),
        
      updateInvestment: (id, updatedFields) =>
        set((state) => ({
          investments: state.investments.map((inv) =>
            inv.id === id ? { ...inv, ...updatedFields } : inv
          ),
        })),
        
      deleteInvestment: (id) =>
        set((state) => {
          const invToDelete = state.investments.find(inv => inv.id === id);
          let updatedAccounts = state.accounts;
          let updatedTransactions = state.transactions;

          if (invToDelete?.transactionIds && invToDelete.transactionIds.length > 0) {
            invToDelete.transactionIds.forEach(tId => {
              const transaction = updatedTransactions.find(t => t.id === tId);
              if (transaction) {
                updatedAccounts = updatedAccounts.map((acc) => {
                  if (acc.id === transaction.accountId) {
                    const modifier = transaction.type === 'income' ? -1 : 1; // reverse
                    return { ...acc, balance: acc.balance + transaction.amount * modifier };
                  }
                  return acc;
                });
                updatedTransactions = updatedTransactions.filter(t => t.id !== tId);
              }
            });
          }

          return {
            investments: state.investments.filter((inv) => inv.id !== id),
            accounts: updatedAccounts,
            transactions: updatedTransactions
          };
        }),

      addInvestmentRecord: (investmentId, record) =>
        set((state) => {
          const newRecord = { ...record, id: crypto.randomUUID() };
          return {
            investments: state.investments.map((inv) => {
              if (inv.id === investmentId) {
                // Update the investment amounts directly when a new record is added
                const newAmount = inv.amount + record.amount;
                const newReturns = inv.returns + record.amount;
                return {
                  ...inv,
                  amount: newAmount,
                  returns: newReturns,
                  records: inv.records ? [...inv.records, newRecord] : [newRecord]
                };
              }
              return inv;
            }),
          };
        }),

      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, { ...category, id: crypto.randomUUID() }],
        })),

      updateCategory: (id, updatedFields) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updatedFields } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id && c.parentId !== id),
        })),
    }),
    {
      name: 'finance-store',
      version: 1,
      storage: createJSONStorage(() => postgresStorage),
      skipHydration: true,
    }
  )
);
