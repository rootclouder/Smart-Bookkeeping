'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, Loader2, Save, UploadCloud } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { data: session, update } = useSession();
  
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化表单数据
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setImage(session.user.image || '');
    }
  }, [session, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请选择一个有效的图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Create an image element to draw onto canvas for compression
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // max width/height for avatar
        let width = img.width;
        let height = img.height;

        // Resize proportionally
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to WebP or JPEG with 0.8 quality to drastically reduce size
          const compressedBase64 = canvas.toDataURL('image/webp', 0.8);
          setImage(compressedBase64);
          setError('');
        } else {
          setImage(reader.result as string);
          setError('');
        }
      };
      img.onerror = () => {
        setError('图片加载失败');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update next-auth session locally without triggering a page reload
      await update({
        name: data.user.name,
        image: data.user.image,
      });
      
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-white/30 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl max-w-sm w-full border"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div 
                className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-white dark:border-zinc-700 shadow-md relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <img src={image} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-zinc-400" />
                )}
                
                {/* 悬浮上传蒙层 */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <UploadCloud className="w-6 h-6 text-white mb-1" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                个人资料设置
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/gif, image/webp"
                className="hidden" 
              />
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  昵称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#07C160] transition-shadow"
                  placeholder="请输入您的昵称"
                  maxLength={20}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  头像链接 (可选)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={image.startsWith('data:') ? '' : image}
                    onChange={(e) => setImage(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#07C160] transition-shadow text-sm"
                    placeholder="或填入网络图片链接"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
                  >
                    上传
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  支持网络链接或本地上传。图片大小不得超过 2M。
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存修改
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
