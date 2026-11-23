import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import { ApiError } from "@/server/utils/api-response";

function encryptionKey(): Buffer {
  const masterKey =
    process.env.TOTP_ENCRYPTION_KEY ?? process.env.AUTH_SECRET;
  if (!masterKey || masterKey.length < 32) {
    throw new ApiError(
      "Configure a 32-character TOTP_ENCRYPTION_KEY or AUTH_SECRET",
      503,
    );
  }

  return createHmac("sha256", masterKey)
    .update("meridian-core:totp-secret:v1")
    .digest();
}

export function encryptSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return [
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(value: string): string {
  const [iv, authTag, encrypted] = value.split(".");
  if (!iv || !authTag || !encrypted) {
    throw new Error("Stored two-factor secret is malformed");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
