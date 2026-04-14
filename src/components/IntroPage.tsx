'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useTheme } from 'next-themes';
import { ArrowRight, BarChart3, Cloud, ShieldCheck } from 'lucide-react';
import { ThemeToggleBtn } from './ThemeToggleBtn';
import { useEffect, useState } from 'react';

export function IntroPage() {
  const setHasSeenIntro = useStore((state) => state.setHasSeenIntro);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const theme = mounted ? resolvedTheme : 'dark';

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
    <div className={`min-h-screen relative overflow-hidden flex flex-col justify-center items-center font-sans transition-colors duration-1000 ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Decorative Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {theme === 'dark' ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] mix-blend-screen" />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200/40 blur-[100px] mix-blend-multiply" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/40 blur-[100px] mix-blend-multiply" />
          </>
        )}
      </div>

      {/* Top Header / Actions */}
      <div className="absolute top-0 right-0 p-6 z-50">
        <ThemeToggleBtn />
      </div>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className={`inline-flex items-center space-x-2 border rounded-full px-4 py-1.5 mb-8 backdrop-blur-md ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
          <span className={`text-xs font-medium tracking-wide ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'}`}>
            个人财务可视化中心
          </span>
        </motion.div>
        
        <motion.h1 
          variants={itemVariants}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
        >
          清晰掌控<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500">
            每一分财富流向
          </span>
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className={`text-lg sm:text-xl mb-12 max-w-2xl font-light leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}
        >
          极简设计与强大分析的完美结合。在这里，记账不再繁琐，而是重塑财富轨迹的开始。
        </motion.p>
        
        {/* Features */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12">
          {[
            { icon: BarChart3, title: '多维度可视化', desc: '收支图表、资产分布一目了然' },
            { icon: Cloud, title: '云端同步', desc: '多设备实时更新，数据永不丢失' },
            { icon: ShieldCheck, title: '隐私安全', desc: '本地+云端双重加密保护' }
          ].map((feature, i) => (
            <div key={i} className={`p-6 rounded-2xl flex flex-col items-center border backdrop-blur-sm ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/50 border-black/5 shadow-sm'}`}>
              <div className={`p-3 rounded-xl mb-4 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-indigo-50 text-indigo-600'}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className={`text-sm text-center ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants}>
          <button
            onClick={() => setHasSeenIntro(true)}
            className="group relative px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl overflow-hidden flex items-center justify-center"
          >
            <span className="relative z-10 flex items-center">
              开启财务探索之旅
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
}
