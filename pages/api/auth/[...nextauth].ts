/**
 * @file pages/api/auth/[...nextauth].ts
 *
 * Configuration of next-auth's authentication API endpoints.
 */

import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.SENDGRID_API_KEY,
        },
      },
      from: process.env.EMAIL_SERVER_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user, token }) {
      session.userId = user.id;
      return session;
    },
  },
};

export default NextAuth(authOptions);
