import type { IsbnLookup, NormalizedExtraction } from '@shared/extraction.ts';
import { Directory, File, Paths } from 'expo-file-system';
import { create } from 'zustand';

import { storage, storageKeys } from '@/lib/storage';

import { extractBook, ExtractError, uploadCover } from './api';
import type { Draft } from './store';

/**
 * Offline capture (plan §9.6 step 7): processed photos are copied to documents/drafts/{itemId}/,
 * listed in MMKV `pending-captures`, and read automatically when the phone is back online.
 */
export type PendingCapture = {
  itemId: string;
  front: string;
  back: string | null;
  isbn: string | null;
  lookup: IsbnLookup | null;
  createdAt: string;
  state: 'waiting' | 'ready' | 'failed';
  frontPath: string | null;
  backPath: string | null;
  extraction: NormalizedExtraction | null;
};

function read(): PendingCapture[] {
  try {
    return JSON.parse(storage.getString(storageKeys.pendingCaptures) ?? '[]') as PendingCapture[];
  } catch {
    return [];
  }
}

type State = { drafts: PendingCapture[]; set: (d: PendingCapture[]) => void };
export const useDrafts = create<State>((set) => ({
  drafts: read(),
  set: (drafts) => {
    storage.set(storageKeys.pendingCaptures, JSON.stringify(drafts));
    set({ drafts });
  },
}));

const put = (d: PendingCapture) => {
  const { drafts, set } = useDrafts.getState();
  set([...drafts.filter((x) => x.itemId !== d.itemId), d]);
};

export function removeDraft(itemId: string) {
  const { drafts, set } = useDrafts.getState();
  set(drafts.filter((d) => d.itemId !== itemId));
  try {
    const dir = new Directory(Paths.document, 'drafts', itemId);
    if (dir.exists) dir.delete();
  } catch {
    // already gone
  }
}

/** Copy the processed photos somewhere durable and remember the draft. */
export async function saveDraft(d: Draft): Promise<PendingCapture> {
  const dir = new Directory(Paths.document, 'drafts', d.itemId);
  if (!dir.exists) dir.create({ intermediates: true });
  const keep = async (uri: string | null, side: 'front' | 'back') => {
    if (!uri) return null;
    const target = new File(dir, `${side}.jpg`);
    if (target.exists) target.delete();
    await new File(uri).copy(target);
    return target.uri;
  };
  const draft: PendingCapture = {
    itemId: d.itemId,
    front: (await keep(d.front, 'front'))!,
    back: await keep(d.back, 'back'),
    isbn: d.isbn,
    lookup: d.lookup,
    createdAt: new Date().toISOString(),
    state: 'waiting',
    frontPath: null,
    backPath: null,
    extraction: null,
  };
  put(draft);
  return draft;
}

let running = false;

/** Upload + read every waiting draft (called when connectivity returns and on app start). */
export async function processDrafts(): Promise<void> {
  if (running) return;
  running = true;
  try {
    for (const d of useDrafts.getState().drafts.filter((x) => x.state === 'waiting')) {
      try {
        const frontPath = d.frontPath ?? (await uploadCover(d.itemId, 'front', d.front));
        const backPath = d.back ? (d.backPath ?? (await uploadCover(d.itemId, 'back', d.back))) : null;
        put({ ...d, frontPath, backPath });
        const { fields } = await extractBook(d.itemId, [frontPath, ...(backPath ? [backPath] : [])]);
        put({ ...d, frontPath, backPath, extraction: fields, state: 'ready' });
      } catch (e) {
        if (e instanceof ExtractError && e.code === 'offline') return; // still offline; try later
        // Uploaded but unreadable / limit reached: the user fills it in from the photo.
        const cur = useDrafts.getState().drafts.find((x) => x.itemId === d.itemId);
        if (cur?.frontPath) put({ ...cur, state: 'failed' });
        else return; // upload failed: network, keep waiting
      }
    }
  } finally {
    running = false;
  }
}
