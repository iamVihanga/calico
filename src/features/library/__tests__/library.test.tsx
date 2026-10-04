import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { storage, storageKeys } from '@/lib/storage';
import { cleanupAppState } from '@/test/cleanup';

const mockBook = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  id,
  status: 'read',
  title,
  titleNative: null,
  author: 'Someone',
  authorNative: null,
  language: 'English',
  format: 'physical',
  ownership: 'owned',
  totalPages: 300,
  currentPage: 300,
  rating: null,
  note: null,
  startedAt: null,
  finishedAt: null,
  finishedPrecision: 'day',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
  coverPath: null,
  coverUrl: null,
  wishlistPriority: null,
  abandonReason: null,
  loan: null,
  ...over,
});
const mockBooks = [
  mockBook('old', 'Madol Doova', { finishedAt: '2024-01-01', finishedPrecision: 'year' }),
  mockBook('new', 'Gamperaliya', { finishedAt: '2025-03-09', finishedPrecision: 'day' }),
  mockBook('now', 'Hath Pana', { status: 'reading', currentPage: 40 }),
];

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
  fetchProfile: async () => ({ id: 'u', display_name: 'Dilan Kumara', theme: 'day', lead_script: 'en' }),
  updateProfile: async () => undefined,
}));
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  fetchBooks: async () => mockBooks,
  fetchBook: async (id: string) => ({ ...mockBooks.find((b) => b.id === id), sessions: [], collections: [] }),
  fetchPageLogs: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
}));
jest.mock('@/features/media/api', () => ({
  ...jest.requireActual('@/features/media/api'),
  fetchMovies: async () => [],
  fetchShows: async () => [],
  fetchShowProgress: async () => [],
}));

const header = (title: string) => screen.findByTestId(`group-${title}`, { includeHiddenElements: true });

/** Library grouping by year, kept with the sort across restarts; the finished date on the detail. */
describe('library groups and saved options', () => {
  beforeAll(() => storage.set(storageKeys.libraryPrefs, '{}'));
  afterAll(cleanupAppState);

  it('groups by year finished, and keeps the grouping and sort after a restart', async () => {
    await renderRouter('./app', { initialUrl: '/library' });
    await fireEvent.press(await screen.findByTestId('library-group'));
    await act(async () => {
      await fireEvent.press(await screen.findByText(copy.library.group.finished));
    });
    expect(await header('2025')).toHaveTextContent(copy.library.groupHeader('2025', 1));
    expect(await header('2024')).toBeTruthy();
    expect(await header(copy.library.groups.unfinished)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('library-sort'));
    await act(async () => {
      await fireEvent.press(await screen.findByText(copy.library.sort.title));
    });

    // "Restart": a fresh render reads the saved options.
    cleanupAppState();
    await renderRouter('./app', { initialUrl: '/library' });
    expect(await header('2025')).toBeTruthy();
    expect(screen.getByTestId('library-sort').props.accessibilityValue).toEqual({ text: copy.library.sort.title });
    expect(screen.getByTestId('library-group').props.accessibilityValue).toEqual({ text: copy.library.group.finished });
  });

  it('the detail says when it was read, as precisely as known', async () => {
    await renderRouter('./app', { initialUrl: '/book/old' });
    expect(await screen.findByTestId('finished-line')).toHaveTextContent('Read in 2024');
    cleanupAppState();
    await renderRouter('./app', { initialUrl: '/book/new' });
    expect(await screen.findByTestId('finished-line')).toHaveTextContent('Read 9 Mar 2025');
  });
});
