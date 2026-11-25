import {
  getPool,
  listUserNotifications,
} from "@/server/models/notification.model";
import { requireUser } from "@/server/guards/auth.guard";
import {
  ApiError,
  assertUuid,
  withApiErrors,
} from "@/server/utils/api-response";

type NotificationRouteContext = {
  params: Promise<{ notificationId: string }>;
};

export async function listNotifications(request: Request) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("limit") ?? 25) || 25),
    );
    const result = await listUserNotifications(
      user.id,
      limit,
      (page - 1) * limit,
    );
    const notifications = result.rows.map((row) => {
      const notification = { ...row };
      delete notification.total_count;
      return notification;
    });
    return Response.json({
      notifications,
      page,
      limit,
      total: result.rows[0]?.total_count ?? 0,
    });
  });
}

export async function markNotificationRead(
  _request: Request,
  context: NotificationRouteContext,
) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const { notificationId } = await context.params;
    assertUuid(notificationId, "notificationId");
    const result = await getPool().query(
      `UPDATE notifications
       SET read_at = coalesce(read_at, now())
       WHERE id = $1 AND user_id = $2
       RETURNING id::text, type, message, read_at, created_at`,
      [notificationId, user.id],
    );
    if (!result.rows[0]) {
      throw new ApiError("Notification not found", 404);
    }

    return Response.json({ notification: result.rows[0] });
  });
}

export async function deleteNotification(
  _request: Request,
  context: NotificationRouteContext,
) {
  return withApiErrors(async () => {
    const user = await requireUser();
    const { notificationId } = await context.params;
    assertUuid(notificationId, "notificationId");
    const result = await getPool().query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2
       RETURNING id::text`,
      [notificationId, user.id],
    );
    if (!result.rows[0]) {
      throw new ApiError("Notification not found", 404);
    }

    return Response.json({ deleted: true });
  });
}
