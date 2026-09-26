-- Edit details and Change cover photo (book overflow menu). Only the keys present in `p` change,
-- so a replayed offline edit is harmless. Pages can't drop below the page you're on.
create or replace function public.update_book(p_item uuid, p jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare v_page int;
begin
  select current_page into v_page from books where item_id = p_item for update;
  if not found then raise exception 'book not found'; end if;
  if p ? 'total_pages' and (p->>'total_pages')::int < v_page then
    raise exception 'total pages below current page' using errcode = '23514';
  end if;

  update items set
    title        = case when p ? 'title' then coalesce(nullif(p->>'title', ''), title) else title end,
    title_native = case when p ? 'title_native' then nullif(p->>'title_native', '') else title_native end,
    cover_path   = case when p ? 'cover_path' then p->>'cover_path' else cover_path end,
    cover_url    = case when p ? 'cover_path' then null else cover_url end
  where id = p_item;

  update books set
    author        = case when p ? 'author' then nullif(p->>'author', '') else author end,
    author_native = case when p ? 'author_native' then nullif(p->>'author_native', '') else author_native end,
    language      = case when p ? 'language' then coalesce(nullif(p->>'language', ''), language) else language end,
    total_pages   = case when p ? 'total_pages' then (p->>'total_pages')::int else total_pages end,
    format        = case when p ? 'format' then (p->>'format')::book_format else format end
  where item_id = p_item;
end $$;
