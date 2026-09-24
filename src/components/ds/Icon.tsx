import createIconSet from '@expo/vector-icons/createIconSet';
import type { StyleProp, TextStyle } from 'react-native';

import { type ThemeColor, useTheme } from '@/theme';

import glyphs from './iconGlyphs.json';

export type IconName = keyof typeof glyphs;

export const ICON_FONT = 'MaterialSymbolsOutlined';

const Glyph = createIconSet(
  glyphs as Record<IconName, number>,
  ICON_FONT,
  require('../../../assets/icons/MaterialSymbolsOutlined.ttf'),
);

export const iconFont = { [ICON_FONT]: require('../../../assets/icons/MaterialSymbolsOutlined.ttf') };

type Props = {
  name: IconName;
  size?: number;
  color?: ThemeColor;
  /** Raw colour already resolved from the theme by a parent component. */
  tint?: string;
  style?: StyleProp<TextStyle>;
  /** Icons are decorative by default; the pressable around them carries the label. */
  accessibilityLabel?: string;
};

/** Material Symbols Outlined (weight 400, fill 0). Run `npm run gen:icons` after using a new name. */
export function Icon({ name, size = 24, color = 'textPrimary', tint, style, accessibilityLabel }: Props) {
  const { t } = useTheme();
  return (
    <Glyph
      name={name}
      size={size}
      color={tint ?? t[color]}
      style={style}
      allowFontScaling={false}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  );
}
