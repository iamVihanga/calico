import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

import type { OrderEntry } from './api';

type Positioned = { position: string };
type Kinded = { kind: 'book' | 'movie' | 'show'; status: string };

/** On the Wishlist: books wanted (Wishlist), movies and shows wanted (Watchlist). */
export const isWanted = (i: Kinded) => (i.kind === 'book' ? i.status === 'wishlist' : i.status === 'watchlist');

/** Lists are sorted with plain `<`/`>`, matching `collate "C"`. */
export const byPosition = (a: Positioned, b: Positioned) =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0;

/** A key that puts the item at `to` in `list` (the list it's dragged within), `from` being where it is now. */
export function keyForMove(list: Positioned[], from: number, to: number) {
  const rest = list.filter((_, i) => i !== from);
  return generateKeyBetween(to > 0 ? rest[to - 1]!.position : null, to < rest.length ? rest[to]!.position : null);
}

export type WishRow<T> = { item: T; position: string | null };

/** The Wishlist in the user's order: placed items by position, then new ones (oldest first, newest last). */
export function wishlistOrder<T extends { id: string; createdAt: string }>(
  items: T[],
  order: OrderEntry[],
): WishRow<T>[] {
  const pos = new Map(order.map((e) => [e.itemId, e.position]));
  const placed = items
    .filter((i) => pos.has(i.id))
    .map((item) => ({ item, position: pos.get(item.id)! }))
    .sort(byPosition);
  const fresh = items
    .filter((i) => !pos.has(i.id))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))
    .map((item) => ({ item, position: null }));
  return [...placed, ...fresh];
}

/** Places at the end for items that don't have one yet, in their shown order. */
export function placesForNew<T extends { id: string }>(rows: WishRow<T>[]): { itemId: string; position: string }[] {
  const fresh = rows.filter((r) => r.position === null);
  if (!fresh.length) return [];
  const last = rows.filter((r) => r.position !== null).at(-1)?.position ?? null;
  const keys = generateNKeysBetween(last, null, fresh.length);
  return fresh.map((r, i) => ({ itemId: r.item.id, position: keys[i]! }));
}
