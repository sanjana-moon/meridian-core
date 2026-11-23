import { settingsUpdateSchema } from "@/lib/validations/settings.schema";
import { getPool } from "@/server/database/connection";
import { requireRole } from "@/server/guards/role.guard";
import { withTransaction } from "@/server/database/with-transaction";
import { parseBody, withApiErrors } from "@/server/utils/api-response";
import { assertTwoFactorIfEnabled } from "@/server/security/totp";

export async function getSettings() {
  return withApiErrors(async () => {
    await requireRole("admin");
    const result = await getPool().query(
      `SELECT key, value, updated_at
       FROM app_settings
       ORDER BY key`,
    );
    return Response.json({
      settings: Object.fromEntries(
        result.rows.map((row) => [row.key, row.value]),
      ),
    });
  });
}

export async function updateSettings(request: Request) {
  return withApiErrors(async () => {
    const admin = await requireRole("admin");
    const { settings } = await parseBody(request, settingsUpdateSchema);
    await assertTwoFactorIfEnabled(
      admin.id,
      request.headers.get("X-2FA-Code") ?? undefined,
    );

    await withTransaction(async (client) => {
      for (const [key, value] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO app_settings (key, value, updated_by)
           VALUES ($1, $2::jsonb, $3)
           ON CONFLICT (key)
           DO UPDATE SET value = EXCLUDED.value,
                         updated_by = EXCLUDED.updated_by,
                         updated_at = now()`,
          [key, JSON.stringify(value), admin.id],
        );
      }
    });

    return Response.json({ settings });
  });
}
