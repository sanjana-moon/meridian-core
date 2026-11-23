import {
  getTransaction,
  reviewMoneyRequest,
} from "@/server/controllers/transaction.controller";

export async function GET(
  request: Request,
  context: RouteContext<"/api/transactions/[transactionId]">,
) {
  void request.url;
  return getTransaction(request, context);
}

export const PATCH = reviewMoneyRequest;
