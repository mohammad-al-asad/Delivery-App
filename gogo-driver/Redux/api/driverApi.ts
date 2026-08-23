import { baseApi } from "./baseApi";

export const driverApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDriverProfile: builder.query({
            query: () => "users/me",
            providesTags: ["user"],
        }),
        updateDriverProfile: builder.mutation({
            query: (data) => ({
                url: "users/me",
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["user"],
        }),
        deleteMyAccount: builder.mutation({
            query: () => ({
                url: "users/me",
                method: "DELETE",
            }),
            invalidatesTags: ["user", "orders", "earnings"],
        }),
        updateDriverDocuments: builder.mutation({
            query: (data) => ({
                url: "users/me/documents",
                method: "PATCH",
                body: data,
            }),
            invalidatesTags: ["user"],
        }),
        updateLocation: builder.mutation({
            query: (data) => ({
                url: "users/me/location",
                method: "PATCH",
                body: data,
            }),
        }),
        getActiveRides: builder.query({
            query: () => "orders?status=InProgress",
            providesTags: ["orders"],
        }),
        getRiderRides: builder.query({
            query: ({ status, scope }: { status?: string; scope?: "available" } = {}) => {
                const params = new URLSearchParams();
                if (status) params.set("status", status);
                if (scope) params.set("scope", scope);

                const queryString = params.toString();
                return `orders${queryString ? `?${queryString}` : ""}`;
            },
            providesTags: ["orders"],
        }),
        acceptRide: builder.mutation({
            query: ({ orderId, riderId }: { orderId: string; riderId: string }) => ({
                url: `orders/${orderId}/assign-rider`,
                method: "PATCH",
                body: { riderId },
            }),
            invalidatesTags: ["orders"],
        }),
        completeRide: builder.mutation({
            query: (orderId) => ({
                url: `orders/${orderId}/status`,
                method: "PATCH",
                body: { status: "Completed" },
            }),
            invalidatesTags: ["orders"],
        }),
        getDailyStats: builder.query({
            query: () => "dashboard/rider",
            providesTags: ["orders"],
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
        getRiderEarnings: builder.query({
            query: () => "dashboard/rider/earnings",
            providesTags: ["earnings"],
        }),
        getOrderById: builder.query({
            query: (id: string) => `orders/${id}`,
            providesTags: ["orders"],
        }),
        submitCompletionProof: builder.mutation({
            query: ({ orderId, formData }: { orderId: string; formData: FormData }) => ({
                url: `orders/${orderId}/completion-proof`,
                method: "PATCH",
                body: formData,
            }),
            invalidatesTags: ["orders"],
        }),
        markCheckpoint: builder.mutation({
            query: ({ orderId, ...body }: { orderId: string; pointType: string; stoppageId?: string; note?: string }) => ({
                url: `orders/${orderId}/checkpoints`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["orders"],
        }),
    }),
});

export const {
    useGetDriverProfileQuery,
    useUpdateDriverProfileMutation,
    useDeleteMyAccountMutation,
    useUpdateDriverDocumentsMutation,
    useUpdateLocationMutation,
    useGetActiveRidesQuery,
    useGetRiderRidesQuery,
    useAcceptRideMutation,
    useCompleteRideMutation,
    useGetDailyStatsQuery,
    useGetNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useGetRiderEarningsQuery,
    useGetOrderByIdQuery,
    useSubmitCompletionProofMutation,
    useMarkCheckpointMutation,
} = driverApi;
