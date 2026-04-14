'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeEffectProvider>
        {children}
      </ThemeEffectProvider>
    </NextThemesProvider>
  );
}

function ThemeEffectProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [animationType, setAnimationType] = React.useState<'sunrise' | 'sunset' | null>(null);
  
  const [prevTheme, setPrevTheme] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    setMounted(true);
    setPrevTheme(resolvedTheme);
  }, [resolvedTheme]);

  React.useEffect(() => {
    if (!mounted || prevTheme === undefined) return;
    
    if (resolvedTheme && resolvedTheme !== prevTheme) {
      setAnimationType(resolvedTheme === 'light' ? 'sunrise' : 'sunset');
      setIsAnimating(true);
      setPrevTheme(resolvedTheme);

      setTimeout(() => {
        setIsAnimating(false);
        setAnimationType(null);
      }, 2000);
    }
  }, [resolvedTheme, prevTheme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {isAnimating && animationType === 'sunrise' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, delay: 0.2 } }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden flex flex-col justify-end items-center"
            style={{
              background: 'linear-gradient(to top, #1e1b4b, #312e81, #f59e0b, #fef3c7)'
            }}
          >
            <motion.div
              initial={{ y: '100%', scale: 0.5, backgroundColor: '#f97316' }}
              animate={{ y: '-150vh', scale: 3, backgroundColor: '#fef08a' }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="w-64 h-64 rounded-full blur-md"
            />
          </motion.div>
        )}
        
        {isAnimating && animationType === 'sunset' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, delay: 0.2 } }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden flex flex-col justify-start items-center"
            style={{
              background: 'linear-gradient(to bottom, #fef3c7, #f59e0b, #312e81, #1e1b4b)'
            }}
          >
            <motion.div
              initial={{ y: '-50vh', scale: 2, backgroundColor: '#fef08a' }}
              animate={{ y: '120vh', scale: 0.5, backgroundColor: '#f97316' }}
              transition={{ duration: 2, ease: "easeIn" }}
              className="w-64 h-64 rounded-full blur-md"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
