// src/server/repositories/user.repository.ts
import type { PoolClient } from "@neondatabase/serverless";
import { getPool } from "@/server/database/connection";
import type { Role } from "@/types";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  transaction_pin_hash: string | null;
  role: Role;
  status: "active" | "blocked";
  created_at: string;
  updated_at: string;
}

type Db = Pick<PoolClient, "query">;

function db(client?: PoolClient): Db {
  return client ?? getPool();
}

export async function findByEmail(
  email: string,
  client?: PoolClient,
): Promise<UserRow | null> {
  const result = await db(client).query<UserRow>(
    `SELECT id::text, name, email, password_hash,
            transaction_pin_hash, role, status,
            created_at, updated_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email.trim().toLowerCase()],
  );
  return result.rows[0] ?? null;
}

export async function findById(
  id: string,
  client?: PoolClient,
): Promise<UserRow | null> {
  const result = await db(client).query<UserRow>(
    `SELECT id::text, name, email, password_hash,
            transaction_pin_hash, role, status,
            created_at, updated_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listUsers(filters: {
  role?: Role;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: UserRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.role) {
    params.push(filters.role);
    conditions.push(`role = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    conditions.push(`(lower(name) LIKE $${params.length} OR lower(email) LIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = filters.offset ?? 0;

  const rowsResult = await getPool().query<UserRow>(
    `SELECT id::text, name, email, password_hash,
            transaction_pin_hash, role, status,
            created_at, updated_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  const countResult = await getPool().query<{ count: string }>(
    `SELECT count(*)::text AS count FROM users ${where}`,
    params,
  );

  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  transactionPinHash?: string | null;
}, client?: PoolClient): Promise<UserRow> {
  const result = await db(client).query<UserRow>(
    `INSERT INTO users (name, email, password_hash, transaction_pin_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id::text, name, email, password_hash,
               transaction_pin_hash, role, status,
               created_at, updated_at`,
    [
      input.name.trim(),
      input.email.trim().toLowerCase(),
      input.passwordHash,
      input.transactionPinHash ?? null,
      input.role,
    ],
  );
  return result.rows[0]!;
}

export async function updateUserStatus(
  id: string,
  status: "active" | "blocked",
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE users SET status = $1, updated_at = now() WHERE id = $2`,
    [status, id],
  );
}

export async function updateTransactionPin(
  id: string,
  pinHash: string,
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE users SET transaction_pin_hash = $1, updated_at = now() WHERE id = $2`,
    [pinHash, id],
  );
}