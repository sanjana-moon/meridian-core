import { z } from "zod";

const amount = z.union([z.string(), z.number()]).transform(String).pipe(
  z.string().regex(/^\d{1,18}(?:\.\d{1,2})?$/),
);

export const transactionRequestSchema = z.object({
  accountId: z.string().uuid(),
  amount,
  description: z.string().trim().max(500).default(""),
  transactionPin: z.string().regex(/^\d{4,8}$/).optional(),
});

export const transactionReviewSchema = z.object({
  decision: z.enum(["approve", "reject", "flag"]),
}).strict();

export const transferSchema = z.object({
  senderAccountId: z.string().uuid(),
  recipientAccountNumber: z.string().trim().min(6).max(40),
  amount,
  description: z.string().trim().max(500).default(""),
  transactionPin: z.string().regex(/^\d{4,8}$/),
  twoFactorCode: z.string().regex(/^\d{6}$/).optional(),
}).strict();

export const loanRepaymentSchema = z.object({
  accountId: z.string().uuid(),
  loanId: z.string().uuid(),
  amount,
  description: z.string().trim().max(500).default(""),
  transactionPin: z.string().regex(/^\d{4,8}$/),
}).strict();
