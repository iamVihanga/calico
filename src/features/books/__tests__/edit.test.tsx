import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { cleanupAppState } from '@/test/cleanup';

const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockUpload = jest.fn().mockResolvedValue('u/it/front-1.jpg');
const mockRemove = jest.fn().mockResolvedValue(undefined);

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
  coverPath: 'u/it/front.jpg',
  coverUrl: null,
  wishlistPriority: null,
  abandonReason: null,
  loan: null,
};

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
  fetchBooks: async () => [it412],
  fetchBook: async () => ({ ...it412, sessions: [], collections: [] }),
  fetchPageLogs: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
  updateBook: (v: unknown) => mockUpdate(v),
}));
jest.mock('@/features/books/cover', () => ({
  ...jest.requireActual('@/features/books/cover'),
  pickCover: async () => 'file:///cache/cropped.jpg',
  uploadReplacementCover: (id: string, uri: string) => mockUpload(id, uri),
  removeOldCover: (p: string | null) => mockRemove(p),
}));

/** Book overflow menu: Edit details and Change cover photo. */
describe('edit a book', () => {
  afterAll(cleanupAppState);

  it('edits the details, refusing fewer pages than the current page', async () => {
    await renderRouter('./app', { initialUrl: '/book/it' });
    await fireEvent.press(await screen.findByTestId('book-overflow'));
    await fireEvent.press(await screen.findByTestId('overflow-edit'));
    await screen.findByTestId('screen-edit-book');
    expect(screen.getByTestId('edit-pages').props.value).toBe('1138');

    await fireEvent.changeText(screen.getByTestId('edit-pages'), '400');
    await fireEvent.press(screen.getByTestId('edit-save'));
    expect(await screen.findByText(copy.edit.pagesBelow(412))).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('edit-pages'), '1153');
    await fireEvent.changeText(screen.getByTestId('edit-titleNative'), 'ඉට්');
    await fireEvent.press(screen.getByTestId('edit-format-ebook'));
    await fireEvent.press(screen.getByTestId('edit-save'));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({
        itemId: 'it',
        edit: expect.objectContaining({ title: 'IT', titleNative: 'ඉට්', totalPages: 1153, format: 'ebook' }),
      }),
    );
    expect(await screen.findByText(copy.edit.saved('IT'))).toBeTruthy();
    await screen.findByTestId('screen-book');
  });

  it('changes the cover photo and removes the old one', async () => {
    await renderRouter('./app', { initialUrl: '/book/it' });
    await fireEvent.press(await screen.findByTestId('book-overflow'));
    await fireEvent.press(await screen.findByTestId('overflow-cover'));
    await fireEvent.press(await screen.findByTestId('cover-gallery'));
    await waitFor(() => expect(mockUpload).toHaveBeenCalledWith('it', 'file:///cache/cropped.jpg'));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({ itemId: 'it', edit: { coverPath: 'u/it/front-1.jpg' } }),
    );
    expect(await screen.findByText(copy.edit.coverSaved)).toBeTruthy();
    expect(mockRemove).toHaveBeenCalledWith('u/it/front.jpg');
  });
});
