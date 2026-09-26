import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateNKeysBetween } from 'fractional-indexing';
import { useMemo } from 'react';

import type { QueueEntry } from '@/features/books/api';
import { failed, useAddToUpNext, useUpNextPositions } from '@/features/books/hooks';
import { type LibItem, useLibraryItems } from '@/features/library/items';
import { copy } from '@/i18n/en';
import { localDateOf } from '@/lib/dates';
import { mk } from '@/lib/mutations';
import { qk } from '@/lib/queryKeys';
import { toast } from '@/lib/stores/toast';

import * as api from './api';
import { byPosition, type QueueItem } from './logic';

export type QueueRow = { entry: QueueEntry; item: LibItem };

/** Up next in order, joined to the library (rows whose item isn't loaded yet are left out). */
export function useQueue() {
  const positions = useUpNextPositions();
  const lib = useLibraryItems();
  const rows = useMemo(
    () =>
      [...(positions.data ?? [])].sort(byPosition).flatMap((entry) => {
        const item = lib.byId.get(entry.itemId);
        return item ? [{ entry, item }] : [];
      }),
    [positions.data, lib.byId],
  );
  return { rows, isPending: positions.isPending || lib.isPending };
}

export const toQueueItem = (r: QueueRow): QueueItem => ({
  id: r.item.id,
  kind: r.item.kind,
  pagesLeft: r.item.pagesLeft,
  runtimeMin: r.item.runtimeMin,
  episodesLeft: r.item.episodesLeft,
  progressPct: r.item.progressPct,
  addedAt: r.entry.addedAt ? localDateOf(new Date(r.entry.addedAt)) : localDateOf(new Date()),
});

type Snap = { queue?: QueueEntry[] };

function useQueueMutation<V>(mutationKey: readonly string[], apply: (q: QueueEntry[], v: V) => QueueEntry[]) {
  const qc = useQueryClient();
  return useMutation<void, Error, V, Snap>({
    mutationKey,
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.upNext });
      const queue = qc.getQueryData<QueueEntry[]>(qk.upNext);
      qc.setQueryData<QueueEntry[]>(qk.upNext, (q) => apply(q ?? [], v).sort(byPosition));
      return { queue };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(qk.upNext, ctx?.queue);
      failed();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.upNext }),
  });
}

export const useMoveInQueue = () =>
  useQueueMutation<api.MoveVars>(mk.upNextMove, (q, v) =>
    q.map((e) => (e.itemId === v.itemId ? { ...e, position: v.position } : e)),
  );

const useRemoveMutation = () =>
  useQueueMutation<{ itemId: string }>(mk.upNextRemove, (q, v) => q.filter((e) => e.itemId !== v.itemId));

/** Remove with "Removed {title}" and Undo (re-inserted at its old position). */
export function useRemoveFromQueue() {
  const remove = useRemoveMutation();
  const requeue = useAddToUpNext();
  return (row: QueueRow) => {
    remove.mutate({ itemId: row.entry.itemId });
    toast({
      message: copy.upNext.removed(row.item.title),
      action: {
        label: copy.common.undo,
        onPress: () => requeue.mutate({ itemId: row.entry.itemId, position: row.entry.position }),
      },
    });
  };
}

/** Append several items after the last one, skipping those already queued. Returns how many were added. */
export function useAddManyToQueue() {
  const qc = useQueryClient();
  const m = useQueueMutation<api.AddManyVars>(mk.upNextAddMany, (q, v) => [
    ...q,
    ...v.entries.filter((e) => !q.some((x) => x.itemId === e.itemId)),
  ]);
  return (itemIds: string[]) => {
    const q = [...(qc.getQueryData<QueueEntry[]>(qk.upNext) ?? [])].sort(byPosition);
    const fresh = itemIds.filter((id) => !q.some((e) => e.itemId === id));
    if (!fresh.length) return 0;
    const keys = generateNKeysBetween(q.at(-1)?.position ?? null, null, fresh.length);
    m.mutate({ entries: fresh.map((itemId, i) => ({ itemId, position: keys[i]! })) });
    return fresh.length;
  };
}
