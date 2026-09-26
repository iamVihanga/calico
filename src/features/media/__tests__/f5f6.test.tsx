import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { State } from 'react-native-gesture-handler';

import { copy } from '@/i18n/en';
import { addLocalDays, colomboToday } from '@/lib/dates';
import { queryClient } from '@/lib/queryClient';
import { useSheetStore } from '@/lib/stores/sheet';
import { useToastStore } from '@/lib/stores/toast';
import { cleanupAppState } from '@/test/cleanup';

import type { Episode, EpisodeRef, Movie, Show } from '../types';

const today = colomboToday();
const ep = (season: number, episode: number, name: string, daysAgo: number | null): Episode => ({
  season,
  episode,
  name,
  airDate: daysAgo === null ? null : addLocalDays(today, -daysAgo),
  stillPath: null,
  voteAverage: 8.1,
  runtimeMin: 60,
});
const mockHotdEps: Episode[] = [
  ...Array.from({ length: 10 }, (_, i) => ep(1, i + 1, `S1 episode ${i + 1}`, 900 - i * 7)),
  ...[
    'A Son for a Son',
    'Rhaenyra the Cruel',
    'The Burning Mill',
    'The Red Dragon and the Gold',
    'Regent',
    'Smallfolk',
    'The Red Sowing',
    'The Queen Who Ever Was',
  ].map((name, i) => ep(2, i + 1, name, 200 - i * 7)),
  ep(3, 1, 'TBA', null),
];

