import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { queryClient } from '@/lib/queryClient';
import { useSheetStore } from '@/lib/stores/sheet';
import { useToastStore } from '@/lib/stores/toast';
import { cleanupAppState } from '@/test/cleanup';

const mockBook = (id: string, title: string) => ({
  id,
  status: 'to_read',
  title,
  titleNative: null,
  author: 'Stephen King',
  authorNative: null,
  language: 'English',
  format: 'physical',
  ownership: 'owned',
  totalPages: 300,
  currentPage: 0,
  rating: null,
  note: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
  coverPath: null,
  coverUrl: null,
  wishlistPriority: null,
  abandonReason: null,
  loan: null,
});

const mockState = {
  collection: {
    id: 'sk',
    name: 'Stephen King',
    description: null,
    position: 'a0',
    createdAt: '',
    items: [
      { itemId: 'it', position: 'a0' },
      { itemId: 'shining', position: 'a1' },
    ],
    coverItemId: null as string | null,
    coverPath: null as string | null,
  },
};
const mockArt = jest.fn();

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
  fetchBooks: async () => [mockBook('it', 'IT'), mockBook('shining', 'The Shining')],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
}));
jest.mock('@/features/media/api', () => ({
  ...jest.requireActual('@/features/media/api'),
  fetchMovies: async () => [],
  fetchShows: async () => [],
  fetchShowProgress: async () => [],
}));
jest.mock('@/features/books/cover', () => ({
  ...jest.requireActual('@/features/books/cover'),
  pickCover: async () => 'file:///cache/art.jpg',
}));
jest.mock('@/features/collections/api', () => ({
  ...jest.requireActual('@/features/collections/api'),
  fetchCollections: async () => [mockState.collection],
  uploadCollectionPhoto: async (id: string) => `u/collections/${id}-1.jpg`,
  setCollectionArt: async (v: { coverItemId: string | null; coverPath: string | null }) => {
    mockArt(v);
    mockState.collection = { ...mockState.collection, coverItemId: v.coverItemId, coverPath: v.coverPath };
  },
}));

/** The mosaic is decorative (hidden from TalkBack), so queries must include hidden elements. */
const hidden = { includeHiddenElements: true };

async function openArt() {
  await fireEvent.press(await screen.findByLabelText(copy.books.more));
  await fireEvent.press(await screen.findByTestId('collection-art'));
  expect(await screen.findByText(copy.collections.art.title)).toBeTruthy();
}

describe('collection art', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    useToastStore.getState().hide();
    useSheetStore.getState().close();
  });
  afterAll(cleanupAppState);

  it('shows its covers, then one chosen cover, a photo, and back to the grid', async () => {
    await renderRouter('./app', { initialUrl: '/collections' });
    // Default art: the patchwork of its items' covers.
    expect(await screen.findByTestId('mosaic-sk-patch-it', hidden)).toBeTruthy();
    expect(screen.getByTestId('mosaic-sk-patch-shining', hidden)).toBeTruthy();

    await fireEvent.press(screen.getByTestId('collection-sk'));
    expect(await screen.findByTestId('collection-mosaic-patch-it', hidden)).toBeTruthy();

    await openArt();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('art-item-shining'));
    });
    await waitFor(() => expect(mockArt).toHaveBeenCalledWith({ id: 'sk', coverItemId: 'shining', coverPath: null }));
    expect(await screen.findByText(copy.collections.art.changed)).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId('collection-mosaic-patch-it', hidden)).toBeNull());

    await openArt();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('cover-gallery'));
    });
    await waitFor(() =>
      expect(mockArt).toHaveBeenLastCalledWith({ id: 'sk', coverItemId: null, coverPath: 'u/collections/sk-1.jpg' }),
    );

    await openArt();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('art-reset'));
    });
    await waitFor(() => expect(mockArt).toHaveBeenLastCalledWith({ id: 'sk', coverItemId: null, coverPath: null }));
    expect(await screen.findByTestId('collection-mosaic-patch-it', hidden)).toBeTruthy();
  });
});
