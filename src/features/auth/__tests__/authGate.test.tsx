import { renderRouter, screen } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';

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
jest.mock('@/features/home/api', () => ({
  fetchShelfSummary: async () => ({ books: 8, movies: 4, shows: 5, openLoans: 2 }),
}));
jest.mock('@/features/auth/google', () => ({
  SignInCancelled: class extends Error {},
  signInWithGoogle: jest.fn(),
  devSignInAsSeedUser: jest.fn(),
}));

describe('auth gate', () => {
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
    expect(await screen.findByText(copy.dev.shelfLine(8, 4, 5, 2))).toBeTruthy();
    expect(screen.getByTestId('tab-add')).toBeTruthy();
    expect(screen.queryByText(copy.welcome.google)).toBeNull();
  });
});
