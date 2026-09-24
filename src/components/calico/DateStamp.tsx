import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Txt } from '@/components/ds/Txt';
import { radius, useTheme } from '@/theme';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "26 SEP" from a yyyy-MM-dd local date (no timezone shift). */
export function stampLabel(isoDate: string): string {
  const [, m, d] = isoDate.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[(m ?? 1) - 1]}`;
}

/** Stable rotation between −4° and +4°, seeded by the date so a stamp never wobbles between renders. */
export function stampRotation(isoDate: string): number {
  let h = 0;
  for (let i = 0; i < isoDate.length; i++) h = (h * 31 + isoDate.charCodeAt(i)) % 997;
  return (h % 9) - 4;
}

export type StampVariant = 'borrowed' | 'current' | 'old';

type Props = {
  date: string;
  variant?: StampVariant;
  /** Override the seeded rotation (degrees). */
  rotate?: number;
  style?: StyleProp<ViewStyle>;
};

/** Ink-style date stamp from the library slip. `old` stamps are struck through (renewed past them). */
export function DateStamp({ date, variant = 'current', rotate, style }: Props) {
  const { t } = useTheme();
  const c = {
    borrowed: { ring: t.borderStrong, bg: t.surfacePage, fg: t.textSecondary },
    current: { ring: t.accentPrimary, bg: t.accentPrimary, fg: t.textOnAccent },
    old: { ring: t.borderSoft, bg: t.surfacePage, fg: t.textMuted },
  }[variant];
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          paddingVertical: 7,
          paddingHorizontal: 12,
          borderRadius: radius.sm,
          borderWidth: 2,
          borderColor: c.ring,
          backgroundColor: c.bg,
          transform: [{ rotate: `${rotate ?? stampRotation(date)}deg` }],
        },
        style,
      ]}
    >
      <Txt
        family="ui"
        weight={700}
        size="xs"
        leading={1.2}
        tint={c.fg}
        style={{ letterSpacing: 1, textDecorationLine: variant === 'old' ? 'line-through' : 'none' }}
      >
        {stampLabel(date)}
      </Txt>
    </View>
  );
}
