import { supabase } from '@/lib/supabase';

export type CollectionEntry = { itemId: string; position: string };
export type Collection = {
  id: string;
  name: string;
  description: string | null;
  position: string;
  /** In collection order. */
  items: CollectionEntry[];
  createdAt: string;
};

const byPos = (a: { position: string }, b: { position: string }) =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0;

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, description, position, created_at, collection_items(item_id, position)');
  if (error) throw error;
  return data
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      position: c.position,
      createdAt: c.created_at,
      items: (c.collection_items ?? []).map((i) => ({ itemId: i.item_id, position: i.position })).sort(byPos),
    }))
    .sort(byPos);
}

export type AddItemsVars = { collectionId: string; items: string[]; positions: string[] };
export async function addToCollection(v: AddItemsVars): Promise<void> {
  const { error } = await supabase.rpc('add_to_collection', {
    p_collection: v.collectionId,
    p_items: v.items,
    p_positions: v.positions,
  });
  if (error) throw error;
}

export type RemoveItemVars = { collectionId: string; itemId: string };
export async function removeFromCollection(v: RemoveItemVars): Promise<void> {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', v.collectionId)
    .eq('item_id', v.itemId);
  if (error) throw error;
}

export async function deleteCollection({ id }: { id: string }): Promise<void> {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}
