import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { cleanupAppState } from '@/test/cleanup';

const mockCreate = jest.fn().mockResolvedValue(undefined);
const mockUpload = jest.fn();

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
  fetchProfile: async () => ({ id: 'u', display_name: 'Dilan Kumara', theme: 'day', lead_script: 'en' }),
  updateProfile: async () => undefined,
}));
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  fetchBooks: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
  createBook: (b: unknown) => mockCreate(b),
}));
jest.mock('@/features/books/cover', () => ({
  ...jest.requireActual('@/features/books/cover'),
  pickCover: async () => 'file:///cache/cover.jpg',
}));
jest.mock('@/features/capture/api', () => ({
  ...jest.requireActual('@/features/capture/api'),
  uploadCover: (...a: unknown[]) => mockUpload(...a),
}));

async function addWithPhoto(title: string) {
  await renderRouter('./app', { initialUrl: '/capture/review?manual=1' });
  await fireEvent.changeText(await screen.findByTestId('review-title'), title);
  await fireEvent.press(screen.getByTestId('review-cover'));
  await fireEvent.press(await screen.findByTestId('cover-gallery'));
  await waitFor(() => expect(screen.getByLabelText(copy.review.changeCover)).toBeTruthy());
  await fireEvent.press(screen.getByTestId('review-add'));
}

/** Typing a book in by hand can still give it a cover photo. */
describe('manual add with a cover photo', () => {
  beforeEach(() => jest.clearAllMocks());
  afterAll(cleanupAppState);

  it('uploads the chosen photo and saves it as the cover', async () => {
    mockUpload.mockImplementation(async (id: string) => `u/${id}/front.jpg`);
    await addWithPhoto('Madol Doova');
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    const book = mockCreate.mock.calls[0]![0] as { id: string; coverPath?: string; coverUrl?: string };
    expect(mockUpload).toHaveBeenCalledWith(book.id, 'front', 'file:///cache/cover.jpg');
    expect(book.coverPath).toBe(`u/${book.id}/front.jpg`);
    expect(book.coverUrl).toBeUndefined();
  });

  it('still saves the book when the upload fails, and says so', async () => {
    mockUpload.mockRejectedValue(new Error('offline'));
    await addWithPhoto('Gamperaliya');
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect((mockCreate.mock.calls[0]![0] as { coverPath?: string }).coverPath).toBeUndefined();
    expect(await screen.findByText(copy.review.added('Gamperaliya'))).toBeTruthy();
  });
});
