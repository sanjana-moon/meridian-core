import { listNotifications } from "@/server/controllers/notification.controller";

export async function GET(request: Request) {
  void request.url;
  return listNotifications(request);
}
