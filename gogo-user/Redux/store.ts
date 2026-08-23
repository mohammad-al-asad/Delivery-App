import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authSlice } from "./Slice/authSlice";
import { orderDraftSlice } from "./Slice/orderDraftSlice";
import { baseApi } from "./api/baseApi";

const persistConfig = {
  key: "gogo-user-app",
  storage: AsyncStorage,
  whitelist: ["auth"], // Persist auth slice
  blacklist: ["baseApi"], // Don't persist API cache
};

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authSlice.reducer,
  orderDraft: orderDraftSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(baseApi.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


