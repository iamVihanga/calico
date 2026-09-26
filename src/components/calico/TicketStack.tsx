import * as Haptics from 'expo-haptics';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Press } from '@/components/ds/Press';
import { copy } from '@/i18n/en';
import { motion } from '@/theme';

import { TicketStub } from './TicketStub';

export type StackViewing = { id: string; date: string; rating: number | null; note: string | null };
export type TicketStackHandle = { tear: () => Promise<void> };

const PEEK = -56; // collapsed: each older stub tucks up under the one above (prototype offset)
const INSET = 6;
const FAN_GAP = 12;

/**
 * Viewings as a stack of ticket stubs, latest on top (plan §11.6). Tap to fan them into a list and
 * back. `tear()` plays "Watched it again": the top stub tilts 3° and drops 12dp with a rigid haptic.
 */
export const TicketStack = forwardRef<TicketStackHandle, { viewings: StackViewing[] }>(function TicketStack(
  { viewings },
  ref,
) {
  const reduced = useReducedMotion();
  const [fanned, setFanned] = useState(false);
  const tearP = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    tear: () =>
      new Promise<void>((resolve) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        if (reduced || viewings.length === 0) return resolve();
        tearP.value = withTiming(1, { duration: motion.duration.fast, easing: Easing.bezier(...motion.easing.out) });
        setTimeout(() => {
          tearP.value = withTiming(0, { duration: motion.duration.fast });
          resolve();
        }, motion.duration.fast);
      }),
  }));

  const torn = useAnimatedStyle(() => ({
    transform: [{ translateY: tearP.value * 12 }, { rotate: `${tearP.value * 3}deg` }],
  }));

  if (viewings.length === 0) return null;
  const layout = reduced ? undefined : LinearTransition.duration(motion.duration.base);

  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={copy.movies.stackA11y(viewings.length)}
      accessibilityState={{ expanded: fanned }}
      disabled={viewings.length < 2}
      onPress={() => setFanned((f) => !f)}
      scaleTo={1}
      testID="ticket-stack"
    >
      <View>
        {viewings.map((v, i) => (
          <Animated.View
            key={v.id}
            layout={layout}
            style={[
              {
                marginTop: i === 0 ? 0 : fanned ? FAN_GAP : PEEK,
                marginHorizontal: fanned ? 0 : i * INSET,
                zIndex: viewings.length - i,
              },
              i === 0 ? torn : null,
            ]}
          >
            <TicketStub date={v.date} rating={v.rating} note={v.note} />
          </Animated.View>
        ))}
      </View>
    </Press>
  );
});
