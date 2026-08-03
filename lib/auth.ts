import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { NextAuthOptions } from "next-auth";

// Multi-tenant : chaque requête Prisma de l'app doit être filtrée par
// session.agencyId, pour isoler complètement les données d'une agence
// de celles d'une autre.

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { agency: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          agencyId: user.agencyId,
          agencyName: user.agency.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.agencyId = (user as any).agencyId;
        token.agencyName = (user as any).agencyName;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).agencyId = token.agencyId;
      (session as any).agencyName = token.agencyName;
      return session;
    },
  },
};
