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
        const account = await prisma.account.findUnique({
          where: { 
            provider_providerAccountId: {
              provider: "wechat-mp", 
              providerAccountId: session.openid 
            }
          },
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
        // Do NOT store image in JWT token to prevent 494 Request Header Too Large error
        // when the image is a large base64 string.
      }
      
      // 捕获前端调用的 update 方法，将新数据合并到 token 中
      if (trigger === "update" && session) {
        // Support flat object from update({ name })
        if (session.name !== undefined) token.name = session.name;
        
        // Support nested object from update({ user: { name } })
        if (session.user?.name !== undefined) token.name = session.user.name;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        // @ts-ignore
        session.user.id = token.sub;
        session.user.name = token.name as string | null | undefined;
        
        // Fetch the user's image directly from the database to keep the cookie size small
        if (token.sub) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.sub as string },
              select: { image: true }
            });
            if (dbUser) {
              session.user.image = dbUser.image as string | null | undefined;
            }
          } catch (e) {
            console.error("Error fetching user image for session:", e);
          }
        }
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
