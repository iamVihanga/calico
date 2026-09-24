import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { persistOptions, queryClient } from '@/lib/queryClient';
import { ThemeProvider, useTheme } from '@/theme';
import { appFonts } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync();

function RootStack({ ready }: { ready: boolean }) {
  const { t } = useTheme();
  const { status } = useAuth();
  const done = ready && status !== 'loading';

  // Hide the splash only when fonts are loaded, the cache is restored and the session is known.
  useEffect(() => {
    if (done) SplashScreen.hideAsync();
  }, [done]);
  if (!done) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.surfacePage } }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="dev" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const [restored, setRestored] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={persistOptions}
            onSuccess={() => {
              // Paused offline mutations (registered in lib/mutations.ts) continue after a restart.
              queryClient.resumePausedMutations();
              setRestored(true);
            }}
            onError={() => setRestored(true)}
          >
            <AuthProvider>
              <BottomSheetModalProvider>
                <RootStack ready={(fontsLoaded || !!fontError) && restored} />
              </BottomSheetModalProvider>
            </AuthProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
