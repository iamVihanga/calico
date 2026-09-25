import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { cleanupAppState } from '@/test/cleanup';

const mockLogPage = jest.fn().mockResolvedValue(undefined);
const mockFinish = jest.fn().mockResolvedValue(undefined);

const it412 = {
  id: 'it',
  status: 'reading',
  title: 'IT',
  titleNative: null,
  author: 'Stephen King',
  authorNative: null,
  language: 'English',
  format: 'physical',
  ownership: 'owned',
  totalPages: 1138,
  currentPage: 412,
  rating: null,
  note: null,
  startedAt: '2026-09-02',
  finishedAt: null,
  createdAt: '2026-09-02T00:00:00Z',
  updatedAt: '2026-09-23T00:00:00Z',
  coverPath: null,
  coverUrl: null,
  wishlistPriority: null,
  abandonReason: null,
  loan: null,
};

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
  fetchBooks: async () => [it412],
  fetchBook: async () => ({ ...it412, sessions: [], collections: [] }),
  fetchPageLogs: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
  logPage: (v: unknown) => mockLogPage(v),
  finishBook: (v: unknown) => mockFinish(v),
}));

/** Flow F3 (brief §9): log pages, then finish. */
describe('F3: log pages, then finish', () => {
  afterAll(cleanupAppState);

  it('logs a page from the ruler and finishes the book', async () => {
    await renderRouter('./app', { initialUrl: '/book/it' });
    await screen.findByTestId('screen-book');

    // Log page → +25 → Log page 437
    await fireEvent.press(await screen.findByTestId('detail-log-page'));
    expect(await screen.findByTestId('ruler-page')).toHaveTextContent('412');
    await fireEvent.press(screen.getByText('+25'));
    expect(screen.getByTestId('ruler-page')).toHaveTextContent('437');
    await fireEvent.press(screen.getByTestId('ruler-save'));
    await waitFor(() => expect(mockLogPage).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'it', page: 437 })));
    expect(await screen.findByText(copy.ruler.logged(437, 'IT'))).toBeTruthy();

    // Log page → End → Finish the book → Finish sheet → Mark as read
    await fireEvent.press(screen.getByTestId('detail-log-page'));
    await fireEvent.press(await screen.findByTestId('ruler-end'));
    expect(screen.getByText(copy.ruler.finish)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('ruler-save'));
    expect(await screen.findByText(copy.finish.headline('IT'))).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(copy.finish.star(4)));
    await act(async () => {
      await fireEvent.press(screen.getByTestId('finish-save'));
    });
    await waitFor(() =>
      expect(mockFinish).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'it', returnLoan: false })),
    );
    const rating = (mockFinish.mock.calls[0]![0] as { rating: number }).rating;
    expect([3.5, 4]).toContain(rating); // tap position decides the half
  });
});
