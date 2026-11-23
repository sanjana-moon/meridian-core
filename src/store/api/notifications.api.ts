import { baseApi } from "@/store/api/base-api";
import type { ApiNotification, ApiPage } from "@/types/api";

interface NotificationListResponse extends ApiPage<ApiNotification> {
  notifications: ApiNotification[];
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<
      NotificationListResponse,
      { page?: number; limit?: number }
    >({
      query: (params) => ({ url: "notifications", params }),
      providesTags: ["Notifications"],
    }),
    markNotificationRead: build.mutation<
      { notification: ApiNotification },
      string
    >({
      query: (id) => ({
        url: `notifications/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),
    deleteNotification: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({
        url: `notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
