import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { State } from 'react-native-gesture-handler';

import { copy } from '@/i18n/en';
import { queryClient } from '@/lib/queryClient';
import { useDragStore } from '@/lib/stores/drag';
import { useSheetStore } from '@/lib/stores/sheet';
import { useToastStore } from '@/lib/stores/toast';
import { cleanupAppState } from '@/test/cleanup';

const mockBook = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  id,
  status: 'to_read',
  title,
  titleNative: null,
  author: 'Someone',
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
  ...over,
});
const mockMovie = (id: string, title: string, tmdbId: number) => ({
  id,
  kind: 'movie',
  status: 'watchlist',
  title,
  titleNative: null,
  posterPath: null,
  backdropPath: null,
  rating: null,
  note: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
  tmdbId,
  overview: null,
  year: 2017,
  runtimeMin: 135,
  genres: [],
  collection: null,
  viewings: [],
});

const mockState = {
  books: [] as ReturnType<typeof mockBook>[],
  movies: [] as ReturnType<typeof mockMovie>[],
  shows: [] as unknown[],
  queue: [] as { itemId: string; position: string; addedAt: string }[],
  collections: [] as {
    id: string;
    name: string;
    description: string | null;
    position: string;
    createdAt: string;
    items: { itemId: string; position: string }[];
  }[],
};
const mockCalls = { status: jest.fn(), move: jest.fn(), create: jest.fn(), add: jest.fn() };

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
  fetchBooks: async () => mockState.books,
  fetchBook: async (id: string) => ({ ...mockState.books.find((b) => b.id === id), sessions: [], collections: [] }),
  fetchPageLogs: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => mockState.queue,
  setBookStatus: async (v: { itemId: string; status: string }) => {
    mockCalls.status(v);
    const b = mockState.books.find((x) => x.id === v.itemId);
    if (b) b.status = v.status;
  },
}));
jest.mock('@/features/media/api', () => ({
  ...jest.requireActual('@/features/media/api'),
  fetchMovies: async () => mockState.movies,
  fetchShows: async () => mockState.shows,
  fetchShowProgress: async () => [],
  createCollection: async (v: { id: string; name: string; position: string; items: string[]; positions: string[] }) => {
    mockCalls.create(v);
    mockState.collections.push({
      id: v.id,
      name: v.name,
      description: null,
      position: v.position,
      createdAt: '',
      items: v.items.map((itemId, i) => ({ itemId, position: v.positions[i]! })),
    });
  },
}));
jest.mock('@/features/collections/api', () => ({
  ...jest.requireActual('@/features/collections/api'),
  fetchCollections: async () => mockState.collections,
  addToCollection: async (v: { collectionId: string; items: string[]; positions: string[] }) => {
    mockCalls.add(v);
    const c = mockState.collections.find((x) => x.id === v.collectionId)!;
    c.items.push(...v.items.map((itemId, i) => ({ itemId, position: v.positions[i]! })));
  },
}));
jest.mock('@/features/upnext/api', () => ({
  ...jest.requireActual('@/features/upnext/api'),
  moveInQueue: async (v: { itemId: string; position: string }) => {
    mockCalls.move(v);
    const e = mockState.queue.find((x) => x.itemId === v.itemId)!;
    e.position = v.position;
  },
}));
jest.mock('@/features/search/api', () => ({
  searchLibrary: async (q: string) =>
    mockState.books
      .filter((b) => b.title.toLowerCase().includes(q.toLowerCase()))
      .map((b) => ({ itemId: b.id, kind: 'book', title: b.title, titleNative: null, author: b.author, score: 1 })),
}));

const reset = () => {
  jest.clearAllMocks();
  queryClient.clear();
  useToastStore.getState().hide();
  useSheetStore.getState().close();
};

describe('F7: build the "Stephen King" collection', () => {
  beforeEach(() => {
    reset();
    mockState.books = [mockBook('it', 'IT'), mockBook('shining', 'The Shining')];
    mockState.movies = [mockMovie('it2017', 'IT (2017)', 346364), mockMovie('it2', 'IT Chapter Two', 474350)];
    mockState.collections = [];
    mockState.queue = [];
  });
  afterAll(cleanupAppState);

  it('+ New → name → Add items now → pick → Done; then drag The Shining onto the chip', async () => {
    await renderRouter('./app', { initialUrl: '/collections' });
    await fireEvent.press(await screen.findByTestId('collections-new'));
    await fireEvent.changeText(await screen.findByTestId('collection-name'), 'Stephen King');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('collection-create-add'));
    });
    expect(await screen.findByTestId('screen-collection-add')).toBeTruthy();
    for (const id of ['it', 'it2017', 'it2']) await fireEvent.press(await screen.findByTestId(`pick-item-${id}`));
    await act(async () => {
      await fireEvent.press(screen.getByTestId('picker-done'));
    });
    await waitFor(() => expect(mockCalls.add).toHaveBeenCalled());
    expect(mockCalls.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Stephen King', items: [] }));
    const sk = mockState.collections[0]!;
    expect(mockCalls.add).toHaveBeenCalledWith(
      expect.objectContaining({ collectionId: sk.id, items: ['it', 'it2017', 'it2'] }),
    );
    expect(await screen.findByText(copy.collections.addedMany('Stephen King', 3))).toBeTruthy();

    // Library: long-press The Shining, drag it onto the Stephen King chip.
    await act(async () => router.navigate('/library'));
    await screen.findByTestId('book-tile-shining');
    useDragStore.getState().setTarget(sk.id, { x: 0, y: 500, width: 400, height: 60 });
    await act(async () => {
      fireGestureHandler(getByGestureTestId('collect-shining'), [
        { state: State.BEGAN, absoluteX: 100, absoluteY: 200 },
        { state: State.ACTIVE, absoluteX: 100, absoluteY: 200 },
        { state: State.ACTIVE, absoluteX: 120, absoluteY: 520 },
        { state: State.END, absoluteX: 120, absoluteY: 520 },
      ]);
    });
    await waitFor(() =>
      expect(mockCalls.add).toHaveBeenLastCalledWith(
        expect.objectContaining({ collectionId: sk.id, items: ['shining'] }),
      ),
    );
    expect(await screen.findByText(copy.collections.added('Stephen King'))).toBeTruthy();
  });
});

