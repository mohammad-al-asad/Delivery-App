import { baseApi } from "./baseApi";

const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        signUp: builder.mutation({
            query: (data) => ({
                url: "auth/register",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["auth"],
        }),
        logIn: builder.mutation({
            query: (data) => ({
                url: "auth/login",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["auth"],
        }),
        verifyUserPhone: builder.mutation({
            query: (data) => ({
                url: "auth/verify-otp",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["auth"],
        }),
        checkUserByPhone: builder.mutation({
            query: (data) => ({
                url: "auth/check-user",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["auth"],
        }),
        refreshToken: builder.mutation({
            query: (data) => ({
                url: "auth/refresh-token",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["auth"],
        }),
        changePassword: builder.mutation({
            query: (data) => ({
                url: "auth/change-password",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["auth"],
        }),
    }),
});

export const {
    useSignUpMutation,
    useLogInMutation,
    useVerifyUserPhoneMutation,
    useCheckUserByPhoneMutation,
    useRefreshTokenMutation,
    useChangePasswordMutation,
} = authApi;

export default authApi;
