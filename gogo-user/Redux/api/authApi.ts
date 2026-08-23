import { baseApi } from "./baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signUp: builder.mutation({
      query: (data) => {
        // console.log("Data being sent to the API:", data);
        return {
          url: "auth/register",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["auth"],
    }),
    logIn: builder.mutation({
      query: (data) => {
        console.log("Data being sent to the API:", data);
        return {
          url: "auth/login",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["auth"],
    }),
    verifyUserPhone: builder.mutation({
      query: (data) => {
        console.log("Data being sent to the API:", data);
        return {
          url: "auth/verify-otp",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["auth"],
    }),
    checkUserByPhone: builder.mutation({
      query: (data) => {
        console.log("Data being sent to the API:", data);
        return {
          url: "auth/check-user",
          method: "POST",
          body: data,
        };
      },
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
    sendOtp: builder.mutation({
      query: (data) => ({
        url: "auth/send-otp",
        method: "POST",
        body: data,
      }),
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: "auth/change-password",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["auth"],
    }),
    setNewPassword: builder.mutation({
      query: (data) => ({
        url: "auth/set-new-password",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["auth"],
    }),
    logout: builder.mutation({
      query: (data) => ({
        url: "auth/logout",
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
  useSendOtpMutation,
  useChangePasswordMutation,
  useSetNewPasswordMutation,
  useLogoutMutation,
} = authApi;

export default authApi;
