import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import {
  layout,
  radius as radii,
  type RadiusKey,
  shadow as shadows,
  type ShadowKey,
  space,
  type Theme,
  useTheme,
} from '@/theme';

import { Press } from './Press';

export type CardTone = 'paper' | 'warm' | 'quiet' | 'forest' | 'accent' | 'ink';
export type CardPad = 'none' | 'sm' | 'md' | 'lg' | 'xl';

const pads: Record<CardPad, number> = { none: 0, sm: space[4], md: layout.padCard, lg: layout.padCardLg, xl: space[7] };

export function cardColors(t: Theme, tone: CardTone): { bg: string; border: string; fg: string } {
  switch (tone) {
    case 'warm':
      return { bg: t.surfacePageWarm, border: 'transparent', fg: t.textPrimary };
    case 'quiet':
      return { bg: t.surfaceQuiet, border: 'transparent', fg: t.textPrimary };
    case 'forest':
      return { bg: t.surfaceInverse, border: 'transparent', fg: t.textInverse };
    case 'accent':
      return { bg: t.accentPrimary, border: 'transparent', fg: t.textOnAccent };
    case 'ink':
      return { bg: t.surfaceInk, border: 'transparent', fg: t.textInverse };
    default:
      return { bg: t.surfaceCard, border: t.borderSoft, fg: t.textPrimary };
  }
}

type Props = {
  children?: ReactNode;
  tone?: CardTone;
  radius?: RadiusKey;
  shadow?: ShadowKey;
  pad?: CardPad;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  tone = 'paper',
  radius = 'lg',
  shadow = 'sm',
  pad = 'md',
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
  style,
}: Props) {
  const { t } = useTheme();
  const c = cardColors(t, tone);
  const box: ViewStyle = {
    borderRadius: radii[radius],
    padding: pads[pad],
    backgroundColor: c.bg,
    borderWidth: 1,
    borderColor: c.border,
    boxShadow: shadow === 'none' ? undefined : shadows[shadow],
  };
  if (onPress || onLongPress) {
    return (
      <Press
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[box, style]}
      >
        {children}
      </Press>
    );
  }
  return (
    <View testID={testID} style={[box, style]}>
      {children}
    </View>
  );
}