/** A tiny in-memory "server" behind the mocked media API. */
const mockDb = {
  shows: [] as Show[],
  movies: [] as Movie[],
  watches: new Map<string, EpisodeRef[]>(),
};
const mockCalls = { add: jest.fn(), collection: jest.fn(), viewing: jest.fn() };

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
        cb('INITIAL_SESSION', { user: { id: 'u', email: 'dilan@calico.test' } });
        return { data: { subscription: { unsubscribe: () => undefined } } };
      },
    },
  },
  currentUserId: async () => 'u',
}));
jest.mock('@/features/profile/api', () => ({
  fetchProfile: async () => ({
    id: 'u',
    display_name: 'Dilan Kumara',
    theme: 'day',
    lead_script: 'en',
    include_specials: false,
  }),
  updateProfile: async () => undefined,
}));
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  fetchBooks: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
}));
jest.mock('@/features/media/api', () => {
  const actual = jest.requireActual('@/features/media/api');
  const logic = jest.requireActual('@/features/media/logic');
  const { colomboToday: todayFn } = jest.requireActual('@/lib/dates');
  const hotd = {
    tmdbId: 94997,
    kind: 'show',
    title: 'House of the Dragon',
    year: 2022,
    posterPath: null,
    backdropPath: null,
    overview: 'The Targaryen civil war.',
    tmdbStatus: 'Returning Series',
    network: 'HBO',
    numberOfSeasons: 3,
    nextEpisodeToAir: null,
    lastEpisodeToAir: null,
    seasons: [],
  };
  const it2017 = {
    tmdbId: 346364,
    kind: 'movie',
    title: 'IT',
    year: 2017,
    posterPath: null,
    backdropPath: null,
    overview: 'Derry.',
    runtimeMin: 135,
    genres: ['Horror'],
    collection: { id: 477962, name: 'IT Collection' },
  };
  const it2 = { ...it2017, tmdbId: 474350, title: 'IT Chapter Two', year: 2019, runtimeMin: 169 };
  const watchesOf = (id: string) => mockDb.watches.get(id) ?? [];
  return {
    ...actual,
    searchTmdb: async (type: string) => ({
      results: type === 'show' ? [{ ...hotd }] : [{ ...it2017 }],
      page: 1,
      totalPages: 1,
    }),
    tmdbShow: async () => hotd,
    tmdbMovie: async (id: number) => (id === it2.tmdbId ? it2 : it2017),
    tmdbCollection: async () => ({ id: 477962, name: 'IT Collection', parts: [it2017, it2] }),
    fetchShows: async () => mockDb.shows,
    fetchMovies: async () => mockDb.movies,
    fetchEpisodes: async () => mockHotdEps,
    fetchWatches: async (id: string) => watchesOf(id),
    fetchShowProgress: async () =>
      mockDb.shows.map((s) => {
        const p = logic.progressOf(mockHotdEps, logic.watchSet(watchesOf(s.id)), todayFn(), false);
        return {
          itemId: s.id,
          aired: p.aired,
          watched: p.watched,
          total: p.total,
          next: p.next && { season: p.next.season, episode: p.next.episode, name: p.next.name, stillPath: null },
          caughtUp: p.caughtUp,
          nextAirDate: null,
          tmdbStatus: s.tmdbStatus,
        };
      }),
    fetchCollectionPositions: async () => [],
    addTmdbItem: async (v: { id: string; kind: string; title: string; tmdbId: number; status: string }) => {
      mockCalls.add(v);
      const base = {
        id: v.id,
        title: v.title,
        tmdbId: v.tmdbId,
        titleNative: null,
        posterPath: null,
        backdropPath: null,
      };
      const common = {
        ...base,
        rating: null,
        note: null,
        startedAt: null,
        finishedAt: null,
        overview: null,
        year: null,
      };
      const stamp = { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (v.kind === 'show') {
        mockDb.shows.push({
          ...common,
          ...stamp,
          kind: 'show',
          status: v.status as Show['status'],
          network: 'HBO',
          tmdbStatus: 'Returning Series',
          numberOfSeasons: 3,
          nextAirDate: null,
          nextSeason: null,
          nextEpisode: null,
          lastSyncedAt: null,
        });
      } else {
        mockDb.movies.push({
          ...common,
          ...stamp,
          kind: 'movie',
          status: v.status as Movie['status'],
          runtimeMin: 135,
          genres: ['Horror'],
          collection: null,
          viewings: [],
        });
      }
    },
    markEpisodes: async (v: { itemId: string; season: number; episodes: number[]; watched: boolean }) => {
      const rest = watchesOf(v.itemId).filter((w) => !(w.season === v.season && v.episodes.includes(w.episode)));
      mockDb.watches.set(
        v.itemId,
        v.watched ? [...rest, ...v.episodes.map((e) => ({ season: v.season, episode: e }))] : rest,
      );
      const s = mockDb.shows.find((x) => x.id === v.itemId);
      if (s && v.watched && s.status === 'watchlist') s.status = 'watching';
    },
    markSeason: async (v: { itemId: string; season: number; episodes: number[] }) => {
      mockDb.watches.set(v.itemId, [
        ...watchesOf(v.itemId),
        ...v.episodes.map((e) => ({ season: v.season, episode: e })),
      ]);
      const s = mockDb.shows.find((x) => x.id === v.itemId);
      if (s && s.status === 'watchlist') s.status = 'watching';
    },
    logViewing: async (v: { id: string; itemId: string; on: string; rating: number | null; note: string | null }) => {
      mockCalls.viewing(v);
      const m = mockDb.movies.find((x) => x.id === v.itemId)!;
      m.viewings = [{ id: v.id, watchedOn: v.on, rating: v.rating, note: v.note }, ...m.viewings];
      m.status = 'watched';
    },
    createCollection: async (v: unknown) => mockCalls.collection(v),
  };
});

const reset = () => {
  mockDb.shows = [];
  mockDb.movies = [];
  mockDb.watches = new Map();
  jest.clearAllMocks();
  queryClient.clear();
  useToastStore.getState().hide();
  useSheetStore.getState().close();
};

/** Tap the n-th square of a season (tests have no layout width, so the grid is one square wide). */
const tapSquare = (season: number, episode: number) =>
  act(() =>
    fireGestureHandler(getByGestureTestId(`tap-${season}`), [
      { state: State.BEGAN, x: 10, y: (episode - 1) * 43 + 10 },
      { state: State.ACTIVE, x: 10, y: (episode - 1) * 43 + 10 },
      { state: State.END, x: 10, y: (episode - 1) * 43 + 10 },
    ]),
  );

describe('F5: add a show and watch the next episode', () => {
  beforeEach(reset);
  afterAll(cleanupAppState);

  it('search → preview → already watched → fill S1 → tap S2 E1–E4 → Home ticks S2 E5', async () => {
    await renderRouter('./app', { initialUrl: '/tmdb?type=show' });
    await fireEvent.changeText(await screen.findByTestId('tmdb-query'), 'house of the dragon');
    await fireEvent.press(await screen.findByTestId('tmdb-result-94997', {}, { timeout: 3000 }));
    const watched = await screen.findByTestId('preview-watched');
    await act(async () => {
      await fireEvent.press(watched);
    });
    await waitFor(() =>
      expect(mockCalls.add).toHaveBeenCalledWith(expect.objectContaining({ kind: 'show', status: 'watchlist' })),
    );
    expect(await screen.findByTestId('screen-show')).toBeTruthy();
    expect(await screen.findByTestId('grid-1')).toBeTruthy();

    // Hold on Season 1 (the accessibility action is the same fill).
    await act(async () => {
      fireEvent(screen.getByLabelText(copy.shows.expand('Season 1')), 'accessibilityAction', {
        nativeEvent: { actionName: 'fill' },
      });
    });
    expect(await screen.findByText(copy.shows.seasonMarked('Season 1'))).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('next-code')).toHaveTextContent('S2 E1'));

    for (const e of [1, 2, 3, 4]) await tapSquare(2, e);
    await waitFor(() => expect(screen.getByTestId('next-code')).toHaveTextContent('S2 E5'));
    expect(screen.getByTestId('episode-count')).toHaveTextContent(copy.shows.episodeCount(14, 19));

    await act(async () => router.navigate('/'));
    const id = mockDb.shows[0]!.id;
    await waitFor(() => expect(screen.getByTestId(`watching-ep-${id}`)).toHaveTextContent('S2 E5  Regent'));
    await act(async () => {
      await fireEvent.press(screen.getByTestId(`watching-tick-${id}`));
    });
    await waitFor(() => expect(screen.getByTestId(`watching-ep-${id}`)).toHaveTextContent('S2 E6  Smallfolk'));
    expect(screen.getByText(copy.shows.marked('S2 E5'))).toBeTruthy();
  });
});

