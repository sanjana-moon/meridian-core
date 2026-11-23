import { baseApi } from "@/store/api/base-api";
import type { ApiAccount, ApiTransaction } from "@/types/api";

interface AccountListResponse {
  accounts: ApiAccount[];
}

interface AccountResponse {
  account: ApiAccount;
  transactions?: ApiTransaction[];
}

interface AccountInput {
  ownerId: string;
  type: "savings" | "current" | "business";
}

interface AccountUpdate {
  type?: "savings" | "current" | "business";
  status?: "active" | "inactive" | "frozen" | "blocked";
  dailyTransferLimit?: string;
  maxSingleTransaction?: string;
  minimumBalance?: string;
}

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccounts: build.query<AccountListResponse, { ownerId?: string } | void>({
      query: (params) => params ? { url: "accounts", params } : "accounts",
      providesTags: ["Accounts"],
    }),
    getAccount: build.query<AccountResponse, string>({
      query: (accountId) => `accounts/${accountId}`,
      providesTags: (_result, _error, id) => [{ type: "Accounts", id }],
    }),
    createAccount: build.mutation<AccountResponse, AccountInput>({
      query: (body) => ({ url: "accounts", method: "POST", body }),
      invalidatesTags: ["Accounts"],
    }),
    updateAccount: build.mutation<
      AccountResponse,
      { accountId: string; body: AccountUpdate }
    >({
      query: ({ accountId, body }) => ({
        url: `accounts/${accountId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Accounts"],
    }),
    deactivateAccount: build.mutation<
      { account: Pick<ApiAccount, "id" | "status"> },
      string
    >({
      query: (accountId) => ({
        url: `accounts/${accountId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Accounts"],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccountQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeactivateAccountMutation,
} = accountsApi;
