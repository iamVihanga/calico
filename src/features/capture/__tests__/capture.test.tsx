import type { NormalizedExtraction } from '@shared/extraction.ts';
import { onlineManager } from '@tanstack/react-query';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { cleanupAppState } from '@/test/cleanup';

import { ExtractError } from '../api';
import { useDrafts } from '../drafts';
import { capture } from '../store';

const mockUpload = jest.fn();
const mockExtract = jest.fn();
const mockSaveDraft = jest.fn();

const owned = {
  id: 'gamperaliya',
  status: 'read',
  title: 'Gamperaliya',
  titleNative: 'ගම්පෙරළිය',
  author: 'Martin Wickramasinghe',
  authorNative: null,
  language: 'Sinhala',
  format: 'physical',
  ownership: 'owned',
  totalPages: 280,
  currentPage: 280,
  rating: 5,
  note: null,
  startedAt: '2024-01-02',
  finishedAt: '2024-02-10',
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-02-10T00:00:00Z',
  coverPath: null,
  coverUrl: null,
  wishlistPriority: null,
  abandonReason: null,
  loan: null,
};

const reading: NormalizedExtraction = {
  script_on_cover: 'sinhala',
  title_native: 'ගම්පෙරළිය',
  title_romanized: 'Gamperaliya',
  author_native: 'මාටින් වික්‍රමසිංහ',
  author_romanized: 'Martin Wickramasinghe',
  language: 'Sinhala',
  isbn: null,
  publisher: null,
  published_year: null,
  total_pages: 280,
  confidence: {
    title_native: 0.95,
    title_romanized: 0.9,
    author_native: 0.9,
    author_romanized: 0.4, // unsure → dotted + "Check this one"
    language: 0.99,
    isbn: 0,
    publisher: 0,
    published_year: 0,
    total_pages: 0.8,
  },
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
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  fetchBooks: async () => [owned],
  fetchPageLogs: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
}));
jest.mock('@/features/capture/api', () => ({
  ...jest.requireActual('@/features/capture/api'),
  uploadCover: (...a: unknown[]) => mockUpload(...a),
  extractBook: (...a: unknown[]) => mockExtract(...a),
}));
jest.mock('@/features/capture/drafts', () => ({
  ...jest.requireActual('@/features/capture/drafts'),
  saveDraft: (...a: unknown[]) => mockSaveDraft(...a),
}));

const photographed = () => {
  capture().start();
  capture().patch({ front: 'file:///front.jpg' });
  return capture().itemId;
};

/** Flow F1 (brief §9): snap the cover → reading → review, and its failure paths. */
describe('F1: snap the cover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onlineManager.setOnline(true);
    useDrafts.getState().set([]);
    mockUpload.mockImplementation(async (id: string, side: string) => `u/${id}/${side}.jpg`);
  });
  afterAll(cleanupAppState);

  it('reads the cover and shows AI and low-confidence fields, plus the duplicate notice', async () => {
    const id = photographed();
    mockExtract.mockResolvedValue({ fields: reading, remaining: 29 });

    await renderRouter('./app', { initialUrl: '/capture/reading' });
    expect(await screen.findByTestId('screen-review', {}, { timeout: 5000 })).toBeTruthy();

    expect(mockUpload).toHaveBeenCalledWith(id, 'front', 'file:///front.jpg');
    expect(mockExtract).toHaveBeenCalledWith(id, [`u/${id}/front.jpg`], expect.anything());
    expect(screen.getByTestId('review-title')).toHaveProp('value', 'Gamperaliya');
    expect(screen.getAllByLabelText(copy.capture.aiBadge).length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(copy.capture.check)).toBeTruthy();
    expect(await screen.findByTestId('review-duplicate')).toBeTruthy();
  });

  it('falls back to a blank form with a toast when the daily limit is reached', async () => {
    photographed();
    mockExtract.mockRejectedValue(new ExtractError('daily_limit', '2026-09-25T18:30:00.000Z'));

    await renderRouter('./app', { initialUrl: '/capture/reading' });
    expect(await screen.findByTestId('screen-review')).toBeTruthy();
    expect(await screen.findByText(copy.capture.dailyLimit)).toBeTruthy();
    expect(capture().resetsAt).toBe('2026-09-25T18:30:00.000Z');
    expect(screen.queryByLabelText(copy.capture.aiBadge)).toBeNull();
  });

  it('saves a draft and returns home when offline', async () => {
    const id = photographed();
    onlineManager.setOnline(false);

    await renderRouter('./app', { initialUrl: '/capture/reading' });
    await waitFor(() => expect(mockSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ itemId: id })));
    expect(await screen.findByText(copy.capture.offline)).toBeTruthy();
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockExtract).not.toHaveBeenCalled();
  });
});
