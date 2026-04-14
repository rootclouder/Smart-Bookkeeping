import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: "wechat-qrcode",
      name: "WeChat QR Code",
      credentials: {
        sceneId: { label: "Scene ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.sceneId) {
          throw new Error("Missing sceneId");
        }

        const session = await prisma.wechatLoginSession.findUnique({
          where: { sceneId: credentials.sceneId },
        });

        if (!session || session.status !== "scanned" || !session.openid) {
          throw new Error("QR Code not scanned or invalid");
        }

        // 查找用户
        const account = await prisma.account.findFirst({
          where: { provider: "wechat-mp", providerAccountId: session.openid },
          include: { user: true },
        });

        if (account?.user) {
          return account.user;
        }

        throw new Error("User not found for this openid");
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.image = user.image;
      }
      
      // 捕获前端调用的 update 方法，将新数据合并到 token 中
      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.image = session.user.image;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        // @ts-ignore
        session.user.id = token.sub;
        session.user.name = token.name as string | null | undefined;
        session.user.image = token.image as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    // signIn: '/login',
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
