import { baseApi } from "@/store/api/base-api";
import type { ApiAccount, ApiCustomer, ApiPage, ApiTransaction } from "@/types/api";

interface CustomerListResponse extends ApiPage<ApiCustomer> {
  customers: ApiCustomer[];
}

interface CustomerDetailsResponse extends ApiCustomer {
  accounts: ApiAccount[];
  transactions: ApiTransaction[];
}

interface CustomerInput {
  name: string;
  email: string;
  password: string;
  transactionPin: string;
  accountType?: "savings" | "current" | "business";
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCustomers: build.query<
      CustomerListResponse,
      { search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "users", params }),
      providesTags: ["Customers"],
    }),
    getCustomer: build.query<CustomerDetailsResponse, string>({
      query: (customerId) => ({
        url: "users",
        params: { customerId },
      }),
      providesTags: (_result, _error, id) => [{ type: "Customers", id }],
    }),
    createCustomer: build.mutation<unknown, CustomerInput>({
      query: (body) => ({ url: "users", method: "POST", body }),
      invalidatesTags: ["Customers", "Accounts"],
    }),
    updateCustomerStatus: build.mutation<
      { customer: ApiCustomer },
      { customerId: string; status: "active" | "blocked" }
    >({
      query: ({ customerId, status }) => ({
        url: `users?customerId=${encodeURIComponent(customerId)}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Customers"],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerStatusMutation,
} = usersApi;
