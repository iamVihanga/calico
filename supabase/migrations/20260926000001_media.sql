-- Phase 5: create a collection with its first items in one call (franchise sheet; reused by Phase 6).
-- Idempotent on p_id, so an offline replay never creates a second collection.
create or replace function public.create_collection(
  p_id uuid, p_name text, p_position text, p_items uuid[] default '{}', p_positions text[] default '{}',
  p_description text default null)
returns uuid language plpgsql security invoker set search_path = public as $$
begin
  if coalesce(array_length(p_items, 1), 0) <> coalesce(array_length(p_positions, 1), 0) then
    raise exception 'items and positions must have the same length';
  end if;
  insert into collections (id, user_id, name, description, position)
  values (p_id, auth.uid(), p_name, p_description, p_position)
  on conflict (id) do nothing;
  perform add_to_collection(p_id, p_items, p_positions);
  return p_id;
end $$;

revoke execute on function public.create_collection(uuid, text, text, uuid[], text[], text) from public, anon;
grant execute on function public.create_collection(uuid, text, text, uuid[], text[], text) to authenticated, service_role;
