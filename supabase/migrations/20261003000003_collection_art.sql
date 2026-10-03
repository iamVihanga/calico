-- Collection art: one of its covers, or a photo (covers/{uid}/collections/{id}-{ts}.jpg). Neither = the 2×2 grid.
alter table public.collections
  add column cover_item_id uuid,
  add column cover_path text check (cover_path is null or cover_path ~ '^[0-9a-f-]{36}/collections/[^/]+\.jpg$'),
  -- Only the user's own items; deleting the item brings the grid back (the user_id column stays).
  add constraint collections_cover_item_fk foreign key (cover_item_id, user_id)
    references public.items (id, user_id) on delete set null (cover_item_id);
create index collections_cover_item_idx on public.collections (cover_item_id) where cover_item_id is not null;
