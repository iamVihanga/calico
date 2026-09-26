import type { TmdbSearchResult } from '@shared/tmdb.ts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Poster } from '@/components/calico/Poster';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { SearchField } from '@/components/ds/SearchField';
import { SegmentedControl } from '@/components/ds/SegmentedControl';
import { Txt } from '@/components/ds/Txt';
import { useAddFromTmdb } from '@/features/media/add';
import { searchTmdb } from '@/features/media/api';
import { mediaHref } from '@/features/media/components/MediaTile';
import { useMovies, useShows } from '@/features/media/hooks';
import type { Media } from '@/features/media/types';
import { copy } from '@/i18n/en';
import { qk } from '@/lib/queryKeys';
import { storage, storageKeys } from '@/lib/storage';
import { openSheet } from '@/lib/stores/sheet';
import { useDebounced } from '@/lib/useDebounced';
import { layout, radius, shadow, useTheme } from '@/theme';

type Kind = 'movie' | 'show';
const MIN_CHARS = 2;
const RECENT_MAX = 5;

const readRecent = (): string[] => {
  try {
    return JSON.parse(storage.getString(storageKeys.recentTmdb) ?? '[]') as string[];
  } catch {
    return [];
  }
};
const remember = (q: string) => {
  const list = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_MAX);
  storage.set(storageKeys.recentTmdb, JSON.stringify(list));
};

