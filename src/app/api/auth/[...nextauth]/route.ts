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
    async session({ session, token }) {
      if (session?.user && token.sub) {
        // @ts-ignore
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    // signIn: '/login',
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
