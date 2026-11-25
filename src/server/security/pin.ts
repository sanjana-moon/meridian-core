import argon2 from "argon2";
import { ApiError } from "@/server/utils/api-response";

// PIN is a short numeric secret. Argon2id with strong params makes
// brute-forcing 6-digit PINs expensive. (Combined with rate limiting
// in the transfer endpoint, this is safe.)
const PIN_HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 4,
  parallelism: 4,
} as const;

export const MIN_PIN_LENGTH = 4;
export const MAX_PIN_LENGTH = 8;

export function validatePinFormat(pin: string): void {
  if (!/^\d+$/.test(pin)) {
    throw new ApiError("Transaction PIN must be numeric", 400);
  }
  if (pin.length < MIN_PIN_LENGTH || pin.length > MAX_PIN_LENGTH) {
    throw new ApiError(
      `Transaction PIN must be ${MIN_PIN_LENGTH}-${MAX_PIN_LENGTH} digits`,
      400,
    );
  }
}

export async function hashPin(pin: string): Promise<string> {
  validatePinFormat(pin);
  return argon2.hash(pin, PIN_HASH_OPTIONS);
}

export async function verifyPin(
  storedHash: string | null | undefined,
  pin: string | null | undefined,
): Promise<boolean> {
  if (!storedHash || !pin) return false;
  if (!/^\d+$/.test(pin)) return false;
  try {
    return await argon2.verify(storedHash, pin);
  } catch {
    return false;
  }
}