import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query({
      query: () => "users/me",
      providesTags: ["user"],
    }),
    updateMyProfile: builder.mutation({
      query: (body) => ({
        url: "users/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["user"],
    }),
    deleteMyAccount: builder.mutation({
      query: () => ({
        url: "users/me",
        method: "DELETE",
      }),
      invalidatesTags: ["user", "addresses", "orders"],
    }),
    getSavedAddresses: builder.query({
      query: () => "users/me/addresses",
      providesTags: ["addresses"],
    }),
    addSavedAddress: builder.mutation({
      query: (body) => ({
        url: "users/me/addresses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["addresses", "user"],
    }),
    updateSavedAddress: builder.mutation({
      query: ({ addressId, body }) => ({
        url: `users/me/addresses/${addressId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["addresses", "user"],
    }),
    deleteSavedAddress: builder.mutation({
      query: (addressId) => ({
        url: `users/me/addresses/${addressId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["addresses", "user"],
    }),
    getNotifications: builder.query({
      query: () => "notifications",
      providesTags: ["notifications"],
    }),
    markNotificationAsRead: builder.mutation({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["notifications"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useDeleteMyAccountMutation,
  useGetSavedAddressesQuery,
  useAddSavedAddressMutation,
  useUpdateSavedAddressMutation,
  useDeleteSavedAddressMutation,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
} = userApi;

export default userApi;
