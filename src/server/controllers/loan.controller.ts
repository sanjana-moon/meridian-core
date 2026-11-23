import {
  loanApplicationSchema,
  loanDecisionSchema,
  loanReviewSchema,
} from "@/lib/validations/loan.schema";
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
import { moneyToCents } from "@/server/utils/money";
import { assertTwoFactorIfEnabled } from "@/server/security/totp";

type LoanRouteContext = {
  params: Promise<{ loanId: string }>;
};

async function setLoanDecision(
  request: Request,
  context: LoanRouteContext,
  decision: "approve" | "reject",
) {
  return withApiErrors(async () => {
    const reviewer = await requireRole("admin");
    const input = await parseBody(request, loanDecisionSchema);
    await assertTwoFactorIfEnabled(reviewer.id, input.twoFactorCode);
    const { loanId } = await context.params;
    assertUuid(loanId, "loanId");

    const result = await withTransaction(async (client) => {
      const selected = await client.query(
        `SELECT id::text, customer_id::text, account_id::text, loan_type,
                requested_amount::text, duration_months, status
         FROM loans WHERE id = $1 FOR UPDATE`,
        [loanId],
      );
      const loan = selected.rows[0];
      if (!loan) {
        throw new ApiError("Loan application not found", 404);
      }
      if (loan.customer_id === reviewer.id) {
        throw new ApiError("You cannot approve your own loan", 403);
      }
      if (!["pending", "under-review"].includes(loan.status)) {
        throw new ApiError("Loan application has already been reviewed", 409);
      }

      if (decision === "reject") {
        const rejected = await client.query(
          `UPDATE loans
           SET status = 'rejected', reviewed_by = $2, updated_at = now()
           WHERE id = $1
           RETURNING id::text, status, updated_at`,
          [loanId, reviewer.id],
        );
        await client.query(
          `INSERT INTO notifications (user_id, type, message)
           VALUES ($1, 'loan-rejected', 'Your loan application was rejected')`,
          [loan.customer_id],
        );
        return rejected.rows[0];
      }

      const accountId = loan.account_id ?? input.accountId;
      if (!accountId) {
        throw new ApiError("Select an account for loan disbursement", 400);
      }
      const accountResult = await client.query(
        `SELECT id::text, owner_id::text, status
         FROM accounts WHERE id = $1 FOR UPDATE`,
        [accountId],
      );
      const account = accountResult.rows[0];
      if (!account || account.owner_id !== loan.customer_id) {
        throw new ApiError("Customer account not found", 404);
      }
      if (account.status !== "active") {
        throw new ApiError("Disbursement account is not active", 409);
      }

      const approved = await client.query(
        `UPDATE loans
         SET account_id = $2, status = 'active',
             remaining_balance = requested_amount, reviewed_by = $3,
             updated_at = now()
         WHERE id = $1
         RETURNING id::text, customer_id::text, account_id::text,
                   loan_type, requested_amount::text, duration_months,
                   remaining_balance::text, status, updated_at`,
        [loanId, accountId, reviewer.id],
      );
      await client.query(
        "UPDATE accounts SET balance = balance + $2, updated_at = now() WHERE id = $1",
        [accountId, loan.requested_amount],
      );
      await client.query(
        `INSERT INTO transactions (
           reference, receiver_account_id, loan_id, type, amount,
           status, description, created_by, reviewed_by
         )
         VALUES ($1, $2, $3, 'loan-disbursement', $4, 'completed', $5, $6, $6)`,
        [
          generateReference(),
          accountId,
          loanId,
          loan.requested_amount,
          `Disbursement for ${loan.loan_type} loan`,
          reviewer.id,
        ],
      );
      await client.query(
        `INSERT INTO notifications (user_id, type, message)
         VALUES ($1, 'loan-approved', 'Your loan was approved and disbursed')`,
        [loan.customer_id],
      );
      return approved.rows[0];
    });

    return Response.json({ loan: result });
  });
}

export async function listLoans(request: Request) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const values: unknown[] = [];
    const filters = ["1 = 1"];

    if (user.role === "customer") {
      values.push(user.id);
      filters.push(`customer_id = $${values.length}`);
    }
    if (status) {
      values.push(status);
      filters.push(`status = $${values.length}`);
    }

    const result = await getPool().query(
      `SELECT id::text, customer_id::text, account_id::text, loan_type,
              requested_amount::text, duration_months, monthly_income::text,
              employment_status, description,
              CASE WHEN $${values.length + 1} = 'customer' THEN NULL
                   ELSE internal_notes END AS internal_notes,
              status, remaining_balance::text, created_at, updated_at
       FROM loans
       WHERE ${filters.join(" AND ")}
       ORDER BY created_at DESC`,
      [...values, user.role],
    );

    return Response.json({ loans: result.rows });
  });
}

