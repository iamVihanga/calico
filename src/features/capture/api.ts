import type { IsbnLookup, NormalizedExtraction } from '@shared/extraction.ts';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { File } from 'expo-file-system';

import { currentUserId, supabase } from '@/lib/supabase';

import type { CaptureError } from './store';

export const coverPath = (uid: string, itemId: string, side: 'front' | 'back') => `${uid}/${itemId}/${side}.jpg`;

/** Plan §9.6 step 4: bytes via the File API, upsert into the private covers bucket. */
export async function uploadCover(itemId: string, side: 'front' | 'back', uri: string): Promise<string> {
  const uid = await currentUserId();
  const path = coverPath(uid, itemId, side);
  const bytes = await new File(uri).bytes();
  const { error } = await supabase.storage
    .from('covers')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

export async function lookupIsbn(isbn: string): Promise<IsbnLookup> {
  const { data, error } = await supabase.functions.invoke<IsbnLookup>('isbn-lookup', { body: { isbn } });
  if (error || !data) throw error ?? new Error('isbn-lookup failed');
  return data;
}

export class ExtractError extends Error {
  constructor(
    readonly code: CaptureError | 'timeout',
    readonly resetsAt: string | null = null,
  ) {
    super(code);
  }
}

export const SLOW_AFTER_MS = 8000;
export const ABORT_AFTER_MS = 25000;

/** Plan §9.6 step 5. Maps HTTP errors to the prototype's states. */
export async function extractBook(
  itemId: string,
  paths: string[],
  signal?: AbortSignal,
): Promise<{ fields: NormalizedExtraction; remaining: number }> {
  const { data, error } = await supabase.functions.invoke<{ fields: NormalizedExtraction; remaining: number }>(
    'extract-book',
    {
      body: { itemId, paths },
      signal,
      timeout: ABORT_AFTER_MS,
    },
  );
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) throw new ExtractError('daily_limit', body.resetsAt ?? null);
    if (res.status === 422) throw new ExtractError('ai_unreadable');
    throw new ExtractError('ai_failed');
  }
  if (error instanceof FunctionsFetchError) throw new ExtractError(signal?.aborted ? 'timeout' : 'offline');
  if (error || !data) throw new ExtractError(signal?.aborted ? 'timeout' : 'ai_failed');
  return data;
}
