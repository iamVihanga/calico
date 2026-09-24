import { forwardRef, useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion, shadow } from '@/theme';

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
  { style, scaleTo = motion.pressScale, pressShadow = false, pressedStyle, onPressIn, onPressOut, disabled, ...rest },
  ref,
) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const timing = { duration: motion.duration.instant, easing: Easing.bezier(...motion.easing.out) };

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <APressable
      ref={ref}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
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
