-- 0003_rpc: write RPCs (atomic, RLS-checked, idempotent for offline replay) and read-side functions
-- (docs/build-plan.md §7.4). All security invoker.

-- Create a book with optional loan, first session, and queue entry. Idempotent on p->>'id'.
create or replace function public.create_book(p jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := (p->>'id')::uuid;
  v_uid uuid := auth.uid();
  v_status item_status := (p->>'status')::item_status;
  v_page int := coalesce((p->>'current_page')::int, 0);
  v_start date := coalesce((p->>'started_at')::date, local_today());
begin
  if exists (select 1 from items where id = v_id) then return v_id; end if;

  insert into items (id, user_id, kind, status, title, title_native, cover_path, cover_url, started_at)
  values (v_id, v_uid, 'book', v_status, p->>'title', nullif(p->>'title_native', ''),
          p->>'cover_path', p->>'cover_url', case when v_status = 'reading' then v_start end);

  insert into books (item_id, user_id, author, author_native, language, isbn, publisher, published_year,
                     format, ownership, total_pages, current_page, wishlist_priority, wishlist_price_lkr,
                     wishlist_where, ai_extracted)
  values (v_id, v_uid, nullif(p->>'author',''), nullif(p->>'author_native',''),
          coalesce(p->>'language','English'), nullif(p->>'isbn',''), nullif(p->>'publisher',''),
          (p->>'published_year')::int, coalesce((p->>'format')::book_format,'physical'),
          coalesce(p->>'ownership','owned'), (p->>'total_pages')::int, v_page,
          p->>'wishlist_priority', (p->>'wishlist_price_lkr')::int, p->>'wishlist_where',
          coalesce((p->>'ai_extracted')::boolean, false));

  if p ? 'loan' then
    insert into loans (id, item_id, user_id, direction, party, borrowed_on, due_on, due_stamps)
    values ((p->'loan'->>'id')::uuid, v_id, v_uid,
            coalesce((p->'loan'->>'direction')::loan_direction, 'borrowed'),
            p->'loan'->>'party', (p->'loan'->>'borrowed_on')::date, (p->'loan'->>'due_on')::date,
            case when p->'loan'->>'due_on' is null then '{}'::date[]
                 else array[(p->'loan'->>'due_on')::date] end);
  end if;

  if v_status = 'reading' then
    insert into reading_sessions (item_id, user_id, started_at) values (v_id, v_uid, v_start);
    insert into page_logs (item_id, user_id, page) values (v_id, v_uid, v_page);  -- baseline
  end if;

  if p ? 'up_next_position' then
    insert into up_next (item_id, user_id, position) values (v_id, v_uid, p->>'up_next_position');
  end if;
  return v_id;
end $$;

-- Move a book between statuses with the right side effects.
create or replace function public.set_book_status(p_item uuid, p_status item_status, p_on date default null)
returns void language plpgsql security invoker set search_path = public as $$
declare v_old item_status; v_uid uuid := auth.uid(); v_on date := coalesce(p_on, local_today()); v_page int;
begin
  select status into v_old from items where id = p_item and kind = 'book' for update;
  if not found then raise exception 'book not found'; end if;
  if v_old = p_status then return; end if;

  if p_status = 'reading' then
    if v_old = 'read' then update books set current_page = 0 where item_id = p_item; end if;  -- re-read
    update items set status = 'reading', finished_at = null,
      started_at = case when v_old in ('read','wishlist','to_read') or started_at is null then v_on else started_at end
    where id = p_item;
    insert into reading_sessions (item_id, user_id, started_at) values (p_item, v_uid, v_on)
      on conflict do nothing;                                   -- one_open_session guards duplicates
    select current_page into v_page from books where item_id = p_item;
    insert into page_logs (item_id, user_id, page) values (p_item, v_uid, v_page);  -- baseline for pace/stats
  elsif p_status = 'read' then
    perform finish_book(p_item, v_on, null, null, false);
  elsif p_status = 'abandoned' then
    perform stop_book(p_item, null, false);
  else -- wishlist | to_read
    update reading_sessions set outcome = 'paused', finished_at = v_on
      where item_id = p_item and outcome = 'reading';
    update items set status = p_status where id = p_item;
  end if;
end $$;

-- Log the current page. Going backwards replaces today's higher logs.
create or replace function public.log_page(p_item uuid, p_page int, p_log_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare v_total int; v_status item_status;
begin
  if exists (select 1 from page_logs where id = p_log_id) then return; end if;   -- idempotent replay
  select b.total_pages, i.status into v_total, v_status
    from books b join items i on i.id = b.item_id where b.item_id = p_item;
  if not found then raise exception 'book not found'; end if;
  if p_page < 0 or (v_total is not null and p_page > v_total) then raise exception 'page out of range'; end if;
  if v_status <> 'reading' then perform set_book_status(p_item, 'reading', local_today()); end if;
  delete from page_logs where item_id = p_item and page > p_page
    and (logged_at at time zone 'Asia/Colombo')::date = local_today();
  insert into page_logs (id, item_id, user_id, page) values (p_log_id, p_item, auth.uid(), p_page);
  update books set current_page = p_page where item_id = p_item;
end $$;

-- Finish a book: status read, final page, close the session, optionally return the loan.
create or replace function public.finish_book(p_item uuid, p_on date, p_rating numeric, p_note text, p_return_loan boolean)
returns void language plpgsql security invoker set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_on date := coalesce(p_on, local_today());
  v_status item_status;
  v_started date;
  v_total int;
  v_page int;
begin
  select i.status, i.started_at, b.total_pages, b.current_page into v_status, v_started, v_total, v_page
    from items i join books b on b.item_id = i.id where i.id = p_item for update of i;
  if not found then raise exception 'book not found'; end if;
  if v_status = 'read' then return; end if;                                   -- idempotent replay

  update items set status = 'read', finished_at = v_on,
    rating = coalesce(p_rating, rating), note = coalesce(p_note, note)
  where id = p_item;

  if v_total is not null and v_page <> v_total then
    update books set current_page = v_total where item_id = p_item;
    insert into page_logs (item_id, user_id, page) values (p_item, v_uid, v_total);
  end if;

  update reading_sessions set outcome = 'read', finished_at = v_on, rating = p_rating, note = p_note
    where item_id = p_item and outcome = 'reading';
  if not found then                                                           -- finished without a session
    insert into reading_sessions (item_id, user_id, started_at, finished_at, outcome, rating, note)
    values (p_item, v_uid, least(coalesce(v_started, v_on), v_on), v_on, 'read', p_rating, p_note);
  end if;

  if p_return_loan then
    update loans set returned_on = v_on where item_id = p_item and returned_on is null;
  end if;
end $$;

-- Stop a book: "Maybe later" moves it to To read, otherwise it's abandoned with a reason.
create or replace function public.stop_book(p_item uuid, p_reason text, p_to_read boolean)
returns void language plpgsql security invoker set search_path = public as $$
declare v_old item_status;
begin
  select status into v_old from items where id = p_item and kind = 'book' for update;
  if not found then raise exception 'book not found'; end if;

  if p_to_read then
    if v_old = 'to_read' then return; end if;
    update reading_sessions set outcome = 'paused', finished_at = local_today()
      where item_id = p_item and outcome = 'reading';
    update items set status = 'to_read' where id = p_item;
  else
    if v_old = 'abandoned' then return; end if;
    update reading_sessions set outcome = 'abandoned', finished_at = local_today()
      where item_id = p_item and outcome = 'reading';
    update books set abandon_reason = p_reason where item_id = p_item;
    update items set status = 'abandoned' where id = p_item;
  end if;
end $$;

-- Add a loan to an existing book. Idempotent on id.
-- Optional p->>'party_kind' ('library' | 'friend') sets ownership for borrowed loans (default library).
create or replace function public.add_loan(p jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := (p->>'id')::uuid;
  v_item uuid := (p->>'item_id')::uuid;
  v_dir loan_direction := coalesce((p->>'direction')::loan_direction, 'borrowed');
  v_due date := (p->>'due_on')::date;
begin
  if exists (select 1 from loans where id = v_id) then return v_id; end if;
  if not exists (select 1 from items where id = v_item and kind = 'book') then raise exception 'book not found'; end if;

  insert into loans (id, item_id, user_id, direction, party, borrowed_on, due_on, due_stamps)
  values (v_id, v_item, auth.uid(), v_dir, p->>'party', coalesce((p->>'borrowed_on')::date, local_today()), v_due,
          case when v_due is null then '{}'::date[] else array[v_due] end);

  if v_dir = 'borrowed' then
    update books set ownership = case when p->>'party_kind' = 'friend' then 'friend' else 'library' end
      where item_id = v_item;
  end if;
  return v_id;
end $$;

-- Renew an open loan to a later due date. Replaying the same renewal is a no-op.
create or replace function public.renew_loan(p_loan uuid, p_new_due date)
returns void language plpgsql security invoker set search_path = public as $$
declare v_due date; v_returned date;
begin
  select due_on, returned_on into v_due, v_returned from loans where id = p_loan for update;
  if not found then raise exception 'loan not found'; end if;
  if v_returned is not null then raise exception 'loan already returned'; end if;
  if v_due is not null and p_new_due = v_due then return; end if;          -- idempotent replay
  if v_due is not null and p_new_due < v_due then raise exception 'new due date must be after the current one'; end if;

  update loans set due_on = p_new_due, due_stamps = due_stamps || p_new_due, renewal_count = renewal_count + 1
    where id = p_loan;
end $$;

-- Return a loan. A borrowed book that was never finished leaves the shelf (ownership none).
create or replace function public.return_loan(p_loan uuid, p_on date)
returns void language plpgsql security invoker set search_path = public as $$
declare v_item uuid; v_dir loan_direction; v_returned date;
begin
  select item_id, direction, returned_on into v_item, v_dir, v_returned from loans where id = p_loan for update;
  if not found then raise exception 'loan not found'; end if;
  if v_returned is not null then return; end if;

  update loans set returned_on = coalesce(p_on, local_today()) where id = p_loan;
  if v_dir = 'borrowed' and not exists (select 1 from items where id = v_item and status = 'read') then
    update books set ownership = 'none' where item_id = v_item;
  end if;
end $$;

-- Add a movie or show from a TMDB DTO. Idempotent on (user, tmdb_id) and on id.
create or replace function public.add_tmdb_item(p jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := (p->>'id')::uuid;
  v_uid uuid := auth.uid();
  v_kind media_kind := (p->>'kind')::media_kind;
  v_status item_status := (p->>'status')::item_status;
  v_tmdb int := (p->>'tmdb_id')::int;
  v_existing uuid;
  v_watched_on date := coalesce((p->>'watched_on')::date, local_today());
begin
  if v_kind not in ('movie', 'show') then raise exception 'kind must be movie or show'; end if;

  if v_kind = 'movie' then
    select item_id into v_existing from movies where user_id = v_uid and tmdb_id = v_tmdb;
  else
    select item_id into v_existing from shows where user_id = v_uid and tmdb_id = v_tmdb;
  end if;
  if v_existing is not null then return v_existing; end if;
  if exists (select 1 from items where id = v_id) then return v_id; end if;

  insert into items (id, user_id, kind, status, title, title_native, poster_path, backdrop_path, rating,
                     started_at, finished_at)
  values (v_id, v_uid, v_kind, v_status, p->>'title', nullif(p->>'title_native', ''), p->>'poster_path',
          p->>'backdrop_path', case when v_status = 'watched' then (p->>'rating')::numeric end,
          case when v_status = 'watching' then local_today() end,
          case when v_status = 'watched' then v_watched_on end);

  if v_kind = 'movie' then
    insert into movies (item_id, user_id, tmdb_id, release_year, runtime_min, genres, overview,
                        tmdb_collection_id, tmdb_collection_name)
    values (v_id, v_uid, v_tmdb, (p->>'release_year')::int, (p->>'runtime_min')::int,
            coalesce(array(select jsonb_array_elements_text(p->'genres')), '{}'), p->>'overview',
            (p->>'tmdb_collection_id')::int, p->>'tmdb_collection_name');
    if v_status = 'watched' then
      insert into watch_logs (item_id, user_id, watched_on, rating)
      values (v_id, v_uid, v_watched_on, (p->>'rating')::numeric);
    end if;
  else
    insert into shows (item_id, user_id, tmdb_id, first_air_year, network, tmdb_status, number_of_seasons,
                       next_air_date, next_season, next_episode, overview, last_synced_at)
    values (v_id, v_uid, v_tmdb, (p->>'first_air_year')::int, p->>'network', p->>'tmdb_status',
            (p->>'number_of_seasons')::int, (p->>'next_air_date')::date, (p->>'next_season')::int,
            (p->>'next_episode')::int, p->>'overview', now());
  end if;

  if p ? 'up_next_position' and v_status not in ('watched', 'dropped') then
    insert into up_next (item_id, user_id, position) values (v_id, v_uid, p->>'up_next_position');
  end if;
  return v_id;
end $$;

-- Log a movie viewing. The item takes the latest viewing's date and rating. Idempotent on p_id.
create or replace function public.log_viewing(p_id uuid, p_item uuid, p_on date, p_rating numeric, p_note text)
returns void language plpgsql security invoker set search_path = public as $$
declare v_on date := coalesce(p_on, local_today()); v_last date;
begin
  if exists (select 1 from watch_logs where id = p_id) then return; end if;
  select finished_at into v_last from items where id = p_item and kind = 'movie' for update;
  if not found then raise exception 'movie not found'; end if;

  insert into watch_logs (id, item_id, user_id, watched_on, rating, note)
  values (p_id, p_item, auth.uid(), v_on, p_rating, p_note);

  update items set status = 'watched',
    finished_at = greatest(coalesce(finished_at, v_on), v_on),
    rating = case when v_last is null or v_on >= v_last then coalesce(p_rating, rating) else rating end
  where id = p_item;
end $$;

-- Mark (or unmark) episodes of one season. Marking the first episode starts a Watchlist show.
create or replace function public.mark_episodes(p_item uuid, p_season int, p_episodes int[], p_watched boolean)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not exists (select 1 from items where id = p_item and kind = 'show') then raise exception 'show not found'; end if;
  if p_watched then
    insert into episode_watches (item_id, user_id, season, episode)
    select p_item, auth.uid(), p_season, e from unnest(p_episodes) as e
    on conflict do nothing;
    update items set status = 'watching', started_at = coalesce(started_at, local_today())
      where id = p_item and status = 'watchlist';
  else
    delete from episode_watches where item_id = p_item and season = p_season and episode = any (p_episodes);
  end if;
end $$;

-- Mark every aired episode of a season watched.
create or replace function public.mark_season(p_item uuid, p_season int)
returns void language plpgsql security invoker set search_path = public as $$
declare v_tmdb int;
begin
  select tmdb_id into v_tmdb from shows where item_id = p_item;
  if not found then raise exception 'show not found'; end if;
  perform mark_episodes(p_item, p_season,
    array(select episode from tmdb_episodes
          where tmdb_show_id = v_tmdb and season = p_season and air_date <= local_today()
          order by episode),
    true);
end $$;

-- Status changes for movies and shows (books use set_book_status).
create or replace function public.set_item_status(p_item uuid, p_status item_status, p_on date default null)
returns void language plpgsql security invoker set search_path = public as $$
declare v_kind media_kind; v_old item_status; v_on date := coalesce(p_on, local_today());
begin
  select kind, status into v_kind, v_old from items where id = p_item for update;
  if not found then raise exception 'item not found'; end if;
  if v_kind = 'book' then raise exception 'use set_book_status for books'; end if;
  if v_old = p_status then return; end if;
  update items set status = p_status,
    finished_at = case when p_status = 'watched' then v_on else finished_at end,
    started_at = case when p_status = 'watching' then coalesce(started_at, v_on) else started_at end
  where id = p_item;
end $$;

-- Bulk add to a collection with client-computed fractional positions.
create or replace function public.add_to_collection(p_collection uuid, p_items uuid[], p_positions text[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  if coalesce(array_length(p_items, 1), 0) <> coalesce(array_length(p_positions, 1), 0) then
    raise exception 'items and positions must have the same length';
  end if;
  insert into collection_items (collection_id, item_id, user_id, position)
  select p_collection, i, auth.uid(), pos from unnest(p_items, p_positions) as u(i, pos)
  on conflict do nothing;
end $$;

-- Everything the user owns, for Settings → Export.
create or replace function public.export_my_data() returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from profiles p where p.id = auth.uid()),
    'items', coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from items t where t.user_id = auth.uid()), '[]'),
    'books', coalesce((select jsonb_agg(to_jsonb(t)) from books t where t.user_id = auth.uid()), '[]'),
    'reading_sessions', coalesce((select jsonb_agg(to_jsonb(t)) from reading_sessions t where t.user_id = auth.uid()), '[]'),
    'page_logs', coalesce((select jsonb_agg(to_jsonb(t) order by t.logged_at) from page_logs t where t.user_id = auth.uid()), '[]'),
    'loans', coalesce((select jsonb_agg(to_jsonb(t)) from loans t where t.user_id = auth.uid()), '[]'),
    'movies', coalesce((select jsonb_agg(to_jsonb(t)) from movies t where t.user_id = auth.uid()), '[]'),
    'watch_logs', coalesce((select jsonb_agg(to_jsonb(t)) from watch_logs t where t.user_id = auth.uid()), '[]'),
    'shows', coalesce((select jsonb_agg(to_jsonb(t)) from shows t where t.user_id = auth.uid()), '[]'),
    'episode_watches', coalesce((select jsonb_agg(to_jsonb(t)) from episode_watches t where t.user_id = auth.uid()), '[]'),
    'collections', coalesce((select jsonb_agg(to_jsonb(t)) from collections t where t.user_id = auth.uid()), '[]'),
    'collection_items', coalesce((select jsonb_agg(to_jsonb(t)) from collection_items t where t.user_id = auth.uid()), '[]'),
    'up_next', coalesce((select jsonb_agg(to_jsonb(t) order by t.position) from up_next t where t.user_id = auth.uid()), '[]')
  );
$$;

-- Progress for one show, or all the user's shows when p_item is null.
create or replace function public.show_progress(p_item uuid default null)
returns table (item_id uuid, aired int, watched int, total int, next_season int, next_episode int,
               next_name text, next_still text, caught_up boolean, next_air_date date, tmdb_status text)
language sql stable security invoker set search_path = public as $$
  with prof as (select coalesce((select include_specials from profiles where id = auth.uid()), false) as inc),
  s as (select * from shows where user_id = auth.uid() and (p_item is null or shows.item_id = p_item)),
  eps as (
    select s.item_id, e.season, e.episode, e.name, e.still_path, e.air_date,
           (w.item_id is not null) as is_watched
    from s
    join tmdb_episodes e on e.tmdb_show_id = s.tmdb_id
    cross join prof
    left join episode_watches w on w.item_id = s.item_id and w.season = e.season and w.episode = e.episode
    where e.season > 0 or prof.inc
  ),
  agg as (
    select eps.item_id,
           count(*) filter (where air_date <= local_today()) as aired,
           count(*) filter (where is_watched) as watched,
           count(*) as total
    from eps group by eps.item_id
  ),
  nxt as (
    select distinct on (eps.item_id) eps.item_id, season, episode, name, still_path
    from eps where not is_watched and air_date <= local_today()
    order by eps.item_id, season, episode
  )
  select s.item_id, coalesce(a.aired, 0)::int, coalesce(a.watched, 0)::int, coalesce(a.total, 0)::int,
         n.season, n.episode, n.name, n.still_path, (n.item_id is null), s.next_air_date, s.tmdb_status
  from s left join agg a on a.item_id = s.item_id left join nxt n on n.item_id = s.item_id;
$$;

-- Bilingual library search (both scripts, titles and authors).
create or replace function public.search_library(q text)
returns table (item_id uuid, kind media_kind, title text, title_native text, author text, status item_status, score real)
language sql stable security invoker set search_path = public, extensions as $$
  select i.id, i.kind, i.title, i.title_native, coalesce(b.author, b.author_native), i.status,
         greatest(similarity(lower(i.title), lower(q)),
                  similarity(coalesce(i.title_native, ''), q),
                  similarity(lower(coalesce(b.author, '')), lower(q)),
                  similarity(coalesce(b.author_native, ''), q)) as score
  from items i left join books b on b.item_id = i.id
  where i.user_id = auth.uid()
    and (lower(i.title) like '%' || lower(q) || '%'
         or i.title_native like '%' || q || '%'
         or lower(coalesce(b.author, '')) like '%' || lower(q) || '%'
         or coalesce(b.author_native, '') like '%' || q || '%'
         or similarity(lower(i.title), lower(q)) > 0.25)
  order by score desc, i.updated_at desc
  limit 50;
$$;

-- Pages read in [p_from, p_to): positive deltas between consecutive page logs per item in the window.
-- The first log of each item in the window is its own baseline (no delta).
create or replace function public.pages_read_between(p_from timestamptz, p_to timestamptz) returns int
language sql stable security invoker set search_path = public as $$
  select coalesce(sum(greatest(d, 0)), 0)::int from (
    select page - lag(page) over (partition by item_id order by logged_at, id) as d
    from page_logs
    where user_id = auth.uid() and logged_at >= p_from and logged_at < p_to
  ) x;
$$;

-- Numbers for Home's stats line.
create or replace function public.home_stats() returns jsonb
language sql stable security invoker set search_path = public as $$
  with b as (
    select (date_trunc('month', now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo') as month_start,
           (date_trunc('week', now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo') as week_start,
           make_date(extract(year from local_today())::int, 1, 1) as year_start
  )
  select jsonb_build_object(
    'pages_this_month', pages_read_between(b.month_start, now() + interval '1 second'),
    'books_finished_this_year', (select count(*) from reading_sessions s
                                  where s.user_id = auth.uid() and s.outcome = 'read' and s.finished_at >= b.year_start),
    'episodes_this_week', (select count(*) from episode_watches w
                            where w.user_id = auth.uid() and w.watched_at >= b.week_start)
  ) from b;
$$;

-- Your year (Asia/Colombo calendar year).
create or replace function public.year_stats(p_year int) returns jsonb
language sql stable security invoker set search_path = public as $$
  with w as (
    select make_date(p_year, 1, 1) as d_from, make_date(p_year + 1, 1, 1) as d_to,
           make_date(p_year, 1, 1)::timestamp at time zone 'Asia/Colombo' as t_from,
           make_date(p_year + 1, 1, 1)::timestamp at time zone 'Asia/Colombo' as t_to
  ),
  finished as (
    select s.item_id, s.started_at, s.finished_at, i.title, b.language, b.total_pages
    from reading_sessions s join items i on i.id = s.item_id join books b on b.item_id = s.item_id, w
    where s.user_id = auth.uid() and s.outcome = 'read' and s.finished_at >= w.d_from and s.finished_at < w.d_to
  ),
  views as (
    select l.item_id, m.runtime_min from watch_logs l join movies m on m.item_id = l.item_id, w
    where l.user_id = auth.uid() and l.watched_on >= w.d_from and l.watched_on < w.d_to
  ),
  eps as (
    select e.item_id, coalesce(t.runtime_min, 45) as runtime_min
    from episode_watches e
    join shows sh on sh.item_id = e.item_id
    left join tmdb_episodes t on t.tmdb_show_id = sh.tmdb_id and t.season = e.season and t.episode = e.episode, w
    where e.user_id = auth.uid() and e.watched_at >= w.t_from and e.watched_at < w.t_to
  ),
  rewatched as (
    select l.item_id, i.title, count(*) as n
    from watch_logs l join items i on i.id = l.item_id
    where l.user_id = auth.uid() and l.item_id in (select item_id from views)
    group by l.item_id, i.title
    having count(*) > 1
    order by count(*) desc, max(l.watched_on) desc
    limit 1
  )
  select jsonb_build_object(
    'year', p_year,
    'books_finished', (select count(*) from finished),
    'goal', (select reading_goal from profiles where id = auth.uid()),
    'pages_read', (select pages_read_between(w.t_from, w.t_to) from w),
    'language_split', coalesce((select jsonb_object_agg(language, n) from
                                  (select language, count(*) as n from finished group by language) l), '{}'),
    'movies_watched', (select count(distinct item_id) from views),
    'viewings', (select count(*) from views),
    'episodes_watched', (select count(*) from eps),
    'hours_watched', round(((select coalesce(sum(coalesce(runtime_min, 120)), 0) from views)
                            + (select coalesce(sum(runtime_min), 0) from eps)) / 60.0, 1),
    'longest_book', (select jsonb_build_object('item_id', item_id, 'title', title, 'pages', total_pages)
                     from finished where total_pages is not null order by total_pages desc limit 1),
    'fastest_read', (select jsonb_build_object('item_id', item_id, 'title', title,
                                               'days', greatest(1, finished_at - started_at))
                     from finished order by finished_at - started_at asc, finished_at desc limit 1),
    'most_rewatched', (select jsonb_build_object('item_id', item_id, 'title', title, 'viewings', n) from rewatched)
  );
$$;

-- Grants -------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
revoke execute on function public.handle_new_user() from authenticated;
-- Functions added by later migrations follow the same rule.
alter default privileges in schema public revoke execute on functions from public, anon;
