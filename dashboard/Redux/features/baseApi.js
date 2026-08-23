import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getBaseUrl } from "../../config/envConfig";
import { logout } from "../Slice/authSlice";
import {
  clearStoredAuth,
  getStoredAccessToken,
  getValidAccessToken,
} from "../../utils/auth-token";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const state = getState();
    const token = getValidAccessToken(
      state?.auth?.token,
      getStoredAccessToken(),
    );

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithAuth = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 || result.error?.status === 403) {
    clearStoredAuth();
    api.dispatch(logout());

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/sign-in"
    ) {
      window.location.replace("/sign-in");
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithAuth,
  endpoints: () => ({}),
  tagTypes: ["auth", "notification", "profile", "common", "deliverySettings", "hotArea", "orders", "user", "reports", "driverPayouts"],
});
