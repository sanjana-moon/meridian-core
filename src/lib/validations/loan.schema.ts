import { z } from "zod";

const amount = z.union([z.string(), z.number()]).transform(String).pipe(
  z.string().regex(/^\d{1,18}(?:\.\d{1,2})?$/),
);

export const loanApplicationSchema = z.object({
  loanType: z.string().trim().min(2).max(80),
  requestedAmount: amount,
  durationMonths: z.number().int().min(1).max(600),
  monthlyIncome: amount,
  employmentStatus: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000).default(""),
  accountId: z.string().uuid().optional(),
});

export const loanReviewSchema = z.object({
  status: z.enum(["under-review"]),
  internalNotes: z.string().trim().max(2000).optional(),
}).strict();

export const loanDecisionSchema = z.object({
  accountId: z.string().uuid().optional(),
  twoFactorCode: z.string().regex(/^\d{6}$/).optional(),
}).strict();
