import type { QueryClient } from '@tanstack/react-query';

import * as books from '@/features/books/api';
import { type ProfilePatch, updateProfile } from '@/features/profile/api';

/**
 * Mutation keys. Every mutation's `mutationFn` is registered here with `setMutationDefaults`,
 * so mutations paused offline can be persisted and resumed after an app restart (plan §9.4).
 * Variables must be JSON-serialisable.
 */
export const mk = {
  profileUpdate: ['profile', 'update'] as const,
  bookCreate: ['books', 'create'] as const,
  bookSetStatus: ['books', 'setStatus'] as const,
  bookLogPage: ['books', 'logPage'] as const,
  bookFinish: ['books', 'finish'] as const,
  bookStop: ['books', 'stop'] as const,
  itemNote: ['items', 'note'] as const,
  itemDelete: ['items', 'delete'] as const,
  upNextAdd: ['upNext', 'add'] as const,
};

export function registerMutations(qc: QueryClient) {
  qc.setMutationDefaults(mk.profileUpdate, {
    mutationFn: (patch: ProfilePatch) => updateProfile(patch),
  });
  qc.setMutationDefaults(mk.bookCreate, { mutationFn: (v: books.NewBook) => books.createBook(v) });
  qc.setMutationDefaults(mk.bookSetStatus, { mutationFn: (v: books.SetStatusVars) => books.setBookStatus(v) });
  qc.setMutationDefaults(mk.bookLogPage, { mutationFn: (v: books.LogPageVars) => books.logPage(v) });
  qc.setMutationDefaults(mk.bookFinish, { mutationFn: (v: books.FinishVars) => books.finishBook(v) });
  qc.setMutationDefaults(mk.bookStop, { mutationFn: (v: books.StopVars) => books.stopBook(v) });
  qc.setMutationDefaults(mk.itemNote, { mutationFn: (v: books.NoteVars) => books.updateNote(v) });
  qc.setMutationDefaults(mk.itemDelete, { mutationFn: (v: { itemId: string }) => books.deleteItem(v) });
  qc.setMutationDefaults(mk.upNextAdd, { mutationFn: (v: books.QueueVars) => books.addToUpNext(v) });
}
