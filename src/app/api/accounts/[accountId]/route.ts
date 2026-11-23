import {
  deactivateAccount,
  getAccount,
  updateAccount,
} from "@/server/controllers/account.controller";

export async function GET(request: Request, context: RouteContext<"/api/accounts/[accountId]">) {
  void request.url;
  return getAccount(request, context);
}

export const PATCH = updateAccount;
export const DELETE = deactivateAccount;
