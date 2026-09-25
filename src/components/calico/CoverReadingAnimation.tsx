import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { radius, shadow, useTheme } from '@/theme';

import { coverRadius } from './GeneratedCover';

export const FIELD_STAGGER_MS = 120;
const STEP_MS = 900;
const COVER = { w: 100, h: 150 };

export type ReadingField = { label: string; value: string };

type Props = {
  /** Local uri of the cropped cover. */
  cover: string | null;
  /** Empty while waiting; values fill in one at a time once they arrive. */
  fields: ReadingField[];
  done: boolean;
};

/**
 * "Reading the cover" (plan §6.2, brief §7.5.3): the cover sits top-left with a scan line passing over
 * it, the status line cycles, then the fields fill one at a time (120ms stagger), lifting into place.
 */
export function CoverReadingAnimation({ cover, fields, done }: Props) {
  const { t } = useTheme();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const scan = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    scan.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.linear }), done ? 1 : -1, false);
  }, [scan, reduced, done]);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, copy.capture.readingSteps.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, [done]);

  const line = useAnimatedStyle(() => ({ transform: [{ translateY: scan.value * (COVER.h - 4) }] }));

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
        <View
          style={[
            {
              width: COVER.w,
              height: COVER.h,
              overflow: 'hidden',
              backgroundColor: t.surfaceSunk,
              boxShadow: shadow.cover,
            },
            coverRadius,
          ]}
        >
          {cover && <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />}
          {!reduced && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 4,
                  opacity: 0.9,
                  backgroundColor: t.accentSecondary,
                },
                line,
              ]}
            />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0, paddingTop: 6 }} accessibilityLiveRegion="polite">
          <Txt family="hand" weight={400} size="lg" color="textAccent">
            {copy.capture.readingHand}
          </Txt>
          <Txt
            family="display"
            weight={700}
            size="xl"
            leading={1.18}
            style={{ marginTop: 2, letterSpacing: -0.02 * 24 }}
          >
            {copy.capture.readingSteps[step]}
          </Txt>
          <Txt family="ui" size="xs" color="textMuted" style={{ marginTop: 8 }}>
            {copy.capture.readingBody}
          </Txt>
        </View>
      </View>

      <View style={{ marginTop: 30, gap: 12 }}>
        {fields.map((f, i) => (
          <View key={f.label}>
            <Txt role="label" size={10} color="textMuted" style={{ marginBottom: 6 }}>
              {f.label}
            </Txt>
            <View
              style={{
                minHeight: 50,
                justifyContent: 'center',
                paddingHorizontal: 14,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: t.borderSoft,
                borderStyle: f.value ? 'solid' : 'dashed',
                backgroundColor: f.value ? t.surfaceCard : 'transparent',
              }}
            >
              {!!f.value && (
                <Animated.View entering={reduced ? undefined : FadeInUp.delay(i * FIELD_STAGGER_MS).duration(240)}>
                  <Txt family="ui" size="sm">
                    {f.value}
                  </Txt>
                </Animated.View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
