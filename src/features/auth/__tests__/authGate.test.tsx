import { renderRouter, screen } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { cleanupAppState } from '@/test/cleanup';

type Listener = (event: string, session: unknown) => void;
let mockSession: unknown = null;

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: Listener) => {
        cb('INITIAL_SESSION', mockSession);
        return { data: { subscription: { unsubscribe: () => undefined } } };
      },
    },
  },
  currentUserId: async () => 'user-1',
}));
jest.mock('@/features/profile/api', () => ({
  fetchProfile: async () => ({ id: 'user-1', display_name: 'Dilan Kumara', theme: 'day' }),
  updateProfile: async () => undefined,
}));
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  fetchBooks: async () => [
    {
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
    },
  ],
  fetchPageLogsFor: async () => ({}),
}));
jest.mock('@/features/auth/google', () => ({
  SignInCancelled: class extends Error {},
  signInWithGoogle: jest.fn(),
  devSignInAsSeedUser: jest.fn(),
}));

describe('auth gate', () => {
  afterAll(cleanupAppState);

  it('sends signed-out users to Welcome', async () => {
    mockSession = null;
    await renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByText(copy.welcome.google)).toBeTruthy();
    expect(screen.queryByTestId('screen-home')).toBeNull();
  });

  it('shows the tab shell with the seed user when signed in', async () => {
    mockSession = { user: { id: 'user-1', email: 'dilan@calico.test' } };
    await renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByTestId('screen-home')).toBeTruthy();
    expect(await screen.findByText('Dilan')).toBeTruthy();
    expect(await screen.findByText(copy.homeShelf.continueReading)).toBeTruthy();
    expect(await screen.findByTestId('reading-it')).toBeTruthy();
    expect(screen.getByTestId('tab-add')).toBeTruthy();
    expect(screen.queryByText(copy.welcome.google)).toBeNull();
  });
});
