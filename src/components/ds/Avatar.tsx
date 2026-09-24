import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { palette, radius, useTheme } from '@/theme';

import { Txt } from './Txt';

const dims = { xs: 28, sm: 36, md: 44, lg: 56, xl: 72 } as const;
export type AvatarTone = 'accent' | 'forest' | 'sand' | 'pink' | 'honey' | 'ink';
export type AvatarRing = 'none' | 'accent' | 'forest' | 'pink' | 'honey';

type Props = {
  name?: string;
  src?: string;
  size?: keyof typeof dims;
  ring?: AvatarRing;
  tone?: AvatarTone;
  style?: StyleProp<ViewStyle>;
};

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ name = '', src, size = 'md', ring = 'none', tone = 'sand', style }: Props) {
  const { t } = useTheme();
  const d = dims[size];
  const bg: Record<AvatarTone, string> = {
    sand: palette.biscuit,
    pink: palette.petal,
    forest: palette.fern,
    honey: palette.honeycomb,
    accent: palette.marmalade,
    ink: palette.ink,
  };
  const fg = tone === 'ink' || tone === 'forest' ? palette.cream : palette.espresso;
  const rings: Record<AvatarRing, string> = {
    none: 'transparent',
    accent: t.accentPrimary,
    forest: t.accentTertiary,
    pink: t.accentPink,
    honey: t.accentSecondary,
  };
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[{ padding: ring === 'none' ? 0 : 2, backgroundColor: rings[ring], borderRadius: radius.pill }, style]}
    >
      <View
        style={{
          width: d,
          height: d,
          borderRadius: radius.pill,
          overflow: 'hidden',
          backgroundColor: bg[tone],
          borderWidth: 2,
          borderColor: t.surfaceCard,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {src ? (
          <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Txt family="ui" weight={700} size={Math.round(d * 0.38)} leading={1} tint={fg}>
            {initials(name)}
          </Txt>
        )}
      </View>
    </View>
  );
}
