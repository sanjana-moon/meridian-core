import { getPool } from "@/server/database/connection";

export { getPool };

export interface NotificationRecord {
  id: string;
  type: string;
  message: string;
  read_at: Date | null;
  created_at: Date;
}

export async function listUserNotifications(
  userId: string,
  limit: number,
  offset: number,
) {
  return getPool().query(
    `SELECT id::text, type, message, read_at, created_at,
            count(*) OVER()::int AS total_count
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
}
