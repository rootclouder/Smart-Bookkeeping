import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    {
      id: "wechat",
      name: "WeChat",
      type: "oauth",
      clientId: process.env.WECHAT_APP_ID || "MOCK_WECHAT_APP_ID",
      clientSecret: process.env.WECHAT_APP_SECRET || "MOCK_WECHAT_APP_SECRET",
      checks: ["state"], // Explicitly set checks to include only state
      authorization: {
        url: "https://open.weixin.qq.com/connect/qrconnect",
        params: {
          appid: process.env.WECHAT_APP_ID || "MOCK_WECHAT_APP_ID",
          scope: "snsapi_login",
          response_type: "code",
        },
      },
      style: {
        logo: "https://authjs.dev/img/providers/wechat.svg",
        logoDark: "https://authjs.dev/img/providers/wechat-dark.svg",
        bg: "#07C160",
        text: "#fff",
        bgDark: "#07C160",
        textDark: "#fff",
      },
      token: {
        url: "https://api.weixin.qq.com/sns/oauth2/access_token",
        async request({ params, client, provider }) {
          const response = await fetch(
            `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${provider.clientId}&secret=${provider.clientSecret}&code=${params.code}&grant_type=authorization_code`
          );
          const tokens = await response.json();
          return { tokens };
        },
      },
      userinfo: {
        url: "https://api.weixin.qq.com/sns/userinfo",
        async request({ tokens }) {
          const response = await fetch(
            `https://api.weixin.qq.com/sns/userinfo?access_token=${tokens.access_token}&openid=${tokens.openid}`
          );
          return await response.json();
        },
      },
      profile(profile: any) {
        return {
          id: profile.unionid || profile.openid,
          name: profile.nickname,
          email: null,
          image: profile.headimgurl,
        };
      },
    },
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
