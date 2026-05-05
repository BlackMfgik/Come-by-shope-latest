import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/mockDb";
import type { UserInfo } from "@/types";

declare module "next-auth" {
  interface Session {
    user: Omit<UserInfo, "id"> & {
      id: string;
      emailVerified?: Date | null;
      image?: string | null;
    };
    accessToken?: string;
  }
  interface User {
    accessToken?: string;
    phone?: string;
    address?: string;
    payment?: string;
    admin?: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // 🚧 МОК — замінити на fetch до реального API
        const dbUser = db.users.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password,
        );
        if (!dbUser) return null;

        const token = db.generateToken(dbUser.id);
        const publicUser = db.toPublicUser(dbUser);

        return {
          ...publicUser,
          id: String(publicUser.id),
          accessToken: token,
        };
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email!;

        // 🚧 МОК — замінити на POST /api/auth/google
        let dbUser = db.users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );
        if (!dbUser) {
          dbUser = {
            id: db._nextUserId++,
            email,
            password: "",
            name: user.name ?? "",
            phone: "",
            address: "",
            payment: "",
            admin: false,
          };
          db.users.push(dbUser);
        }

        const token = db.generateToken(dbUser.id);
        const publicUser = db.toPublicUser(dbUser);

        user.id = String(publicUser.id);
        user.name = publicUser.name;
        user.email = publicUser.email;
        user.phone = publicUser.phone;
        user.address = publicUser.address;
        user.payment = publicUser.payment;
        user.admin = publicUser.admin;
        user.accessToken = token;
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token["userInfo"] = {
          id: Number(user.id),
          name: user.name ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
          address: user.address ?? "",
          payment: user.payment ?? "",
          admin: user.admin ?? false,
        } satisfies UserInfo;
        token["accessToken"] = user.accessToken;
        token.sub = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token["userInfo"]) {
        session.user = {
          ...(token["userInfo"] as UserInfo),
          id: token.sub!,
          emailVerified: null,
        };
        session.accessToken = token["accessToken"] as string | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/account",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  debug: process.env.NODE_ENV === "development",
});
