import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { router, useIsFocused, useNavigation, useScrollToTop } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pinki } from '@/components/calico/Pinki';
import { ScriptToggle } from '@/components/calico/ScriptToggle';
import { Button } from '@/components/ds/Button';
import { QueryError } from '@/components/ds/QueryError';
import { SkeletonGrid, SkeletonRows } from '@/components/ds/Skeleton';
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
import { MediaRow, MediaTile } from '@/features/media/components/MediaTile';
import { useMovies, useShowProgress, useShows } from '@/features/media/hooks';
import { GROUP_BYS, type GroupBy, groupItems, type GroupRow, groupRows } from '@/features/library/logic';
import { DEFAULT_DIR, LIBRARY_SORTS } from '@/features/library/sort';
import {
  type LibraryPrefs,
  type LibraryView,
  readLibraryPrefs,
  saveLibraryPrefs,
  type Segment,
  type SegmentPrefs,
} from '@/features/library/prefs';
import { countBy, MOVIE_STATUSES, SHOW_STATUSES, sortMedia } from '@/features/media/logic';
import type { Media, MediaStatus } from '@/features/media/types';
import { copy } from '@/i18n/en';
import { colomboToday } from '@/lib/dates';
import { layout, radius, useTheme } from '@/theme';

type Filter = 'all' | BookStatus | MediaStatus;
type Row = Book | Media;
type ListRow = Row | GroupRow<Row>;
const isGroupRow = (r: ListRow): r is GroupRow<Row> => 'type' in r && (r.type === 'header' || r.type === 'items');
const save = (next: LibraryPrefs) => {
  saveLibraryPrefs(next);
  return next;
};
const withFilter = (p: LibraryPrefs, filter: string): LibraryPrefs =>
  save({ ...p, [p.segment]: { ...p[p.segment], filter } });
const FILTERS: Record<Segment, readonly string[]> = {
  books: BOOK_STATUSES,
  movies: MOVIE_STATUSES,
  shows: SHOW_STATUSES,
};

