'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, Wallet, Box, CreditCard, Plus, TrendingUp, BarChart3, Tag, User as UserIcon, LogOut } from 'lucide-react';
import { RecordModal } from '@/components/RecordModal';
import { WelcomePage } from '@/components/WelcomePage';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  const isGuestMode = useStore((state) => state.isGuestMode);
  const setGuestMode = useStore((state) => state.setGuestMode);

  useEffect(() => {
    // Rehydrate state after auth resolves to prevent mismatch
    if (status !== 'loading') {
      useStore.persist.rehydrate();
    }
  }, [status]);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: '总览' },
    { to: '/assets', icon: Wallet, label: '资产管理' },
    { to: '/investments', icon: TrendingUp, label: '理财管理' },
    { to: '/analysis', icon: BarChart3, label: '收支分析' },
    { to: '/categories', icon: Tag, label: '分类管理' },
    { to: '/items', icon: Box, label: '物品管理' },
    { to: '/debts', icon: CreditCard, label: '负债管理' },
  ];

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' && !isGuestMode) {
    return <WelcomePage />;
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 font-semibold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center mr-3">
            ¥
          </div>
          智慧财务管理
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
            <Link
              key={item.to}
              href={item.to}
              className={
                cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          )})}
        </nav>
        
        {/* User Auth Section (Sidebar) */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          {session?.user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center overflow-hidden">
                {session.user.image ? (
                  <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full bg-zinc-200 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-zinc-500" />
                  </div>
                )}
                <span className="ml-3 text-sm font-medium truncate pr-2">
                  {session.user.name || 'User'}
                </span>
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 text-zinc-400 hover:text-rose-500 transition-colors shrink-0"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-zinc-500" />
                </div>
                <span className="ml-3 text-sm font-medium truncate pr-2 text-zinc-500">
                  在线体验
                </span>
              </div>
              <button 
                onClick={() => setGuestMode(false)}
                className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors shrink-0"
                title="返回登录页"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="md:hidden h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white dark:bg-zinc-900 font-semibold">
          智慧财务管理
          <div className="flex items-center">
            {session?.user ? (
              <button onClick={() => signOut({ callbackUrl: '/' })}>
                {session.user.image ? (
                  <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-zinc-500" />
                  </div>
                )}
              </button>
            ) : (
              <button 
                onClick={() => setGuestMode(false)}
                className="text-xs px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                在线体验
              </button>
            )}
          </div>
        </div>
        <div className="p-6 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>


      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex justify-around items-center px-2 z-40">
        {navItems.map((item) => {
          const isActive = pathname === item.to;
          return (
          <Link
            key={item.to}
            href={item.to}
            className={
              cn(
                'flex flex-col items-center justify-center w-full h-full text-xs transition-colors',
                isActive
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              )
            }
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="scale-90">{item.label}</span>
          </Link>
        )})}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsRecordModalOpen(true)}
        className="fixed right-6 bottom-24 md:bottom-10 w-14 h-14 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center z-50 group"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Record Modal */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />
    </div>
  );
}