describe('F8: reorder Up next and pick', () => {
  const titles = [
    'Fire & Blood',
    'Hath Pana',
    'Chinaman',
    'Maali',
    'The Shining',
    'Oppenheimer',
    'Dune',
    'Severance',
    'The Bear',
    'Derry',
    'IT Chapter Two',
    'Gamperaliya',
  ];
  beforeEach(() => {
    reset();
    mockState.books = titles.map((t, i) => mockBook(`b${i + 1}`, t));
    mockState.movies = [];
    mockState.collections = [];
    mockState.queue = titles.map((_, i) => ({
      itemId: `b${i + 1}`,
      position: `a${i.toString(36)}`,
      addedAt: '2026-09-11T00:00:00Z',
    }));
  });
  afterAll(() => {
    jest.restoreAllMocks();
    cleanupAppState();
  });

  it('moves Gamperaliya from 12 to 4 with ↑, keeps the order after a refetch, then Pick for me → Start this', async () => {
    await renderRouter('./app', { initialUrl: '/up-next' });
    expect(await screen.findByTestId('queue-row-b12')).toBeTruthy();
    expect(screen.getByText(copy.upNext.divider)).toBeTruthy();
    for (let n = 0; n < 8; n++) {
      await act(async () => {
        await fireEvent.press(screen.getByTestId('queue-up-b12'));
      });
    }
    await waitFor(() => expect(mockCalls.move).toHaveBeenCalledTimes(8));
    const order = () =>
      screen.getAllByTestId(/^queue-row-/).map((n) => (n.props as { testID: string }).testID.replace('queue-row-', ''));
    await waitFor(() => expect(order().slice(0, 5)).toEqual(['b1', 'b2', 'b3', 'b12', 'b4']));
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['upNext'] });
    });
    expect(order().slice(0, 5)).toEqual(['b1', 'b2', 'b3', 'b12', 'b4']);

    jest.spyOn(Math, 'random').mockReturnValue(0.35); // index 3 of the top ten: Gamperaliya
    await fireEvent.press(screen.getByTestId('pick-for-me'));
    expect(await screen.findByText(copy.pick.shuffling)).toBeTruthy();
    // Shuffle (1s) → paw (0.5s) → reveal.
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(copy.pick.kiriPicks)).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(await screen.findByTestId('pick-title')).toHaveTextContent('Gamperaliya');
    expect(screen.getByTestId('pick-reason')).toHaveTextContent(/queued \d+ days ago/);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('pick-start'));
    });
    await waitFor(() =>
      expect(mockCalls.status).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'b12', status: 'reading' })),
    );
    expect(await screen.findByTestId('screen-book')).toBeTruthy();
  });
});

describe('global search', () => {
  beforeEach(() => {
    reset();
    mockState.books = [mockBook('madol', 'Madol Doova'), mockBook('it', 'IT')];
    mockState.movies = [];
    mockState.queue = [];
  });
  afterAll(cleanupAppState);

  it('groups hits by type and offers TMDB or a new book when nothing matches', async () => {
    await renderRouter('./app', { initialUrl: '/search' });
    await fireEvent.changeText(await screen.findByTestId('search-query'), 'madol');
    expect(await screen.findByTestId('search-hit-madol')).toBeTruthy();
    expect(screen.getByTestId('search-group-book')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('search-query'), 'kaputu');
    expect(await screen.findByText(copy.globalSearch.nothing('kaputu'))).toBeTruthy();
    expect(screen.getByText(copy.globalSearch.addBook('kaputu'))).toBeTruthy();
    await fireEvent.press(screen.getByTestId('search-add-book'));
    expect(await screen.findByTestId('screen-review')).toBeTruthy();
    expect(screen.getByTestId('review-title')).toHaveProp('value', 'kaputu');
  });
});
