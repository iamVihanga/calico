import { tmdbImage } from '@shared/tmdb.ts';
import { Image } from 'expo-image';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Txt } from '@/components/ds/Txt';
import { alpha, radius, shadow, type SizeKey } from '@/theme';

import { coverFor } from './coverPalette';

type Props = {
  item: { id: string; title: string; posterPath: string | null };
  kind: 'movie' | 'show';
  /** TMDB image size (plan §8.2: posters w342; w185 for small tiles and rows). */
  size?: 'w185' | 'w342';
  titleSize?: number | SizeKey;
  /** The film-strip dots along the bottom (movie detail). */
  filmDots?: boolean;
  shadowed?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Movie or show poster: the typographic cover underneath, the TMDB poster on top once it loads. */
export function Poster({
  item,
  kind,
  size = 'w185',
  titleSize = '2xs',
  filmDots = false,
  shadowed = true,
  style,
}: Props) {
  const p = coverFor(item.id);
  const uri = tmdbImage(item.posterPath, size);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          aspectRatio: 2 / 3,
          backgroundColor: p.bg,
          borderRadius: kind === 'show' ? radius.sm : radius.xs,
          boxShadow: shadowed ? shadow.cover : undefined,
          paddingVertical: 10,
          paddingHorizontal: 9,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Txt family="display" weight={700} size={titleSize} leading={1.2} tint={p.ink} numberOfLines={6}>
        {item.title}
      </Txt>
      {uri && (
        <Image
          source={{ uri }}
          cachePolicy="disk"
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          transition={120}
        />
      )}
      {filmDots && (
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: alpha.black18,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: alpha.cream72 },
});
