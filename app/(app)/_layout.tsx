import { onlineManager } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { OfflineBanner } from '@/components/calico/OfflineBanner';
import { SheetHost } from '@/components/hosts/SheetHost';
import { ToastHost } from '@/components/hosts/ToastHost';
import { processDrafts } from '@/features/capture/drafts';
import { DragLayer } from '@/features/collections/DragLayer';
import { startReminderSync } from '@/features/loans/reminders';
import { useReminderResponses } from '@/features/loans/responses';
import { useProfileThemeSync } from '@/features/profile/hooks';
import { setupNotifications } from '@/lib/notifications';
import { useTheme } from '@/theme';

/** Signed-in shell: screens plus the global sheet, toast and offline hosts. */
export default function AppLayout() {
  const { t } = useTheme();
  useProfileThemeSync();
  useReminderResponses();

  // Reminders are resynced on every sign-in / launch (so they survive a reinstall) and hourly on foreground.
  useEffect(() => {
    void setupNotifications().catch(() => undefined);
    return startReminderSync();
  }, []);

  // Offline captures are read as soon as the phone is back online (and on start).
  useEffect(() => {
    void processDrafts();
    return onlineManager.subscribe((online) => {
      if (online) void processDrafts();
    });
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: t.surfacePage }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.surfacePage } }}>
        {/* Declared here, not from inside the screen: changing presentation later remounts it. */}
        <Stack.Screen name="pick" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      </Stack>
      <OfflineBanner />
      <ToastHost />
      <SheetHost />
      <DragLayer />
    </View>
  );
}
