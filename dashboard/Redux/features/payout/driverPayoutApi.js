import { baseApi } from "../baseApi";

const driverPayoutApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDriverPayouts: builder.query({
      query: (params) => ({
        url: "dashboard/driver-payouts",
        method: "GET",
        params,
      }),
      providesTags: ["driverPayouts"],
    }),
    getDriverPayoutHistory: builder.query({
      query: (params) => ({
        url: "dashboard/driver-payouts/history",
        method: "GET",
        params,
      }),
      providesTags: ["driverPayouts"],
    }),
    payDriver: builder.mutation({
      query: ({ riderId, body }) => ({
        url: `dashboard/driver-payouts/${riderId}/pay`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["driverPayouts"],
    }),
  }),
});

export const {
  useGetDriverPayoutsQuery,
  useGetDriverPayoutHistoryQuery,
  usePayDriverMutation,
} = driverPayoutApi;

export default driverPayoutApi;
