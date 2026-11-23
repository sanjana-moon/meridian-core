import { baseApi } from "@/store/api/base-api";
import type { ApiPage, ApiTransaction } from "@/types/api";

interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
}

interface TransactionListResponse extends ApiPage<ApiTransaction> {
  transactions: ApiTransaction[];
}

interface TransactionResponse {
  transaction: ApiTransaction;
}

interface TransferInput {
  senderAccountId: string;
  recipientAccountNumber: string;
  amount: string;
  description: string;
  transactionPin: string;
  twoFactorCode?: string;
}

interface MoneyRequestInput {
  accountId: string;
  amount: string;
  description: string;
  transactionPin?: string;
}

interface RepaymentInput {
  accountId: string;
  loanId: string;
  amount: string;
  description: string;
  transactionPin: string;
}

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query<TransactionListResponse, TransactionFilters>({
      query: (params) => ({ url: "transactions", params }),
      providesTags: ["Transactions"],
    }),
    getTransaction: build.query<TransactionResponse, string>({
      query: (id) => `transactions/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Transactions", id }],
    }),
    transferFunds: build.mutation<
      TransactionResponse,
      TransferInput & { idempotencyKey: string }
    >({
      query: ({ idempotencyKey, ...body }) => ({
        url: "transactions/transfer",
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      invalidatesTags: ["Transactions", "Accounts", "Notifications"],
    }),
    requestDeposit: build.mutation<TransactionResponse, MoneyRequestInput>({
      query: (body) => ({ url: "transactions/deposit", method: "POST", body }),
      invalidatesTags: ["Transactions"],
    }),
    requestWithdrawal: build.mutation<TransactionResponse, MoneyRequestInput>({
      query: (body) => ({
        url: "transactions/withdrawal",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Transactions"],
    }),
    reviewTransaction: build.mutation<
      TransactionResponse,
      { id: string; decision: "approve" | "reject" | "flag" }
    >({
      query: ({ id, decision }) => ({
        url: `transactions/${id}`,
        method: "PATCH",
        body: { decision },
      }),
      invalidatesTags: ["Transactions", "Accounts", "Notifications"],
    }),
    repayLoan: build.mutation<
      TransactionResponse,
      RepaymentInput & { idempotencyKey: string }
    >({
      query: ({ idempotencyKey, ...body }) => ({
        url: "transactions",
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      invalidatesTags: ["Transactions", "Accounts", "Loans"],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useTransferFundsMutation,
  useRequestDepositMutation,
  useRequestWithdrawalMutation,
  useReviewTransactionMutation,
  useRepayLoanMutation,
} = transactionsApi;
