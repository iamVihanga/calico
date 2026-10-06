import type { QueryClient } from '@tanstack/react-query';

import * as books from '@/features/books/api';
import * as collections from '@/features/collections/api';
import * as loans from '@/features/loans/api';
import * as media from '@/features/media/api';
import * as chat from '@/features/media/chat/api';
import * as wishlist from '@/features/wishlist/api';
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
  bookUpdate: ['books', 'update'] as const,
  itemNote: ['items', 'note'] as const,
  itemDelete: ['items', 'delete'] as const,
  upNextAdd: ['upNext', 'add'] as const,
  loanAdd: ['loans', 'add'] as const,
  loanRenew: ['loans', 'renew'] as const,
  loanReturn: ['loans', 'return'] as const,
  loanReopen: ['loans', 'reopen'] as const,
  loanBorrowedOn: ['loans', 'borrowedOn'] as const,
  loanDueOn: ['loans', 'dueOn'] as const,
  mediaAdd: ['media', 'add'] as const,
  mediaViewing: ['media', 'viewing'] as const,
  mediaMarkEpisodes: ['media', 'markEpisodes'] as const,
  mediaMarkSeason: ['media', 'markSeason'] as const,
  mediaMarkShow: ['media', 'markShow'] as const,
  mediaStatus: ['media', 'status'] as const,
  mediaOnHold: ['media', 'onHold'] as const,
  collectionCreate: ['collections', 'create'] as const,
  // The Wishlist order (the keys keep their Up next values, so paused offline writes still resume).
  wishlistMove: ['upNext', 'move'] as const,
  wishlistPlace: ['upNext', 'addMany'] as const,
  upNextRemove: ['upNext', 'remove'] as const,
  collectionAdd: ['collections', 'add'] as const,
  collectionRemove: ['collections', 'remove'] as const,
  collectionDelete: ['collections', 'delete'] as const,
  collectionArt: ['collections', 'art'] as const,
  chatSend: ['chat', 'send'] as const,
  chatClear: ['chat', 'clear'] as const,
};

/** Movie/show writes run one at a time, so a collection or episode mark never beats the add it depends on. */
export const MEDIA_SCOPE = { id: 'media' };
/**
 * Book and loan writes run one at a time too: a book added as Read is created, then finished, and the
 * finish must never reach the server first (it would fail and the book would stay To read).
 */
export const BOOK_SCOPE = { id: 'books' };
/** Wishlist order writes run in order too: new items get their place before a move can rewrite it. */
export const WISHLIST_SCOPE = { id: 'wishlist' };

export function registerMutations(qc: QueryClient) {
  qc.setMutationDefaults(mk.profileUpdate, {
    mutationFn: (patch: ProfilePatch) => updateProfile(patch),
  });
  qc.setMutationDefaults(mk.bookCreate, { scope: BOOK_SCOPE, mutationFn: (v: books.NewBook) => books.createBook(v) });
  qc.setMutationDefaults(mk.bookSetStatus, {
    scope: BOOK_SCOPE,
    mutationFn: (v: books.SetStatusVars) => books.setBookStatus(v),
  });
  qc.setMutationDefaults(mk.bookLogPage, { scope: BOOK_SCOPE, mutationFn: (v: books.LogPageVars) => books.logPage(v) });
  qc.setMutationDefaults(mk.bookFinish, {
    scope: BOOK_SCOPE,
    mutationFn: (v: books.FinishVars) => books.finishBook(v),
  });
  qc.setMutationDefaults(mk.bookStop, { scope: BOOK_SCOPE, mutationFn: (v: books.StopVars) => books.stopBook(v) });
  qc.setMutationDefaults(mk.bookUpdate, {
    scope: BOOK_SCOPE,
    mutationFn: (v: books.UpdateBookVars) => books.updateBook(v),
  });
  qc.setMutationDefaults(mk.itemNote, { scope: BOOK_SCOPE, mutationFn: (v: books.NoteVars) => books.updateNote(v) });
  qc.setMutationDefaults(mk.itemDelete, { mutationFn: (v: { itemId: string }) => books.deleteItem(v) });
  qc.setMutationDefaults(mk.upNextAdd, { mutationFn: (v: books.QueueVars) => books.addToUpNext(v) });
  qc.setMutationDefaults(mk.loanAdd, { scope: BOOK_SCOPE, mutationFn: (v: loans.AddLoanVars) => loans.addLoan(v) });
  qc.setMutationDefaults(mk.loanRenew, { scope: BOOK_SCOPE, mutationFn: (v: loans.RenewVars) => loans.renewLoan(v) });
  qc.setMutationDefaults(mk.loanReturn, {
    scope: BOOK_SCOPE,
    mutationFn: (v: loans.ReturnVars) => loans.returnLoan(v),
  });
  qc.setMutationDefaults(mk.loanReopen, {
    scope: BOOK_SCOPE,
    mutationFn: (v: loans.ReopenVars) => loans.reopenLoan(v),
  });
  qc.setMutationDefaults(mk.loanBorrowedOn, {
    scope: BOOK_SCOPE,
    mutationFn: (v: loans.BorrowedOnVars) => loans.setLoanBorrowedOn(v),
  });
  qc.setMutationDefaults(mk.loanDueOn, {
    scope: BOOK_SCOPE,
    mutationFn: (v: loans.DueOnVars) => loans.setLoanDueOn(v),
  });
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
  qc.setMutationDefaults(mk.mediaMarkShow, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: media.ShowWatchedVars) => media.markShowWatched(v),
  });
  qc.setMutationDefaults(mk.mediaStatus, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: media.MediaStatusVars) => media.setItemStatus(v),
  });
  qc.setMutationDefaults(mk.mediaOnHold, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: media.OnHoldVars) => media.setShowOnHold(v),
  });
  qc.setMutationDefaults(mk.wishlistMove, {
    scope: WISHLIST_SCOPE,
    mutationFn: (v: wishlist.MoveVars) => wishlist.moveInWishlist(v),
  });
  qc.setMutationDefaults(mk.wishlistPlace, {
    scope: WISHLIST_SCOPE,
    mutationFn: (v: wishlist.PlaceVars) => wishlist.placeInWishlist(v),
  });
  // Old Up next writes only (paused offline before the update).
  qc.setMutationDefaults(mk.upNextRemove, {
    mutationFn: (v: { itemId: string }) => wishlist.removeFromWishlistOrder(v),
  });
  qc.setMutationDefaults(mk.collectionAdd, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: collections.AddItemsVars) => collections.addToCollection(v),
  });
  qc.setMutationDefaults(mk.collectionRemove, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: collections.RemoveItemVars) => collections.removeFromCollection(v),
  });
  qc.setMutationDefaults(mk.collectionDelete, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: { id: string }) => collections.deleteCollection(v),
  });
  qc.setMutationDefaults(mk.collectionArt, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: collections.ArtVars) => collections.setCollectionArt(v),
  });
  qc.setMutationDefaults(mk.collectionCreate, {
    scope: MEDIA_SCOPE,
    mutationFn: (v: media.CollectionVars) => media.createCollection(v),
  });
  qc.setMutationDefaults(mk.chatSend, { mutationFn: (v: chat.SendChatVars) => chat.sendChat(v) });
  qc.setMutationDefaults(mk.chatClear, { mutationFn: (v: { itemId: string }) => chat.clearChat(v) });
}
