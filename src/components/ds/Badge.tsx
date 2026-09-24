import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { palette, radius, size, type Theme, tracking, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

export type BadgeTone = 'accent' | 'forest' | 'sand' | 'pink' | 'honey' | 'ink';

// Badge ink colours are fixed in the design system (not theme tokens).
const BADGE_INK = { accent: '#8A3708', pink: '#A1495A', honey: '#8A5A12' } as const;

export function badgeColors(t: Theme, tone: BadgeTone): { bg: string; fg: string } {
  switch (tone) {
    case 'accent':
      return { bg: t.surfaceAccentSoft, fg: BADGE_INK.accent };
    case 'forest':
      return { bg: t.statusSuccessSoft, fg: t.statusSuccess };
    case 'pink':
      return { bg: palette.blush, fg: BADGE_INK.pink };
    case 'honey':
      return { bg: t.statusWarningSoft, fg: BADGE_INK.honey };
    case 'ink':
      return { bg: t.surfaceInk, fg: t.textInverse };
    default:
      return { bg: t.surfaceQuiet, fg: t.textSecondary };
  }
}

type Props = {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: IconName;
  caps?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ children, tone = 'sand', icon, caps = true, style }: Props) {
  const { t } = useTheme();
  const c = badgeColors(t, tone);
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 6,
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: radius.pill,
          backgroundColor: c.bg,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={14} tint={c.fg} />}
      <Txt
        family="ui"
        weight={700}
        size="3xs"
        leading={1.2}
        tint={c.fg}
        style={{
          letterSpacing: (caps ? tracking.caps : 0.01) * size['3xs'],
          textTransform: caps ? 'uppercase' : 'none',
        }}
      >
        {children}
      </Txt>
    </View>
  );
}
