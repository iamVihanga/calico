import { useEffect, useState } from 'react';
import { type DimensionValue, type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { layout, motion, radius as radii, useTheme } from '@/theme';

type Props = {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Loading placeholder: sunk paper that breathes gently (static with reduced motion). */
export function Skeleton({ width = '100%', height, radius = radii.md, style }: Props) {
  const { t } = useTheme();
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    o.value = withRepeat(
      withTiming(0.55, { duration: motion.duration.page * 2, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(o);
  }, [o, reduced]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: t.surfaceSunk }, anim, style]}
    />
  );
}

/** A grid of cover-shaped placeholders (Library grid, collections). */
export function SkeletonGrid({
  columns = 3,
  rows = 3,
  ratio = 1.5,
}: {
  columns?: number;
  rows?: number;
  ratio?: number;
}) {
  return (
    <View style={{ gap: 18, paddingHorizontal: layout.gutterScreen }} testID="skeleton">
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 14 }}>
          {Array.from({ length: columns }, (_, c) => (
            <View key={c} style={{ flex: 1, gap: 7 }}>
              <SkeletonBox ratio={ratio} />
              <Skeleton width="70%" height={12} radius={radii.xs} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function SkeletonBox({ ratio }: { ratio: number }) {
  const [w, setW] = useState(0);
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Skeleton height={w * ratio || 120} radius={radii.sm} />
    </View>
  );
}

/** Card rows (Up next, search, settings-like lists). */
export function SkeletonRows({ n = 4, height = 68 }: { n?: number; height?: number }) {
  return (
    <View style={{ gap: 10, paddingHorizontal: layout.gutterScreen }} testID="skeleton">
      {Array.from({ length: n }, (_, i) => (
        <Skeleton key={i} height={height} radius={radii.lg} />
      ))}
    </View>
  );
}

/** Detail screens before the item has loaded: cover, title, status rail. */
export function DetailSkeleton() {
  return (
    <View
      style={{ alignItems: 'center', gap: 14, paddingTop: 24, paddingHorizontal: layout.gutterScreen }}
      testID="skeleton"
    >
      <Skeleton width={160} height={240} radius={radii.sm} />
      <Skeleton width="70%" height={28} />
      <Skeleton width="40%" height={16} />
      <Skeleton height={90} radius={radii.lg} style={{ marginTop: 12 }} />
    </View>
  );
}
