import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import { copy } from '@/i18n/en';
import { queryClient } from '@/lib/queryClient';
import { cleanupAppState } from '@/test/cleanup';

import { ChatError } from '../api';

const mockSend = jest.fn();
const mockClear = jest.fn().mockResolvedValue(undefined);
let mockHistory: unknown[] = [];

const movie = {
  id: 'm1',
  kind: 'movie',
  status: 'watched',
  title: 'IT',
  titleNative: null,
  tmdbId: 346364,
  posterPath: null,
  backdropPath: null,
  rating: null,
  note: null,
  startedAt: null,
  finishedAt: null,
  overview: 'Derry.',
  year: 2017,
  runtimeMin: 135,
  genres: ['Horror'],
  collection: null,
  viewings: [],
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
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
jest.mock('@/features/media/api', () => ({
  ...jest.requireActual('@/features/media/api'),
  fetchMovies: async () => [movie],
  fetchShows: async () => [],
  fetchShowProgress: async () => [],
}));
jest.mock('@/features/media/chat/api', () => ({
  ...jest.requireActual('@/features/media/chat/api'),
  fetchChat: async () => mockHistory,
  sendChat: (v: unknown) => mockSend(v),
  clearChat: (v: unknown) => mockClear(v),
}));

/** Ask Pinki: overview, memory, language and spoilers, limits. */
describe('Ask Pinki chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    mockHistory = [];
  });
  afterAll(cleanupAppState);

  it('starts empty, asks for an overview from a quick prompt, and shows the reply', async () => {
    mockSend.mockImplementation(async () => {
      mockHistory = [
        { id: '1', role: 'user', content: copy.chat.prompts.overview, language: 'en', createdAt: 'a' },
        { id: '2', role: 'assistant', content: 'Seven kids and a clown.', language: 'en', createdAt: 'b' },
      ];
      return { reply: 'Seven kids and a clown.', remaining: 49 };
    });
    await renderRouter('./app', { initialUrl: '/chat/m1' });
    expect(await screen.findByTestId('chat-empty')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId(`chat-prompt-${copy.chat.prompts.overview}`));
    });
    await waitFor(() =>
      expect(mockSend).toHaveBeenCalledWith({
        itemId: 'm1',
        message: copy.chat.prompts.overview,
        language: 'en',
        spoilers: false,
      }),
    );
    expect(await screen.findByText('Seven kids and a clown.')).toBeTruthy();
    // Movies get no "Recap where I am" prompt.
    expect(screen.queryByTestId(`chat-prompt-${copy.chat.prompts.recap}`)).toBeNull();
  });

  it('sends in Sinhala with spoilers when chosen, from the composer', async () => {
    mockSend.mockResolvedValue({ reply: 'හොඳයි', remaining: 48 });
    await renderRouter('./app', { initialUrl: '/chat/m1' });
    await fireEvent.press(await screen.findByText(copy.chat.languages.si));
    await fireEvent.press(screen.getByTestId('chat-spoilers'));
    await fireEvent.changeText(screen.getByTestId('chat-input'), '  How does it end?  ');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('chat-send'));
    });
    await waitFor(() =>
      expect(mockSend).toHaveBeenCalledWith({
        itemId: 'm1',
        message: 'How does it end?',
        language: 'si',
        spoilers: true,
      }),
    );
  });

  it('takes the question back and says so at the daily limit', async () => {
    mockSend.mockRejectedValue(new ChatError('daily_limit'));
    await renderRouter('./app', { initialUrl: '/chat/m1' });
    await fireEvent.changeText(await screen.findByTestId('chat-input'), 'One more?');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('chat-send'));
    });
    expect(await screen.findByText(copy.chat.dailyLimit)).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('One more?')).toBeNull());
  });

  it('clears the conversation after confirming', async () => {
    mockHistory = [{ id: '1', role: 'user', content: 'Hi', language: 'en', createdAt: 'a' }];
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    await renderRouter('./app', { initialUrl: '/chat/m1' });
    await act(async () => {
      await fireEvent.press(await screen.findByTestId('chat-clear'));
    });
    await waitFor(() => expect(mockClear).toHaveBeenCalledWith({ itemId: 'm1' }));
    alert.mockRestore();
  });
});
