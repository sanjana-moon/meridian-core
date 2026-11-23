import argon2 from "argon2";
import {
  loanRepaymentSchema,
  transactionRequestSchema,
  transactionReviewSchema,
  transferSchema,
} from "@/lib/validations/transaction.schema";
import { getPool } from "@/server/database/connection";
import { requireUser } from "@/server/guards/auth.guard";
import { requireRole } from "@/server/guards/role.guard";
import { withTransaction } from "@/server/database/with-transaction";
import {
  ApiError,
  assertUuid,
  parseBody,
  withApiErrors,
} from "@/server/utils/api-response";
import { generateReference } from "@/server/utils/generate-reference";
import { centsToMoney, moneyToCents } from "@/server/utils/money";
import { assertTwoFactorIfEnabled } from "@/server/security/totp";

type TransactionRouteContext = {
  params: Promise<{ transactionId: string }>;
};

interface AccountRow {
  id: string;
  owner_id: string;
  account_number: string;
  balance: string;
  status: string;
  max_single_transaction: string;
  daily_transfer_limit: string;
  minimum_balance: string;
}

async function verifyTransactionPin(userId: string, pin: string) {
  const result = await getPool().query<{ transaction_pin_hash: string | null }>(
    "SELECT transaction_pin_hash FROM users WHERE id = $1 AND status = 'active'",
    [userId],
  );
  const hash = result.rows[0]?.transaction_pin_hash;
  if (!hash || !(await argon2.verify(hash, pin))) {
    throw new ApiError("Invalid transaction PIN", 403);
  }
}

async function createMoneyRequest(
  request: Request,
  type: "deposit" | "withdrawal",
) {
  return withApiErrors(async () => {
    const user = await requireUser();
    if (user.role !== "customer") {
      throw new ApiError("Only customers may submit money requests", 403);
    }

    const input = await parseBody(request, transactionRequestSchema);
    if (type === "withdrawal") {
      if (!input.transactionPin) {
        throw new ApiError("Transaction PIN is required", 400);
      }
      await verifyTransactionPin(user.id, input.transactionPin);
    }
    await assertTwoFactorIfEnabled(
      user.id,
      request.headers.get("X-2FA-Code") ?? undefined,
    );

    const amountCents = moneyToCents(input.amount);
    if (amountCents <= BigInt(0)) {
      throw new ApiError("Amount must be greater than zero", 400);
    }

    const result = await getPool().query<AccountRow>(
      `SELECT id::text, owner_id::text, account_number, balance::text, status,
              max_single_transaction::text, daily_transfer_limit::text,
              minimum_balance::text
       FROM accounts WHERE id = $1 AND owner_id = $2`,
      [input.accountId, user.id],
    );
    const account = result.rows[0];
    if (!account) {
      throw new ApiError("Account not found", 404);
    }
    if (account.status !== "active") {
      throw new ApiError("This account cannot be used", 409);
    }
    if (amountCents > moneyToCents(account.max_single_transaction)) {
      throw new ApiError("Amount exceeds the account transaction limit", 400);
    }

    const transaction = await getPool().query(
      `INSERT INTO transactions (
         reference, sender_account_id, receiver_account_id, type, amount,
         status, description, created_by, is_suspicious
       )
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)
       RETURNING id::text, reference, type, amount::text, status, description, created_at`,
      [
        generateReference(),
        type === "withdrawal" ? account.id : null,
        type === "deposit" ? account.id : null,
        type,
        input.amount,
        input.description,
        user.id,
        amountCents >= BigInt(1_000_000),
      ],
    );

    return Response.json({ transaction: transaction.rows[0] }, { status: 201 });
  });
}

