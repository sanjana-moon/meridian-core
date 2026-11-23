import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  transactionPin: z.string().regex(/^\d{4,8}$/),
  accountType: z.enum(["savings", "current", "business"]).default("savings"),
});

export const twoFactorCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
}).strict();

export const customerStatusSchema = z.object({
  status: z.enum(["active", "blocked"]),
}).strict();
