import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { addLocalDays, colomboToday } from '@/lib/dates';
import { queryClient } from '@/lib/queryClient';
import { useSheetStore } from '@/lib/stores/sheet';
import { useToastStore } from '@/lib/stores/toast';
import { cleanupAppState } from '@/test/cleanup';

const mockInTwoDays = addLocalDays(colomboToday(), 2);
const mockHeld = new Set<string>();
const mockShow = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  id,
  kind: 'show',
  status: 'watching',
  title,
  titleNative: null,
  posterPath: null,
  backdropPath: null,
  rating: null,
  note: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '',
  updatedAt: '',
  tmdbId: 1,
  overview: null,
  year: 2005,
  network: null,
  tmdbStatus: 'Returning Series',
  numberOfSeasons: 5,
  nextAirDate: null,
  nextSeason: null,
  nextEpisode: null,
  lastSyncedAt: null,
  onHold: mockHeld.has(id),
  ...over,
});
const mockRow = (itemId: string, behind: boolean) => ({
  itemId,
  aired: 20,
  watched: behind ? 10 : 20,
  total: 20,
  next: behind ? { season: 1, episode: 11, name: 'Next one', stillPath: null } : null,
  caughtUp: !behind,
  nextAirDate: null,
  tmdbStatus: null,
});
const mockSetOnHold = jest.fn(async (v: { itemId: string; on: boolean }) => {
  if (v.on) mockHeld.add(v.itemId);
  else mockHeld.delete(v.itemId);
});

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
    watch_nudges: false,
  }),
  updateProfile: async () => undefined,
}));
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  fetchBooks: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
}));
jest.mock('@/features/media/api', () => ({
  ...jest.requireActual('@/features/media/api'),
  fetchMovies: async () => [],
  fetchShows: async () => [
    mockShow('sn', 'Supernatural'),
    mockShow('sev', 'Severance', {
      nextAirDate: mockInTwoDays,
      nextSeason: 3,
      nextEpisode: 1,
      network: 'Apple TV+',
    }),
    mockShow('tlou', 'The Last of Us'),
    mockShow('done', 'Fleabag', { tmdbStatus: 'Ended' }),
  ],
  fetchShowProgress: async () => [
    mockRow('sn', true),
    mockRow('sev', false),
    mockRow('tlou', false),
    mockRow('done', false),
  ],
  fetchEpisodes: async () =>
    Array.from({ length: 20 }, (_, i) => ({
      season: 1,
      episode: i + 1,
      name: i === 10 ? 'Next one' : `Episode ${i + 1}`,
      airDate: '2020-01-01',
      stillPath: null,
      voteAverage: null,
      runtimeMin: 45,
      overview: '',
    })),
  fetchWatches: async () => Array.from({ length: 10 }, (_, i) => ({ season: 1, episode: i + 1 })),
  fetchWatchSessions: async () => [],
  setShowOnHold: (v: { itemId: string; on: boolean }) => mockSetOnHold(v),
  markEpisodes: async (v: { itemId: string; watched: boolean }) => {
    if (v.watched) mockHeld.delete(v.itemId); // like SQL mark_episodes
  },
}));

describe('Continue watching: Upcoming and On hold', () => {
  beforeEach(() => {
    queryClient.clear();
    mockHeld.clear();
    mockSetOnHold.mockClear();
    useSheetStore.getState().close();
    useToastStore.getState().hide();
  });
  afterAll(cleanupAppState);

  it('caught-up shows sit behind a link: the sheet lists dated ones with a countdown, then "No date yet"', async () => {
    await renderRouter('./app', { initialUrl: '/' });
    const link = await screen.findByTestId('watching-upcoming');
    expect(link).toHaveTextContent(copy.upcoming.link(1, 1), { exact: false });
    expect(link).toHaveTextContent('Next: Severance, in 2 days', { exact: false });
    expect(screen.queryByText(/caught up/)).toBeNull();

    await fireEvent.press(link);
    expect(await screen.findByTestId('upcoming-sheet')).toBeTruthy();
    expect(screen.getByTestId('upcoming-when-sev')).toHaveTextContent('In 2 days');
    expect(screen.getByTestId('upcoming-sev')).toHaveTextContent('S3 E1', { exact: false });
    expect(screen.getByText(copy.upcoming.noDate)).toBeTruthy();
    expect(screen.getByTestId('upcoming-undated-tlou')).toBeTruthy();
    expect(screen.queryByTestId('upcoming-undated-done')).toBeNull(); // ended: nothing more to come
  });

  it('put on hold from the episode sheet, then back from the On hold list', async () => {
    await renderRouter('./app', { initialUrl: '/' });
    await fireEvent.press(await screen.findByTestId('watching-open-sn'));
    const hold = await screen.findByTestId('episode-on-hold');
    expect(hold).toHaveTextContent(copy.onHold.put);
    await act(async () => {
      await fireEvent.press(hold);
    });
    expect(mockSetOnHold).toHaveBeenCalledWith({ itemId: 'sn', on: true });
    await waitFor(() => expect(screen.queryByTestId('watching-sn')).toBeNull());
    expect(useToastStore.getState().toast?.message).toBe(copy.onHold.putDone('Supernatural'));

    const chip = await screen.findByTestId('watching-on-hold');
    expect(chip).toHaveTextContent(copy.onHold.link(1));
    await fireEvent.press(chip);
    expect(await screen.findByTestId('on-hold-sn')).toHaveTextContent('S1 E11', { exact: false });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('on-hold-back-sn'));
    });
    expect(mockSetOnHold).toHaveBeenLastCalledWith({ itemId: 'sn', on: false });
    expect(await screen.findByTestId('watching-sn')).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId('watching-on-hold')).toBeNull());
  });

  it('ticking an episode of a show on hold brings it back, and says so', async () => {
    mockHeld.add('sn');
    await renderRouter('./app', { initialUrl: '/' });
    await fireEvent.press(await screen.findByTestId('watching-on-hold'));
    await fireEvent.press(await screen.findByTestId('on-hold-open-sn'));
    const mark = await screen.findByTestId('episode-mark');
    await act(async () => {
      await fireEvent.press(mark);
    });
    expect(await screen.findByTestId('watching-sn')).toBeTruthy();
    const { toast, queue } = useToastStore.getState();
    expect([toast, ...queue].map((t) => t?.message)).toContain(copy.onHold.backDone('Supernatural'));
  });
});
