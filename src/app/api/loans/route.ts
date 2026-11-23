import {
  applyForLoan,
  listLoans,
} from "@/server/controllers/loan.controller";

export async function GET(request: Request) {
  void request.url;
  return listLoans(request);
}

export const POST = applyForLoan;
