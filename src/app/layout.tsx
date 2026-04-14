import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientLayout } from './ClientLayout';
import { NextAuthProvider } from '@/components/NextAuthProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '智慧财务中心',
  description: '智慧财务中心 - 资产、理财、收支管理',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen dark:bg-zinc-950 dark:text-zinc-100 bg-white text-zinc-900`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <NextAuthProvider>
            <ClientLayout>{children}</ClientLayout>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}