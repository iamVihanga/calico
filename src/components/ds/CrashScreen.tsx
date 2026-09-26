import type { ErrorBoundaryProps } from 'expo-router';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { copy } from '@/i18n/en';
import { reportError } from '@/lib/sentry';
import { layout, useTheme } from '@/theme';

import { Button } from './Button';
import { Txt } from './Txt';

/** A screen threw while rendering: report it, keep the rest of the app usable. */
export function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => reportError(error), [error]);
  return (
    <View
      testID="crash-screen"
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: layout.gutterScreen,
        paddingTop: insets.top,
        backgroundColor: t.surfacePage,
      }}
    >
      <Txt family="display" weight={700} size={22} align="center" accessibilityRole="header">
        {copy.errors.crashed}
      </Txt>
      <Txt family="hand" weight={400} size="xl" color="textMuted" align="center">
        {copy.errors.crashedHint}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <Button variant="secondary" onPress={() => router.dismissTo('/')} testID="crash-home">
          {copy.errors.home}
        </Button>
        <Button variant="accent" onPress={() => void retry()} testID="crash-retry">
          {copy.errors.retry}
        </Button>
      </View>
    </View>
  );
}
