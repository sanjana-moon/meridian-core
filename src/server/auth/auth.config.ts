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

// A pre-computed argon2 hash used to normalize timing when the user
// does not exist. Prevents "email enumeration via response time" attacks.
// This hash is for the literal string "dummy-password-never-matches".
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgt3ub+b+dWRWJTmaaJObG";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours — banking sessions should not live forever
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
          // Still burn a dummy verify so timing is constant
          await argon2.verify(DUMMY_HASH, "x").catch(() => false);
          return null;
        }

        const email = parsed.data.email.trim().toLowerCase();

        const result = await getPool().query<AuthUserRow>(
          `SELECT id::text, name, email, password_hash, role, status
           FROM users
           WHERE email = $1
           LIMIT 1`,
          [email],
        );
        const user = result.rows[0];

        // Always run a verify — even if user is missing — to keep timing constant.
        const hashToCheck = user?.password_hash ?? DUMMY_HASH;
        const passwordOk = await argon2
          .verify(hashToCheck, parsed.data.password)
          .catch(() => false);

        if (!user || user.status !== "active" || !passwordOk) {
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
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;