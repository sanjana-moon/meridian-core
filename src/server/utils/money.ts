import { ApiError } from "@/server/utils/api-response";

export function moneyToCents(value: string | number): bigint {
  const normalized = String(value);
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);

  if (!match) {
    throw new ApiError("Amount must have at most two decimal places", 400);
  }

  return BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
}

export function centsToMoney(cents: bigint): string {
  const whole = cents / BigInt(100);
  const fraction = String(cents % BigInt(100)).padStart(2, "0");
  return `${whole}.${fraction}`;
}

export function isValidPositiveAmount(value: string): boolean {
  try {
    return moneyToCents(value) > BigInt(0);
  } catch {
    return false;
  }
}
