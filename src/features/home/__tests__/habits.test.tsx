import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { queryClient } from '@/lib/queryClient';
import { useSheetStore } from '@/lib/stores/sheet';
import { storage, storageKeys } from '@/lib/storage';
import { cleanupAppState } from '@/test/cleanup';

const at = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00+05:30`).toISOString();
const before = ['2026-10-04', '2026-10-03', '2026-10-02', '2026-10-01', '2026-09-30', '2026-09-29'];
const mockSessions = [
  ...before.map((d) => ({ itemId: 'sn', at: at(d, '20:00') })), // Supernatural in the evening
  ...before.map((d) => ({ itemId: 'ahs', at: at(d, '07:30') })), // AHS in the morning
];
const show = (id: string, title: string) => ({
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
  tmdbId: id === 'sn' ? 1 : 2,
  overview: null,
  year: 2005,
  network: null,
  tmdbStatus: 'Ended',
  numberOfSeasons: 5,
  nextAirDate: null,
  nextSeason: null,
  nextEpisode: null,
  lastSyncedAt: null,
});
const mockUpdateProfile = jest.fn(async (_patch: unknown) => undefined);
// The app's clock for habits (Home order, the hint, the offer).
let mockNow = new Date('2026-10-05T20:15:00+05:30');
jest.mock('@/lib/useHourNow', () => ({ useHourNow: () => mockNow }));

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
  updateProfile: (p: unknown) => mockUpdateProfile(p),
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
  fetchShows: async () => [show('ahs', 'American Horror Story'), show('sn', 'Supernatural')],
  fetchShowProgress: async () =>
    ['sn', 'ahs'].map((itemId) => ({
      itemId,
      aired: 20,
      watched: 10,
      total: 20,
      next: { season: 1, episode: 11, name: 'Next one', stillPath: null },
      caughtUp: false,
      nextAirDate: null,
      tmdbStatus: 'Ended',
    })),
  // 20 aired episodes, the first 10 watched: next is S1 E11.
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
  fetchWatchSessions: async () => mockSessions,
}));

const order = () =>
  screen
    .getAllByTestId(/^watching-(sn|ahs)$/)
    .map((n) => (n.props as { testID: string }).testID.replace('watching-', ''));

describe('Continue watching follows your watching times', () => {
  beforeEach(() => {
    queryClient.clear();
    useSheetStore.getState().close();
    mockUpdateProfile.mockClear();
  });
  afterAll(cleanupAppState);

  it('the evening show comes first in the evening, with a hint, and the morning show in the morning', async () => {
    mockNow = new Date('2026-10-05T20:15:00+05:30');
    await renderRouter('./app', { initialUrl: '/' });
    await waitFor(() => expect(order()).toEqual(['sn', 'ahs']));
    expect(screen.getByTestId('watching-usual')).toHaveTextContent(copy.habits.usual('Supernatural', '8 pm'));
    cleanupAppState();

    mockNow = new Date('2026-10-05T07:40:00+05:30');
    await renderRouter('./app', { initialUrl: '/' });
    await waitFor(() => expect(order()).toEqual(['ahs', 'sn']));
    expect(screen.getByTestId('watching-usual')).toHaveTextContent(
      copy.habits.usual('American Horror Story', '7:30 am'),
    );
  });

  it('offers a nudge once a habit shows; yes goes through the explainer and turns nudges on', async () => {
    mockNow = new Date('2026-10-05T12:00:00+05:30');
    storage.set(storageKeys.nudgeOffer, false);
    await renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByTestId('nudge-offer')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('nudge-offer-yes'));
    });
    expect(await screen.findByText(copy.nudges.askTitle)).toBeTruthy();
    expect(screen.queryByTestId('nudge-offer')).toBeNull(); // answered: never again
    await act(async () => {
      await fireEvent.press(screen.getByTestId('notif-allow'));
    });
    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledWith({ watch_nudges: true }));
  });
});
