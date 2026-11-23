import { baseApi } from "@/store/api/base-api";

interface SettingsResponse {
  settings: Record<string, unknown>;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<SettingsResponse, void>({
      query: () => "admin/settings",
      providesTags: ["Settings"],
    }),
    updateSettings: build.mutation<
      SettingsResponse,
      { settings: Record<string, unknown>; twoFactorCode?: string }
    >({
      query: ({ twoFactorCode, ...body }) => ({
        url: "admin/settings",
        method: "PATCH",
        body,
        ...(twoFactorCode
          ? { headers: { "X-2FA-Code": twoFactorCode } }
          : {}),
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
