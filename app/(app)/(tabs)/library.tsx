import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { router, useIsFocused, useNavigation, useScrollToTop } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScriptToggle } from '@/components/calico/ScriptToggle';
import { Button } from '@/components/ds/Button';
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
import { countBy, MOVIE_STATUSES, SHOW_STATUSES, sortMedia } from '@/features/media/logic';
import type { Media, MediaStatus } from '@/features/media/types';
import { copy } from '@/i18n/en';
import { colomboToday } from '@/lib/dates';
import { toast } from '@/lib/stores/toast';
import { layout, radius, useTheme } from '@/theme';

type Segment = 'books' | 'movies' | 'shows';
type View_ = 'grid' | 'list' | 'shelf';
type Filter = 'all' | BookStatus | MediaStatus;
type Row = Book | Media;

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
  const [segment, setSegment] = useState<Segment>('books');
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View_>('grid');
  const [sort, setSort] = useState<SortKey>('updated');
  const today = colomboToday();

  // Tap the active Library tab: scroll to top (useScrollToTop) and reset the filter.
  const ref = useRef<FlashListRef<Row>>(null);
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
  const media: Media[] = useMemo(
    () => (segment === 'movies' ? (movies.data ?? []) : segment === 'shows' ? (shows.data ?? []) : []),
    [segment, movies.data, shows.data],
  );
  const statuses: readonly Filter[] =
    segment === 'books' ? BOOK_STATUSES : segment === 'movies' ? MOVIE_STATUSES : SHOW_STATUSES;
  const mediaCounts = useMemo(() => countBy(media as { status: string }[], statuses as string[]), [media, statuses]);
  const shownMedia = useMemo(
    () => sortMedia(filter === 'all' ? media : media.filter((m) => m.status === filter), sort),
    [media, filter, sort],
  );
  const progressById = useMemo(() => new Map((progress ?? []).map((p) => [p.itemId, p])), [progress]);
  const pending = isBooks ? books.isPending : segment === 'movies' ? movies.isPending : shows.isPending;
  const layout_ = !isBooks && view === 'shelf' ? 'grid' : view; // no shelf for movies and shows
  const columns = layout_ === 'grid' ? 3 : 1;
  const data: Row[] = isBooks ? (view === 'shelf' ? [] : shown) : shownMedia;
  const shownCount = isBooks ? shown.length : shownMedia.length;

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

  const empty = pending ? null : shownCount === 0 ? (
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
        {isBooks
          ? copy.library.empty[filter as keyof typeof copy.library.empty]
          : copy.library.emptyMedia[filter as keyof typeof copy.library.emptyMedia]}
      </Txt>
      {!isBooks && filter === 'all' && (
        <Button
          variant="secondary"
          style={{ alignSelf: 'center', marginTop: 18 }}
          testID="library-search-tmdb"
          onPress={() => router.push({ pathname: '/tmdb', params: { type: segment === 'movies' ? 'movie' : 'show' } })}
        >
          {segment === 'movies' ? copy.library.addMovie : copy.library.addShow}
        </Button>
      )}
    </View>
  ) : isBooks && view === 'shelf' ? (
    <ShelfView books={shown} lead={lead} />
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.surfacePage }}>
      <FlashList
        ref={ref}
        key={`${segment}-${layout_}-${columns}`}
        testID="screen-library"
        data={data}
        numColumns={columns}
        keyExtractor={(b) => b.id}
        getItemType={() => `${segment}-${layout_}`}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + TAB_SCREEN_BOTTOM }}
        renderItem={({ item, index }) =>
          layout_ === 'grid' ? (
            <View style={{ flex: 1, ...GRID_CELL[index % 3], paddingBottom: 18 }}>
              {'kind' in item ? (
                <MediaTile item={item} progress={progressById.get(item.id)} />
              ) : (
                <BookTile book={item} lead={lead} today={today} />
              )}
            </View>
          ) : (
            <View style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 12 }}>
              {'kind' in item ? (
                <MediaRow item={item} progress={progressById.get(item.id)} />
              ) : (
                <BookRow book={item} lead={lead} onStatus={onStatus} onQueue={queue} />
              )}
            </View>
          )
        }
      />
    </View>
  );
}
