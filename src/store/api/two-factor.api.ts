import { baseApi } from "@/store/api/base-api";

interface TwoFactorSetupResponse {
  qrCode: string;
}

interface TwoFactorVerifyResponse {
  enabled: true;
  recoveryCodes: string[];
}

export const twoFactorApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTwoFactorStatus: build.query<{ enabled: boolean }, void>({
      query: () => "two-factor/status",
      providesTags: ["TwoFactor"],
    }),
    setupTwoFactor: build.mutation<TwoFactorSetupResponse, void>({
      query: () => ({ url: "two-factor/setup", method: "POST" }),
      invalidatesTags: ["TwoFactor"],
    }),
    verifyTwoFactor: build.mutation<TwoFactorVerifyResponse, { code: string }>({
      query: (body) => ({ url: "two-factor/verify", method: "POST", body }),
      invalidatesTags: ["TwoFactor"],
    }),
    disableTwoFactor: build.mutation<{ enabled: false }, { code: string }>({
      query: (body) => ({ url: "two-factor/disable", method: "POST", body }),
      invalidatesTags: ["TwoFactor"],
    }),
  }),
});

export const {
  useGetTwoFactorStatusQuery,
  useSetupTwoFactorMutation,
  useVerifyTwoFactorMutation,
  useDisableTwoFactorMutation,
} = twoFactorApi;
