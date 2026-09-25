import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useIsFocused, useNavigation, useScrollToTop } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Kiri } from '@/components/calico/Kiri';
import { ScriptToggle } from '@/components/calico/ScriptToggle';
import { EmptyState } from '@/components/ds/EmptyState';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { ScreenHeader } from '@/components/ds/ScreenHeader';
import { SegmentedControl } from '@/components/ds/SegmentedControl';
import { Select } from '@/components/ds/Select';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { Icon, type IconName } from '@/components/ds/Icon';
import { TAB_SCREEN_BOTTOM } from '@/components/layout/TabScreen';
import { BookRow } from '@/features/books/components/BookRow';
import { BookTile } from '@/features/books/components/BookTile';
import { ShelfView } from '@/features/books/components/ShelfView';
import { useBookStatusChange } from '@/features/books/useBookStatusChange';
import { useBooks, useLeadScript, useQueueBook } from '@/features/books/hooks';
import { BOOK_STATUSES, sortBooks, type SortKey, statusCounts, statusLabel } from '@/features/books/logic';
import type { Book, BookStatus } from '@/features/books/types';
import { copy } from '@/i18n/en';
import { colomboToday } from '@/lib/dates';
import { toast } from '@/lib/stores/toast';
import { layout, radius, useTheme } from '@/theme';

type Segment = 'books' | 'movies' | 'shows';
type View_ = 'grid' | 'list' | 'shelf';
type Filter = 'all' | BookStatus;

const VIEWS: { id: View_; icon: IconName }[] = [
  { id: 'grid', icon: 'grid_view' },
  { id: 'list', icon: 'view_list' },
  { id: 'shelf', icon: 'shelves' },
];

// 3 columns, 20dp page gutters, 14dp gaps, equal tile widths: every cell carries 68/3 of padding.
const GRID_CELL = [
  { paddingLeft: 20, paddingRight: 8 / 3 },
  { paddingLeft: 34 / 3, paddingRight: 34 / 3 },
  { paddingLeft: 8 / 3, paddingRight: 20 },
] as const;

/** Library tab (prototype `library`). Books in Phase 2; Movies and Shows arrive in Phase 5. */
export default function Library() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const lead = useLeadScript();
  const books = useBooks();
  const queue = useQueueBook();
  const changeStatus = useBookStatusChange();
  const [segment, setSegment] = useState<Segment>('books');
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View_>('grid');
  const [sort, setSort] = useState<SortKey>('updated');
  const today = colomboToday();

  // Tap the active Library tab: scroll to top (useScrollToTop) and reset the filter.
  const ref = useRef<FlashListRef<Book>>(null);
  useScrollToTop(ref);
  const navigation = useNavigation();
  const focused = useIsFocused();
  useEffect(
    () => navigation.addListener('tabPress' as never, () => focused && setFilter('all')),
    [navigation, focused],
  );

  const all = useMemo(() => books.data ?? [], [books.data]);
  const counts = useMemo(() => statusCounts(all), [all]);
  const shown = useMemo(
    () => sortBooks(filter === 'all' ? all : all.filter((b) => b.status === filter), sort, lead),
    [all, filter, sort, lead],
  );
  const isBooks = segment === 'books';
  const columns = view === 'grid' ? 3 : 1;
  const data = !isBooks || view === 'shelf' ? [] : shown;

  const onStatus = (b: Book, s: BookStatus) => changeStatus(b, s);

  const header = (
    <View>
      <ScreenHeader
        hand={copy.headers.libraryHand}
        title={copy.headers.library}
        trailing={
          <>
            <IconButton
              icon="search"
              label={copy.home.search}
              tone="card"
              onPress={() => toast({ message: copy.errors.notYet })}
            />
            <ScriptToggle />
          </>
        }
      />
      <SegmentedControl
        style={{ marginHorizontal: layout.gutterScreen, marginBottom: 16 }}
        items={[
          { id: 'books', label: copy.library.segments.books },
          { id: 'movies', label: copy.library.segments.movies },
          { id: 'shows', label: copy.library.segments.shows },
        ]}
        value={segment}
        onChange={(s) => {
          setSegment(s);
          setFilter('all');
        }}
      />
      {isBooks && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: layout.gutterScreen, paddingBottom: 16 }}
          >
            <Tag selected={filter === 'all'} onPress={() => setFilter('all')} testID="filter-all">
              {copy.library.all}
            </Tag>
            {BOOK_STATUSES.map((s) => (
              <Tag
                key={s}
                selected={filter === s}
                count={counts[s]}
                onPress={() => setFilter(s)}
                testID={`filter-${s}`}
              >
                {statusLabel(s)}
              </Tag>
            ))}
          </ScrollView>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: layout.gutterScreen,
              paddingBottom: 16,
            }}
          >
            <Select
              variant="inline"
              label={copy.library.sortLabel}
              value={sort}
              onChange={setSort}
              options={(['updated', 'title', 'rating', 'added'] as const).map((k) => ({
                value: k,
                label: copy.library.sort[k],
              }))}
            />
            <View
              style={{
                flexDirection: 'row',
                gap: 4,
                padding: 3,
                backgroundColor: t.surfaceSunk,
                borderRadius: radius.pill,
              }}
            >
              {VIEWS.map((v) => {
                const on = view === v.id;
                return (
                  <Press
                    key={v.id}
                    accessibilityRole="button"
                    accessibilityLabel={copy.library.views[v.id]}
                    accessibilityState={{ selected: on }}
                    hitSlop={7}
                    onPress={() => setView(v.id)}
                    style={{
                      width: 38,
                      height: 34,
                      borderRadius: radius.pill,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? t.surfaceCard : 'transparent',
                    }}
                  >
                    <Icon name={v.icon} size={18} color={on ? 'textAccent' : 'textMuted'} />
                  </Press>
                );
              })}
            </View>
          </View>
        </>
      )}
    </View>
  );

  const empty = !isBooks ? (
    <EmptyState art={<Kiri pose="curled" width={140} />} body={copy.dev.phase(5)} />
  ) : books.isPending ? null : shown.length === 0 ? (
    <View
      style={{
        margin: layout.gutterScreen,
        paddingVertical: 52,
        paddingHorizontal: 28,
        backgroundColor: t.surfacePageWarm,
        borderRadius: radius.xl,
      }}
    >
      <Txt family="hand" weight={400} size="xl" color="textAccent" align="center">
        {copy.library.empty[filter]}
      </Txt>
    </View>
  ) : view === 'shelf' ? (
    <ShelfView books={shown} lead={lead} />
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.surfacePage }}>
      <FlashList
        ref={ref}
        key={`${view}-${columns}`}
        testID="screen-library"
        data={data}
        numColumns={columns}
        keyExtractor={(b) => b.id}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + TAB_SCREEN_BOTTOM }}
        renderItem={({ item, index }) =>
          view === 'grid' ? (
            <View style={{ flex: 1, ...GRID_CELL[index % 3], paddingBottom: 18 }}>
              <BookTile book={item} lead={lead} today={today} />
            </View>
          ) : (
            <View style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 12 }}>
              <BookRow book={item} lead={lead} onStatus={onStatus} onQueue={queue} />
            </View>
          )
        }
      />
    </View>
  );
}
