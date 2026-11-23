import {
  deleteNotification,
  markNotificationRead,
} from "@/server/controllers/notification.controller";

export const PATCH = markNotificationRead;
export const DELETE = deleteNotification;
