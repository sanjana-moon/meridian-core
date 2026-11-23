import { baseApi } from "@/store/api/base-api";
import type { ApiAccount } from "@/types/api";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  transactionPin: string;
  accountType?: "savings" | "current" | "business";
}

interface RegisterResponse {
  user: { id: string; name: string; email: string; role: string };
  account: Pick<ApiAccount, "id" | "account_number" | "type" | "balance" | "status">;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    registerCustomer: build.mutation<RegisterResponse, RegisterInput>({
      query: (body) => ({ url: "auth/register", method: "POST", body }),
      invalidatesTags: ["Customers", "Accounts"],
    }),
  }),
});

export const { useRegisterCustomerMutation } = authApi;
