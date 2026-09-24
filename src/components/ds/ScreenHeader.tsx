import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { layout, space, useTheme } from '@/theme';

import { Txt } from './Txt';

type Props = {
  title: string;
  /** Small caps line above the title. */
  eyebrow?: string;
  /** Caveat line above the title ("everything you own"). */
  hand?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  tone?: 'page' | 'inverse';
  style?: StyleProp<ViewStyle>;
};

/** Tab screen header as drawn in the prototype app: Caveat eyebrow, 34dp Playfair title, trailing buttons. */
export function ScreenHeader({ title, eyebrow, hand, leading, trailing, tone = 'page', style }: Props) {
  const { t } = useTheme();
  const inverse = tone === 'inverse';
  return (
    <View
      accessibilityRole="header"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: space[4],
          paddingTop: 10,
          paddingHorizontal: layout.gutterScreen,
          paddingBottom: 18,
        },
        style,
      ]}
    >
      {leading}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {eyebrow && (
          <Txt role="label" size="3xs" tint={inverse ? t.textInverseMuted : t.textMuted}>
            {eyebrow}
          </Txt>
        )}
        {hand && (
          <Txt family="hand" weight={400} size="lg" leading={1} tint={inverse ? t.accentSecondary : t.textAccent}>
            {hand}
          </Txt>
        )}
        <Txt
          family="display"
          weight={700}
          size={34}
          leading={1.06}
          tint={inverse ? t.textInverse : t.textPrimary}
          style={{ letterSpacing: -0.03 * 34 }}
        >
          {title}
        </Txt>
      </View>
      {trailing && <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>{trailing}</View>}
    </View>
  );
}
