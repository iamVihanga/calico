import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { cropPhoto, finishCrop, useCropStore } from '@/lib/stores/crop';
import { cleanupAppState } from '@/test/cleanup';

const mockStraighten = jest.fn();

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
  fetchBooks: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
}));
jest.mock('@/lib/straighten', () => ({
  straightenCover: (...a: unknown[]) => {
    mockStraighten(...a);
    return Promise.resolve({ uri: 'file:///straight.jpg', width: 800, height: 1200 });
  },
}));

/** A picked photo (Change cover, collection art) goes through the same four-corner crop. */
describe('crop for picked photos', () => {
  afterAll(cleanupAppState);

  // The crop itself (layout, corners, Use photo) is covered by the capture flow's test; Jest doesn't
  // re-render inside a Modal after a layout event, so here we check the host's wiring.
  it('opens over the app for a picked photo, and closing it hands back nothing', async () => {
    await renderRouter('./app', { initialUrl: '/library' });
    let result: Promise<unknown> | undefined;
    act(() => {
      result = cropPhoto({ uri: 'file:///picked.jpg', width: 1200, height: 1600 });
    });
    expect(await screen.findByTestId('crop-area')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByLabelText(copy.common.cancel));
    });
    await expect(result).resolves.toBeNull();
    await waitFor(() => expect(screen.queryByTestId('crop-area')).toBeNull());
    expect(mockStraighten).not.toHaveBeenCalled();
  });

  it('a newer crop request cancels the older one', async () => {
    const first = cropPhoto({ uri: 'file:///a.jpg', width: 10, height: 10 });
    const second = cropPhoto({ uri: 'file:///b.jpg', width: 10, height: 10 });
    await expect(first).resolves.toBeNull();
    act(() => finishCrop({ uri: 'file:///out.jpg', width: 5, height: 5 }));
    await expect(second).resolves.toEqual({ uri: 'file:///out.jpg', width: 5, height: 5 });
    expect(useCropStore.getState().request).toBeNull();
  });
});
