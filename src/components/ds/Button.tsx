import type { ReactNode } from 'react';
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { layout, palette, radius, shadow, size as sizes, type Theme, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Caveat handwriting label (24, or 30 at lg). */
  hand?: boolean;
  block?: boolean;
  icon?: IconName;
  iconAfter?: IconName;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

function variantColors(t: Theme, v: ButtonVariant) {
  switch (v) {
    case 'accent':
      return {
        bg: t.accentPrimary,
        fg: t.textOnAccent,
        border: 'transparent',
        pressed: t.accentPrimaryPress,
        shadow: shadow.sm,
      };
    case 'secondary':
      return {
        bg: t.surfaceCard,
        fg: t.textPrimary,
        border: t.borderStrong,
        pressed: t.surfacePageWarm,
        shadow: undefined,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        fg: t.textSecondary,
        border: 'transparent',
        pressed: t.surfaceQuiet,
        shadow: undefined,
      };
    case 'inverse':
      return {
        bg: palette.cream,
        fg: palette.forest,
        border: 'transparent',
        pressed: palette.white,
        shadow: undefined,
      };
    default:
      return {
        bg: t.surfaceInk,
        fg: t.textInverse,
        border: 'transparent',
        pressed: palette.espresso,
        shadow: shadow.sm,
      };
  }
}

const sizeStyles: Record<ButtonSize, ViewStyle & { font: number }> = {
  sm: { paddingVertical: 9, paddingHorizontal: 14, minHeight: 36, borderRadius: radius.sm, font: sizes['2xs'] },
  md: {
    paddingVertical: layout.padControlY,
    paddingHorizontal: layout.padControlX,
    minHeight: layout.hitMin,
    borderRadius: radius.md,
    font: sizes.sm,
  },
  lg: { paddingVertical: 18, paddingHorizontal: 26, minHeight: layout.hitMin, borderRadius: radius.lg, font: sizes.md },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  hand = false,
  block = false,
  icon,
  iconAfter,
  disabled = false,
  loading = false,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
  style,
}: Props) {
  const { t } = useTheme();
  const c = variantColors(t, variant);
  const { font, ...box } = sizeStyles[size];
  const fontSize = hand ? (size === 'lg' ? sizes['2xl'] : sizes.xl) : font;
  const inactive = disabled || loading;
  // sm buttons are 36 high; extend the touch area to 48.
  const slop = size === 'sm' ? (layout.hitMin - 36) / 2 : 0;

  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={inactive}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={slop}
      pressShadow
      pressedStyle={{ backgroundColor: c.pressed }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: block ? 'stretch' : 'flex-start',
          gap: 8,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.bg,
          boxShadow: inactive ? undefined : c.shadow,
          opacity: disabled ? 0.42 : 1,
        },
        box,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={fontSize + 3} tint={c.fg} />}
          <View>
            <Txt family={hand ? 'hand' : 'ui'} weight={700} size={fontSize} leading={1.2} tint={c.fg}>
              {children}
            </Txt>
          </View>
          {iconAfter && <Icon name={iconAfter} size={fontSize + 3} tint={c.fg} />}
        </>
      )}
    </Press>
  );
}
