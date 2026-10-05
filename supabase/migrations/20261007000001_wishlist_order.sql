-- Up next is gone; the Wishlist tab lists wishlist books and watchlist movies and shows (by status) and
-- keeps their drag order in the same `up_next` table (one fractional position per item). An item that
-- leaves the wishlist / watchlist loses its row, whatever changed its status.

create or replace function public.items_status_side_effects() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status not in ('wishlist', 'watchlist') then
    delete from up_next where item_id = new.id;
  end if;
  return new;
end $$;

-- Rows for things that were queued but aren't wanted-not-started any more.
delete from public.up_next q using public.items i
  where i.id = q.item_id and i.status not in ('wishlist', 'watchlist');
