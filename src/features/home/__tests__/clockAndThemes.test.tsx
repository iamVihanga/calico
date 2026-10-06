import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { queryClient } from '@/lib/queryClient';
import { useSheetStore } from '@/lib/stores/sheet';
import { storage, storageKeys } from '@/lib/storage';
import { cleanupAppState } from '@/test/cleanup';
import { themes } from '@/theme';

let mockTheme = 'day';
let mockPalette = 'forest';
const mockUpdateProfile = jest.fn(async (patch: { palette?: string }) => {
  if (patch.palette) mockPalette = patch.palette; // the server keeps it
});
// Home's clock (the sun or the moon, the greeting).
let mockNow = new Date('2026-10-05T21:00:00+05:30');
jest.mock('@/lib/useHourNow', () => ({ useHourNow: () => mockNow }));

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
    theme: mockTheme,
    palette: mockPalette,
    lead_script: 'en',
    include_specials: false,
    watch_nudges: false,
  }),
  updateProfile: (p: { palette?: string }) => mockUpdateProfile(p),
}));
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  fetchBooks: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
}));
jest.mock('@/features/media/api', () => ({
  ...jest.requireActual('@/features/media/api'),
  fetchMovies: async () => [],
  fetchShows: async () => [],
  fetchShowProgress: async () => [],
  fetchWatchSessions: async () => [],
}));

/** Home's own art (the splash has a moon too, and may still be fading out). */
const art = (name: string) =>
  within(screen.getByTestId('screen-home')).queryByTestId(`art-${name}`, { includeHiddenElements: true });
async function home() {
  await renderRouter('./app', { initialUrl: '/' });
  expect(await screen.findByTestId('screen-home')).toBeTruthy();
}

describe('Home follows the clock; Settings → Theme switches colours', () => {
  beforeEach(() => {
    queryClient.clear();
    useSheetStore.getState().close();
    mockUpdateProfile.mockClear();
    mockPalette = 'forest';
    storage.remove(storageKeys.theme);
    storage.remove(storageKeys.themePalette);
  });
  afterAll(cleanupAppState);

  it('the moon at 9 pm in day mode, the sun at 9 am in night mode', async () => {
    mockTheme = 'day';
    mockNow = new Date('2026-10-05T21:00:00+05:30');
    await home();
    await waitFor(() => expect(art('moon')).toBeTruthy());
    expect(art('sun')).toBeNull();
    expect(screen.getByText(copy.home.greetingEvening)).toBeTruthy();
    cleanupAppState();

    mockTheme = 'night';
    mockNow = new Date('2026-10-05T09:00:00+05:30');
    await home();
    await waitFor(() => expect(screen.getByTestId('toggle-night')).toBeChecked());
    expect(art('sun')).toBeTruthy();
    expect(art('moon')).toBeNull();
    expect(screen.getByText(copy.home.greetingMorning)).toBeTruthy();
  });

  it('Settings → Theme → Tortoiseshell repaints at once, is remembered and saved', async () => {
    mockTheme = 'day';
    await home();
    await fireEvent.press(screen.getByTestId('open-settings'));
    const row = await screen.findByTestId('setting-palette');
    expect(row).toHaveTextContent(copy.settings.paletteValue.forest, { exact: false });

    await fireEvent.press(row);
    const tortie = await screen.findByTestId('palette-tortoiseshell');
    expect(screen.getByTestId('palette-forest')).toBeChecked();
    await act(async () => {
      await fireEvent.press(tortie);
    });
    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledWith({ palette: 'tortoiseshell' }));
    expect(storage.getString(storageKeys.themePalette)).toBe('tortoiseshell');
    await waitFor(() =>
      expect(screen.getByTestId('setting-palette')).toHaveTextContent(copy.settings.paletteValue.tortoiseshell, {
        exact: false,
      }),
    );
    // The page itself is now Tortoiseshell paper.
    const page = themes.tortoiseshell.day.surfacePage;
    expect(JSON.stringify(screen.toJSON())).toContain(page);
  });
});
