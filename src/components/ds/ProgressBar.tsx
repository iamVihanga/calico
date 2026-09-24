import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion, palette, radius, space, useTheme } from '@/theme';

import { Txt } from './Txt';

export type ProgressTone = 'accent' | 'forest' | 'honey' | 'ink';

type Props = {
  /** 0–100 */
  value: number;
  label?: string;
  tone?: ProgressTone;
  height?: number;
  showValue?: boolean;
  /** Track colour override (prototype grid tiles use the sunk surface). */
  track?: string;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({ value, label, tone = 'accent', height = 8, showValue = false, track, style }: Props) {
  const { t } = useTheme();
  const reduced = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value));
  const fill = { accent: t.accentPrimary, forest: t.accentTertiary, honey: t.accentSecondary, ink: t.surfaceInk }[tone];
  const w = useSharedValue(pct);

  useEffect(() => {
    w.value = reduced
      ? pct
      : withTiming(pct, { duration: motion.duration.slow, easing: Easing.bezier(...motion.easing.cozy) });
  }, [pct, reduced, w]);

  const bar = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[{ gap: space[3] }, style]}
    >
      {(label || showValue) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space[4] }}>
          {label && (
            <Txt family="ui" weight={700} size="2xs" color="textSecondary">
              {label}
            </Txt>
          )}
          {showValue && (
            <Txt family="ui" weight={700} size="2xs" color="textMuted">
              {`${Math.round(pct)}%`}
            </Txt>
          )}
        </View>
      )}
      <View
        style={{ height, borderRadius: radius.pill, backgroundColor: track ?? palette.biscuit, overflow: 'hidden' }}
      >
        <Animated.View style={[{ height: '100%', borderRadius: radius.pill, backgroundColor: fill }, bar]} />
      </View>
    </View>
  );
}
