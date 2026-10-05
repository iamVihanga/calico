import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

import { failed } from '@/features/books/hooks';
import { type LibItem, useLibraryItems } from '@/features/library/items';
import { mk, WISHLIST_SCOPE } from '@/lib/mutations';
import { qk } from '@/lib/queryKeys';

import * as api from './api';
import { byPosition, isWanted, placesForNew, type WishRow, wishlistOrder } from './logic';

export const useWishlistOrder = () => useQuery({ queryKey: qk.wishlistOrder, queryFn: api.fetchWishlistOrder });

/** Wishlist books and watchlist movies and shows, in the user's order. */
export function useWishlist() {
  const order = useWishlistOrder();
  const lib = useLibraryItems();
  const rows = useMemo(() => wishlistOrder(lib.items.filter(isWanted), order.data ?? []), [lib.items, order.data]);
  return { rows, isPending: order.isPending || lib.isPending, ready: order.isSuccess && !lib.isPending };
}

type Snap = { order?: api.OrderEntry[] };

function useOrderMutation<V>(mutationKey: readonly string[], apply: (o: api.OrderEntry[], v: V) => api.OrderEntry[]) {
  const qc = useQueryClient();
  return useMutation<void, Error, V, Snap>({
    mutationKey,
    scope: WISHLIST_SCOPE,
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.wishlistOrder });
      const order = qc.getQueryData<api.OrderEntry[]>(qk.wishlistOrder);
      qc.setQueryData<api.OrderEntry[]>(qk.wishlistOrder, (o) => apply(o ?? [], v).sort(byPosition));
      return { order };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(qk.wishlistOrder, ctx?.order);
      failed();
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.wishlistOrder }),
  });
}

export const useMoveInWishlist = () =>
  useOrderMutation<api.MoveVars>(mk.wishlistMove, (o, v) =>
    o.map((e) => (e.itemId === v.itemId ? { ...e, position: v.position } : e)),
  );

const usePlaceInWishlist = () =>
  useOrderMutation<api.PlaceVars>(mk.wishlistPlace, (o, v) => [
    ...o,
    ...v.entries.filter((e) => !o.some((x) => x.itemId === e.itemId)),
  ]);

/** Items new to the Wishlist get a place at the end (one write), once the order has loaded. */
export function usePlaceNewItems(rows: WishRow<LibItem>[], ready: boolean) {
  const place = usePlaceInWishlist().mutate;
  const sent = useRef(new Set<string>());
  useEffect(() => {
    if (!ready) return;
    const entries = placesForNew(rows).filter((e) => !sent.current.has(e.itemId));
    if (!entries.length) return;
    for (const e of entries) sent.current.add(e.itemId);
    place({ entries });
  }, [rows, ready, place]);
}
