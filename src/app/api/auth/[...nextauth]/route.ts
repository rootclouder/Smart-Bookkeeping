import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;

        if (!username || !password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { username },
          select: { id: true, name: true, passwordHash: true },
        });

        if (!user?.passwordHash) {
          throw new Error("Invalid credentials");
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
          throw new Error("Invalid credentials");
        }

        return { id: user.id, name: user.name };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (token.picture) delete token.picture;
      if (token.image) delete token.image;

      if (user) {
        token.sub = user.id;
        token.name = user.name;
      }
      
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.user?.name !== undefined) token.name = session.user.name;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        (session.user as any).id = token.sub;
        session.user.name = token.name as string | null | undefined;
        
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
