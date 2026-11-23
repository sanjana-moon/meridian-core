import { getTwoFactorStatus } from "@/server/controllers/two-factor.controller";

export async function GET(request: Request) {
  void request.url;
  return getTwoFactorStatus();
}
