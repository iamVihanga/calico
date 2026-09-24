import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ds/Icon';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { useOnline } from '@/lib/useOnline';
import { motion, radius, useTheme } from '@/theme';

/** Slim pill under the status bar while offline (prototype: cloud_off + "Offline — changes sync…"). */
export function OfflineBanner() {
  const online = useOnline();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <Animated.View
      entering={FadeInUp.duration(motion.duration.fast)}
      exiting={FadeOutUp.duration(motion.duration.fast)}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        top: insets.top + 4,
        left: 14,
        right: 14,
        zIndex: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        backgroundColor: t.statusInfoSoft,
      }}
    >
      <Icon name="cloud_off" size={16} color="statusInfo" />
      <Txt family="ui" weight={600} size="2xs" color="textSecondary">
        {copy.offline.banner}
      </Txt>
    </Animated.View>
  );
}
