import { z } from "zod";

const amount = z.union([z.string(), z.number()]).transform(String).pipe(
  z.string().regex(/^\d{1,18}(?:\.\d{1,2})?$/),
);

export const accountCreateSchema = z.object({
  ownerId: z.string().uuid(),
  type: z.enum(["savings", "current", "business"]).default("savings"),
});

export const accountUpdateSchema = z.object({
  type: z.enum(["savings", "current", "business"]).optional(),
  status: z.enum(["active", "inactive", "frozen", "blocked"]).optional(),
  dailyTransferLimit: amount.optional(),
  maxSingleTransaction: amount.optional(),
  minimumBalance: amount.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one account field is required",
});
