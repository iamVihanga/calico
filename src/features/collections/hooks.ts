import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import { useMemo } from 'react';

import { newId } from '@/features/books/api';
import { failed } from '@/features/books/hooks';
import type { LibItem } from '@/features/library/items';
import { tmdbKeys } from '@/features/media/add';
import * as mediaApi from '@/features/media/api';
import { copy } from '@/i18n/en';
import { MEDIA_SCOPE, mk } from '@/lib/mutations';
import { qk } from '@/lib/queryKeys';
import { toast } from '@/lib/stores/toast';

import * as api from './api';
import { type SeriesPart, seriesSuggestions } from './logic';

const DAY = 24 * 60 * 60 * 1000;

export const useCollections = () => useQuery({ queryKey: qk.collections, queryFn: api.fetchCollections });

export function useCollection(id: string) {
  const q = useCollections();
  return { ...q, data: q.data?.find((c) => c.id === id) };
}

type Snap = { list?: api.Collection[] };

function useCollectionMutation<V>(
  mutationKey: readonly string[],
  apply: (list: api.Collection[], v: V) => api.Collection[],
  mutationFn?: (v: V) => Promise<void>,
) {
  const qc = useQueryClient();
  return useMutation<void, Error, V, Snap>({
    mutationKey,
    scope: MEDIA_SCOPE,
    ...(mutationFn ? { mutationFn } : {}),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.collections });
      const list = qc.getQueryData<api.Collection[]>(qk.collections);
      qc.setQueryData<api.Collection[]>(qk.collections, (l) => apply(l ?? [], v));
      return { list };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(qk.collections, ctx?.list);
      failed();
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.collections });
      void qc.invalidateQueries({ queryKey: ['item'] }); // book detail shows its collections
    },
  });
}

/** New collection at the end of the list, optionally with its first items (in the given order). */
export function useNewCollection() {
  const qc = useQueryClient();
  const m = useCollectionMutation<mediaApi.CollectionVars>(mk.collectionCreate, (l, v) => [
    ...l.filter((c) => c.id !== v.id),
    {
      id: v.id,
      name: v.name,
      description: v.description ?? null,
      position: v.position,
      createdAt: new Date().toISOString(),
      items: v.items.map((itemId, i) => ({ itemId, position: v.positions[i]! })),
    },
  ]);
  return (name: string, description: string | null, items: string[] = []) => {
    const list = qc.getQueryData<api.Collection[]>(qk.collections) ?? [];
    const id = newId();
    m.mutate({
      id,
      name,
      description,
      position: generateKeyBetween(list.at(-1)?.position ?? null, null),
      items,
      positions: generateNKeysBetween(null, null, items.length),
    });
    return id;
  };
}

/** Add items at the end of a collection (already-present items are skipped). Returns how many. */
export function useAddToCollection() {
  const qc = useQueryClient();
  const m = useCollectionMutation<api.AddItemsVars>(mk.collectionAdd, (l, v) =>
    l.map((c) =>
      c.id !== v.collectionId
        ? c
        : { ...c, items: [...c.items, ...v.items.map((itemId, i) => ({ itemId, position: v.positions[i]! }))] },
    ),
  );
  return (collectionId: string, itemIds: string[]) => {
    const c = qc.getQueryData<api.Collection[]>(qk.collections)?.find((x) => x.id === collectionId);
    const fresh = itemIds.filter((id) => !c?.items.some((i) => i.itemId === id));
    if (!fresh.length) return 0;
    const positions = generateNKeysBetween(c?.items.at(-1)?.position ?? null, null, fresh.length);
    m.mutate({ collectionId, items: fresh, positions });
    return fresh.length;
  };
}

/** Remove one item, with Undo (it goes back to its old position). */
export function useRemoveFromCollection() {
  const add = useCollectionMutation<api.AddItemsVars>(mk.collectionAdd, (l, v) =>
    l.map((c) =>
      c.id !== v.collectionId
        ? c
        : {
            ...c,
            items: [...c.items, { itemId: v.items[0]!, position: v.positions[0]! }].sort((a, b) =>
              a.position < b.position ? -1 : 1,
            ),
          },
    ),
  );
  const remove = useCollectionMutation<api.RemoveItemVars>(mk.collectionRemove, (l, v) =>
    l.map((c) => (c.id !== v.collectionId ? c : { ...c, items: c.items.filter((i) => i.itemId !== v.itemId) })),
  );
  return (c: api.Collection, item: Pick<LibItem, 'id' | 'title'>) => {
    const entry = c.items.find((i) => i.itemId === item.id);
    if (!entry) return;
    remove.mutate({ collectionId: c.id, itemId: item.id });
    toast({
      message: copy.collections.removed(item.title, c.name),
      action: {
        label: copy.common.undo,
        onPress: () => add.mutate({ collectionId: c.id, items: [item.id], positions: [entry.position] }),
      },
    });
  };
}

export const useDeleteCollection = () =>
  useCollectionMutation<{ id: string }>(mk.collectionDelete, (l, v) => l.filter((c) => c.id !== v.id));

/** Series parts missing from the library, for the movies in this collection (TMDB, cached a day). */
export function useSeriesSuggestions(members: LibItem[], library: LibItem[]): SeriesPart[] {
  const ids = [...new Set(members.flatMap((m) => (m.tmdbCollection ? [m.tmdbCollection.id] : [])))];
  const data = useQueries({
    queries: ids.map((id) => ({
      queryKey: tmdbKeys.collection(id),
      queryFn: () => mediaApi.tmdbCollection(id),
      staleTime: DAY,
    })),
    combine: (rs) => rs.map((r) => r.data),
  });
  return useMemo(() => {
    const parts = new Map<number, SeriesPart[]>();
    data.forEach(
      (c) =>
        c &&
        parts.set(
          c.id,
          c.parts.map((p) => ({ tmdbId: p.tmdbId, title: p.title, year: p.year })),
        ),
    );
    const have = new Set(library.flatMap((i) => (i.kind === 'movie' && i.tmdbId ? [i.tmdbId] : [])));
    return seriesSuggestions(members, parts, have);
  }, [data, members, library]);
}
