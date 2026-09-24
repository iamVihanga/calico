import { useScrollToTop } from 'expo-router';
import { type ReactNode, useRef } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/** Room under tab screens for the floating nav (prototype `padding-bottom: 132px`). */
export const TAB_SCREEN_BOTTOM = 132;

/** Scrolling tab screen: page paper, status-bar inset, tap-active-tab scrolls to top. */
export function TabScreen({ children, testID }: { children: ReactNode; testID?: string }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const ref = useRef<ScrollView>(null);
  useScrollToTop(ref);
  return (
    <ScrollView
      ref={ref}
      testID={testID}
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + TAB_SCREEN_BOTTOM }}
    >
      {children}
    </ScrollView>
  );
}
