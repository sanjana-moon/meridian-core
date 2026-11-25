import {
  accountCreateSchema,
  accountUpdateSchema,
} from "@/lib/validations/account.schema";
import { getPool } from "@/server/models/account.model";
import { requireRole } from "@/server/guards/role.guard";
import { requireUser } from "@/server/guards/auth.guard";
import {
  ApiError,
  assertUuid,
  parseBody,
  withApiErrors,
} from "@/server/utils/api-response";
import { generateReference } from "@/server/utils/generate-reference";

type AccountRouteContext = {
  params: Promise<{ accountId: string }>;
};

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function listAccounts(request: Request) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const url = new URL(request.url);
    const requestedOwner = url.searchParams.get("ownerId");
    if (requestedOwner) {
      assertUuid(requestedOwner, "ownerId");
    }

    if (user.role === "customer") {
      const result = await getPool().query(
        `SELECT id::text, owner_id::text, account_number, type, balance::text,
                status, daily_transfer_limit::text, max_single_transaction::text,
                minimum_balance::text, created_at
         FROM accounts
         WHERE owner_id = $1
         ORDER BY created_at DESC`,
        [user.id],
      );
      return Response.json({ accounts: result.rows });
    }

    const result = await getPool().query(
      `SELECT id::text, owner_id::text, account_number, type, balance::text,
              status, daily_transfer_limit::text, max_single_transaction::text,
              minimum_balance::text, created_at
       FROM accounts
       WHERE ($1::uuid IS NULL OR owner_id = $1)
       ORDER BY created_at DESC`,
      [requestedOwner],
    );
    return Response.json({ accounts: result.rows });
  });
}

export async function createAccount(request: Request) {
  return withApiErrors(async () => {
    await requireRole("admin", "staff");
    const input = await parseBody(request, accountCreateSchema);
    const result = await getPool().query(
      `INSERT INTO accounts (owner_id, account_number, type)
       SELECT id, $2, $3
       FROM users
       WHERE id = $1 AND role = 'customer' AND status = 'active'
       RETURNING id::text, owner_id::text, account_number, type, balance::text,
                 status, daily_transfer_limit::text, max_single_transaction::text,
                 minimum_balance::text, created_at`,
      [input.ownerId, generateReference("ACC"), input.type],
    );
    if (!result.rows[0]) {
      throw new ApiError("Active customer not found", 404);
    }

    return Response.json({ account: result.rows[0] }, { status: 201 });
  });
}

export async function getAccount(
  request: Request,
  context: AccountRouteContext,
) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const { accountId } = await context.params;
    assertUuid(accountId, "accountId");
    const accountResult = await getPool().query(
      `SELECT id::text, owner_id::text, account_number, type, balance::text,
              status, daily_transfer_limit::text, max_single_transaction::text,
              minimum_balance::text, created_at
       FROM accounts
       WHERE id = $1
         AND ($2 <> 'customer' OR owner_id = $3)`,
      [accountId, user.role, user.id],
    );
    const account = accountResult.rows[0];
    if (!account) {
      throw new ApiError("Account not found", 404);
    }

    const transactions = await getPool().query(
      `SELECT id::text, reference, type, amount::text, fee::text, status,
              description, created_at
       FROM transactions
       WHERE sender_account_id = $1 OR receiver_account_id = $1
       ORDER BY created_at DESC
       LIMIT 500`,
      [accountId],
    );

    if (new URL(request.url).searchParams.get("format") === "csv") {
      const rows = [
        ["Reference", "Type", "Amount", "Fee", "Status", "Description", "Date"],
        ...transactions.rows.map((transaction) => [
          transaction.reference,
          transaction.type,
          transaction.amount,
          transaction.fee,
          transaction.status,
          transaction.description,
          transaction.created_at,
        ]),
      ];
      const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="account-${account.account_number}-statement.csv"`,
        },
      });
    }

    return Response.json({ account, transactions: transactions.rows });
  });
}

export async function updateAccount(
  request: Request,
  context: AccountRouteContext,
) {
  return withApiErrors(async () => {
    await requireRole("admin", "staff");
    const input = await parseBody(request, accountUpdateSchema);
    const { accountId } = await context.params;
    assertUuid(accountId, "accountId");
    const values: unknown[] = [accountId];
    const assignments: string[] = [];

    const fields = [
      ["type", input.type],
      ["status", input.status],
      ["daily_transfer_limit", input.dailyTransferLimit],
      ["max_single_transaction", input.maxSingleTransaction],
      ["minimum_balance", input.minimumBalance],
    ] as const;

    for (const [column, value] of fields) {
      if (value !== undefined) {
        values.push(value);
        assignments.push(`${column} = $${values.length}`);
      }
    }

    assignments.push("updated_at = now()");
    const result = await getPool().query(
      `UPDATE accounts
       SET ${assignments.join(", ")}
       WHERE id = $1
       RETURNING id::text, owner_id::text, account_number, type, balance::text,
                 status, daily_transfer_limit::text, max_single_transaction::text,
                 minimum_balance::text, updated_at`,
      values,
    );
    if (!result.rows[0]) {
      throw new ApiError("Account not found", 404);
    }

    return Response.json({ account: result.rows[0] });
  });
}

export async function deactivateAccount(
  _request: Request,
  context: AccountRouteContext,
) {
  return withApiErrors(async () => {
    await requireRole("admin", "staff");
    const { accountId } = await context.params;
    assertUuid(accountId, "accountId");
    const result = await getPool().query(
      `UPDATE accounts SET status = 'inactive', updated_at = now()
       WHERE id = $1 RETURNING id::text, status`,
      [accountId],
    );
    if (!result.rows[0]) {
      throw new ApiError("Account not found", 404);
    }

    return Response.json({ account: result.rows[0] });
  });
}
