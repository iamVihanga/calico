import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { requestReminderSync } from '@/features/loans/reminders';
import { useProfile } from '@/features/profile/hooks';
import { appendKey, byPosition } from '@/features/upnext/logic';
import { copy } from '@/i18n/en';
import { colomboToday, localDateOf } from '@/lib/dates';
import { mk } from '@/lib/mutations';
import { qk } from '@/lib/queryKeys';
import { toast } from '@/lib/stores/toast';

import * as api from './api';
import { leadTitle, statusLabel } from './logic';
import type { Book, BookDetail, BookStatus, LeadScript, PageLog } from './types';

const BOOKS = qk.items('book', 'all');
type Queue = { itemId: string; position: string }[];

export function useLeadScript(): LeadScript {
  const { data } = useProfile();
  return data?.lead_script === 'si' ? 'si' : 'en';
}

export const useBooks = () => useQuery({ queryKey: BOOKS, queryFn: api.fetchBooks });

export function useBook(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.item(id),
    queryFn: () => api.fetchBook(id),
    // Show the list row instantly while the detail loads.
    placeholderData: () => {
      const b = qc.getQueryData<Book[]>(BOOKS)?.find((x) => x.id === id);
      return b ? { ...b, sessions: [], collections: [] } : undefined;
    },
  });
}

export const usePageLogs = (id: string) =>
  useQuery({ queryKey: qk.pageLogs(id), queryFn: () => api.fetchPageLogs(id) });

export function useReadingLogs(ids: string[]) {
  const key = useMemo(() => [...ids].sort(), [ids]);
  return useQuery({
    queryKey: ['pageLogs', 'many', ...key],
    queryFn: () => api.fetchPageLogsFor(key),
    enabled: key.length > 0,
  });
}

export const useUpNextPositions = () => useQuery({ queryKey: qk.upNext, queryFn: api.fetchUpNextPositions });

// Cache helpers -----------------------------------------------------------------------------------

export type Snapshot = { books?: Book[]; item?: BookDetail | null; logs?: PageLog[]; queue?: Queue };

export async function snapshot(qc: QueryClient, id: string): Promise<Snapshot> {
  await Promise.all([
    qc.cancelQueries({ queryKey: BOOKS }),
    qc.cancelQueries({ queryKey: qk.item(id) }),
    qc.cancelQueries({ queryKey: qk.pageLogs(id) }),
  ]);
  return {
    books: qc.getQueryData<Book[]>(BOOKS),
    item: qc.getQueryData<BookDetail | null>(qk.item(id)),
    logs: qc.getQueryData<PageLog[]>(qk.pageLogs(id)),
    queue: qc.getQueryData<Queue>(qk.upNext),
  };
}

export function patchBook(qc: QueryClient, id: string, patch: (b: Book) => Partial<Book>) {
  qc.setQueryData<Book[]>(BOOKS, (list) =>
    list?.map((b) => (b.id === id ? { ...b, ...patch(b), updatedAt: new Date().toISOString() } : b)),
  );
  qc.setQueryData<BookDetail | null>(qk.item(id), (b) => (b ? { ...b, ...patch(b) } : b));
}

export function restore(qc: QueryClient, id: string, s?: Snapshot) {
  if (!s) return;
  qc.setQueryData(BOOKS, s.books);
  qc.setQueryData(qk.item(id), s.item);
  qc.setQueryData(qk.pageLogs(id), s.logs);
  qc.setQueryData(qk.upNext, s.queue);
}

export function settle(qc: QueryClient, id: string) {
  void qc.invalidateQueries({ queryKey: BOOKS });
  void qc.invalidateQueries({ queryKey: qk.item(id) });
  void qc.invalidateQueries({ queryKey: qk.pageLogs(id) });
  void qc.invalidateQueries({ queryKey: ['pageLogs', 'many'] });
  void qc.invalidateQueries({ queryKey: qk.upNext });
  void qc.invalidateQueries({ queryKey: qk.homeStats });
  requestReminderSync(); // a new, finished-and-returned or deleted book can change the reminders
}

export const failed = () => toast({ message: copy.errors.saveFailed });
/** Statuses that take any item off Up next (DB trigger `items_status_side_effects`). */
const DONE_STATUSES: string[] = ['read', 'abandoned', 'watched', 'dropped'];

