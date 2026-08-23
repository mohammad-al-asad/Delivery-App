import { baseApi } from "./baseApi";

export const commonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCommonContent: builder.query({
      query: () => "common",
      providesTags: ["common"],
    }),
    createReport: builder.mutation({
      query: (body) => ({
        url: "reports",
        method: "POST",
        body,
      }),
      invalidatesTags: ["common"],
    }),
  }),
});

export const { useGetCommonContentQuery, useCreateReportMutation } = commonApi;

export default commonApi;
