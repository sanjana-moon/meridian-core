import { randomUUID } from "node:crypto";

// Secure, collision-resistant transaction reference.
// Format: TXN-<UUID without dashes, uppercase> (32 hex chars)
// 128 bits of randomness. Practically impossible to collide.
export function generateReference(prefix = "TXN"): string {
  return `${prefix}-${randomUUID().replaceAll("-", "").toUpperCase()}`;
}