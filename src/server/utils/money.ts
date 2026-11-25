// src/server/utils/money.ts
import { ApiError } from "@/server/utils/api-response";

/**
 * Convert a user-provided money string/number to integer cents (bigint).
 * Accepts: "100", "100.5", "100.50", 100, 100.5
 * Rejects: negatives, >2 decimals, NaN, Infinity, empty, scientific notation.
 */
export function moneyToCents(value: string | number): bigint {
  if (value === null || value === undefined || value === "") {
    throw new ApiError("Amount is required", 400);
  }

  // Reject non-finite numbers (NaN, Infinity, -Infinity).
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new ApiError("Amount must be a valid number", 400);
  }

  const normalized = String(value).trim();

  // Only allow plain decimal format: optional minus is NOT allowed.
  // This prevents "-100" from silently slipping through.
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) {
    if (normalized.startsWith("-")) {
      throw new ApiError("Amount must be positive", 400);
    }
    if (normalized.includes(".") && /\d\.\d{3,}/.test(normalized)) {
      throw new ApiError("Amount must have at most two decimal places", 400);
    }
    throw new ApiError("Amount must be a valid monetary value (e.g. 100.50)", 400);
  }

  const wholePart = BigInt(match[1]);
  const fractionPart = BigInt((match[2] ?? "0").padEnd(2, "0"));
  return wholePart * BigInt(100) + fractionPart;
}

/**
 * Convert integer cents (bigint) to the canonical money string.
 * Always returns two decimal places, e.g. 1050n -> "10.50"
 */
export function centsToMoney(cents: bigint): string {
  if (cents < BigInt(0)) {
    throw new ApiError("Money amount cannot be negative", 500);
  }
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

/**
 * Safely compare two money values expressed as decimal strings.
 * Uses bigint math internally so no floating point error.
 */
export function isMoneyGreater(
  a: string | number,
  b: string | number,
): boolean {
  return moneyToCents(a) > moneyToCents(b);
}

export function isMoneyGreaterOrEqual(
  a: string | number,
  b: string | number,
): boolean {
  return moneyToCents(a) >= moneyToCents(b);
}