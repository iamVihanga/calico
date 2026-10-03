import { File } from 'expo-file-system';

import { currentUserId, supabase } from '@/lib/supabase';

export type CollectionEntry = { itemId: string; position: string };
export type Collection = {
  id: string;
  name: string;
  description: string | null;
  position: string;
  /** In collection order. */
  items: CollectionEntry[];
  createdAt: string;
  /** Chosen art: one of its items' covers, or a photo (storage path). Neither = the 2×2 grid. */
  coverItemId: string | null;
  coverPath: string | null;
};

const byPos = (a: { position: string }, b: { position: string }) =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0;

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select(
      'id, name, description, position, created_at, cover_item_id, cover_path, collection_items(item_id, position)',
    );
  if (error) throw error;
  return data
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      position: c.position,
      createdAt: c.created_at,
      coverItemId: c.cover_item_id,
      coverPath: c.cover_path,
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

async function photoOf(id: string): Promise<string | null> {
  const { data } = await supabase.from('collections').select('cover_path').eq('id', id).maybeSingle();
  return data?.cover_path ?? null;
}

/** Best effort: a leftover photo is only storage, and account deletion sweeps the folder. */
async function removePhoto(path: string | null) {
  if (path) await supabase.storage.from('covers').remove([path]);
}

export async function deleteCollection({ id }: { id: string }): Promise<void> {
  const photo = await photoOf(id);
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
  await removePhoto(photo);
}

export type ArtVars = { id: string; coverItemId: string | null; coverPath: string | null };
/** Single-row update; the photo it replaces (if any) is removed afterwards. */
export async function setCollectionArt(v: ArtVars): Promise<void> {
  const old = await photoOf(v.id);
  const { error } = await supabase
    .from('collections')
    .update({ cover_item_id: v.coverItemId, cover_path: v.coverPath })
    .eq('id', v.id);
  if (error) throw error;
  if (old !== v.coverPath) await removePhoto(old);
}

/** A new file name each time: covers are cached by storage path. */
export const collectionPhotoPath = (uid: string, id: string, at: number) => `${uid}/collections/${id}-${at}.jpg`;

export async function uploadCollectionPhoto(id: string, uri: string): Promise<string> {
  const uid = await currentUserId();
  const path = collectionPhotoPath(uid, id, Date.now());
  const bytes = await new File(uri).bytes();
  const { error } = await supabase.storage.from('covers').upload(path, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}
