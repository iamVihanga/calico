import { useState } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

import { radius, shadow, useTheme } from '@/theme';

import { CoverPhoto } from './CoverPhoto';
import { ItemCover } from './ItemCover';
import { type MediaKind } from './MediaShapeIcon';

export type MosaicItem = {
  id: string;
  kind: MediaKind;
  title: string;
  cover: { coverPath: string | null; coverUrl: string | null; posterPath: string | null };
};

type Props = {
  /** First four items by collection position. Missing patches render as empty sunk paper. */
  items: MosaicItem[];
  /** Chosen art: one item's cover, or a photo (storage path), filling the card instead of the grid. */
  art?: { item?: MosaicItem | null; photoPath?: string | null };
  /** `grid` = 2×2 square card (Collections tab); `strip` = 4-across header (collection detail). */
  variant?: 'grid' | 'strip';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const STRIP_HEIGHT = 104;

/** The collection's first four covers as a patchwork (cropped to fit), or the art the user chose. */
export function CollectionMosaic({ items, art, variant = 'grid', style, testID }: Props) {
  const { t } = useTheme();
  const [w, setW] = useState(0);
  const patches = [0, 1, 2, 3].map((i) => items[i]);
  const strip = variant === 'strip';
  const gap = strip ? 4 : 3;
  const cellW = strip ? (w - 3 * gap) / 4 : (w - gap) / 2;

  const cover = (it: MosaicItem, width: number) => (
    <ItemCover item={it} width={width} titleSize={strip ? 10 : 9} shadow={false} style={{ borderRadius: 0 }} />
  );

  const patch = (it: MosaicItem | undefined, i: number) => (
    <View
      key={it?.id ?? `empty-${i}`}
      testID={it && testID ? `${testID}-patch-${it.id}` : undefined}
      style={{ flex: 1, backgroundColor: t.surfaceSunk, justifyContent: 'center', overflow: 'hidden' }}
    >
      {it && cellW > 0 && cover(it, cellW)}
    </View>
  );

  const chosen = art?.photoPath ? (
    <CoverPhoto item={{ coverPath: art.photoPath, coverUrl: null }} />
  ) : art?.item && w > 0 ? (
    <View style={{ flex: 1, justifyContent: 'center' }}>{cover(art.item, w)}</View>
  ) : null;
  const hasArt = !!art?.photoPath || !!art?.item;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[
        {
          borderRadius: radius.lg,
          overflow: 'hidden',
          boxShadow: shadow.sm,
          backgroundColor: t.surfaceSunk,
          gap,
        },
        strip ? { height: STRIP_HEIGHT, flexDirection: 'row' } : { aspectRatio: 1 },
        style,
      ]}
    >
      {hasArt ? (
        chosen
      ) : strip ? (
        patches.map(patch)
      ) : (
        <>
          <View style={{ flex: 1, flexDirection: 'row', gap }}>{patches.slice(0, 2).map((p, i) => patch(p, i))}</View>
          <View style={{ flex: 1, flexDirection: 'row', gap }}>{patches.slice(2).map((p, i) => patch(p, i + 2))}</View>
        </>
      )}
    </View>
  );
}

/** Coloured count dot under a collection card (book = square-ish, movie = round, show = rounded). */
export function MediaCountDot({ kind }: { kind: MediaKind }) {
  const { t } = useTheme();
  const dot = { book: [t.cover[0], 2], movie: [t.cover[1], 4], show: [t.cover[5], 3] } as const;
  const [bg, r] = dot[kind];
  return <View style={{ width: 8, height: 8, borderRadius: r, backgroundColor: bg }} />;
}
