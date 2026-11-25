import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { getPool } from "@/server/database/connection";
import { withTransaction } from "@/server/database/with-transaction";
import { logger } from "@/server/utils/logger";

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 10; // characters per code
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 32768, // lower than password — codes are one-use
  timeCost: 2,
  parallelism: 2,
} as const;

/**
 * Generate N fresh recovery codes, hash them, store them, and return the
 * plaintext codes to show the user ONCE.
 */
export async function generateRecoveryCodes(userId: string): Promise<string[]> {
  const plaintext: string[] = [];
  const hashes: string[] = [];

  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const raw = randomBytes(RECOVERY_CODE_LENGTH)
      .toString("base64url")
      .slice(0, RECOVERY_CODE_LENGTH)
      .toUpperCase();
    plaintext.push(raw);
    hashes.push(await argon2.hash(raw, HASH_OPTIONS));
  }

  await withTransaction(async (client) => {
    // Clear any existing codes (recovery codes are regenerated, not appended).
    await client.query(`DELETE FROM recovery_codes WHERE user_id = $1`, [userId]);
    for (const hash of hashes) {
      await client.query(
        `INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1, $2)`,
        [userId, hash],
      );
    }
  });

  return plaintext;
}

/**
 * Verify a recovery code. On success, the code is marked as used so it
 * cannot be reused. Returns true if the code was valid and consumed.
 */
export async function consumeRecoveryCode(
  userId: string,
  code: string,
): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return false;

  const result = await getPool().query<{ id: string; code_hash: string }>(
    `SELECT id::text, code_hash
     FROM recovery_codes
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId],
  );

  for (const row of result.rows) {
    const ok = await argon2.verify(row.code_hash, normalized).catch(() => false);
    if (ok) {
      // Mark used atomically. Only succeeds if still unused.
      const update = await getPool().query(
        `UPDATE recovery_codes SET used_at = now()
         WHERE id = $1 AND used_at IS NULL`,
        [row.id],
      );
      if (update.rowCount === 1) {
        logger.info("Recovery code consumed", { userId });
        return true;
      }
    }
  }
  return false;
}