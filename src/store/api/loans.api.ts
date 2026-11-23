import { baseApi } from "@/store/api/base-api";
import type { ApiLoan, ApiTransaction } from "@/types/api";

interface LoanListResponse {
  loans: ApiLoan[];
}

interface LoanResponse {
  loan: ApiLoan;
  repayments?: ApiTransaction[];
}

interface LoanApplicationInput {
  loanType: string;
  requestedAmount: string;
  durationMonths: number;
  monthlyIncome: string;
  employmentStatus: string;
  description: string;
  accountId?: string;
}

export const loansApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLoans: build.query<LoanListResponse, { status?: string } | void>({
      query: (params) => params ? { url: "loans", params } : "loans",
      providesTags: ["Loans"],
    }),
    getLoan: build.query<LoanResponse, string>({
      query: (id) => `loans/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Loans", id }],
    }),
    applyForLoan: build.mutation<LoanResponse, LoanApplicationInput>({
      query: (body) => ({ url: "loans", method: "POST", body }),
      invalidatesTags: ["Loans", "Notifications"],
    }),
    reviewLoan: build.mutation<
      LoanResponse,
      { id: string; internalNotes: string }
    >({
      query: ({ id, internalNotes }) => ({
        url: `loans/${id}`,
        method: "PATCH",
        body: { status: "under-review", internalNotes },
      }),
      invalidatesTags: ["Loans", "Notifications"],
    }),
    approveLoan: build.mutation<
      LoanResponse,
      { id: string; accountId?: string; twoFactorCode?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `loans/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loans", "Accounts", "Transactions", "Notifications"],
    }),
    rejectLoan: build.mutation<
      LoanResponse,
      { id: string; twoFactorCode?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `loans/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loans", "Notifications"],
    }),
  }),
});

export const {
  useGetLoansQuery,
  useGetLoanQuery,
  useApplyForLoanMutation,
  useReviewLoanMutation,
  useApproveLoanMutation,
  useRejectLoanMutation,
} = loansApi;
