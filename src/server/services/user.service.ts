import argon2 from "argon2";
import {
  customerStatusSchema,
  registerSchema,
} from "@/lib/validations/auth.schema";
import { requireRole } from "@/server/guards/role.guard";
import { getPool } from "@/server/models/user.model";
import { withTransaction } from "@/server/database/with-transaction";
import {
  ApiError,
  assertUuid,
  parseBody,
  withApiErrors,
} from "@/server/utils/api-response";
import { generateReference } from "@/server/utils/generate-reference";
import type { CreatedUserRow } from "@/server/models/user.model";

async function createCustomer(request: Request, staffOnly: boolean) {
  return withApiErrors(async () => {
    const actor = staffOnly ? await requireRole("admin", "staff") : null;
    const input = await parseBody(request, registerSchema);
    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });
    const pinHash = await argon2.hash(input.transactionPin, {
      type: argon2.argon2id,
    });
    const accountNumber = generateReference("ACC");

    const customer = await withTransaction(async (client) => {
      const created = await client.query<CreatedUserRow>(
        `INSERT INTO users (name, email, password_hash, transaction_pin_hash, role)
         VALUES ($1, lower($2), $3, $4, 'customer')
         ON CONFLICT (email) DO NOTHING
         RETURNING id::text, name, email, role`,
        [input.name, input.email, passwordHash, pinHash],
      );
      const user = created.rows[0];
      if (!user) {
        throw new ApiError("An account already exists for this email", 409);
      }

      const account = await client.query(
        `INSERT INTO accounts (owner_id, account_number, type)
         VALUES ($1, $2, $3)
         RETURNING id::text, account_number, type, balance::text, status`,
        [user.id, accountNumber, input.accountType],
      );

      if (actor) {
        await client.query(
          `INSERT INTO notifications (user_id, type, message)
           VALUES ($1, 'account-created', 'A bank account has been created for you')`,
          [user.id],
        );
      }

      return { user, account: account.rows[0] };
    });

    return Response.json(customer, { status: 201 });
  });
}

export function registerCustomer(request: Request) {
  return createCustomer(request, false);
}

export function createCustomerByStaff(request: Request) {
  return createCustomer(request, true);
}

export async function listUsers(request: Request) {
  return withApiErrors(async () => {
    await requireRole("admin", "staff");
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");

    if (customerId) {
      assertUuid(customerId, "customerId");
      const userResult = await getPool().query(
        `SELECT id::text, name, email, role, status, created_at
         FROM users
         WHERE id = $1 AND role = 'customer'`,
        [customerId],
      );
      const user = userResult.rows[0];
      if (!user) {
        throw new ApiError("Customer not found", 404);
      }

      const [accounts, transactions] = await Promise.all([
        getPool().query(
          `SELECT id::text, account_number, type, balance::text, status, created_at
           FROM accounts WHERE owner_id = $1 ORDER BY created_at DESC`,
          [customerId],
        ),
        getPool().query(
          `SELECT t.id::text, t.reference, t.type, t.amount::text, t.status,
                  t.description, t.created_at
           FROM transactions t
           LEFT JOIN accounts a
             ON a.id = t.sender_account_id OR a.id = t.receiver_account_id
           WHERE a.owner_id = $1
           ORDER BY t.created_at DESC
           LIMIT 100`,
          [customerId],
        ),
      ]);

      return Response.json({
        ...user,
        accounts: accounts.rows,
        transactions: transactions.rows,
      });
    }

    const query = url.searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("limit") ?? 25) || 25),
    );
    const result = await getPool().query(
      `SELECT id::text, name, email, status, created_at,
              count(*) OVER()::int AS total_count
       FROM users
       WHERE role = 'customer'
         AND ($1 = '' OR name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [query, limit, (page - 1) * limit],
    );

    const customers = result.rows.map((row) => {
      const customer = { ...row };
      delete customer.total_count;
      return customer;
    });

    return Response.json({
      customers,
      page,
      limit,
      total: result.rows[0]?.total_count ?? 0,
    });
  });
}

export function createUser(request: Request) {
  return createCustomerByStaff(request);
}

export async function updateCustomerStatus(request: Request) {
  return withApiErrors(async () => {
    const admin = await requireRole("admin");
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");
    if (!customerId) {
      throw new ApiError("customerId is required", 400);
    }
    assertUuid(customerId, "customerId");
    const { status } = await parseBody(request, customerStatusSchema);
    const result = await getPool().query(
      `UPDATE users
       SET status = $2, updated_at = now()
       WHERE id = $1 AND role = 'customer' AND id <> $3
       RETURNING id::text, name, email, status`,
      [customerId, status, admin.id],
    );
    if (!result.rows[0]) {
      throw new ApiError("Customer not found", 404);
    }

    return Response.json({ customer: result.rows[0] });
  });
}
