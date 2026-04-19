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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (document.cookie && document.cookie.length > 3500) {
                  alert('您的本地缓存数据（Cookie）过大，可能导致页面无法访问（494错误）。\\n\\n系统将尝试自动清理，如果问题仍然存在，请在浏览器设置中手动清除本站 Cookie 后刷新重试。');
                  
                  var cookies = document.cookie.split(";");
                  for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    var eqPos = cookie.indexOf("=");
                    var name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                  }
                }
              } catch (e) {
                console.error('Cookie 检查脚本运行出错:', e);
              }
            `,
          }}
        />
      </head>
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