export async function listTransactions(request: Request) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 25) || 25));
    const values: unknown[] = [];
    const filters = ["1 = 1"];

    if (user.role === "customer") {
      values.push(user.id);
      filters.push(
        `EXISTS (
           SELECT 1 FROM accounts a
           WHERE a.owner_id = $${values.length}
             AND (a.id = t.sender_account_id OR a.id = t.receiver_account_id)
         )`,
      );
    }

    const filterValues: Array<[string, string | null]> = [
      ["type", url.searchParams.get("type")],
      ["status", url.searchParams.get("status")],
    ];
    for (const [column, value] of filterValues) {
      if (value) {
        values.push(value);
        filters.push(`t.${column} = $${values.length}`);
      }
    }

    const search = url.searchParams.get("search")?.trim();
    if (search) {
      values.push(`%${search}%`);
      filters.push(
        `(t.reference ILIKE $${values.length} OR t.id::text ILIKE $${values.length})`,
      );
    }

    const dateFrom = url.searchParams.get("from");
    if (dateFrom) {
      if (Number.isNaN(Date.parse(dateFrom))) {
        throw new ApiError("Invalid from date", 400);
      }
      values.push(dateFrom);
      filters.push(`t.created_at >= $${values.length}::timestamptz`);
    }

    const dateTo = url.searchParams.get("to");
    if (dateTo) {
      if (Number.isNaN(Date.parse(dateTo))) {
        throw new ApiError("Invalid to date", 400);
      }
      values.push(dateTo);
      filters.push(`t.created_at <= $${values.length}::timestamptz`);
    }

    values.push(limit, (page - 1) * limit);
    const result = await getPool().query(
      `SELECT t.id::text, t.reference, t.sender_account_id::text,
              t.receiver_account_id::text, t.loan_id::text, t.type, t.amount::text,
              t.fee::text, t.status, t.description, t.is_suspicious, t.created_at,
              count(*) OVER()::int AS total_count
       FROM transactions t
       WHERE ${filters.join(" AND ")}
       ORDER BY t.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    const transactions = result.rows.map((row) => {
      const transaction = { ...row };
      delete transaction.total_count;
      return transaction;
    });

    return Response.json({
      transactions,
      page,
      limit,
      total: result.rows[0]?.total_count ?? 0,
    });
  });
}

export async function getTransaction(
  _request: Request,
  context: TransactionRouteContext,
) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const { transactionId } = await context.params;
    assertUuid(transactionId, "transactionId");
    const result = await getPool().query(
      `SELECT t.id::text, t.reference, t.sender_account_id::text,
              t.receiver_account_id::text, t.loan_id::text, t.type, t.amount::text,
              t.fee::text, t.status, t.description, t.is_suspicious,
              t.created_by::text, t.reviewed_by::text, t.created_at,
              sender.account_number AS sender_account_number,
              receiver.account_number AS receiver_account_number
       FROM transactions t
       LEFT JOIN accounts sender ON sender.id = t.sender_account_id
       LEFT JOIN accounts receiver ON receiver.id = t.receiver_account_id
       WHERE t.id = $1
         AND (
           $2 <> 'customer'
           OR EXISTS (
             SELECT 1 FROM accounts a
             WHERE a.owner_id = $3
               AND (a.id = t.sender_account_id OR a.id = t.receiver_account_id)
           )
         )`,
      [transactionId, user.role, user.id],
    );
    if (!result.rows[0]) {
      throw new ApiError("Transaction not found", 404);
    }

    return Response.json({ transaction: result.rows[0] });
  });
}

export async function transferFunds(request: Request) {
  return withApiErrors(async () => {
    const user = await requireUser();
    if (user.role !== "customer") {
      throw new ApiError("Only customers may initiate transfers", 403);
    }

    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
    if (!idempotencyKey || idempotencyKey.length > 128) {
      throw new ApiError("A valid Idempotency-Key header is required", 400);
    }

    const input = await parseBody(request, transferSchema);
    const amountCents = moneyToCents(input.amount);
    if (amountCents <= BigInt(0)) {
      throw new ApiError("Amount must be greater than zero", 400);
    }
    await verifyTransactionPin(user.id, input.transactionPin);
    await assertTwoFactorIfEnabled(user.id, input.twoFactorCode);

    const transaction = await withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        idempotencyKey,
      ]);
      const previous = await client.query(
        `SELECT t.id::text, t.reference, t.type, t.amount::text, t.status,
                t.description, t.created_at, t.created_by::text,
                t.sender_account_id::text, a.account_number AS recipient_account_number
         FROM transactions t
         LEFT JOIN accounts a ON a.id = t.receiver_account_id
         WHERE t.idempotency_key = $1`,
        [idempotencyKey],
      );
      if (previous.rows[0]) {
        const existing = previous.rows[0];
        if (
          existing.created_by !== user.id ||
          existing.type !== "transfer" ||
          existing.sender_account_id !== input.senderAccountId ||
          existing.recipient_account_number !== input.recipientAccountNumber ||
          moneyToCents(existing.amount) !== amountCents ||
          existing.description !== input.description
        ) {
          throw new ApiError("Idempotency key has already been used", 409);
        }
        return {
          id: existing.id,
          reference: existing.reference,
          type: existing.type,
          amount: existing.amount,
          status: existing.status,
          description: existing.description,
          created_at: existing.created_at,
        };
      }

      const accountResult = await client.query<AccountRow>(
        `SELECT id::text, owner_id::text, account_number, balance::text, status,
                max_single_transaction::text, daily_transfer_limit::text,
                minimum_balance::text
         FROM accounts
         WHERE id = $1 OR account_number = $2
         ORDER BY id
         FOR UPDATE`,
        [input.senderAccountId, input.recipientAccountNumber],
      );
      const sender = accountResult.rows.find((row) => row.id === input.senderAccountId);
      const recipient = accountResult.rows.find(
        (row) => row.account_number === input.recipientAccountNumber,
      );
      if (!sender || sender.owner_id !== user.id) {
        throw new ApiError("Sender account not found", 404);
      }
      if (!recipient) {
        throw new ApiError("Recipient account not found", 404);
      }
      if (sender.id === recipient.id) {
        throw new ApiError("Transfers to the same account are not allowed", 400);
      }
      if (sender.status !== "active" || recipient.status !== "active") {
        throw new ApiError("Both accounts must be active", 409);
      }
      const recipientOwner = await client.query<{ status: string }>(
        "SELECT status FROM users WHERE id = $1",
        [recipient.owner_id],
      );
      if (recipientOwner.rows[0]?.status !== "active") {
        throw new ApiError("Recipient account is unavailable", 409);
      }
      if (amountCents > moneyToCents(sender.max_single_transaction)) {
        throw new ApiError("Amount exceeds the account transaction limit", 400);
      }
      if (amountCents > moneyToCents(sender.daily_transfer_limit)) {
        throw new ApiError("Amount exceeds the daily transfer limit", 400);
      }

      const dailyTotal = await client.query<{ total: string }>(
        `SELECT coalesce(sum(amount), 0)::text AS total
         FROM transactions
         WHERE sender_account_id = $1
           AND type = 'transfer'
           AND status = 'completed'
           AND created_at >= date_trunc('day', now())`,
        [sender.id],
      );
      if (
        moneyToCents(dailyTotal.rows[0]?.total ?? "0") + amountCents >
        moneyToCents(sender.daily_transfer_limit)
      ) {
        throw new ApiError("Daily transfer limit exceeded", 400);
      }

      const balanceCents = moneyToCents(sender.balance);
      const minimumCents = moneyToCents(sender.minimum_balance);
      if (balanceCents - amountCents < minimumCents) {
        throw new ApiError("Insufficient available balance", 409);
      }

      await client.query(
        "UPDATE accounts SET balance = balance - $2, updated_at = now() WHERE id = $1",
        [sender.id, input.amount],
      );
      await client.query(
        "UPDATE accounts SET balance = balance + $2, updated_at = now() WHERE id = $1",
        [recipient.id, input.amount],
      );

      const suspicious = amountCents >= BigInt(1_000_000);
      const created = await client.query(
        `INSERT INTO transactions (
           reference, sender_account_id, receiver_account_id, type, amount,
           status, description, idempotency_key, created_by, is_suspicious
         )
         VALUES ($1, $2, $3, 'transfer', $4, 'completed', $5, $6, $7, $8)
         RETURNING id::text, reference, type, amount::text, status, description, created_at`,
        [
          generateReference(),
          sender.id,
          recipient.id,
          input.amount,
          input.description,
          idempotencyKey,
          user.id,
          suspicious,
        ],
      );

      await client.query(
        `INSERT INTO notifications (user_id, type, message)
         SELECT owner_id, 'transfer-received', 'A transfer was received into your account'
         FROM accounts WHERE id = $1`,
        [recipient.id],
      );

      return created.rows[0];
    });

    return Response.json({ transaction }, { status: 201 });
  });
}

export function requestDeposit(request: Request) {
  return createMoneyRequest(request, "deposit");
}

export function requestWithdrawal(request: Request) {
  return createMoneyRequest(request, "withdrawal");
}

export async function reviewMoneyRequest(
  request: Request,
  context: TransactionRouteContext,
) {
  return withApiErrors(async () => {
    const reviewer = await requireRole("admin", "staff");
    const input = await parseBody(request, transactionReviewSchema);
    const { transactionId } = await context.params;
    assertUuid(transactionId, "transactionId");

    const result = await withTransaction(async (client) => {
      const selected = await client.query(
        `SELECT id::text, sender_account_id::text, receiver_account_id::text,
                type, amount::text, status, created_by::text
         FROM transactions WHERE id = $1 FOR UPDATE`,
        [transactionId],
      );
      const transaction = selected.rows[0];
      if (!transaction) {
        throw new ApiError("Transaction not found", 404);
      }
      if (input.decision === "flag") {
        const flagged = await client.query(
          `UPDATE transactions
           SET is_suspicious = true, flagged_by = $2, updated_at = now()
           WHERE id = $1
           RETURNING id::text, reference, type, amount::text, status,
                     is_suspicious, updated_at`,
          [transactionId, reviewer.id],
        );
        await client.query(
          `INSERT INTO notifications (user_id, type, message)
           SELECT id, 'transaction-flagged', 'A transaction was flagged for review'
           FROM users WHERE role = 'admin' AND status = 'active'`,
        );
        return flagged.rows[0];
      }

      if (!["deposit", "withdrawal"].includes(transaction.type)) {
        throw new ApiError("This transaction cannot be reviewed here", 409);
      }
      if (transaction.status !== "pending") {
        throw new ApiError("Transaction has already been reviewed", 409);
      }
      if (transaction.created_by === reviewer.id) {
        throw new ApiError("You cannot approve your own request", 403);
      }

      const accountId =
        transaction.type === "deposit"
          ? transaction.receiver_account_id
          : transaction.sender_account_id;
      const accountResult = await client.query<AccountRow>(
        `SELECT id::text, owner_id::text, account_number, balance::text, status,
                max_single_transaction::text, daily_transfer_limit::text,
                minimum_balance::text
         FROM accounts WHERE id = $1 FOR UPDATE`,
        [accountId],
      );
      const account = accountResult.rows[0];
      if (!account) {
        throw new ApiError("Account not found", 404);
      }

      if (input.decision === "approve") {
        if (account.status !== "active") {
          throw new ApiError("Account is not active", 409);
        }
        if (
          moneyToCents(transaction.amount) >
          moneyToCents(account.max_single_transaction)
        ) {
          throw new ApiError("Amount exceeds the account transaction limit", 409);
        }
        if (transaction.type === "withdrawal") {
          const currentBalance = moneyToCents(account.balance);
          const withdrawalAmount = moneyToCents(transaction.amount);
          if (
            currentBalance - withdrawalAmount <
            moneyToCents(account.minimum_balance)
          ) {
            throw new ApiError("Insufficient available balance", 409);
          }
          await client.query(
            "UPDATE accounts SET balance = balance - $2, updated_at = now() WHERE id = $1",
            [account.id, transaction.amount],
          );
        } else {
          await client.query(
            "UPDATE accounts SET balance = balance + $2, updated_at = now() WHERE id = $1",
            [account.id, transaction.amount],
          );
        }
      }

      const status = input.decision === "approve" ? "completed" : "failed";
      const updated = await client.query(
        `UPDATE transactions
         SET status = $2, review_decision = $4,
             reviewed_by = $3, updated_at = now()
         WHERE id = $1
         RETURNING id::text, reference, type, amount::text, status, description`,
        [
          transactionId,
          status,
          reviewer.id,
          input.decision === "approve" ? "approved" : "rejected",
        ],
      );
      await client.query(
        `INSERT INTO notifications (user_id, type, message)
         VALUES ($1, $2, $3)`,
        [
          transaction.created_by,
          `${transaction.type}-${input.decision}`,
          `Your ${transaction.type} request was ${input.decision === "approve" ? "approved" : "rejected"}`,
        ],
      );

      return updated.rows[0];
    });

    return Response.json({ transaction: result });
  });
}

export async function repayLoan(request: Request) {
  return withApiErrors(async () => {
    const user = await requireUser();
    if (user.role !== "customer") {
      throw new ApiError("Only customers may repay loans", 403);
    }
    const input = await parseBody(request, loanRepaymentSchema);
    const key = request.headers.get("Idempotency-Key")?.trim();
    if (!key || key.length > 128) {
      throw new ApiError("A valid Idempotency-Key header is required", 400);
    }
    const amountCents = moneyToCents(input.amount);
    if (amountCents <= BigInt(0)) {
      throw new ApiError("Amount must be greater than zero", 400);
    }
    await verifyTransactionPin(user.id, input.transactionPin);
    await assertTwoFactorIfEnabled(
      user.id,
      request.headers.get("X-2FA-Code") ?? undefined,
    );

    const transaction = await withTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [key]);
      const previous = await client.query(
        `SELECT t.id::text, t.reference, t.type, t.amount::text, t.status,
                t.description, t.created_at, t.created_by::text,
                t.sender_account_id::text, t.loan_id::text
         FROM transactions t
         WHERE t.idempotency_key = $1`,
        [key],
      );
      if (previous.rows[0]) {
        const existing = previous.rows[0];
        if (
          existing.created_by !== user.id ||
          existing.type !== "loan-repayment" ||
          existing.sender_account_id !== input.accountId ||
          existing.loan_id !== input.loanId ||
          moneyToCents(existing.amount) !== amountCents ||
          existing.description !== input.description
        ) {
          throw new ApiError("Idempotency key has already been used", 409);
        }
        return {
          id: existing.id,
          reference: existing.reference,
          type: existing.type,
          amount: existing.amount,
          status: existing.status,
          description: existing.description,
          created_at: existing.created_at,
        };
      }

      const loanResult = await client.query(
        `SELECT id::text, customer_id::text, account_id::text,
                remaining_balance::text, status
         FROM loans WHERE id = $1 FOR UPDATE`,
        [input.loanId],
      );
      const loan = loanResult.rows[0];
      if (!loan || loan.customer_id !== user.id) {
        throw new ApiError("Loan not found", 404);
      }
      if (loan.status !== "active" || !loan.account_id) {
        throw new ApiError("Loan is not eligible for repayment", 409);
      }
      if (loan.account_id !== input.accountId) {
        throw new ApiError("Repayment account does not match the loan", 400);
      }

      const accountResult = await client.query<AccountRow>(
        `SELECT id::text, owner_id::text, account_number, balance::text, status,
                max_single_transaction::text, daily_transfer_limit::text,
                minimum_balance::text
         FROM accounts WHERE id = $1 FOR UPDATE`,
        [input.accountId],
      );
      const account = accountResult.rows[0];
      if (!account || account.owner_id !== user.id) {
        throw new ApiError("Account not found", 404);
      }
      if (account.status !== "active") {
        throw new ApiError("Account is not active", 409);
      }
      if (amountCents > moneyToCents(loan.remaining_balance)) {
        throw new ApiError("Repayment exceeds the remaining loan balance", 400);
      }
      if (amountCents > moneyToCents(account.max_single_transaction)) {
        throw new ApiError("Amount exceeds the account transaction limit", 400);
      }
      if (
        moneyToCents(account.balance) - amountCents <
        moneyToCents(account.minimum_balance)
      ) {
        throw new ApiError("Insufficient available balance", 409);
      }

      await client.query(
        "UPDATE accounts SET balance = balance - $2, updated_at = now() WHERE id = $1",
        [account.id, input.amount],
      );
      const remaining = moneyToCents(loan.remaining_balance) - amountCents;
      await client.query(
        `UPDATE loans
         SET remaining_balance = $2, status = $3, updated_at = now()
         WHERE id = $1`,
        [
          loan.id,
          centsToMoney(remaining),
          remaining === BigInt(0) ? "completed" : "active",
        ],
      );
      const created = await client.query(
        `INSERT INTO transactions (
           reference, sender_account_id, loan_id, type, amount, status,
           description, idempotency_key, created_by
         )
         VALUES ($1, $2, $3, 'loan-repayment', $4, 'completed', $5, $6, $7)
         RETURNING id::text, reference, type, amount::text, status, description, created_at`,
        [
          generateReference(),
          account.id,
          loan.id,
          input.amount,
          input.description,
          key,
          user.id,
        ],
      );
      return created.rows[0];
    });

    return Response.json({ transaction }, { status: 201 });
  });
}
