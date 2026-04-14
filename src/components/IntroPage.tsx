'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useTheme } from 'next-themes';
import { ArrowRight, BarChart3, Cloud, ShieldCheck, MessageCircle, Loader2, X } from 'lucide-react';
import { ThemeToggleBtn } from './ThemeToggleBtn';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

export function IntroPage() {
  const setHasSeenIntro = useStore((state) => state.setHasSeenIntro);
  const setGuestMode = useStore((state) => state.setGuestMode);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // QR Code state
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [sceneId, setSceneId] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);

  useEffect(() => setMounted(true), []);

  const theme = mounted ? resolvedTheme : 'dark';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQR && sceneId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/wechat/check?sceneId=${sceneId}&t=${Date.now()}`, {
            cache: 'no-store'
          });
          const data = await res.json();
          if (data.status === 'scanned') {
            clearInterval(interval);
            const signInResult = await signIn('wechat-qrcode', { 
              sceneId, 
              redirect: false 
            });
            
            if (signInResult?.ok) {
              setHasSeenIntro(true); // Proceed to app
              window.location.reload();
            } else {
              console.error('登录失败:', signInResult?.error);
              alert('登录失败，请重试');
              setShowQR(false);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [showQR, sceneId]);

  const handleWechatLogin = async () => {
    setIsLoadingQR(true);
    setShowQR(true);
    try {
      const res = await fetch('/api/wechat/qrcode');
      const data = await res.json();
      if (data.url && data.code) {
        setQrUrl(data.url);
        setSceneId(data.sceneId);
        setAuthCode(data.code);
      } else {
        alert('无法获取二维码，请检查后端配置');
        setShowQR(false);
      }
    } catch (e) {
      console.error(e);
      setShowQR(false);
    } finally {
      setIsLoadingQR(false);
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
            新一代智慧财务中心
          </span>
        </motion.div>
        
        <motion.h1 
          variants={itemVariants}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
        >
          智慧财务中心<br />
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
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleWechatLogin}
            className="group relative w-full sm:w-auto px-8 py-4 bg-[#07C160] hover:bg-[#06ad56] text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(7,193,96,0.3)] hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <div className="relative flex items-center justify-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              微信关注登录
            </div>
          </button>

          <button
            onClick={handleGuestLogin}
            className={`group w-full sm:w-auto px-8 py-4 border rounded-2xl font-bold text-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 flex items-center justify-center ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-black/5 hover:bg-black/10 border-black/10 text-slate-900'}`}
          >
            在线体验
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

      </motion.div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowQR(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-16 h-16 bg-[#07C160]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-[#07C160]" />
              </div>
              
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                扫码关注并发送验证码
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                请使用微信扫描下方二维码关注公众号<br/>并在公众号内回复下方 6 位数字完成登录
              </p>

              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl aspect-square flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700 relative mb-6">
                {isLoadingQR ? (
                  <div className="flex flex-col items-center text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-sm">正在加载二维码...</span>
                  </div>
                ) : (
                  qrUrl && (
                    <img 
                      src={qrUrl} 
                      alt="微信登录二维码" 
                      className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
                    />
                  )
                )}
              </div>
              
              {!isLoadingQR && authCode && (
                <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
                  <div className="text-xs text-zinc-500 mb-1">您的专属验证码</div>
                  <div className="text-3xl font-mono font-bold tracking-[0.25em] text-[#07C160]">
                    {authCode}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-zinc-400 mt-6 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 mr-1" />
                您的信息将受到严格保护
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
