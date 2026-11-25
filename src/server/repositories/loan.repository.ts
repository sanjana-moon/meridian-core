import type { PoolClient } from "@neondatabase/serverless";
import { getPool } from "@/server/database/connection";

export type LoanStatus =
  | "pending" | "under-review" | "approved"
  | "rejected" | "active" | "completed";

export interface LoanRow {
  id: string;
  customer_id: string;
  account_id: string | null;
  loan_type: string;
  requested_amount: string;
  duration_months: number;
  monthly_income: string;
  employment_status: string;
  description: string;
  internal_notes: string;
  status: LoanStatus;
  remaining_balance: string;
  reviewed_by: string | null;
  forwarded_by: string | null;
  forwarded_at: string | null;
  created_at: string;
  updated_at: string;
}

type Db = Pick<PoolClient, "query">;
const db = (c?: PoolClient): Db => c ?? getPool();

export async function findById(
  id: string,
  client?: PoolClient,
): Promise<LoanRow | null> {
  const result = await db(client).query<LoanRow>(
    `SELECT * FROM loans WHERE id = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function lockById(
  id: string,
  client: PoolClient,
): Promise<LoanRow | null> {
  const result = await client.query<LoanRow>(
    `SELECT * FROM loans WHERE id = $1 FOR UPDATE`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listByCustomer(
  customerId: string,
  client?: PoolClient,
): Promise<LoanRow[]> {
  const result = await db(client).query<LoanRow>(
    `SELECT * FROM loans WHERE customer_id = $1 ORDER BY created_at DESC`,
    [customerId],
  );
  return result.rows;
}

export async function listAll(filters: {
  status?: LoanStatus;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: LoanRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    conditions.push(`lower(loan_type) LIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = filters.offset ?? 0;

  const rowsResult = await getPool().query<LoanRow>(
    `SELECT * FROM loans ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params,
  );
  const countResult = await getPool().query<{ count: string }>(
    `SELECT count(*)::text AS count FROM loans ${where}`,
    params,
  );
  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.count ?? 0),
  };
}

export async function createLoan(input: {
  customerId: string;
  accountId?: string | null;
  loanType: string;
  requestedAmount: string;
  durationMonths: number;
  monthlyIncome: string;
  employmentStatus: string;
  description?: string;
}, client?: PoolClient): Promise<LoanRow> {
  const result = await db(client).query<LoanRow>(
    `INSERT INTO loans
      (customer_id, account_id, loan_type, requested_amount,
       duration_months, monthly_income, employment_status, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, ''))
     RETURNING *`,
    [
      input.customerId,
      input.accountId ?? null,
      input.loanType,
      input.requestedAmount,
      input.durationMonths,
      input.monthlyIncome,
      input.employmentStatus,
      input.description ?? "",
    ],
  );
  return result.rows[0]!;
}

export async function updateStatus(
  id: string,
  status: LoanStatus,
  reviewedBy?: string | null,
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE loans
     SET status = $1, reviewed_by = COALESCE($2, reviewed_by), updated_at = now()
     WHERE id = $3`,
    [status, reviewedBy ?? null, id],
  );
}

export async function updateRemainingBalance(
  id: string,
  remainingBalance: string,
  client: PoolClient,
): Promise<void> {
  await client.query(
    `UPDATE loans SET remaining_balance = $1, updated_at = now() WHERE id = $2`,
    [remainingBalance, id],
  );
}

export async function addInternalNote(
  id: string,
  note: string,
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE loans
     SET internal_notes = CASE
       WHEN internal_notes = '' THEN $1
       ELSE internal_notes || E'\n---\n' || $1
     END,
     updated_at = now()
     WHERE id = $2`,
    [note, id],
  );
}

export async function markForwarded(
  id: string,
  forwardedBy: string,
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE loans
     SET status = 'under-review',
         forwarded_by = $1,
         forwarded_at = now(),
         updated_at = now()
     WHERE id = $2 AND status = 'pending'`,
    [forwardedBy, id],
  );
}