import { randomUUID } from "node:crypto";

export function generateReference(prefix = "TXN"): string {
  return `${prefix}-${randomUUID().replaceAll("-", "").toUpperCase()}`;
}
