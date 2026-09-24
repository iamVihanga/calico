import { type StyleProp, type ViewStyle } from 'react-native';

import { alpha, layout, palette, radius, type Theme, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';

export type IconButtonTone = 'quiet' | 'card' | 'accent' | 'ink' | 'inverse';
const dims = { sm: 36, md: 44, lg: 52 } as const;

function toneColors(t: Theme, tone: IconButtonTone) {
  switch (tone) {
    case 'card':
      return { bg: t.surfaceCard, fg: t.textPrimary, border: t.borderSoft, pressed: t.surfacePageWarm };
    case 'accent':
      return { bg: t.accentPrimary, fg: t.textOnAccent, border: 'transparent', pressed: t.accentPrimaryPress };
    case 'ink':
      return { bg: t.surfaceInk, fg: t.textInverse, border: 'transparent', pressed: palette.espresso };
    case 'inverse':
      return { bg: alpha.cream16, fg: t.textInverse, border: 'transparent', pressed: 'rgba(251,246,238,0.26)' };
    default:
      return { bg: 'transparent', fg: t.textSecondary, border: 'transparent', pressed: t.surfaceQuiet };
  }
}

type Props = {
  icon: IconName;
  /** Required: becomes the accessibility label. */
  label: string;
  tone?: IconButtonTone;
  size?: keyof typeof dims;
  round?: boolean;
  active?: boolean;
  iconSize?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  label,
  tone = 'quiet',
  size = 'md',
  round = true,
  active = false,
  iconSize,
  onPress,
  onLongPress,
  testID,
  style,
}: Props) {
  const { t } = useTheme();
  const c = toneColors(t, tone);
  const d = dims[size];
  const slop = Math.max(0, (layout.hitMin - d) / 2);
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      testID={testID}
      hitSlop={slop}
      onPress={onPress}
      onLongPress={onLongPress}
      pressedStyle={{ backgroundColor: c.pressed }}
      style={[
        {
          width: d,
          height: d,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: active ? t.surfaceAccentSoft : c.bg,
          borderRadius: round ? radius.pill : radius.md,
        },
        style,
      ]}
    >
      <Icon name={icon} size={iconSize ?? Math.round(d * 0.5)} tint={active ? t.textAccent : c.fg} />
    </Press>
  );
}
