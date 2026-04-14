'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { LayoutDashboard, Wallet, Box, CreditCard, Plus, TrendingUp, BarChart3, Tag, User as UserIcon, LogOut, Sun, Moon } from 'lucide-react';
import { RecordModal } from '@/components/RecordModal';
import { ProfileModal } from '@/components/ProfileModal';
import { IntroPage } from '@/components/IntroPage';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

import { ThemeToggleBtn } from '@/components/ThemeToggleBtn';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  
  const isGuestMode = useStore((state) => state.isGuestMode);
  const setGuestMode = useStore((state) => state.setGuestMode);
  const hasSeenIntro = useStore((state) => state.hasSeenIntro);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    return <IntroPage />;
  }

  return (
    <div className="flex h-screen text-zinc-900 dark:text-zinc-100 relative overflow-hidden bg-transparent">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        {mounted && theme === 'dark' ? (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] mix-blend-screen" />
            <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[100px] mix-blend-screen" />
          </>
        ) : mounted ? (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-200/40 blur-[100px] mix-blend-multiply" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/40 blur-[100px] mix-blend-multiply" />
            <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-teal-200/20 blur-[100px] mix-blend-multiply" />
          </>
        ) : null}
        
        {/* Subtle grid overlay */}
        <div className={`absolute inset-0 ${mounted && theme === 'dark' ? "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCA0MEwwIDBMMDAgME00MCAwTDQwIDQwTDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] mix-blend-overlay" : "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCA0MEwwIDBMMDAgME00MCAwTDQwIDQwTDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAwLCAwLCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] mix-blend-multiply"} opacity-50`} />
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl hidden md:flex flex-col relative z-10">
        <div className="h-16 flex items-center px-6 font-semibold text-lg tracking-tight">
          <img src="/icon.svg" alt="Logo" className="w-8 h-8 rounded-lg mr-3 shadow-sm" />
          智慧财务中心
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
                  'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'text-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                )
              }
            >
              <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-emerald-600 dark:text-emerald-400" : "")} />
              {item.label}
            </Link>
          )})}
        </nav>
        
        {/* User Auth Section (Sidebar) */}
        <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <div className="mb-4 flex items-center justify-between px-2 text-zinc-500 text-sm font-medium">
            <span>主题模式</span>
            {mounted && (
              <ThemeToggleBtn className="scale-75" />
            )}
          </div>
          {session?.user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 group">
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center overflow-hidden flex-1 hover:opacity-80 transition-opacity text-left"
                title="编辑个人资料"
              >
                {session.user.image ? (
                  <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full bg-zinc-200 shrink-0 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-zinc-500" />
                  </div>
                )}
                <span className="ml-3 text-sm font-medium truncate pr-2">
                  {session.user.name || 'User'}
                </span>
              </button>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 text-zinc-400 hover:text-rose-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
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
      <main className="flex-1 overflow-auto relative z-10 flex flex-col bg-transparent">
        <div className="md:hidden h-16 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between px-4 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl font-semibold sticky top-0 z-20">
          <div className="flex items-center">
            <img src="/icon.svg" alt="Logo" className="w-8 h-8 rounded-lg mr-3 shadow-sm" />
            智慧财务中心
          </div>
          <div className="flex items-center space-x-3">
            {mounted && (
              <ThemeToggleBtn className="scale-75" />
            )}
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
        <div className="p-6 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8 flex-1 w-full">
          {children}
        </div>
      </main>


      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl flex items-center justify-around px-4 z-20 pb-safe">
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
                  ? 'text-emerald-600 dark:text-emerald-400'
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
        className="fixed right-6 bottom-24 md:bottom-10 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center z-50 group"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Record Modal */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
