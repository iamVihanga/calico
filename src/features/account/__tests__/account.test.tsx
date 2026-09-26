import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { queryClient } from '@/lib/queryClient';
import { useSheetStore } from '@/lib/stores/sheet';
import { cleanupAppState } from '@/test/cleanup';

const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockSignOut = jest.fn();

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
    reading_goal: 24,
    default_loan_days: 14,
    default_library: 'Colombo Public Library',
    reminder_time: '09:00:00',
    remind_3d: true,
    remind_1d: true,
    include_specials: false,
  }),
  updateProfile: async (p: unknown) => mockUpdate(p),
}));
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  fetchBooks: async () =>
    ['a', 'b', 'c'].map((id) => ({
      id,
      title: id,
      titleNative: null,
      status: 'read',
      loan: null,
      createdAt: '',
      updatedAt: '',
    })),
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
}));
jest.mock('@/features/media/api', () => ({
  ...jest.requireActual('@/features/media/api'),
  fetchMovies: async () => [],
  fetchShows: async () => [],
  fetchShowProgress: async () => [],
}));
jest.mock('@/features/account/api', () => ({
  ...jest.requireActual('@/features/account/api'),
  fetchHomeStats: async () => ({ pagesThisMonth: 1240, booksFinishedThisYear: 17, episodesThisWeek: 3 }),
  fetchYearStats: async (year: number) => ({
    year,
    booksFinished: 17,
    goal: 24,
    pagesRead: 5412,
    languageSplit: { Sinhala: 10, English: 7 },
    moviesWatched: 2,
    viewings: 3,
    episodesWatched: 96,
    hoursWatched: 80,
    longestBook: { itemId: 'it', title: 'IT', pages: 1138 },
    fastestRead: null,
    mostRewatched: { itemId: 'it17', title: 'IT (2017)', viewings: 3 },
  }),
  deleteAccount: async () => mockDelete(),
}));
jest.mock('@/features/auth/signOut', () => ({ signOut: async () => mockSignOut() }));

describe('Your year, Settings and deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    useSheetStore.getState().close();
  });
  afterAll(cleanupAppState);

  it('Home stats line opens Your year with the goal shelf and tiles', async () => {
    await renderRouter('./app', { initialUrl: '/' });
    const line = await screen.findByText('1,240 pages read this month');
    await fireEvent.press(line);
    expect(await screen.findByTestId('year-finished')).toHaveTextContent('17 books finished');
    expect(screen.getByText(copy.year.goal(24))).toBeTruthy();
    expect(screen.getByText('71%')).toBeTruthy();
    expect(screen.getByText(copy.year.shelf(17, 24))).toBeTruthy();
    expect(screen.getByText('5,412')).toBeTruthy();
    expect(screen.getByText(copy.year.longest(1138))).toBeTruthy();
    expect(screen.getByText(copy.year.rewatched(3))).toBeTruthy();
  });

  it('edits the reminder time and toggles a reminder', async () => {
    await renderRouter('./app', { initialUrl: '/settings' });
    expect(await screen.findByText('9:00 AM')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('setting-time'));
    await fireEvent.press(await screen.findByTestId('hour-up'));
    await fireEvent.press(screen.getByTestId('minute-up'));
    expect(screen.getByTestId('time-value')).toHaveTextContent('10:05 AM');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('setting-save'));
    });
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ reminder_time: '10:05:00' }));
    await act(async () => {
      await fireEvent.press(screen.getByTestId('setting-3d'));
    });
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ remind_3d: false }));
    expect(screen.getByText(copy.settings.tmdbNotice)).toBeTruthy();
  });

  it('deletes only after typing DELETE, then signs out', async () => {
    await renderRouter('./app', { initialUrl: '/settings/delete' });
    expect(await screen.findByText(copy.account.deleteBody(3, 0, 0))).toBeTruthy();
    expect(screen.getByTestId('delete-everything')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('delete-confirm-input'), 'delete');
    expect(screen.getByTestId('delete-everything')).toBeEnabled();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('delete-everything'));
    });
    await waitFor(() => expect(mockDelete).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
  });
});
