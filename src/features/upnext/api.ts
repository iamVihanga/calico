import { currentUserId, supabase } from '@/lib/supabase';

/** Single-row writes: a move only rewrites one row's fractional key (plan §11.7). */
export type MoveVars = { itemId: string; position: string };
export async function moveInQueue({ itemId, position }: MoveVars): Promise<void> {
  const { error } = await supabase.from('up_next').update({ position }).eq('item_id', itemId);
  if (error) throw error;
}

export async function removeFromQueue({ itemId }: { itemId: string }): Promise<void> {
  const { error } = await supabase.from('up_next').delete().eq('item_id', itemId);
  if (error) throw error;
}

/** "All to up next": one upsert of rows in a single table; items already queued keep their place. */
export type AddManyVars = { entries: { itemId: string; position: string }[] };
export async function addManyToQueue({ entries }: AddManyVars): Promise<void> {
  if (!entries.length) return;
  const uid = await currentUserId();
  const { error } = await supabase.from('up_next').upsert(
    entries.map((e) => ({ item_id: e.itemId, user_id: uid, position: e.position })),
    { onConflict: 'item_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}
