'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function ThemeToggleBtn({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const targetTheme = resolvedTheme === 'light' ? 'dark' : 'light';

    // @ts-ignore - View Transition API
    if (!document.startViewTransition) {
      setTheme(targetTheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    // @ts-ignore - View Transition API
    const transition = document.startViewTransition(async () => {
      // Force a synchronous DOM update for the View Transition API to capture
      if (targetTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
      
      // Update React state via next-themes
      setTheme(targetTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: targetTheme === 'dark' ? clipPath : [...clipPath].reverse(),
        },
        {
          duration: 700,
          easing: 'ease-in-out',
          pseudoElement: targetTheme === 'dark' 
            ? '::view-transition-new(root)' 
            : '::view-transition-old(root)',
        }
      );
    });
  };

  if (!mounted) return <div className={`w-12 h-12 ${className}`} />;

  return (
    <button
      onClick={toggleTheme}
      className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 ${
        resolvedTheme === 'dark' 
          ? 'bg-white/10 text-yellow-300 hover:bg-white/20 shadow-[0_0_15px_rgba(253,224,71,0.2)]' 
          : 'bg-black/5 text-indigo-600 hover:bg-black/10 shadow-[0_0_15px_rgba(79,70,229,0.2)]'
      } ${className}`}
      aria-label="Toggle Theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: resolvedTheme === 'dark' ? 0 : 180 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {resolvedTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </motion.div>
    </button>
  );
}