/** Finished/stopped items leave Up next (DB trigger). Mirror it locally and offer Undo (plan §11.1). */
export function leaveQueue(qc: QueryClient, id: string, status: string, requeue: (v: api.QueueVars) => void) {
  if (!DONE_STATUSES.includes(status)) return;
  const queue = qc.getQueryData<Queue>(qk.upNext);
  const entry = queue?.find((q) => q.itemId === id);
  if (!entry) return;
  qc.setQueryData<Queue>(
    qk.upNext,
    queue?.filter((q) => q.itemId !== id),
  );
  toast({ message: copy.books.removed, action: { label: copy.common.undo, onPress: () => requeue(entry) } });
}

// Mutations ---------------------------------------------------------------------------------------

export function useAddToUpNext() {
  const qc = useQueryClient();
  return useMutation<void, Error, api.QueueVars, Snapshot>({
    mutationKey: mk.upNextAdd,
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.upNext });
      const prev = { queue: qc.getQueryData<Queue>(qk.upNext) };
      qc.setQueryData<Queue>(qk.upNext, (q) => [...(q ?? []).filter((x) => x.itemId !== v.itemId), v].sort(byPosition));
      return prev;
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(qk.upNext, ctx?.queue);
      failed();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.upNext }),
  });
}

/** Append to the end of Up next, or say it's already there. */
export function useQueueBook() {
  const qc = useQueryClient();
  const add = useAddToUpNext();
  return async (itemId: string) => {
    const queue = (await qc.ensureQueryData({ queryKey: qk.upNext, queryFn: api.fetchUpNextPositions })) ?? [];
    if (queue.some((q) => q.itemId === itemId)) {
      toast({ message: copy.overflow.alreadyUpNext });
      return;
    }
    add.mutate({ itemId, position: appendKey([...queue].sort(byPosition)) });
    toast({ message: copy.overflow.addedUpNext });
  };
}

export function useSetBookStatus() {
  const qc = useQueryClient();
  const requeue = useAddToUpNext();
  return useMutation<void, Error, api.SetStatusVars, Snapshot>({
    mutationKey: mk.bookSetStatus,
    onMutate: async (v) => {
      const s = await snapshot(qc, v.itemId);
      patchBook(qc, v.itemId, (b) => ({
        status: v.status,
        ...(v.status === 'reading'
          ? { currentPage: b.status === 'read' ? 0 : b.currentPage, startedAt: v.on ?? colomboToday() }
          : {}),
      }));
      leaveQueue(qc, v.itemId, v.status, (e) => requeue.mutate(e));
      return s;
    },
    onError: (_e, v, ctx) => {
      restore(qc, v.itemId, ctx);
      failed();
    },
    onSettled: (_d, _e, v) => settle(qc, v.itemId),
  });
}

export function useLogPage() {
  const qc = useQueryClient();
  return useMutation<void, Error, api.LogPageVars, Snapshot>({
    mutationKey: mk.bookLogPage,
    onMutate: async (v) => {
      const s = await snapshot(qc, v.itemId);
      patchBook(qc, v.itemId, () => ({ currentPage: v.page, status: 'reading' }));
      const today = localDateOf(new Date(v.loggedAt));
      qc.setQueryData<PageLog[]>(qk.pageLogs(v.itemId), (logs) => [
        // Going back replaces today's higher logs (same rule as the log_page RPC).
        ...(logs ?? []).filter((l) => !(l.page > v.page && localDateOf(new Date(l.loggedAt)) === today)),
        { id: v.logId, page: v.page, loggedAt: v.loggedAt },
      ]);
      return s;
    },
    onError: (_e, v, ctx) => {
      restore(qc, v.itemId, ctx);
      failed();
    },
    onSettled: (_d, _e, v) => settle(qc, v.itemId),
  });
}

export function useFinishBook() {
  const qc = useQueryClient();
  const requeue = useAddToUpNext();
  return useMutation<void, Error, api.FinishVars, Snapshot>({
    mutationKey: mk.bookFinish,
    onMutate: async (v) => {
      const s = await snapshot(qc, v.itemId);
      patchBook(qc, v.itemId, (b) => ({
        status: 'read',
        currentPage: b.totalPages ?? b.currentPage,
        rating: v.rating ?? b.rating,
        note: v.note ?? b.note,
        finishedAt: v.on,
        loan: v.returnLoan ? null : b.loan,
      }));
      leaveQueue(qc, v.itemId, 'read', (e) => requeue.mutate(e));
      return s;
    },
    onError: (_e, v, ctx) => {
      restore(qc, v.itemId, ctx);
      failed();
    },
    onSettled: (_d, _e, v) => settle(qc, v.itemId),
  });
}

