import * as Haptics from 'expo-haptics';
import { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { type FlatList, type LayoutChangeEvent, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { palette, useTheme } from '@/theme';

export const TICK = 12; // dp per page
const HEIGHT = 88;
const HAPTIC_MIN_MS = 25;

export type PageRulerHandle = { scrollTo: (page: number, animated?: boolean) => void };

type Props = {
  /** Last page (or 100 for percent). */
  max: number;
  /** Page the ruler opens on (the last logged page). */
  initial: number;
  onChange: (page: number) => void;
};

const Tick = memo(function Tick({ n, color, label }: { n: number; color: string; label: string }) {
  return (
    <View style={{ width: TICK, height: HEIGHT }}>
      <View style={{ width: 1, height: n % 10 === 0 ? 42 : n % 5 === 0 ? 30 : 20, backgroundColor: color }} />
      {n % 10 === 0 && (
        <View style={{ position: 'absolute', top: 48, left: -20, width: 40, alignItems: 'center' }}>
          <Txt family="ui" weight={600} size="3xs" color="textMuted" allowFontScaling={false}>
            {label}
          </Txt>
        </View>
      )}
    </View>
  );
});

/**
 * Tape-measure page scrubber (plan §11.2): one tick per page scrolls past a fixed centre needle.
 * The page is computed on the UI thread; JS gets one call per page change (with a haptic tick,
 * firmer every 10 pages). Adjustable for screen readers: ±1 page.
 */
export const PageRuler = forwardRef<PageRulerHandle, Props>(function PageRuler({ max, initial, onChange }, ref) {
  const { t } = useTheme();
  const list = useRef<FlatList<number>>(null);
  const [width, setWidth] = useState(0);
  const page = useSharedValue(initial);
  const current = useRef(initial);
  const lastHaptic = useRef(0);
  const pages = useMemo(() => Array.from({ length: max + 1 }, (_, i) => i), [max]);

  useImperativeHandle(ref, () => ({
    scrollTo: (p, animated = true) =>
      list.current?.scrollToOffset({ offset: Math.max(0, Math.min(max, p)) * TICK, animated }),
  }));

  const tick = useCallback(
    (p: number) => {
      current.current = p;
      onChange(p);
      const now = Date.now();
      if (p % 10 === 0) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (now - lastHaptic.current > HAPTIC_MIN_MS) void Haptics.selectionAsync();
      lastHaptic.current = now;
    },
    [onChange],
  );

  const onScroll = useAnimatedScrollHandler((e) => {
    page.value = Math.max(0, Math.min(max, Math.round(e.contentOffset.x / TICK)));
  });
  useAnimatedReaction(
    () => page.value,
    (p, prev) => {
      if (prev !== null && p !== prev) runOnJS(tick)(p);
    },
  );

  const step = (d: number) => {
    const p = Math.max(0, Math.min(max, current.current + d));
    list.current?.scrollToOffset({ offset: p * TICK, animated: false });
    tick(p);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={copy.ruler.a11y(current.current, max)}
      accessibilityValue={{ min: 0, max, now: current.current }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: HEIGHT, backgroundColor: t.surfacePageWarm, overflow: 'hidden' }}
    >
      {width > 0 && (
        <Animated.FlatList
          ref={list as never}
          horizontal
          data={pages}
          keyExtractor={String}
          renderItem={({ item }) => <Tick n={item} color={palette.biscuit} label={String(item)} />}
          getItemLayout={(_, i) => ({ length: TICK, offset: TICK * i, index: i })}
          initialScrollIndex={Math.max(0, Math.min(max, initial))}
          initialNumToRender={Math.ceil(width / TICK) + 10}
          windowSize={5}
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: width / 2 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />
      )}
      {/* Fixed needle */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: width / 2 - 1,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: t.accentPrimary,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: width / 2 - 7.5,
          top: 0,
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderTopWidth: 10,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: t.accentPrimary,
        }}
      />
    </View>
  );
});
