import { Image } from 'expo-image';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { type IllustrationName, illustrations } from './illustrations.generated';

export type { IllustrationName };

type Props = {
  name: IllustrationName;
  /** Rendered width in dp; the height follows the image. */
  width: number;
  /** Decorative (hidden from TalkBack) unless labelled. */
  accessibilityLabel?: string;
  /** The prototype's gentle bob (`kfloat`): one full rise and fall every `float` ms. */
  float?: number;
  /** Tilt in degrees (the prototype's tilted covers and elements). */
  rotate?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const FLOAT_DP = 7;

/** One of the design/v2 illustrations (scripts/illustrations.py). */
export function Illustration({ name, width, accessibilityLabel, float, rotate = 0, style, testID }: Props) {
  const art = illustrations[name];
  const height = Math.round((width * art.height) / art.width);
  const reduced = useReducedMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!float || reduced) return;
    lift.value = withRepeat(withTiming(-FLOAT_DP, { duration: float / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(lift);
  }, [float, reduced, lift]);

  const motion = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { rotate: `${rotate}deg` }],
  }));

  return (
    <Animated.View
      style={[{ width, height }, motion, style]}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      pointerEvents="none"
      testID={testID ?? `art-${name}`}
    >
      <Image source={art.source} style={{ width, height }} contentFit="contain" />
    </Animated.View>
  );
}
