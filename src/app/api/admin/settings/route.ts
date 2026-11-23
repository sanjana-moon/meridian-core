import {
  getSettings,
  updateSettings,
} from "@/server/controllers/settings.controller";

export async function GET(request: Request) {
  void request.url;
  return getSettings();
}

export const PATCH = updateSettings;
