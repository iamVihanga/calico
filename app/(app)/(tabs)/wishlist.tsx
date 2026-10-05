import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Illustration } from '@/components/calico/Illustration';
import { Button } from '@/components/ds/Button';
import { ScreenHeader } from '@/components/ds/ScreenHeader';
import { SkeletonRows } from '@/components/ds/Skeleton';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { TAB_SCREEN_BOTTOM } from '@/components/layout/TabScreen';
import type { OrderEntry } from '@/features/wishlist/api';
import { useMoveInWishlist, usePlaceNewItems, useWishlist } from '@/features/wishlist/hooks';
import { byPosition, keyForMove } from '@/features/wishlist/logic';
import { WishlistRow } from '@/features/wishlist/WishlistRow';
import { copy } from '@/i18n/en';
import { qk } from '@/lib/queryKeys';
import { storage, storageKeys } from '@/lib/storage';
import { layout, radius, useTheme } from '@/theme';

type Filter = 'all' | 'book' | 'movie' | 'show';
const FILTERS: readonly Filter[] = ['all', 'book', 'movie', 'show'];
const readFilter = (): Filter => {
  const v = storage.getString(storageKeys.wishlistFilter);
  return FILTERS.includes(v as Filter) ? (v as Filter) : 'all';
};

/**
 * Wishlist (replaces Up next): wishlist books and watchlist movies and shows, in the user's own order.
 * Long-press the handle to drag (in any filter: the item moves between the ones you see); ↑ is the
 * button alternative. Items join and leave by their status.
 */
export default function Wishlist() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { rows, isPending, ready } = useWishlist();
  usePlaceNewItems(rows, ready);
  const qc = useQueryClient();
  const move = useMoveInWishlist();
  const [filter, setFilterState] = useState<Filter>(readFilter);
  const setFilter = (f: Filter) => {
    storage.set(storageKeys.wishlistFilter, f);
    setFilterState(f);
  };
  const shown = useMemo(() => (filter === 'all' ? rows : rows.filter((r) => r.item.kind === filter)), [rows, filter]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: rows.length, book: 0, movie: 0, show: 0 };
    for (const r of rows) c[r.item.kind] += 1;
    return c;
  }, [rows]);

  // The order is read at the moment of the move (not a render-time index), among the items shown now.
  const moveItem = (itemId: string, to: (from: number) => number) => {
    const visible = new Set(shown.map((r) => r.item.id));
    const list = (qc.getQueryData<OrderEntry[]>(qk.wishlistOrder) ?? [])
      .filter((e) => visible.has(e.itemId))
      .sort(byPosition);
    const from = list.findIndex((e) => e.itemId === itemId);
    const target = Math.max(0, Math.min(list.length - 1, to(from)));
    if (from < 0 || target === from) return;
    move.mutate({ itemId, position: keyForMove(list, from, target) });
  };

  const header = (
    <View>
      <ScreenHeader hand={copy.headers.wishlistHand} title={copy.headers.wishlist} />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          paddingHorizontal: layout.gutterScreen,
          paddingBottom: 16,
        }}
      >
        {FILTERS.map((f) => (
          <Tag
            key={f}
            selected={filter === f}
            count={f === 'all' ? undefined : counts[f]}
            onPress={() => setFilter(f)}
            testID={`wish-filter-${f}`}
          >
            {copy.wishlist.filters[f]}
          </Tag>
        ))}
      </View>
      {isPending && <SkeletonRows n={5} />}
      {!isPending && shown.length === 0 && (
        <View
          style={{
            marginHorizontal: layout.gutterScreen,
            marginVertical: 8,
            paddingTop: 26,
            paddingHorizontal: 28,
            paddingBottom: 30,
            gap: 12,
            backgroundColor: t.surfacePageWarm,
            borderRadius: radius.xl,
            alignItems: 'center',
          }}
          testID="wishlist-empty"
        >
          <Illustration name="open-book-world" width={232} accessibilityLabel={copy.art.openBookWorld} />
          <Txt family="hand" weight={400} size="xl" color="textMuted" align="center">
            {copy.wishlist.empty}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            <Button variant="secondary" onPress={() => router.push('/capture/review')}>
              {copy.wishlist.addBook}
            </Button>
            <Button variant="secondary" onPress={() => router.push('/tmdb')}>
              {copy.wishlist.findMedia}
            </Button>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.surfacePage }} testID="screen-wishlist">
      <DraggableFlatList
        data={shown}
        keyExtractor={(r) => r.item.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + TAB_SCREEN_BOTTOM }}
        activationDistance={8}
        initialNumToRender={20}
        onPlaceholderIndexChange={() => void Haptics.selectionAsync()}
        onDragEnd={({ from, to }) => {
          const row = shown[from];
          if (row) moveItem(row.item.id, () => to);
        }}
        renderItem={({ item: row, drag, isActive, getIndex }) => {
          const i = getIndex() ?? 0;
          return (
            <ScaleDecorator activeScale={1.03}>
              <View style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 10 }}>
                <WishlistRow
                  row={row}
                  n={i + 1}
                  active={isActive}
                  onDrag={row.position ? drag : undefined}
                  onUp={i > 0 && row.position ? () => moveItem(row.item.id, (from) => from - 1) : undefined}
                />
              </View>
            </ScaleDecorator>
          );
        }}
      />
    </View>
  );
}
