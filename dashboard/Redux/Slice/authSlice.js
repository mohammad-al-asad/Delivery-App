import { createSlice } from "@reduxjs/toolkit";
import {
  clearStoredAuth,
  isValidAccessToken,
} from "../../utils/auth-token";

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      const validToken = isValidAccessToken(token) ? token : null;

      if (!validToken) {
        state.user = null;
        state.token = null;
        state.refreshToken = null;

        if (typeof window !== "undefined") {
          clearStoredAuth();
        }

        return;
      }

      state.user = user;
      state.token = validToken;
      state.refreshToken = refreshToken;

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", validToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (user) localStorage.setItem("user", JSON.stringify(user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;

      // Clear localStorage
      if (typeof window !== "undefined") {
        clearStoredAuth();
      }
    },
  },
});

export const { setUser, logout } = authSlice.actions;

export default authSlice.reducer;
