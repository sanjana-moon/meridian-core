import QRCode from "qrcode";
import { generateSecret, generateURI, verify } from "otplib";
import { getPool } from "@/server/database/connection";
import { decryptSecret } from "@/server/security/encryption";
import { ApiError } from "@/server/utils/api-response";

const ISSUER = "Meridian Core";

export async function createTotpSetup(email: string) {
  // otplib v13: generateSecret() returns a base32 string by default.
  const secret = generateSecret();
  const uri = generateURI({
    issuer: ISSUER,
    label: email,
    secret,
  });
  const qrCode = await QRCode.toDataURL(uri);
  return { secret, qrCode };
}

export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  if (!/^\d{6}$/.test(token)) return false;
  const result = await verify({
    secret,
    token,
    epochTolerance: 1, // one 30-s window before/after
  });
  return result.valid;
}

export async function assertTwoFactorIfEnabled(
  userId: string,
  token?: string,
): Promise<void> {
  const result = await getPool().query<{
    secret_ciphertext: string;
    enabled: boolean;
  }>(
    `SELECT secret_ciphertext, enabled
     FROM two_factor_secrets WHERE user_id = $1`,
    [userId],
  );
  const setup = result.rows[0];
  if (!setup?.enabled) {
    return;
  }
  if (!token) {
    throw new ApiError("Two-factor code required", 403);
  }
  const valid = await verifyTotp(decryptSecret(setup.secret_ciphertext), token);
  if (!valid) {
    throw new ApiError("Invalid two-factor code", 403);
  }
}