const VIEWS: { id: LibraryView; icon: IconName }[] = [
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

/** Library tab (prototype `library`): Books, Movies and Shows segments with status filters and views. */
export default function Library() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const lead = useLeadScript();
  const books = useBooks();
  const queue = useQueueBook();
  const changeStatus = useBookStatusChange();
  const movies = useMovies();
  const shows = useShows();
  const progress = useShowProgress().data;
  // Segment, and per segment its filter, sort, grouping and view: kept across restarts (MMKV).
  const [prefs, setPrefs] = useState(() => readLibraryPrefs(FILTERS));
  const segment = prefs.segment;
  const { sort, dir, view, group } = prefs[segment];
  const filter = prefs[segment].filter as Filter;
  const update = (patch: Partial<SegmentPrefs>) =>
    setPrefs((p) => save({ ...p, [p.segment]: { ...p[p.segment], ...patch } }));
  const setSegment = (s: Segment) => setPrefs((p) => save({ ...p, segment: s }));
  const setFilter = (f: Filter) => setPrefs((p) => withFilter(p, f));
  // A new sort starts in its own natural direction (newest / highest first, titles A→Z).
  const setSort = (k: SortKey) => update({ sort: k, dir: DEFAULT_DIR[k] });
  const flipDir = () => update({ dir: dir === 'asc' ? 'desc' : 'asc' });
  const setView = (v: LibraryView) => update({ view: v });
  const setGroup = (g: GroupBy) => update({ group: g });
  const today = colomboToday();

  // Tap the active Library tab: scroll to top (useScrollToTop) and reset the filter.
  const ref = useRef<FlashListRef<ListRow>>(null);
  useScrollToTop(ref);
  const navigation = useNavigation();
  const focused = useIsFocused();
  useEffect(
    () => navigation.addListener('tabPress' as never, () => focused && setPrefs((p) => withFilter(p, 'all'))),
    [navigation, focused],
  );

  const all = useMemo(() => books.data ?? [], [books.data]);
  const counts = useMemo(() => statusCounts(all), [all]);
  const shown = useMemo(
    () => sortBooks(filter === 'all' ? all : all.filter((b) => b.status === filter), sort, lead, dir),
    [all, filter, sort, lead, dir],
  );
  const isBooks = segment === 'books';
  const media: Media[] = useMemo(
    () => (segment === 'movies' ? (movies.data ?? []) : segment === 'shows' ? (shows.data ?? []) : []),
    [segment, movies.data, shows.data],
  );
  const statuses: readonly Filter[] =
    segment === 'books' ? BOOK_STATUSES : segment === 'movies' ? MOVIE_STATUSES : SHOW_STATUSES;
  const mediaCounts = useMemo(() => countBy(media as { status: string }[], statuses as string[]), [media, statuses]);
  const shownMedia = useMemo(
    () => sortMedia(filter === 'all' ? media : media.filter((m) => m.status === filter), sort, dir),
    [media, filter, sort, dir],
  );
  const progressById = useMemo(() => new Map((progress ?? []).map((p) => [p.itemId, p])), [progress]);
  const pending = isBooks ? books.isPending : segment === 'movies' ? movies.isPending : shows.isPending;
  const layout_ = !isBooks && view === 'shelf' ? 'grid' : view; // no shelf for movies and shows
  const columns = layout_ === 'grid' ? 3 : 1;
  const list: Row[] = isBooks ? shown : shownMedia;
  const shownCount = list.length;
  const groups = useMemo(() => (group === 'none' ? null : groupItems(list, group)), [list, group]);
  // Grouped: a single column of section headers and rows of up to 3 tiles (grid) or 1 row (list).
  const data: ListRow[] =
    isBooks && view === 'shelf' ? [] : groups ? groupRows(groups, layout_ === 'grid' ? 3 : 1) : list;
  const listColumns = groups ? 1 : columns;

  const onStatus = (b: Book, s: BookStatus) => changeStatus(b, s);

  const header = (
    <View>
      <ScreenHeader
        hand={copy.headers.libraryHand}
        title={copy.headers.library}
        trailing={
          <>
            <IconButton icon="search" label={copy.home.search} tone="card" onPress={() => router.push('/search')} />
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
        onChange={setSegment}
      />
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: layout.gutterScreen, paddingBottom: 16 }}
        >
          <Tag selected={filter === 'all'} onPress={() => setFilter('all')} testID="filter-all">
            {copy.library.all}
          </Tag>
          {statuses.map((s) => (
            <Tag
              key={s}
              selected={filter === s}
              count={isBooks ? counts[s as BookStatus] : (mediaCounts[s] ?? 0)}
              onPress={() => setFilter(s)}
              testID={`filter-${s}`}
            >
              {isBooks ? statusLabel(s as BookStatus) : copy.mediaStatus[s as MediaStatus]}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Select
              variant="inline"
              label={copy.library.sortLabel}
              value={sort}
              onChange={setSort}
              testID="library-sort"
              options={LIBRARY_SORTS.map((k) => ({ value: k, label: copy.library.sort[k] }))}
            />
            <Press
              accessibilityRole="button"
              accessibilityLabel={copy.library.dir[sort][dir]}
              accessibilityHint={copy.library.dirHint}
              testID="library-sort-dir"
              onPress={flipDir}
              hitSlop={7}
              style={{
                width: 34,
                height: 34,
                marginLeft: -8,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.surfaceSunk,
              }}
            >
              <Icon
                name="arrow_upward"
                size={18}
                color="textSecondary"
                style={{ transform: [{ rotate: dir === 'asc' ? '0deg' : '180deg' }] }}
              />
            </Press>
            <Select
              variant="inline"
              label={copy.library.groupLabel}
              value={group}
              onChange={setGroup}
              testID="library-group"
              options={GROUP_BYS.map((g) => ({ value: g, label: copy.library.group[g] }))}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: 4,
              padding: 3,
              backgroundColor: t.surfaceSunk,
              borderRadius: radius.pill,
            }}
          >
            {VIEWS.filter((v) => isBooks || v.id !== 'shelf').map((v) => {
              const on = layout_ === v.id;
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
    </View>
  );

  const listQuery = isBooks ? books : segment === 'movies' ? movies : shows;
  const empty =
    listQuery.isError && !listQuery.data ? (
      <QueryError onRetry={() => void listQuery.refetch()} />
    ) : pending ? (
      layout_ === 'grid' ? (
        <SkeletonGrid />
      ) : (
        <SkeletonRows />
      )
    ) : shownCount === 0 ? (
      <View
        style={{
          margin: layout.gutterScreen,
          paddingTop: 30,
          paddingHorizontal: 28,
          paddingBottom: 36,
          backgroundColor: t.surfacePageWarm,
          borderRadius: radius.xl,
          alignItems: 'center',
        }}
        testID="library-empty"
      >
        <Pinki pose="curled" width={214} />
        <Txt family="hand" weight={400} size="xl" color="textAccent" align="center" style={{ marginTop: 10 }}>
          {isBooks
            ? copy.library.empty[filter as keyof typeof copy.library.empty]
            : copy.library.emptyMedia[filter as keyof typeof copy.library.emptyMedia]}
        </Txt>
        {!isBooks && filter === 'all' && (
          <Button
            variant="secondary"
            style={{ alignSelf: 'center', marginTop: 18 }}
            testID="library-search-tmdb"
            onPress={() =>
              router.push({ pathname: '/tmdb', params: { type: segment === 'movies' ? 'movie' : 'show' } })
            }
          >
            {segment === 'movies' ? copy.library.addMovie : copy.library.addShow}
          </Button>
        )}
      </View>
    ) : isBooks && view === 'shelf' ? (
      groups ? (
        <View>
          {groups.map((g) => (
            <View key={g.key}>
              <GroupHeader title={g.title} count={g.items.length} />
              <ShelfView books={g.items as Book[]} lead={lead} />
            </View>
          ))}
        </View>
      ) : (
        <ShelfView books={shown} lead={lead} />
      )
    ) : null;

  const tile = (item: Row, cell: number) => (
    <View key={item.id} style={{ flex: 1, ...GRID_CELL[cell], paddingBottom: 18 }}>
      {'kind' in item ? (
        <MediaTile item={item} progress={progressById.get(item.id)} />
      ) : (
        <BookTile book={item} lead={lead} today={today} />
      )}
    </View>
  );
  const row = (item: Row) => (
    <View key={item.id} style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 12 }}>
      {'kind' in item ? (
        <MediaRow item={item} progress={progressById.get(item.id)} />
      ) : (
        <BookRow book={item} lead={lead} onStatus={onStatus} onQueue={queue} />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.surfacePage }}>
      <FlashList
        ref={ref}
        // A new order redraws the list from the top.
        key={`${segment}-${layout_}-${listColumns}-${group}-${sort}-${dir}`}
        testID="screen-library"
        data={data}
        numColumns={listColumns}
        keyExtractor={(r) => (isGroupRow(r) ? r.key : r.id)}
        getItemType={(r) => (isGroupRow(r) ? r.type : `${segment}-${layout_}`)}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + TAB_SCREEN_BOTTOM }}
        renderItem={({ item, index }) => {
          if (isGroupRow(item)) {
            if (item.type === 'header') return <GroupHeader title={item.title} count={item.count} />;
            return layout_ === 'grid' ? (
              <View style={{ flexDirection: 'row' }}>
                {[0, 1, 2].map((i) => (item.items[i] ? tile(item.items[i]!, i) : <View key={i} style={{ flex: 1 }} />))}
              </View>
            ) : (
              row(item.items[0]!)
            );
          }
          return layout_ === 'grid' ? tile(item, index % 3) : row(item);
        }}
      />
    </View>
  );
}

/** A section title in a grouped Library: "2025 · 14". */
function GroupHeader({ title, count }: { title: string; count: number }) {
  return (
    <Txt
      family="display"
      weight={700}
      size={20}
      accessibilityRole="header"
      testID={`group-${title}`}
      style={{ paddingHorizontal: layout.gutterScreen, paddingTop: 6, paddingBottom: 12 }}
    >
      {copy.library.groupHeader(title, count)}
    </Txt>
  );
}
