import {
  listTransactions,
  repayLoan,
} from "@/server/controllers/transaction.controller";

export async function GET(request: Request) {
  void request.url;
  return listTransactions(request);
}

export const POST = repayLoan;
