import { type StyleProp, View, type ViewStyle } from 'react-native';

import { Txt } from '@/components/ds/Txt';
import { alpha, shadow as shadows, type SizeKey } from '@/theme';

import { CoverPhoto } from './CoverPhoto';
import { coverFor } from './coverPalette';
import { coverRadius } from './GeneratedCover';
import { Poster } from './Poster';

type Props = {
  item: {
    id: string;
    kind: 'book' | 'movie' | 'show';
    title: string;
    cover: { coverPath: string | null; coverUrl: string | null; posterPath: string | null };
  };
  width: number;
  titleSize?: number | SizeKey;
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A book cover (typographic + photo) or a movie/show poster, at any width (2:3). */
export function ItemCover({ item, width, titleSize = 8, shadow = true, style }: Props) {
  if (item.kind !== 'book') {
    return (
      <Poster
        item={{ id: item.id, title: item.title, posterPath: item.cover.posterPath }}
        kind={item.kind}
        titleSize={titleSize}
        shadowed={shadow}
        size={width > 120 ? 'w342' : 'w185'}
        style={[{ width, padding: Math.max(4, Math.round(width / 10)) }, style]}
      />
    );
  }
  const p = coverFor(item.id);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          aspectRatio: 2 / 3,
          backgroundColor: p.bg,
          boxShadow: shadow ? shadows.xs : undefined,
          padding: Math.max(4, Math.round(width / 10)),
          overflow: 'hidden',
        },
        coverRadius,
        style,
      ]}
    >
      <Txt family="display" weight={700} size={titleSize} leading={1.15} tint={p.ink} numberOfLines={5}>
        {item.title}
      </Txt>
      <CoverPhoto item={item.cover} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: Math.max(2, width / 12),
          backgroundColor: alpha.black18,
        }}
      />
    </View>
  );
}
