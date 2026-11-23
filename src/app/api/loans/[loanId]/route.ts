import {
  getLoan,
  reviewLoan,
} from "@/server/controllers/loan.controller";

export async function GET(
  request: Request,
  context: RouteContext<"/api/loans/[loanId]">,
) {
  void request.url;
  return getLoan(request, context);
}

export const PATCH = reviewLoan;
