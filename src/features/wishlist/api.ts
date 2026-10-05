import { currentUserId, supabase } from '@/lib/supabase';

/**
 * The Wishlist's drag order lives in `up_next` (one fractional `position` per item); membership is by
 * status (wishlist books, watchlist movies and shows). Items leaving the wishlist lose their row in SQL.
 */
export type OrderEntry = { itemId: string; position: string; addedAt?: string };
export async function fetchWishlistOrder(): Promise<OrderEntry[]> {
  const { data, error } = await supabase.from('up_next').select('item_id, position, added_at');
  if (error) throw error;
  return data.map((r) => ({ itemId: r.item_id, position: r.position, addedAt: r.added_at }));
}

/** A move only rewrites one row's fractional key. */
export type MoveVars = { itemId: string; position: string };
export async function moveInWishlist({ itemId, position }: MoveVars): Promise<void> {
  const { error } = await supabase.from('up_next').update({ position }).eq('item_id', itemId);
  if (error) throw error;
}

/** Give wishlist items without a place one (at the end); items that have one keep it. */
export type PlaceVars = { entries: { itemId: string; position: string }[] };
export async function placeInWishlist({ entries }: PlaceVars): Promise<void> {
  if (!entries.length) return;
  const uid = await currentUserId();
  const { error } = await supabase.from('up_next').upsert(
    entries.map((e) => ({ item_id: e.itemId, user_id: uid, position: e.position })),
    { onConflict: 'item_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

/** Only for paused offline writes from the old Up next (still registered so they can finish). */
export async function removeFromWishlistOrder({ itemId }: { itemId: string }): Promise<void> {
  const { error } = await supabase.from('up_next').delete().eq('item_id', itemId);
  if (error) throw error;
}
