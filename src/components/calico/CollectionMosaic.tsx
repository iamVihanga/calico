import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Txt } from '@/components/ds/Txt';
import { radius, shadow, useTheme } from '@/theme';

import { coverFor } from './coverPalette';
import { type MediaKind } from './MediaShapeIcon';

export type MosaicItem = { id: string; title: string };

type Props = {
  /** First four items by collection position. Missing patches render as empty sunk paper. */
  items: MosaicItem[];
  /** `grid` = 2×2 square card (Collections tab); `strip` = 4-across header (collection detail). */
  variant?: 'grid' | 'strip';
  style?: StyleProp<ViewStyle>;
};

/** Patchwork of the collection's first four covers. */
export function CollectionMosaic({ items, variant = 'grid', style }: Props) {
  const { t } = useTheme();
  const patches = [0, 1, 2, 3].map((i) => items[i]);
  const strip = variant === 'strip';
  const gap = strip ? 4 : 3;

  const patch = (it: MosaicItem | undefined, i: number) => {
    const p = it ? coverFor(it.id) : null;
    return (
      <View
        key={it?.id ?? `empty-${i}`}
        style={{
          flex: 1,
          backgroundColor: p ? p.bg : t.surfaceSunk,
          justifyContent: 'flex-end',
          padding: strip ? 8 : 6,
          overflow: 'hidden',
        }}
      >
        {it && (
          <Txt
            family="display"
            weight={700}
            size={strip ? 10 : 9}
            leading={1.15}
            tint={p?.ink}
            numberOfLines={3}
            allowFontScaling={false}
          >
            {it.title}
          </Txt>
        )}
      </View>
    );
  };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          borderRadius: radius.lg,
          overflow: 'hidden',
          boxShadow: shadow.sm,
          backgroundColor: t.surfaceSunk,
          gap,
        },
        strip ? { height: 104, flexDirection: 'row' } : { aspectRatio: 1 },
        style,
      ]}
    >
      {strip ? (
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
