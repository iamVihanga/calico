import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { coverRadius, GeneratedCover } from '@/components/calico/GeneratedCover';
import { type CoverName, coverPalettes } from '@/components/calico/coverPalette';
import { shadow } from '@/theme';

export const coverWidths = { xs: 48, sm: 64, md: 92, lg: 124, xl: 168 } as const;
export type CoverSize = keyof typeof coverWidths;

type Props = {
  title?: string;
  author?: string;
  /** Named palette. When omitted the palette is picked from `seed` (item id). */
  cover?: CoverName;
  seed?: string;
  size?: CoverSize;
  src?: string;
  /** expo-image cache key (storage path) so rotating signed URLs don't re-download. */
  cacheKey?: string;
  tilt?: number;
  style?: StyleProp<ViewStyle>;
};

export function BookCover({ title = '', author, cover, seed, size = 'md', src, cacheKey, tilt = 0, style }: Props) {
  const w = coverWidths[size];
  const h = Math.round(w * 1.48);
  const transform = tilt ? [{ rotate: `${tilt}deg` }] : undefined;

  if (src) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={author ? `${title}, ${author}` : title}
        style={[{ width: w, height: h, overflow: 'hidden', boxShadow: shadow.cover, transform }, coverRadius, style]}
      >
        <Image
          source={{ uri: src, cacheKey }}
          cachePolicy="disk"
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: Math.max(3, Math.round(w * 0.045)),
            experimental_backgroundImage: 'linear-gradient(90deg, rgba(28,23,20,0.22), rgba(28,23,20,0))',
          }}
        />
      </View>
    );
  }
  return (
    <GeneratedCover
      title={title}
      author={author}
      seed={seed}
      palette={cover ? coverPalettes[cover] : undefined}
      width={w}
      height={h}
      showAuthor={size !== 'xs'}
      style={[{ transform }, style]}
    />
  );
}
