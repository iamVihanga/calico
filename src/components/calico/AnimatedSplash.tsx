import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { alpha, motion, palette, radius, splash, useTheme } from '@/theme';

import { Illustration } from './Illustration';

/** Cat width on the native splash (app.config.ts imageWidth) and in the animated layout. */
const NATIVE_CAT = 148;
const CAT = 214;
const POP_MS = 560;
const BAR_MS = 2000;
const FADE_OUT_MS = 220;
/** How long the intro plays at least (pop + reveal, then a beat with the scene) before it may fade. */
export const INTRO_MS = 1400;
/** The wordmark block under the cat pushes it this far above centre; the native splash centres it. */
const NATIVE_DROP = 78;

const cozy = Easing.bezier(...motion.easing.cozy);
const purr = Easing.bezier(...motion.easing.purr);

/**
 * The design/v2 splash (prototype `splash`): Pinki asleep on the forest gradient with her moon, the
 * wordmark and three covers. Its first frame is the native splash (same background, cat at the
 * same size), so the hand-off doesn't jump. `onFirstLayout` is when the native splash can go. On
 * every cold start the intro plays in full (`INTRO_MS`); it fades out once that's done and the app
 * is ready (`done`), then calls `onHidden`. With reduced motion it fades as soon as `done`.
 */
export function AnimatedSplash({
  done,
  onHidden,
  onFirstLayout,
}: {
  done: boolean;
  onHidden: () => void;
  onFirstLayout?: (e: LayoutChangeEvent) => void;
}) {
  const { t } = useTheme();
  const reduced = useReducedMotion();
  const handoff = useSharedValue(1); // flat native-colour layer over the gradient
  const pop = useSharedValue(reduced ? 1 : NATIVE_CAT / CAT);
  const drop = useSharedValue(reduced ? 0 : NATIVE_DROP);
  const reveal = useSharedValue(reduced ? 1 : 0); // everything that isn't on the native splash
  const bar = useSharedValue(0.04);
  const shown = useSharedValue(1);
  const [introDone, setIntroDone] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setIntroDone(true), INTRO_MS);
    return () => clearTimeout(t);
  }, [reduced]);

  useEffect(() => {
    if (reduced) {
      handoff.value = 0;
      return;
    }
    handoff.value = withTiming(0, { duration: motion.duration.slow, easing: cozy });
    pop.value = withTiming(1, { duration: POP_MS, easing: purr });
    drop.value = withTiming(0, { duration: POP_MS, easing: cozy });
    reveal.value = withDelay(motion.duration.fast, withTiming(1, { duration: motion.duration.slow }));
    bar.value = withTiming(1, { duration: BAR_MS, easing: cozy });
  }, [reduced, handoff, pop, drop, reveal, bar]);

  useEffect(() => {
    if (!done || !introDone) return;
    shown.value = withTiming(0, { duration: reduced ? 0 : FADE_OUT_MS }, (finished) => {
      if (finished) runOnJS(onHidden)();
    });
  }, [done, introDone, reduced, shown, onHidden]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: shown.value }));
  const handoffStyle = useAnimatedStyle(() => ({ opacity: handoff.value }));
  const catStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drop.value }, { scale: pop.value }] }));
  const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.value }));
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  return (
    <Animated.View
      testID="animated-splash"
      onLayout={onFirstLayout}
      accessible
      accessibilityLabel={copy.splash.opening}
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 10,
          alignItems: 'center',
          justifyContent: 'center',
          experimental_backgroundImage: `linear-gradient(172deg, ${splash.top} 0%, ${splash.bottom} 100%)`,
        },
        rootStyle,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, revealStyle]} pointerEvents="none">
        <Illustration name="strokes" width={38} style={{ position: 'absolute', left: 26, top: 96, opacity: 0.9 }} />
        <Illustration name="dots" width={44} style={{ position: 'absolute', right: 30, bottom: 268, opacity: 0.85 }} />
        {/* Covers along the bottom edge */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 150,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <Illustration name="cover-atlas" width={96} rotate={-9} style={{ marginBottom: -28, ...coverShadow }} />
          <Illustration
            name="cover-midnight"
            width={104}
            style={{ marginBottom: -14, marginHorizontal: -12, ...coverShadow }}
          />
          <Illustration name="cover-brighter" width={96} rotate={9} style={{ marginBottom: -28, ...coverShadow }} />
        </View>
      </Animated.View>

      <View style={{ width: 312, height: 272, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }, revealStyle]}>
          <View style={{ width: 236, height: 236, borderRadius: radius.pill, backgroundColor: splash.halo }} />
          <View
            style={{
              position: 'absolute',
              width: 260,
              height: 260,
              experimental_backgroundImage: `radial-gradient(circle, ${splash.glow} 0%, transparent 65%)`,
            }}
          />
        </Animated.View>
        <Animated.View style={catStyle}>
          <Illustration name="cat-loaf" width={CAT} accessibilityLabel={copy.pinki.curled} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, revealStyle]} pointerEvents="none">
          <Illustration name="moon" width={54} float={5000} style={{ position: 'absolute', right: 0, top: 0 }} />
          <Illustration name="asterisk" width={24} style={{ position: 'absolute', right: 76, top: -6 }} />
          <Illustration name="heart" width={28} style={{ position: 'absolute', right: 16, bottom: 18 }} />
          <Illustration name="wave" width={42} style={{ position: 'absolute', left: 58, bottom: -4, opacity: 0.9 }} />
          <Illustration name="bookmark" width={22} style={{ position: 'absolute', left: 8, top: 74 }} />
          <Illustration name="openbook" width={38} style={{ position: 'absolute', left: -4, bottom: 54 }} />
        </Animated.View>
      </View>

      <Animated.View style={[{ alignItems: 'center' }, revealStyle]}>
        <Txt
          family="display"
          weight={700}
          size={54}
          leading={1}
          tint={palette.cream}
          style={{ marginTop: 26, letterSpacing: -0.03 * 54 }}
        >
          {copy.welcome.title}
        </Txt>
        <Txt family="hand" weight={400} size={26} leading={1} tint={t.accentSecondary} style={{ marginTop: 4 }}>
          {copy.welcome.eyebrow}
        </Txt>
        <View
          style={{
            width: 132,
            height: 5,
            marginTop: 40,
            borderRadius: radius.pill,
            backgroundColor: alpha.cream16,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[{ height: '100%', borderRadius: radius.pill, backgroundColor: palette.marmalade }, barStyle]}
          />
        </View>
      </Animated.View>

      {/* The native splash's flat colour, fading to reveal the gradient. */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: splash.native, zIndex: -1 }, handoffStyle]}
      />
    </Animated.View>
  );
}

// drop-shadow follows the image's alpha (the covers have transparent margins; boxShadow would not).
const coverShadow = { filter: 'drop-shadow(0 8px 16px rgba(10,18,15,0.45))' } as const;
