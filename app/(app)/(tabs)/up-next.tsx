import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useIsFocused } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ds/ScreenHeader';
import { SkeletonRows } from '@/components/ds/Skeleton';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { TAB_SCREEN_BOTTOM } from '@/components/layout/TabScreen';
import type { QueueEntry } from '@/features/books/api';
import { type QueueRow, useMoveInQueue, useQueue, useRemoveFromQueue } from '@/features/upnext/hooks';
import { byPosition, keyForMove, PICK_POOL } from '@/features/upnext/logic';
import { PickButton } from '@/features/upnext/PickButton';
import { QueueRowView } from '@/features/upnext/QueueRowView';
import { useShake } from '@/features/upnext/shake';
import { copy } from '@/i18n/en';
import { qk } from '@/lib/queryKeys';
import { layout, radius, useTheme } from '@/theme';

type Filter = 'all' | 'book' | 'movie' | 'show';

/**
 * Up next (prototype `upnext`, plan §11.7): one queue for everything. Long-press the handle to drag;
 * ↑ and ✕ are the button alternatives. Filters only filter the view (dragging needs All).
 * Pick for me draws from the top ten; shaking the phone here opens it too.
 */
export default function UpNext() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { rows, isPending } = useQueue();
  const qc = useQueryClient();
  const move = useMoveInQueue();
  const remove = useRemoveFromQueue();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = useMemo(() => (filter === 'all' ? rows : rows.filter((r) => r.item.kind === filter)), [rows, filter]);
  const openPick = useCallback(() => router.push('/pick'), []);
  useShake(focused && rows.length > 0, openPick);

  // Read the order at the moment of the move (not a render-time index), so quick repeated taps and
  // memoised cells always move from where the item really is now.
  const moveItem = (itemId: string, to: (from: number) => number) => {
    const list = [...(qc.getQueryData<QueueEntry[]>(qk.upNext) ?? [])].sort(byPosition);
    const from = list.findIndex((e) => e.itemId === itemId);
    const target = Math.max(0, Math.min(list.length - 1, to(from)));
    if (from < 0 || target === from) return;
    move.mutate({ itemId, position: keyForMove(list, from, target) });
  };
  const indexOf = (r: QueueRow) => rows.findIndex((x) => x.entry.itemId === r.entry.itemId);

  const header = (
    <View>
      <ScreenHeader hand={copy.headers.upNextHand} title={copy.headers.upNext} />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          paddingHorizontal: layout.gutterScreen,
          paddingBottom: 16,
        }}
      >
        {(['all', 'book', 'movie', 'show'] as const).map((f) => (
          <Tag key={f} selected={filter === f} onPress={() => setFilter(f)} testID={`queue-filter-${f}`}>
            {copy.upNext.filters[f]}
          </Tag>
        ))}
      </View>
      {filter !== 'all' && rows.length > 0 && (
        <Txt
          family="ui"
          size="2xs"
          color="textMuted"
          style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 10 }}
        >
          {copy.upNext.filteredHint}
        </Txt>
      )}
      {isPending && <SkeletonRows n={5} />}
      {!isPending && shown.length === 0 && (
        <View
          style={{
            marginHorizontal: layout.gutterScreen,
            marginVertical: 8,
            paddingVertical: 52,
            paddingHorizontal: 28,
            backgroundColor: t.surfacePageWarm,
            borderRadius: radius.xl,
          }}
        >
          <Txt family="hand" weight={400} size="xl" color="textMuted" align="center">
            {copy.upNext.empty}
          </Txt>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.surfacePage }} testID="screen-up-next">
      <DraggableFlatList
        data={shown}
        keyExtractor={(r) => r.entry.itemId}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + TAB_SCREEN_BOTTOM + 70 }}
        activationDistance={filter === 'all' ? 8 : 10000}
        initialNumToRender={20}
        onPlaceholderIndexChange={() => void Haptics.selectionAsync()}
        onDragEnd={({ from, to }) => {
          const row = shown[from];
          if (row) moveItem(row.entry.itemId, () => to);
        }}
        renderItem={({ item: row, drag, isActive }) => {
          const i = indexOf(row);
          return (
            <ScaleDecorator activeScale={1.03}>
              <View style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 10 }}>
                <QueueRowView
                  row={row}
                  n={i + 1}
                  active={isActive}
                  onDrag={filter === 'all' ? drag : undefined}
                  onUp={i > 0 ? () => moveItem(row.entry.itemId, (from) => from - 1) : undefined}
                  onRemove={() => remove(row)}
                />
                {filter === 'all' && i === PICK_POOL - 1 && rows.length > PICK_POOL && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 14,
                      paddingHorizontal: 4,
                    }}
                  >
                    <Txt family="hand" weight={400} size={17} color="textMuted">
                      {copy.upNext.divider}
                    </Txt>
                    <View
                      style={{ flex: 1, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: t.borderStrong }}
                    />
                  </View>
                )}
              </View>
            </ScaleDecorator>
          );
        }}
      />
      {rows.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: insets.bottom + 96,
            paddingHorizontal: layout.gutterScreen,
          }}
        >
          <PickButton hand={copy.pick.ctaHand} onPress={openPick} />
        </View>
      )}
    </View>
  );
}
