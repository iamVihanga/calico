import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Txt } from '@/components/ds/Txt';
import { radius, shadow as shadows } from '@/theme';

import { type CoverPalette, coverFor } from './coverPalette';

type Props = {
  title: string;
  author?: string;
  /** Item id; picks a palette from the prototype rotation. Ignored when `palette` is given. */
  seed?: string;
  palette?: CoverPalette;
  width: number;
  height?: number;
  /** Show the spine strip on the left edge (books). */
  spine?: boolean;
  showAuthor?: boolean;
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const coverRadius = {
  borderTopLeftRadius: radius.cover.topLeft,
  borderTopRightRadius: radius.cover.topRight,
  borderBottomRightRadius: radius.cover.bottomRight,
  borderBottomLeftRadius: radius.cover.bottomLeft,
} as const;

/** Typographic cover for items without a photo (design-system BookCover layout). */
export function GeneratedCover({
  title,
  author,
  seed,
  palette,
  width,
  height = Math.round(width * 1.48),
  spine = true,
  showAuthor = true,
  shadow = true,
  style,
}: Props) {
  const p = palette ?? coverFor(seed ?? title);
  const titleSize = Math.max(9, Math.round(width * 0.135));
  const authorSize = Math.max(7, Math.round(width * 0.075));
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={author ? `${title}, ${author}` : title}
      style={[
        {
          width,
          height,
          backgroundColor: p.bg,
          overflow: 'hidden',
          padding: Math.round(width * 0.11),
          justifyContent: 'space-between',
          boxShadow: shadow ? shadows.cover : undefined,
        },
        coverRadius,
        style,
      ]}
    >
      <Txt
        family="display"
        weight={700}
        size={titleSize}
        leading={1.12}
        tint={p.ink}
        style={{ letterSpacing: -0.01 * titleSize }}
        numberOfLines={5}
      >
        {title}
      </Txt>
      {author && showAuthor && width > 48 ? (
        <Txt
          family="ui"
          weight={700}
          size={authorSize}
          leading={1.2}
          tint={p.sub}
          style={{ letterSpacing: 0.04 * authorSize, textTransform: 'uppercase' }}
          numberOfLines={2}
        >
          {author}
        </Txt>
      ) : null}
      {spine && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: Math.max(3, Math.round(width * 0.045)),
            experimental_backgroundImage: 'linear-gradient(90deg, rgba(28,23,20,0.22), rgba(28,23,20,0))',
          }}
        />
      )}
    </View>
  );
}
