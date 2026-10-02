import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';

import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { radius, useTheme } from '@/theme';

import { Illustration } from './Illustration';

export const FIELD_STAGGER_MS = 120;
const STEP_MS = 900;
const CAT = 138;

export type ReadingField = { label: string; value: string };

type Props = {
  /** Empty while waiting; values fill in one at a time once they arrive. */
  fields: ReadingField[];
  done: boolean;
};

/**
 * "Reading the cover" (design/v2 `reading`): Kiri with her magnifying glass, dots bobbing beside her,
 * the status line cycles, then the fields fill one at a time (120ms stagger), lifting into place.
 */
export function CoverReadingAnimation({ fields, done }: Props) {
  const { t } = useTheme();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, copy.capture.readingSteps.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, [done]);

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
        <View style={{ width: CAT }}>
          <Illustration name="cat-magnifier" width={CAT} accessibilityLabel={copy.art.magnifier} />
          <Illustration name="dots" width={38} float={2400} style={{ position: 'absolute', right: -6, top: 4 }} />
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
