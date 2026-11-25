import type { PoolClient } from "@neondatabase/serverless";
import { getPool } from "@/server/database/connection";

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

type Db = Pick<PoolClient, "query">;
const db = (c?: PoolClient): Db => c ?? getPool();

export async function listUserNotifications(
  userId: string,
  options: { limit?: number; offset?: number } = {},
  client?: PoolClient,
): Promise<NotificationRow[]> {
  const limit = Math.min(options.limit ?? 20, 100);
  const offset = options.offset ?? 0;
  const result = await db(client).query<NotificationRow>(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    [userId],
  );
  return result.rows;
}

export async function createNotification(input: {
  userId: string;
  type: string;
  message: string;
}, client?: PoolClient): Promise<NotificationRow> {
  const result = await db(client).query<NotificationRow>(
    `INSERT INTO notifications (user_id, type, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.userId, input.type, input.message],
  );
  return result.rows[0]!;
}

export async function markRead(
  id: string,
  userId: string,
  client?: PoolClient,
): Promise<void> {
  await db(client).query(
    `UPDATE notifications SET read_at = now()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
    [id, userId],
  );
}