export function useStopBook() {
  const qc = useQueryClient();
  const requeue = useAddToUpNext();
  return useMutation<void, Error, api.StopVars, Snapshot>({
    mutationKey: mk.bookStop,
    onMutate: async (v) => {
      const s = await snapshot(qc, v.itemId);
      const status: BookStatus = v.toRead ? 'to_read' : 'abandoned';
      patchBook(qc, v.itemId, () => ({ status, abandonReason: v.toRead ? null : v.reason }));
      leaveQueue(qc, v.itemId, status, (e) => requeue.mutate(e));
      return s;
    },
    onError: (_e, v, ctx) => {
      restore(qc, v.itemId, ctx);
      failed();
    },
    onSettled: (_d, _e, v) => settle(qc, v.itemId),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation<void, Error, api.NoteVars, Snapshot>({
    mutationKey: mk.itemNote,
    onMutate: async (v) => {
      const s = await snapshot(qc, v.itemId);
      patchBook(qc, v.itemId, () => ({ note: v.note || null }));
      return s;
    },
    onError: (_e, v, ctx) => {
      restore(qc, v.itemId, ctx);
      failed();
    },
    onSettled: (_d, _e, v) => settle(qc, v.itemId),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation<void, Error, { itemId: string }, Snapshot>({
    mutationKey: mk.itemDelete,
    onMutate: async (v) => {
      const s = await snapshot(qc, v.itemId);
      qc.setQueryData<Book[]>(BOOKS, (list) => list?.filter((b) => b.id !== v.itemId));
      qc.setQueryData<Queue>(qk.upNext, (q) => q?.filter((x) => x.itemId !== v.itemId));
      return s;
    },
    onError: (_e, v, ctx) => {
      restore(qc, v.itemId, ctx);
      failed();
    },
    onSettled: (_d, _e, v) => {
      qc.removeQueries({ queryKey: qk.item(v.itemId) });
      settle(qc, v.itemId);
    },
  });
}

/** Optimistic book from the create payload, so the new book shows up before the server answers. */
function bookFromNew(n: api.NewBook): Book {
  const now = new Date().toISOString();
  return {
    id: n.id,
    status: n.status,
    title: n.title,
    titleNative: n.titleNative || null,
    author: n.author || null,
    authorNative: n.authorNative || null,
    language: n.language,
    format: n.format,
    ownership: n.ownership,
    totalPages: n.totalPages ?? null,
    currentPage: n.currentPage ?? 0,
    rating: null,
    note: null,
    startedAt: n.status === 'reading' ? (n.startedAt ?? colomboToday()) : null,
    finishedAt: null,
    createdAt: now,
    updatedAt: now,
    coverPath: n.coverPath ?? null,
    coverUrl: n.coverUrl ?? null,
    wishlistPriority: n.wishlistPriority ?? null,
    abandonReason: null,
    loan: n.loan
      ? {
          id: n.loan.id,
          direction: 'borrowed',
          party: n.loan.party,
          borrowedOn: n.loan.borrowedOn,
          dueOn: n.loan.dueOn ?? null,
          dueStamps: n.loan.dueOn ? [n.loan.dueOn] : [],
          renewalCount: 0,
        }
      : null,
  };
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation<void, Error, api.NewBook, Snapshot>({
    mutationKey: mk.bookCreate,
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: BOOKS });
      const prev = { books: qc.getQueryData<Book[]>(BOOKS) };
      qc.setQueryData<Book[]>(BOOKS, (list) => [bookFromNew(v), ...(list ?? []).filter((b) => b.id !== v.id)]);
      return prev;
    },
    onError: (_e, v, ctx) => {
      qc.setQueryData(BOOKS, ctx?.books);
      failed();
    },
    onSettled: (_d, _e, v) => settle(qc, v.id),
  });
}

/** Toast after a status change ("IT → Reading"). */
export function announceStatus(b: Pick<Book, 'title' | 'titleNative'>, status: BookStatus, lead: LeadScript) {
  toast({ message: copy.books.statusChanged(leadTitle(b, lead).main, statusLabel(status)) });
}
