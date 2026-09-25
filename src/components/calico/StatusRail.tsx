import { useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { radius, shadow, useTheme } from '@/theme';

export type RailStop<S extends string> = { id: S; label: string };

type Props<S extends string> = {
  stops: RailStop<S>[];
  /** Current status; may be the branch (then no stop is active). */
  value: S;
  onSelect: (s: S) => void;
  /** Abandoned / Dropped: drawn under the rail as a branch. */
  branch?: RailStop<S>;
  title?: string;
};

/**
 * Status track (plan §6.2 StatusRail): tap a stop, or drag along the rail and let go on a stop.
 * Stops before the current one read as done (sage), the current one is marmalade with a focus glow.
 */
export function StatusRail<S extends string>({ stops, value, onSelect, branch, title }: Props<S>) {
  const { t } = useTheme();
  const [width, setWidth] = useState(0);
  const at = stops.findIndex((s) => s.id === value);

  const pick = (x: number) => {
    if (!width) return;
    const i = Math.max(0, Math.min(stops.length - 1, Math.floor((x / width) * stops.length)));
    const s = stops[i];
    if (s && s.id !== value) onSelect(s.id);
  };
  const drag = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onEnd((e) => runOnJS(pick)(e.x));

  return (
    <View
      style={{
        paddingTop: 18,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: t.surfaceCard,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
      }}
    >
      {title && (
        <Txt role="label" size="3xs" color="textMuted" style={{ marginBottom: 14 }}>
          {title}
        </Txt>
      )}
      <GestureDetector gesture={drag}>
        <View
          accessibilityRole="radiogroup"
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <View
            style={{
              position: 'absolute',
              left: `${50 / stops.length}%`,
              right: `${50 / stops.length}%`,
              top: 8,
              height: 3,
              borderRadius: 2,
              backgroundColor: t.surfaceSunk,
            }}
          />
          {stops.map((s, i) => {
            const on = s.id === value;
            const done = at > -1 && i < at;
            return (
              <Press
                key={s.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={s.label}
                testID={`rail-${s.id}`}
                onPress={() => !on && onSelect(s.id)}
                style={{ flex: 1, alignItems: 'center', gap: 8, minHeight: 48 }}
              >
                <View
                  style={{
                    width: 19,
                    height: 19,
                    borderRadius: radius.pill,
                    borderWidth: 3,
                    borderColor: on ? t.accentPrimary : done ? t.accentQuiet : t.borderStrong,
                    backgroundColor: on ? t.accentPrimary : done ? t.accentQuiet : t.surfaceCard,
                    boxShadow: on ? shadow.focus : undefined,
                  }}
                />
                <Txt
                  family="ui"
                  weight={700}
                  size="3xs"
                  align="center"
                  color={on ? 'textAccent' : done ? 'textSecondary' : 'textMuted'}
                >
                  {s.label}
                </Txt>
              </Press>
            );
          })}
        </View>
      </GestureDetector>
      {branch && (
        <Press
          accessibilityRole="radio"
          accessibilityState={{ checked: value === branch.id }}
          accessibilityLabel={branch.label}
          testID={`rail-${branch.id}`}
          onPress={() => value !== branch.id && onSelect(branch.id)}
          style={{
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            minHeight: 44,
            marginTop: 8,
          }}
        >
          <View
            style={{
              width: 13,
              height: 13,
              borderRadius: radius.pill,
              borderWidth: 2,
              borderColor: t.borderStrong,
              backgroundColor: value === branch.id ? t.textPrimary : t.surfaceCard,
            }}
          />
          <Txt family="ui" weight={600} size="2xs" color={value === branch.id ? 'textPrimary' : 'textMuted'}>
            {branch.label}
          </Txt>
        </Press>
      )}
    </View>
  );
}
