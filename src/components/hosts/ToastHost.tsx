import { useSegments } from 'expo-router';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from '@/components/ds/Toast';
import { useToastStore } from '@/lib/stores/toast';
import { motion } from '@/theme';

// Prototype: 98 above the bottom on tab screens (clears the floating nav), 28 elsewhere.
const ABOVE_TABS = 98;
const ABOVE_EDGE = 28;

export function ToastHost() {
  const toast = useToastStore((s) => s.toast);
  const hide = useToastStore((s) => s.hide);
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  const onTabs = segments.includes('(tabs)');
  return (
    <Animated.View
      key={toast.id}
      entering={FadeInDown.duration(motion.duration.fast)}
      exiting={FadeOut.duration(motion.duration.fast)}
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + (onTabs ? ABOVE_TABS : ABOVE_EDGE),
        zIndex: 6,
      }}
    >
      <Toast
        message={toast.message}
        tone={toast.tone}
        action={
          toast.action && {
            label: toast.action.label,
            onPress: () => {
              hide();
              toast.action?.onPress();
            },
          }
        }
      />
    </Animated.View>
  );
}
