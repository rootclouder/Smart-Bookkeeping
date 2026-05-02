'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useTheme } from 'next-themes';
import { ArrowRight, BarChart3, Cloud, Loader2, ShieldCheck } from 'lucide-react';
import { ThemeToggleBtn } from './ThemeToggleBtn';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

export function IntroPage() {
  const setHasSeenIntro = useStore((state) => state.setHasSeenIntro);
  const setGuestMode = useStore((state) => state.setGuestMode);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => setMounted(true), []);

  const theme = mounted ? resolvedTheme : 'dark';

  const handleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await signIn('credentials', { username, password, redirect: false });
      if (result?.ok) {
        setGuestMode(false);
        setHasSeenIntro(true);
        return;
      }
      setError(result?.error || '登录失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || '注册失败');
        return;
      }
      const result = await signIn('credentials', { username, password, redirect: false });
      if (result?.ok) {
        setGuestMode(false);
        setHasSeenIntro(true);
        return;
      }
      setError(result?.error || '登录失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = () => {
    setHasSeenIntro(true);
    setGuestMode(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col justify-center items-center font-sans ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {theme === 'dark' ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px] mix-blend-screen" />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/40 blur-[100px] mix-blend-multiply" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-200/40 blur-[100px] mix-blend-multiply" />
          </>
        )}
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            <img src="/icon.svg" alt="Logo" className="w-10 h-10 rounded-2xl shadow-sm" />
            <div>
              <div className="text-lg font-semibold tracking-tight">智慧财务中心</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">账号数据与游客数据隔离</div>
            </div>
          </div>
          <ThemeToggleBtn className="scale-90" />
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-white/30 dark:border-white/10 rounded-3xl shadow-2xl border p-6 md:p-7">
          <div className="flex items-center justify-between mb-5">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${mode === 'login' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border border-white/20 dark:border-white/10'}`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${mode === 'register' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border border-white/20 dark:border-white/10'}`}
              >
                注册
              </button>
            </div>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="text-xs px-3 py-2 rounded-xl bg-white/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border border-white/20 dark:border-white/10 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
            >
              游客体验
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-zinc-500 mb-1">用户名</div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>

            {mode === 'register' && (
              <div>
                <div className="text-xs text-zinc-500 mb-1">显示名称（可选）</div>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                  placeholder="用于页面展示"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <div className="text-xs text-zinc-500 mb-1">密码</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                placeholder="请输入密码"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div>
                <div className="text-xs text-zinc-500 mb-1">确认密码</div>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                  placeholder="再次输入密码"
                  type="password"
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="text-xs text-rose-500 pt-1">{error}</div>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={mode === 'login' ? handleLogin : handleRegister}
              className="w-full mt-2 px-4 py-3 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center">继续 <ArrowRight className="w-4 h-4 ml-2" /></span>}
            </button>

            <div className="flex items-center justify-center text-xs text-zinc-400 pt-3">
              <ShieldCheck className="w-4 h-4 mr-1" />
              密码仅用于本系统登录
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6 grid grid-cols-2 gap-3 text-xs text-zinc-500">
          <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 flex items-center space-x-3">
            <Cloud className="w-4 h-4 text-blue-500" />
            <div>登录后数据云端同步</div>
          </div>
          <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 flex items-center space-x-3">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <div>总览与分析实时更新</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
