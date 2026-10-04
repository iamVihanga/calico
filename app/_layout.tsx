import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplash } from '@/components/calico/AnimatedSplash';
import { PortalHost } from '@/components/ds/Portal';
import { AuthProvider, type AuthStatus, useAuth } from '@/features/auth/AuthProvider';
import { persistOptions, queryClient } from '@/lib/queryClient';
import { initSentry, navigationIntegration, setSentryUser, wrapRoot } from '@/lib/sentry';
import { ThemeProvider, useTheme } from '@/theme';
import { appFonts } from '@/theme/fonts';

initSentry();
SplashScreen.preventAutoHideAsync();

const hideNativeSplash = () => SplashScreen.hide();

function RootStack({ fontsReady, restored }: { fontsReady: boolean; restored: boolean }) {
  const { t } = useTheme();
  const { status, session } = useAuth();
  const userId = session?.user.id ?? null;
  useEffect(() => setSentryUser(userId), [userId]);
  const done = fontsReady && restored && status !== 'loading';
  const [splashGone, setSplashGone] = useState(false);

  // Android always shows the native splash (static Pinki) until the first frame. The animated one
  // starts on that same frame (it needs the fonts for the wordmark) and the native one goes as soon
  // as it has laid out, so there is no gap. The intro always plays in full on a cold start; the app
  // mounts behind it once the cache is restored and the session is known, and the splash fades.
  if (!fontsReady) return null;

  return (
    <>
      {done && <Screens status={status} surface={t.surfacePage} />}
      {!splashGone && (
        <AnimatedSplash done={done} onHidden={() => setSplashGone(true)} onFirstLayout={hideNativeSplash} />
      )}
    </>
  );
}

function Screens({ status, surface }: { status: AuthStatus; surface: string }) {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: surface } }}>
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

function RootLayout() {
  const navRef = useNavigationContainerRef();
  useEffect(() => {
    if (navRef) navigationIntegration.registerNavigationContainer(navRef);
  }, [navRef]);
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
              <RootStack fontsReady={fontsLoaded || !!fontError} restored={restored} />
              {/* Sheets (and anything else portaled) draw here, above every screen. */}
              <PortalHost />
            </AuthProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default wrapRoot(RootLayout);
