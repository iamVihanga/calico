import type { QueryClient } from '@tanstack/react-query';

import * as books from '@/features/books/api';
import * as loans from '@/features/loans/api';
import * as media from '@/features/media/api';
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
  loanAdd: ['loans', 'add'] as const,
  loanRenew: ['loans', 'renew'] as const,
  loanReturn: ['loans', 'return'] as const,
  loanReopen: ['loans', 'reopen'] as const,
  mediaAdd: ['media', 'add'] as const,
  mediaViewing: ['media', 'viewing'] as const,
  mediaMarkEpisodes: ['media', 'markEpisodes'] as const,
  mediaMarkSeason: ['media', 'markSeason'] as const,
  mediaStatus: ['media', 'status'] as const,
  collectionCreate: ['collections', 'create'] as const,
};

/** Movie/show writes run one at a time, so a collection or episode mark never beats the add it depends on. */
export const MEDIA_SCOPE = { id: 'media' };

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
  qc.setMutationDefaults(mk.loanAdd, { mutationFn: (v: loans.AddLoanVars) => loans.addLoan(v) });
  qc.setMutationDefaults(mk.loanRenew, { mutationFn: (v: loans.RenewVars) => loans.renewLoan(v) });
  qc.setMutationDefaults(mk.loanReturn, { mutationFn: (v: loans.ReturnVars) => loans.returnLoan(v) });
  qc.setMutationDefaults(mk.loanReopen, { mutationFn: (v: loans.ReopenVars) => loans.reopenLoan(v) });
  qc.setMutationDefaults(mk.mediaAdd, { scope: MEDIA_SCOPE, mutationFn: (v: media.NewMedia) => media.addTmdbItem(v) });
  qc.setMutationDefaults(mk.mediaViewing, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: media.ViewingVars) => media.logViewing(v),
  });
  qc.setMutationDefaults(mk.mediaMarkEpisodes, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: media.MarkVars) => media.markEpisodes(v),
  });
  qc.setMutationDefaults(mk.mediaMarkSeason, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: media.SeasonVars) => media.markSeason(v),
  });
  qc.setMutationDefaults(mk.mediaStatus, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: media.MediaStatusVars) => media.setItemStatus(v),
  });
  qc.setMutationDefaults(mk.collectionCreate, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: media.CollectionVars) => media.createCollection(v),
  });
}
