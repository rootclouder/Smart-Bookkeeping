'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useStore } from '@/store/useStore';
import { MessageCircle, ArrowRight, ShieldCheck, Zap, LineChart, Loader2, X } from 'lucide-react';

export function WelcomePage() {
  const setGuestMode = useStore((state) => state.setGuestMode);
  
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [sceneId, setSceneId] = useState('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQR && sceneId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/wechat/check?sceneId=${sceneId}`);
          const data = await res.json();
          if (data.status === 'scanned') {
            clearInterval(interval);
            signIn('wechat-qrcode', { sceneId, callbackUrl: '/' });
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
      if (data.url) {
        setQrUrl(data.url);
        setSceneId(data.sceneId);
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
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex items-center justify-center font-sans">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[100px] mix-blend-screen" />
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCA0MEwwIDBMMDAgME00MCAwTDQwIDQwTDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-50 mix-blend-overlay" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-5xl px-6 py-12 mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">
        
        {/* Left Column: Copy & CTAs */}
        <motion.div 
          className="flex-1 text-center lg:text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
            <span className="text-xs font-medium tracking-wide text-zinc-300">新一代个人财务中心</span>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
          >
            智慧财务管理<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
              重塑财富轨迹
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed"
          >
            告别繁杂账本，用数据驱动决策。支持多账户同步、投资收益追踪与资产深度分析，让您的每一笔财富流向清晰可见。
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
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
              onClick={() => setGuestMode(true)}
              className="group w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 flex items-center justify-center"
            >
              在线体验
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
          
          <motion.p variants={itemVariants} className="mt-6 text-xs text-zinc-500">
            * 微信登录后数据将安全加密同步至云端；在线体验数据仅保留在本地。
          </motion.p>
        </motion.div>

        {/* Right Column: Abstract UI / Stats Display */}
        <motion.div 
          className="flex-1 hidden lg:block relative"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4, type: 'spring', damping: 20 }}
        >
          <div className="relative w-full aspect-square max-w-lg mx-auto">
            {/* Glass Card 1 */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[10%] right-[10%] w-[70%] h-[40%] bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl z-20"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <LineChart className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-sm font-medium text-zinc-300">本月净资产增长</div>
              </div>
              <div className="text-4xl font-bold text-white tracking-tight">+ ¥12,450.00</div>
              <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 w-[75%]" />
              </div>
            </motion.div>

            {/* Glass Card 2 */}
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-[15%] left-[5%] w-[60%] h-[35%] bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl z-30"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-sm font-medium text-zinc-300">数据安全保护</div>
              </div>
              <div className="text-sm text-zinc-400 leading-relaxed">
                银行级加密传输，您的财务隐私不可触碰。
              </div>
            </motion.div>

            {/* Glass Card 3 (Small accent) */}
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute top-[45%] left-[0%] w-24 h-24 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl p-4 shadow-xl z-10 flex items-center justify-center rotate-12"
            >
              <Zap className="w-10 h-10 text-white opacity-80" />
            </motion.div>
          </div>
        </motion.div>

      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                扫码关注并登录
              </h3>
              <p className="text-sm text-zinc-500 mb-8">
                请使用微信扫描下方二维码关注公众号<br/>关注后即可自动登录并开启微信记账
              </p>

              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl aspect-square flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700 relative">
                {isLoadingQR ? (
                  <div className="flex flex-col items-center text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-sm">正在生成专属二维码...</span>
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
