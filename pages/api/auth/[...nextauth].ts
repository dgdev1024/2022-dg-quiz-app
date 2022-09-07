/**
 * @file pages/api/auth/[...nextauth].ts
 *
 * Configure's next-auth's authentication API routes.
 */

import type { NextAuthOptions } from "next-auth";

import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@lib/prisma";

// Export the next-auth configuration options, for use with
// 'unstable_getServerSession'.
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
      session.user.id = user.id;
      return session;
    },
  },
};

// Configure next-auth.
export default NextAuth(authOptions);
