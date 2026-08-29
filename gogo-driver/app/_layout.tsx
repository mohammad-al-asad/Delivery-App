import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import ReduxProvider from "../Redux/ReduxProvider";

export default function RootLayout() {

  return (
    <ReduxProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tab)" options={{ headerShown: false }} />
          <Stack.Screen name="(screens)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthProvider>
    </ReduxProvider>
  );
}
