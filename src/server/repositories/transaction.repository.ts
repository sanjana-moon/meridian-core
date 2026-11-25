import type { PoolClient } from "@neondatabase/serverless";
import { getPool } from "@/server/database/connection";

export type TransactionType =
  | "deposit" | "withdrawal" | "transfer"
  | "loan-disbursement" | "loan-repayment";
export type TransactionStatus = "pending" | "completed" | "failed" | "reversed";

export interface TransactionRow {
  id: string;
  reference: string;
  sender_account_id: string | null;
  receiver_account_id: string | null;
  loan_id: string | null;
  type: TransactionType;
  amount: string;
  fee: string;
  status: TransactionStatus;
  review_decision: "approved" | "rejected" | null;
  description: string;
  idempotency_key: string | null;
  created_by: string;
  flagged_by: string | null;
  reviewed_by: string | null;
  is_suspicious: boolean;
  created_at: string;
  updated_at: string;
}

type Db = Pick<PoolClient, "query">;
const db = (c?: PoolClient): Db => c ?? getPool();

export async function findById(
  id: string,
  client?: PoolClient,
): Promise<TransactionRow | null> {
  const result = await db(client).query<TransactionRow>(
    `SELECT * FROM transactions WHERE id = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findByIdempotencyKey(
  key: string,
  client?: PoolClient,
): Promise<TransactionRow | null> {
  const result = await db(client).query<TransactionRow>(
    `SELECT * FROM transactions WHERE idempotency_key = $1 LIMIT 1`,
    [key],
  );
  return result.rows[0] ?? null;
}

export async function listForAccount(input: {
  accountId: string;
  type?: TransactionType;
  status?: TransactionStatus;
  fromDate?: string;
  toDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: TransactionRow[]; total: number }> {
  const conditions: string[] = [
    `(sender_account_id = $1 OR receiver_account_id = $1)`,
  ];
  const params: unknown[] = [input.accountId];

  if (input.type) {
    params.push(input.type);
    conditions.push(`type = $${params.length}`);
  }
  if (input.status) {
    params.push(input.status);
    conditions.push(`status = $${params.length}`);
  }
  if (input.fromDate) {
    params.push(input.fromDate);
    conditions.push(`created_at >= $${params.length}::timestamptz`);
  }
  if (input.toDate) {
    params.push(input.toDate);
    conditions.push(`created_at < ($${params.length}::timestamptz + interval '1 day')`);
  }
  if (input.search) {
    params.push(`%${input.search}%`);
    conditions.push(`reference ILIKE $${params.length}`);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const limit = Math.min(input.limit ?? 20, 100);
  const offset = input.offset ?? 0;

  const rowsResult = await getPool().query<TransactionRow>(
    `SELECT * FROM transactions ${where}
     ORDER BY created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );
  const countResult = await getPool().query<{ count: string }>(
    `SELECT count(*)::text AS count FROM transactions ${where}`,
    params,
  );
  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function listAll(filters: {
  type?: TransactionType;
  status?: TransactionStatus;
  fromDate?: string;
  toDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: TransactionRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.type) { params.push(filters.type); conditions.push(`type = $${params.length}`); }
  if (filters.status) { params.push(filters.status); conditions.push(`status = $${params.length}`); }
  if (filters.fromDate) { params.push(filters.fromDate); conditions.push(`created_at >= $${params.length}::timestamptz`); }
  if (filters.toDate) { params.push(filters.toDate); conditions.push(`created_at < ($${params.length}::timestamptz + interval '1 day')`); }
  if (filters.search) { params.push(`%${filters.search}%`); conditions.push(`reference ILIKE $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = filters.offset ?? 0;

  const rowsResult = await getPool().query<TransactionRow>(
    `SELECT * FROM transactions ${where}
     ORDER BY created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );
  const countResult = await getPool().query<{ count: string }>(
    `SELECT count(*)::text AS count FROM transactions ${where}`,
    params,
  );
  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function createTransaction(input: {
  reference: string;
  senderAccountId?: string | null;
  receiverAccountId?: string | null;
  loanId?: string | null;
  type: TransactionType;
  amount: string;
  fee?: string;
  status: TransactionStatus;
  description?: string;
  idempotencyKey?: string | null;
  createdBy: string;
  reviewDecision?: "approved" | "rejected" | null;
}, client?: PoolClient): Promise<TransactionRow> {
  const result = await db(client).query<TransactionRow>(
    `INSERT INTO transactions
      (reference, sender_account_id, receiver_account_id, loan_id,
       type, amount, fee, status, description, idempotency_key,
       created_by, review_decision)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::numeric, 0),
             $8, COALESCE($9, ''), $10, $11, $12)
     RETURNING *`,
    [
      input.reference,
      input.senderAccountId ?? null,
      input.receiverAccountId ?? null,
      input.loanId ?? null,
      input.type,
      input.amount,
      input.fee ?? null,
      input.status,
      input.description ?? "",
      input.idempotencyKey ?? null,
      input.createdBy,
      input.reviewDecision ?? null,
    ],
  );
  return result.rows[0]!;
}

export async function updateStatus(
  id: string,
  status: TransactionStatus,
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE transactions SET status = $1, updated_at = now() WHERE id = $2`,
    [status, id],
  );
}

export async function setReviewDecision(
  id: string,
  decision: "approved" | "rejected",
  reviewedBy: string,
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE transactions
     SET review_decision = $1, reviewed_by = $2,
         status = $3, updated_at = now()
     WHERE id = $4`,
    [decision, reviewedBy, decision === "approved" ? "completed" : "failed", id],
  );
}

export async function flagSuspicious(
  id: string,
  flaggedBy: string,
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE transactions
     SET is_suspicious = true, flagged_by = $1, updated_at = now()
     WHERE id = $2`,
    [flaggedBy, id],
  );
}