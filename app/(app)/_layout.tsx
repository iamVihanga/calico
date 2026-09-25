import { onlineManager } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { OfflineBanner } from '@/components/calico/OfflineBanner';
import { SheetHost } from '@/components/hosts/SheetHost';
import { ToastHost } from '@/components/hosts/ToastHost';
import { processDrafts } from '@/features/capture/drafts';
import { useProfileThemeSync } from '@/features/profile/hooks';
import { useTheme } from '@/theme';

/** Signed-in shell: screens plus the global sheet, toast and offline hosts. */
export default function AppLayout() {
  const { t } = useTheme();
  useProfileThemeSync();

  // Offline captures are read as soon as the phone is back online (and on start).
  useEffect(() => {
    void processDrafts();
    return onlineManager.subscribe((online) => {
      if (online) void processDrafts();
    });
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: t.surfacePage }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.surfacePage } }} />
      <OfflineBanner />
      <ToastHost />
      <SheetHost />
    </View>
  );
}
