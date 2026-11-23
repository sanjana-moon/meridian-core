import { createHash, randomBytes } from "node:crypto";
import { twoFactorCodeSchema } from "@/lib/validations/auth.schema";
import { getPool } from "@/server/database/connection";
import { withTransaction } from "@/server/database/with-transaction";
import { requireUser } from "@/server/guards/auth.guard";
import {
  ApiError,
  parseBody,
  withApiErrors,
} from "@/server/utils/api-response";
import { decryptSecret, encryptSecret } from "@/server/security/encryption";
import {
  assertTwoFactorIfEnabled,
  createTotpSetup,
  verifyTotp,
} from "@/server/security/totp";

export async function getTwoFactorStatus() {
  return withApiErrors(async () => {
    const user = await requireUser();
    const result = await getPool().query<{ enabled: boolean }>(
      "SELECT enabled FROM two_factor_secrets WHERE user_id = $1",
      [user.id],
    );
    return Response.json({ enabled: result.rows[0]?.enabled ?? false });
  });
}

export async function setupTwoFactor(request: Request) {
  return withApiErrors(async () => {
    const user = await requireUser();
    await assertTwoFactorIfEnabled(
      user.id,
      request.headers.get("X-2FA-Code") ?? undefined,
    );
    const { secret, qrCode } = await createTotpSetup(user.email);
    await getPool().query(
      `INSERT INTO two_factor_secrets (user_id, secret_ciphertext, enabled)
       VALUES ($1, $2, false)
       ON CONFLICT (user_id)
       DO UPDATE SET secret_ciphertext = EXCLUDED.secret_ciphertext,
                     enabled = false,
                     updated_at = now()`,
      [user.id, encryptSecret(secret)],
    );

    return Response.json({ qrCode });
  });
}

export async function verifyTwoFactor(request: Request) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const { code } = await parseBody(request, twoFactorCodeSchema);
    const result = await getPool().query<{ secret_ciphertext: string }>(
      `SELECT secret_ciphertext FROM two_factor_secrets WHERE user_id = $1`,
      [user.id],
    );
    const encryptedSecret = result.rows[0]?.secret_ciphertext;
    if (!encryptedSecret) {
      throw new ApiError("Two-factor setup has not been started", 409);
    }

    const secret = decryptSecret(encryptedSecret);
    if (!(await verifyTotp(secret, code))) {
      throw new ApiError("Invalid verification code", 400);
    }

    const recoveryCodes = Array.from({ length: 8 }, () =>
      randomBytes(8).toString("hex"),
    );
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE two_factor_secrets
         SET enabled = true, updated_at = now()
         WHERE user_id = $1`,
        [user.id],
      );
      await client.query("DELETE FROM recovery_codes WHERE user_id = $1", [
        user.id,
      ]);
      for (const codeValue of recoveryCodes) {
        const codeHash = createHash("sha256").update(codeValue).digest("hex");
        await client.query(
          "INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1, $2)",
          [user.id, codeHash],
        );
      }
    });

    return Response.json({ enabled: true, recoveryCodes });
  });
}

export async function disableTwoFactor(request: Request) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const { code } = await parseBody(request, twoFactorCodeSchema);
    const result = await getPool().query<{ secret_ciphertext: string }>(
      `SELECT secret_ciphertext FROM two_factor_secrets
       WHERE user_id = $1 AND enabled = true`,
      [user.id],
    );
    const encryptedSecret = result.rows[0]?.secret_ciphertext;
    if (!encryptedSecret) {
      throw new ApiError("Two-factor authentication is not enabled", 409);
    }
    if (!(await verifyTotp(decryptSecret(encryptedSecret), code))) {
      throw new ApiError("Invalid verification code", 400);
    }

    await withTransaction(async (client) => {
      await client.query("DELETE FROM recovery_codes WHERE user_id = $1", [
        user.id,
      ]);
      await client.query("DELETE FROM two_factor_secrets WHERE user_id = $1", [
        user.id,
      ]);
    });

    return Response.json({ enabled: false });
  });
}
