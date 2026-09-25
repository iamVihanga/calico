import type { IsbnLookup, NormalizedExtraction } from '@shared/extraction.ts';
import { create } from 'zustand';

import { newId } from '@/features/books/api';

export type CameraMode = 'barcode' | 'cover' | 'back';
export type CaptureError = 'ai_failed' | 'ai_unreadable' | 'daily_limit' | 'offline';

/** The book being captured (plan §9.6). One draft at a time; photos live under covers/{uid}/{itemId}/. */
export type Draft = {
  itemId: string;
  isbn: string | null;
  lookup: IsbnLookup | null;
  /** Local processed photos (after crop). */
  front: string | null;
  back: string | null;
  /** Raw photo waiting in the crop screen, and which side it is. */
  pending: { uri: string; width: number; height: number; side: 'front' | 'back' } | null;
  /** Storage paths once uploaded. */
  frontPath: string | null;
  backPath: string | null;
  extraction: NormalizedExtraction | null;
  error: CaptureError | null;
  resetsAt: string | null;
};

type State = Draft & {
  start: () => void;
  patch: (p: Partial<Draft>) => void;
};

const empty = (): Draft => ({
  itemId: newId(),
  isbn: null,
  lookup: null,
  front: null,
  back: null,
  pending: null,
  frontPath: null,
  backPath: null,
  extraction: null,
  error: null,
  resetsAt: null,
});

export const useCaptureStore = create<State>((set) => ({
  ...empty(),
  start: () => set(empty()),
  patch: (p) => set(p),
}));

export const capture = () => useCaptureStore.getState();
