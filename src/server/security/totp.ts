import QRCode from "qrcode";
import { generateSecret, generateURI, verify } from "otplib";
import { getPool } from "@/server/database/connection";
import { decryptSecret } from "@/server/security/encryption";
import { ApiError } from "@/server/utils/api-response";

export async function createTotpSetup(email: string) {
  const secret = generateSecret();
  const uri = generateURI({
    issuer: "Meridian Core",
    label: email,
    secret,
  });
  const qrCode = await QRCode.toDataURL(uri);
  return { secret, qrCode };
}

export async function verifyTotp(secret: string, token: string) {
  const result = await verify({
    secret,
    token,
    epochTolerance: 30,
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
  if (!token || !(await verifyTotp(decryptSecret(setup.secret_ciphertext), token))) {
    throw new ApiError("A valid two-factor code is required", 403);
  }
}
