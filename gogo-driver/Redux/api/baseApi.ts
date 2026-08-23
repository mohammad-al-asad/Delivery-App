import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { logout, setUser } from "../Slice/authSlice";

interface RootState {
    auth: {
        token: string | null;
        refreshToken: string | null;
        user: any | null;
    };
}

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_SERVER_URL,
    prepareHeaders: (headers, { getState }) => {
        const state = getState() as RootState;
        const token = state?.auth?.token;

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // Try to get a new token
        const state = api.getState() as RootState;
        const refreshToken = state.auth.refreshToken;

        if (refreshToken) {
            const refreshResult: any = await baseQuery(
                {
                    url: "auth/refresh-token",
                    method: "POST",
                    body: { refreshToken },
                },
                api,
                extraOptions
            );

            if (refreshResult.data) {
                // Store the new tokens
                const { accessToken, refreshToken: newRefreshToken, user } = refreshResult.data.data;
                api.dispatch(setUser({ user, token: accessToken, refreshToken: newRefreshToken }));

                // Retry the original query with the new token
                result = await baseQuery(args, api, extraOptions);
            } else {
                // Refresh failed - log out
                api.dispatch(logout());
            }
        } else {
            api.dispatch(logout());
        }
    }
    return result;
};

export const baseApi = createApi({
    reducerPath: "baseApi",
    baseQuery: baseQueryWithReauth,
    endpoints: () => ({}),
    tagTypes: ["auth", "common", "report", "user", "orders", "notifications", "earnings"],
});
