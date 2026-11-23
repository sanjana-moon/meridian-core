import {
  createAccount,
  listAccounts,
} from "@/server/controllers/account.controller";

export async function GET(request: Request) {
  void request.url;
  return listAccounts(request);
}

export const POST = createAccount;
