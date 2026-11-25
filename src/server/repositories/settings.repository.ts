import type { PoolClient } from "@neondatabase/serverless";
import { getPool } from "@/server/database/connection";

export interface AppSettingRow {
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
}

type Db = Pick<PoolClient, "query">;
const db = (c?: PoolClient): Db => c ?? getPool();

export async function get<T = unknown>(
  key: string,
  client?: PoolClient,
): Promise<T | null> {
  const result = await db(client).query<AppSettingRow>(
    `SELECT key, value, updated_by, updated_at FROM app_settings WHERE key = $1`,
    [key],
  );
  return (result.rows[0]?.value as T) ?? null;
}

export async function getAll(
  client?: PoolClient,
): Promise<Record<string, unknown>> {
  const result = await db(client).query<AppSettingRow>(
    `SELECT key, value, updated_by, updated_at FROM app_settings`,
  );
  const out: Record<string, unknown> = {};
  for (const row of result.rows) out[row.key] = row.value;
  return out;
}

export async function upsert(
  key: string,
  value: unknown,
  updatedBy: string,
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `INSERT INTO app_settings (key, value, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $3, now())
     ON CONFLICT (key) DO UPDATE
     SET value = EXCLUDED.value,
         updated_by = EXCLUDED.updated_by,
         updated_at = now()`,
    [key, JSON.stringify(value), updatedBy],
  );
}