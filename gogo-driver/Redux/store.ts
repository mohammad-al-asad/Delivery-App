import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";

import { baseApi } from "./api/baseApi";
import { authSlice } from "./Slice/authSlice";

const persistConfig = {
    key: "gogo-driver-app",
    storage: AsyncStorage,
    whitelist: ["auth"],
    blacklist: ["baseApi"],
};

const rootReducer = combineReducers({
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authSlice.reducer,
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
