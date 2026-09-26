import { forwardRef, useState } from 'react';
import {
  type Insets,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  type View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { layout, motion, shadow } from '@/theme';

const APressable = Animated.createAnimatedComponent(Pressable);

export type PressProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed. Defaults to the design system's press scale (0.97). */
  scaleTo?: number;
  /** Add the inset press shadow while held (buttons). */
  pressShadow?: boolean;
  /** Style applied while pressed (e.g. the prototype's hover background). */
  pressedStyle?: StyleProp<ViewStyle>;
};

/** Pressable with the Calico press feedback: a quick scale-down, no Android ripple. */
export const Press = forwardRef<View, PressProps>(function Press(
  {
    style,
    scaleTo = motion.pressScale,
    pressShadow = false,
    pressedStyle,
    onPressIn,
    onPressOut,
    disabled,
    hitSlop,
    ...rest
  },
  ref,
) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const timing = { duration: motion.duration.instant, easing: Easing.bezier(...motion.easing.out) };

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  // Anything drawn smaller than 48dp still gets a 48dp touch target (CLAUDE.md), unless it sets its own.
  const slop = hitSlop ?? minTargetSlop(style);

  return (
    <APressable
      ref={ref}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={slop}
      onPressIn={(e) => {
        setPressed(true);
        if (!reduced) scale.value = withTiming(scaleTo, timing);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        scale.value = withTiming(1, timing);
        onPressOut?.(e);
      }}
      style={[
        style,
        pressed && pressShadow ? { boxShadow: shadow.press } : null,
        pressed ? pressedStyle : null,
        animated,
      ]}
      {...rest}
    />
  );
});

/** Extra touch area so a pressable of `minHeight`/`height` (and width) under 48dp reaches 48dp. */
export function minTargetSlop(style: StyleProp<ViewStyle>): Insets | undefined {
  const f = StyleSheet.flatten(style) ?? {};
  const h = typeof f.minHeight === 'number' ? f.minHeight : typeof f.height === 'number' ? f.height : null;
  const w = typeof f.minWidth === 'number' ? f.minWidth : typeof f.width === 'number' ? f.width : null;
  const v = h !== null && h < layout.hitMin ? (layout.hitMin - h) / 2 : 0;
  const x = w !== null && w < layout.hitMin ? (layout.hitMin - w) / 2 : 0;
  return v || x ? { top: v, bottom: v, left: x, right: x } : undefined;
}
