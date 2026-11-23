import argon2 from "argon2";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { credentialsSchema } from "@/lib/validations/auth.schema";
import { getPool } from "@/server/database/connection";
import type { Role } from "@/types";

interface AuthUserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  status: string;
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const result = await getPool().query<AuthUserRow>(
          `SELECT id::text, name, email, password_hash, role, status
           FROM users
           WHERE email = lower($1)
           LIMIT 1`,
          [parsed.data.email],
        );
        const user = result.rows[0];

        if (
          !user ||
          user.status !== "active" ||
          !(await argon2.verify(user.password_hash, parsed.data.password))
        ) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (token.id && token.role) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
