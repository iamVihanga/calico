import { Stack } from 'expo-router';
import { View } from 'react-native';

import { OfflineBanner } from '@/components/calico/OfflineBanner';
import { SheetHost } from '@/components/hosts/SheetHost';
import { ToastHost } from '@/components/hosts/ToastHost';
import { useProfileThemeSync } from '@/features/profile/hooks';
import { useTheme } from '@/theme';

/** Signed-in shell: screens plus the global sheet, toast and offline hosts. */
export default function AppLayout() {
  const { t } = useTheme();
  useProfileThemeSync();
  return (
    <View style={{ flex: 1, backgroundColor: t.surfacePage }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.surfacePage } }} />
      <OfflineBanner />
      <ToastHost />
      <SheetHost />
    </View>
  );
}