/** TMDB search (prototype `tmdb`, plan §11.11): Movies / Shows, quick add, preview on tap. */
export default function TmdbSearch() {
  const params = useLocalSearchParams<{ type?: Kind; q?: string }>();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<Kind>(params.type === 'show' ? 'show' : 'movie');
  const [text, setText] = useState(params.q ?? '');
  const [recent] = useState(readRecent);
  const [adding, setAdding] = useState<number | null>(null);
  const q = useDebounced(text.trim(), 300);
  const addFromTmdb = useAddFromTmdb();

  const search = useQuery({
    queryKey: qk.tmdbSearch(kind, q),
    queryFn: () => searchTmdb(kind, q),
    enabled: q.length >= MIN_CHARS,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });

  // Rows for titles already in the library show "Added" from the local cache.
  const movies = useMovies().data;
  const shows = useShows().data;
  const owned = useMemo(() => {
    const m = new Map<string, Media>();
    for (const x of [...(movies ?? []), ...(shows ?? [])]) m.set(`${x.kind}:${x.tmdbId}`, x);
    return m;
  }, [movies, shows]);

  const results = q.length >= MIN_CHARS ? (search.data?.results ?? []) : [];
  const emptyCopy =
    q.length < MIN_CHARS ? copy.tmdb.typeMore : search.isFetched && !search.isFetching ? copy.tmdb.nothing(q) : null;

  const quickAdd = async (r: TmdbSearchResult) => {
    setAdding(r.tmdbId);
    remember(q);
    await addFromTmdb(r, 'watchlist');
    setAdding(null);
  };
  const preview = (r: TmdbSearchResult) => {
    remember(q);
    openSheet('tmdbPreview', {
      tmdbId: r.tmdbId,
      kind: r.kind,
      title: r.title,
      year: r.year,
      posterPath: r.posterPath,
      overview: r.overview,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.surfacePage }} testID="screen-tmdb">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingTop: insets.top + 10,
          paddingHorizontal: 14,
        }}
      >
        <IconButton icon="arrow_back" label={copy.books.back} onPress={() => router.back()} />
        <SearchField
          value={text}
          onChange={setText}
          onClear={() => setText('')}
          placeholder={copy.tmdb.placeholder}
          autoFocus={!params.q}
          returnKeyType="search"
          testID="tmdb-query"
          style={{ flex: 1 }}
        />
      </View>
      <SegmentedControl
        style={{ marginHorizontal: layout.gutterScreen, marginTop: 14, marginBottom: 14 }}
        items={(['movie', 'show'] as const).map((k) => ({ id: k, label: copy.tmdb.tabs[k] }))}
        value={kind}
        onChange={setKind}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {text.trim().length < MIN_CHARS && recent.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 8, paddingHorizontal: layout.gutterScreen, paddingBottom: 16 }}
            accessibilityLabel={copy.tmdb.recent}
          >
            {recent.map((r) => (
              <Press
                key={r}
                accessibilityRole="button"
                onPress={() => setText(r)}
                style={{
                  minHeight: 38,
                  justifyContent: 'center',
                  paddingHorizontal: 15,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: t.borderStrong,
                }}
                hitSlop={5}
              >
                <Txt family="ui" weight={600} size="xs" color="textSecondary">
                  {r}
                </Txt>
              </Press>
            ))}
          </ScrollView>
        )}

        {results.length === 0 && emptyCopy && (
          <View
            style={{
              marginHorizontal: layout.gutterScreen,
              marginVertical: 8,
              paddingVertical: 44,
              paddingHorizontal: 26,
              backgroundColor: t.surfacePageWarm,
              borderRadius: radius.xl,
            }}
          >
            <Txt family="hand" weight={400} size="xl" color="textMuted" align="center">
              {emptyCopy}
            </Txt>
          </View>
        )}
        {search.isError && q.length >= MIN_CHARS && (
          <Txt family="ui" size="xs" color="statusDanger" align="center" style={{ padding: 16 }}>
            {copy.tmdb.failed}
          </Txt>
        )}

        <View style={{ gap: 12, paddingHorizontal: layout.gutterScreen }}>
          {results.map((r) => {
            const have = owned.get(`${r.kind}:${r.tmdbId}`);
            const busy = adding === r.tmdbId;
            return (
              <Press
                key={r.tmdbId}
                accessibilityRole="button"
                accessibilityLabel={`${r.title}, ${r.kind === 'movie' ? copy.tmdb.metaMovie(r.year) : copy.tmdb.metaShow(r.year)}`}
                testID={`tmdb-result-${r.tmdbId}`}
                onPress={() => (have ? router.push(mediaHref(have)) : preview(r))}
                scaleTo={0.99}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  backgroundColor: t.surfaceCard,
                  borderRadius: radius.lg,
                  boxShadow: shadow.sm,
                }}
              >
                <Poster
                  item={{ id: String(r.tmdbId), title: r.title, posterPath: r.posterPath }}
                  kind={r.kind}
                  titleSize={8}
                  style={{ width: 50, paddingVertical: 5, paddingHorizontal: 4 }}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt family="display" weight={700} size={17} leading={1.2} numberOfLines={1}>
                    {r.title}
                  </Txt>
                  <Txt family="ui" size="2xs" color="textMuted" style={{ marginTop: 3 }}>
                    {r.kind === 'movie' ? copy.tmdb.metaMovie(r.year) : copy.tmdb.metaShow(r.year)}
                  </Txt>
                </View>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel={have ? copy.tmdb.addedA11y(r.title) : copy.tmdb.add(r.title)}
                  accessibilityHint={have ? undefined : copy.tmdb.addHint}
                  accessibilityState={{ disabled: !!have || busy }}
                  testID={`tmdb-add-${r.tmdbId}`}
                  disabled={!!have || busy}
                  onPress={() => void quickAdd(r)}
                  onLongPress={() => preview(r)}
                  style={{
                    minWidth: 48,
                    height: 48,
                    paddingHorizontal: 12,
                    borderRadius: radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: have ? t.statusSuccessSoft : t.accentPrimary,
                  }}
                >
                  {busy ? (
                    <ActivityIndicator color={t.textOnAccent} />
                  ) : have ? (
                    <Icon name="check" size={20} tint={t.statusSuccess} />
                  ) : (
                    <Icon name="add" size={22} tint={t.textOnAccent} />
                  )}
                </Press>
              </Press>
            );
          })}
        </View>
        <Txt family="hand" weight={400} size={17} color="textMuted" style={{ padding: 22 }}>
          {copy.tmdb.attribution}
        </Txt>
      </ScrollView>
    </View>
  );
}
