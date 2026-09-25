import type { QueryClient } from '@tanstack/react-query';

import * as books from '@/features/books/api';
import * as loans from '@/features/loans/api';
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
  qc.setMutationDefaults(mk.loanAdd, { mutationFn: (v: loans.AddLoanVars) => loans.addLoan(v) });
  qc.setMutationDefaults(mk.loanRenew, { mutationFn: (v: loans.RenewVars) => loans.renewLoan(v) });
  qc.setMutationDefaults(mk.loanReturn, { mutationFn: (v: loans.ReturnVars) => loans.returnLoan(v) });
  qc.setMutationDefaults(mk.loanReopen, { mutationFn: (v: loans.ReopenVars) => loans.reopenLoan(v) });
}
