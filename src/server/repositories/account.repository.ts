// src/server/repositories/account.repository.ts
import type { PoolClient } from "@neondatabase/serverless";
import { getPool } from "@/server/database/connection";

export type AccountType = "savings" | "current" | "business";
export type AccountStatus = "active" | "inactive" | "frozen" | "blocked";

export interface AccountRow {
  id: string;
  owner_id: string;
  account_number: string;
  type: AccountType;
  balance: string;              // numeric as string — never parseFloat!
  status: AccountStatus;
  daily_transfer_limit: string;
  max_single_transaction: string;
  minimum_balance: string;
  created_at: string;
  updated_at: string;
}

type Db = Pick<PoolClient, "query">;
const db = (c?: PoolClient): Db => c ?? getPool();

export async function findById(
  id: string,
  client?: PoolClient,
): Promise<AccountRow | null> {
  const result = await db(client).query<AccountRow>(
    `SELECT * FROM accounts WHERE id = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

/**
 * CRITICAL: locks the row for update. Use this inside withTransaction
 * before mutating balance, to prevent race conditions during transfers.
 */
export async function lockById(
  id: string,
  client: PoolClient,
): Promise<AccountRow | null> {
  const result = await client.query<AccountRow>(
    `SELECT * FROM accounts WHERE id = $1 FOR UPDATE`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findByAccountNumber(
  accountNumber: string,
  client?: PoolClient,
): Promise<AccountRow | null> {
  const result = await db(client).query<AccountRow>(
    `SELECT * FROM accounts WHERE account_number = $1 LIMIT 1`,
    [accountNumber.trim()],
  );
  return result.rows[0] ?? null;
}

export async function listByOwner(
  ownerId: string,
  client?: PoolClient,
): Promise<AccountRow[]> {
  const result = await db(client).query<AccountRow>(
    `SELECT * FROM accounts WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId],
  );
  return result.rows;
}

export async function listAll(filters: {
  status?: AccountStatus;
  type?: AccountType;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: AccountRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.type) {
    params.push(filters.type);
    conditions.push(`type = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`account_number LIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = filters.offset ?? 0;

  const rowsResult = await getPool().query<AccountRow>(
    `SELECT * FROM accounts ${where} ORDER BY created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );
  const countResult = await getPool().query<{ count: string }>(
    `SELECT count(*)::text AS count FROM accounts ${where}`,
    params,
  );
  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function createAccount(input: {
  ownerId: string;
  accountNumber: string;
  type: AccountType;
  dailyTransferLimit?: string;
  maxSingleTransaction?: string;
  minimumBalance?: string;
}, client?: PoolClient): Promise<AccountRow> {
  const result = await db(client).query<AccountRow>(
    `INSERT INTO accounts
       (owner_id, account_number, type,
        daily_transfer_limit, max_single_transaction, minimum_balance)
     VALUES ($1, $2, $3,
             COALESCE($4::numeric, daily_transfer_limit),
             COALESCE($5::numeric, max_single_transaction),
             COALESCE($6::numeric, minimum_balance))
     RETURNING *`,
    [
      input.ownerId,
      input.accountNumber,
      input.type,
      input.dailyTransferLimit ?? null,
      input.maxSingleTransaction ?? null,
      input.minimumBalance ?? null,
    ],
  );
  return result.rows[0]!;
}

export async function updateStatus(
  id: string,
  status: AccountStatus,
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE accounts SET status = $1, updated_at = now() WHERE id = $2`,
    [status, id],
  );
}

export async function updateLimits(
  id: string,
  input: {
    dailyTransferLimit?: string;
    maxSingleTransaction?: string;
    minimumBalance?: string;
  },
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE accounts
     SET daily_transfer_limit = COALESCE($1::numeric, daily_transfer_limit),
         max_single_transaction = COALESCE($2::numeric, max_single_transaction),
         minimum_balance = COALESCE($3::numeric, minimum_balance),
         updated_at = now()
     WHERE id = $4`,
    [
      input.dailyTransferLimit ?? null,
      input.maxSingleTransaction ?? null,
      input.minimumBalance ?? null,
      id,
    ],
  );
}

/**
 * Atomically adjust balance by a signed delta string (e.g. "-100.50" or "50.00").
 * Must be called inside withTransaction, on a locked row.
 * The CHECK (balance >= 0) constraint in the schema protects against overdraft.
 */
export async function adjustBalance(
  id: string,
  deltaMoney: string,
  client: PoolClient,
): Promise<AccountRow> {
  const result = await client.query<AccountRow>(
    `UPDATE accounts
     SET balance = balance + $1::numeric, updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [deltaMoney, id],
  );
  if (result.rowCount === 0) {
    throw new Error(`Account ${id} not found while adjusting balance`);
  }
  return result.rows[0]!;
}

/**
 * Sum of completed transfers made today by the given account as the sender.
 * Used to enforce daily_transfer_limit.
 */
export async function getTodayTransferTotal(
  accountId: string,
  client?: PoolClient,
): Promise<string> {
  const result = await db(client).query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text AS total
     FROM transactions
     WHERE sender_account_id = $1
       AND type = 'transfer'
       AND status IN ('pending', 'completed')
       AND created_at >= date_trunc('day', now())`,
    [accountId],
  );
  return result.rows[0]?.total ?? "0";
}