describe('F6: movie rewatch, and the franchise offer', () => {
  beforeEach(reset);
  afterAll(cleanupAppState);

  it('quick add IT offers the rest of the series and creates the collection', async () => {
    await renderRouter('./app', { initialUrl: '/tmdb?type=movie' });
    await fireEvent.changeText(await screen.findByTestId('tmdb-query'), 'it');
    const add = await screen.findByTestId('tmdb-add-346364', {}, { timeout: 3000 });
    await act(async () => {
      await fireEvent.press(add);
    });
    expect(await screen.findByText(copy.tmdb.franchise('IT', 2, 1))).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('franchise-add'));
    });
    await waitFor(() => expect(mockCalls.collection).toHaveBeenCalled());
    const titles = mockCalls.add.mock.calls.map((c) => (c[0] as { title: string }).title);
    expect(titles).toEqual(['IT', 'IT Chapter Two']);
    const col = mockCalls.collection.mock.calls[0]![0] as { name: string; items: string[] };
    expect(col.name).toBe('IT Collection');
    expect(col.items).toEqual(mockDb.movies.map((m) => m.id));
  });

  it('Library → Movies → IT → Watched it again → 4 stars, "Still scary." → three stubs', async () => {
    mockDb.movies = [
      {
        id: 'it',
        kind: 'movie',
        status: 'watched',
        title: 'IT',
        titleNative: null,
        posterPath: null,
        backdropPath: null,
        rating: 4,
        note: null,
        startedAt: null,
        finishedAt: '2023-10-31',
        createdAt: '2023-10-31T00:00:00Z',
        updatedAt: '2023-10-31T00:00:00Z',
        tmdbId: 346364,
        overview: null,
        year: 2017,
        runtimeMin: 135,
        genres: ['Horror'],
        collection: null,
        viewings: [
          { id: 'v2', watchedOn: '2023-10-31', rating: 4, note: 'Halloween rewatch.' },
          { id: 'v1', watchedOn: '2017-09-22', rating: 5, note: 'Saw it at Savoy.' },
        ],
      },
    ];
    await renderRouter('./app', { initialUrl: '/library' });
    await fireEvent.press(await screen.findByText(copy.library.segments.movies));
    await fireEvent.press(await screen.findByTestId('media-tile-it'));
    expect(await screen.findByTestId('watch-count')).toHaveTextContent(copy.movies.watchCount(2));

    await act(async () => {
      await fireEvent.press(screen.getByTestId('watch-again'));
    });
    await fireEvent.press(await screen.findByLabelText(copy.finish.star(4)), { nativeEvent: { locationX: 40 } });
    await fireEvent.changeText(screen.getByTestId('viewing-note'), 'Still scary.');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('viewing-save'));
    });
    await waitFor(() =>
      expect(mockCalls.viewing).toHaveBeenCalledWith(
        expect.objectContaining({ itemId: 'it', rating: 4, note: 'Still scary.', on: today }),
      ),
    );
    await waitFor(() => expect(screen.getByTestId('watch-count')).toHaveTextContent(copy.movies.watchCount(3)));
    expect(screen.getByText('Still scary.')).toBeTruthy();
  });
});
