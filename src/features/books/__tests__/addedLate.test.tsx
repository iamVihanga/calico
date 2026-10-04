import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { addLocalDays, colomboToday, fmtShort } from '@/lib/dates';
import { pickDay } from '@/test/calendar';
import { cleanupAppState } from '@/test/cleanup';

const mockCreate = jest.fn().mockResolvedValue(undefined);
const mockFinish = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: () => ({ createSignedUrls: async () => ({ data: [], error: null }) }) },
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
    default_library: 'Colombo Public Library',
    default_loan_days: 14,
  }),
  updateProfile: async () => undefined,
}));
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  fetchBooks: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
  createBook: (b: unknown) => mockCreate(b),
  finishBook: (v: unknown) => mockFinish(v),
}));
jest.mock('@/features/loans/sheets/LoanSheets', () => ({
  ...jest.requireActual('@/features/loans/sheets/LoanSheets'),
  maybeAskForReminders: async () => undefined,
}));

const today = colomboToday();

/** Books added days (or years) after the fact. */
describe('adding a book late', () => {
  beforeEach(() => jest.clearAllMocks());
  afterAll(cleanupAppState);

  it('a book read "a while ago" is finished as backfilled', async () => {
    await renderRouter('./app', { initialUrl: '/capture/review?manual=1' });
    await fireEvent.changeText(await screen.findByTestId('review-title'), 'Gamperaliya');
    await fireEvent.press(screen.getByTestId('status-read'));
    await fireEvent.press(await screen.findByTestId('review-when-past'));
    expect(screen.getByTestId('review-when-hint')).toHaveTextContent(copy.when.hintNone);
    // Only the year is remembered: it counts in that year's stats.
    await fireEvent.press(await screen.findByTestId('review-when-year-2024'));
    expect(screen.getByTestId('review-when-hint')).toHaveTextContent(copy.when.hintPeriod('2024'));
    await act(async () => {
      await fireEvent.press(screen.getByTestId('review-add'));
    });
    await waitFor(() => expect(mockFinish).toHaveBeenCalled());
    const book = mockCreate.mock.calls[0]![0] as { id: string; status: string };
    expect(book.status).toBe('to_read');
    expect(mockFinish).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: book.id, backfill: true, on: '2024-01-01', precision: 'year' }),
    );
  });

  it('a library book borrowed a week ago is due a week sooner, or on the day picked', async () => {
    await renderRouter('./app', { initialUrl: '/capture/review?manual=1' });
    await fireEvent.changeText(await screen.findByTestId('review-title'), 'Madol Doova');
    await fireEvent.press(screen.getByTestId('source-library'));
    expect(await screen.findByTestId('review-loan-due-value')).toHaveTextContent(fmtShort(addLocalDays(today, 14)));
    // Borrowed a week ago (quick choice): the loan keeps its length.
    await fireEvent.press(screen.getByTestId('review-loan-borrowed'));
    await fireEvent.press(await screen.findByTestId('review-loan-picker-quick-3'));
    await fireEvent.press(screen.getByTestId('review-loan-picker-done'));
    expect(screen.getByTestId('review-loan-due-value')).toHaveTextContent(fmtShort(addLocalDays(today, 7)));
    // Then the exact due date from the calendar.
    await fireEvent.press(screen.getByTestId('review-loan-due'));
    await pickDay('review-loan-picker-calendar', addLocalDays(today, 10));
    await fireEvent.press(screen.getByTestId('review-loan-picker-done'));
    expect(screen.getByTestId('review-loan-due-value')).toHaveTextContent(fmtShort(addLocalDays(today, 10)));
    await act(async () => {
      await fireEvent.press(screen.getByTestId('review-add'));
    });
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect((mockCreate.mock.calls[0]![0] as { loan: unknown }).loan).toEqual(
      expect.objectContaining({ borrowedOn: addLocalDays(today, -7), dueOn: addLocalDays(today, 10) }),
    );
    expect(mockFinish).not.toHaveBeenCalled();
  });
});