export async function applyForLoan(request: Request) {
  return withApiErrors(async () => {
    const user = await requireUser();
    if (user.role !== "customer") {
      throw new ApiError("Only customers may apply for loans", 403);
    }
    const input = await parseBody(request, loanApplicationSchema);
    if (
      moneyToCents(input.requestedAmount) <= BigInt(0) ||
      moneyToCents(input.monthlyIncome) < BigInt(0)
    ) {
      throw new ApiError("Loan amounts are invalid", 400);
    }

    if (input.accountId) {
      const account = await getPool().query(
        `SELECT id FROM accounts
         WHERE id = $1 AND owner_id = $2 AND status = 'active'`,
        [input.accountId, user.id],
      );
      if (!account.rows[0]) {
        throw new ApiError("Active customer account not found", 404);
      }
    }

    const loan = await withTransaction(async (client) => {
      const created = await client.query(
        `INSERT INTO loans (
           customer_id, account_id, loan_type, requested_amount, duration_months,
           monthly_income, employment_status, description
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id::text, customer_id::text, account_id::text, loan_type,
                   requested_amount::text, duration_months, monthly_income::text,
                   employment_status, description, status, remaining_balance::text,
                   created_at`,
        [
          user.id,
          input.accountId ?? null,
          input.loanType,
          input.requestedAmount,
          input.durationMonths,
          input.monthlyIncome,
          input.employmentStatus,
          input.description,
        ],
      );
      await client.query(
        `INSERT INTO notifications (user_id, type, message)
         SELECT id, 'loan-submitted', 'A new loan application is ready for review'
         FROM users WHERE role IN ('admin', 'staff') AND status = 'active'`,
      );
      return created.rows[0];
    });

    return Response.json({ loan }, { status: 201 });
  });
}

export async function getLoan(_request: Request, context: LoanRouteContext) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const { loanId } = await context.params;
    assertUuid(loanId, "loanId");
    const result = await getPool().query(
      `SELECT id::text, customer_id::text, account_id::text, loan_type,
              requested_amount::text, duration_months, monthly_income::text,
              employment_status, description,
              CASE WHEN $3 = 'customer' THEN NULL ELSE internal_notes END AS internal_notes,
              status, remaining_balance::text, reviewed_by::text, created_at, updated_at
       FROM loans
       WHERE id = $1 AND ($2 <> 'customer' OR customer_id = $4)`,
      [loanId, user.role, user.role, user.id],
    );
    if (!result.rows[0]) {
      throw new ApiError("Loan application not found", 404);
    }

    const repayments = await getPool().query(
      `SELECT id::text, reference, amount::text, status, description, created_at
       FROM transactions
       WHERE loan_id = $1 AND type = 'loan-repayment'
       ORDER BY created_at DESC`,
      [loanId],
    );
    return Response.json({ loan: result.rows[0], repayments: repayments.rows });
  });
}

export async function reviewLoan(request: Request, context: LoanRouteContext) {
  return withApiErrors(async () => {
    const reviewer = await requireRole("admin", "staff");
    const input = await parseBody(request, loanReviewSchema);
    const { loanId } = await context.params;
    assertUuid(loanId, "loanId");
    const result = await getPool().query(
      `UPDATE loans
       SET status = 'under-review',
           internal_notes = CASE WHEN $2 = '' THEN internal_notes ELSE $2 END,
           updated_at = now()
       WHERE id = $1 AND status IN ('pending', 'under-review')
         AND customer_id <> $3
       RETURNING id::text, status, internal_notes, updated_at`,
      [loanId, input.internalNotes ?? "", reviewer.id],
    );
    if (!result.rows[0]) {
      const exists = await getPool().query(
        "SELECT id FROM loans WHERE id = $1",
        [loanId],
      );
      if (!exists.rows[0]) {
        throw new ApiError("Loan application not found", 404);
      }
      throw new ApiError("Loan application cannot be reviewed by this user", 409);
    }

    return Response.json({ loan: result.rows[0] });
  });
}

export function approveLoan(request: Request, context: LoanRouteContext) {
  return setLoanDecision(request, context, "approve");
}

export function rejectLoan(request: Request, context: LoanRouteContext) {
  return setLoanDecision(request, context, "reject");
}
