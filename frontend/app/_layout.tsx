import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { AuthProvider } from "@/src/context/AuthContext";
import { ProProvider } from "@/src/context/ProContext";
import { FavoritesProvider } from "@/src/context/FavoritesContext";
import { AuthModal } from "@/src/components/AuthModal";
import { UpgradeProModal } from "@/src/components/UpgradeProModal";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <AuthProvider>
            <ProProvider>
              <FavoritesProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="hall/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="terms" options={{ headerShown: false }} />
                  <Stack.Screen name="privacy" options={{ headerShown: false }} />
                  <Stack.Screen name="compare" options={{ headerShown: false }} />
                </Stack>
                <AuthModal />
                <UpgradeProModal />
              </FavoritesProvider>
            </ProProvider>
          </AuthProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
