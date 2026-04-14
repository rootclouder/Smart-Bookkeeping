'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, User } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-sm relative z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-zinc-900 dark:text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">登录账户</h3>
              <p className="text-sm text-zinc-500">
                登录后可将数据安全同步至云端
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  signIn('wechat');
                  onClose();
                }}
                className="w-full py-3.5 px-4 bg-[#07C160] hover:bg-[#06ad56] text-white rounded-xl font-bold flex items-center justify-center transition-colors"
              >
                微信扫码登录
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                <span className="flex-shrink-0 mx-4 text-zinc-400 text-xs">或</span>
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-bold flex items-center justify-center transition-colors"
              >
                <User className="w-5 h-5 mr-2 opacity-50" />
                以游客身份继续
              </button>
            </div>
            
            <p className="text-xs text-center text-zinc-400 mt-6">
              游客数据仅保存在本地浏览器，清除缓存会丢失数据。
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
