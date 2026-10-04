-- Detail screens show when something was read or watched, as precisely as it's known:
-- items.finished_precision ('day' | 'month' | 'year', null = "a while ago" with no date) next to
-- finished_at, set wherever finished_at is. Also: episode ticks and page logs move the item up in
-- "Recently updated" (they never touched items.updated_at), Home's stat line can show books or pages
-- read this month (profiles.home_stat), and home_stats() returns books_this_month.

alter table public.items add column finished_precision text default 'day'
  check (finished_precision in ('day', 'month', 'year'));
-- Backfill from what's already recorded (precision of the latest read / viewing / episode).
update public.items i set finished_precision = (
    select s.date_precision from public.reading_sessions s
    where s.item_id = i.id and s.outcome = 'read' order by s.finished_at desc nulls last limit 1)
  where i.kind = 'book' and i.status = 'read';
update public.items i set finished_precision = (
    select l.date_precision from public.watch_logs l
    where l.item_id = i.id order by l.watched_on desc, l.created_at desc limit 1)
  where i.kind = 'movie' and i.status = 'watched';
update public.items i set finished_precision = (
    select w.date_precision from public.episode_watches w
    where w.item_id = i.id order by w.watched_at desc limit 1)
  where i.kind = 'show' and i.status = 'watched'
    and exists (select 1 from public.episode_watches w where w.item_id = i.id);

alter table public.profiles add column home_stat text not null default 'books'
  check (home_stat in ('books', 'pages'));

create or replace function public.finish_book(p_item uuid, p_on date, p_rating numeric, p_note text, p_return_loan boolean,
                                              p_backfill boolean default false, p_precision text default null)
returns void language plpgsql security invoker set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_on date := coalesce(p_on, local_today());
  v_prec text := when_precision(p_backfill, p_precision);
  v_status item_status;
  v_started date;
  v_total int;
  v_page int;
begin
  select i.status, i.started_at, b.total_pages, b.current_page into v_status, v_started, v_total, v_page
    from items i join books b on b.item_id = i.id where i.id = p_item for update of i;
  if not found then raise exception 'book not found'; end if;
  if v_status = 'read' then return; end if;                                   -- idempotent replay

  update items set status = 'read', finished_at = v_on, finished_precision = v_prec,
    started_at = case when started_at > v_on then v_on else started_at end,
    rating = coalesce(p_rating, rating), note = coalesce(p_note, note)
  where id = p_item;

  if v_total is not null and v_page <> v_total then
    update books set current_page = v_total where item_id = p_item;
    insert into page_logs (item_id, user_id, page, logged_at, backfilled, date_precision)
    values (p_item, v_uid, v_total, when_at(p_backfill, v_prec, v_on), p_backfill, v_prec);
  end if;

  update reading_sessions set outcome = 'read', finished_at = v_on, started_at = least(started_at, v_on),
    rating = p_rating, note = p_note, backfilled = p_backfill, date_precision = v_prec
    where item_id = p_item and outcome = 'reading';
  if not found then                                                           -- finished without a session
    insert into reading_sessions (item_id, user_id, started_at, finished_at, outcome, rating, note, backfilled,
                                  date_precision)
    values (p_item, v_uid, least(coalesce(v_started, v_on), v_on), v_on, 'read', p_rating, p_note, p_backfill, v_prec);
  end if;

  if p_return_loan then
    update loans set returned_on = v_on where item_id = p_item and returned_on is null;
  end if;
end $$;


create or replace function public.log_viewing(p_id uuid, p_item uuid, p_on date, p_rating numeric, p_note text,
                                              p_backfill boolean default false, p_precision text default null)
returns void language plpgsql security invoker set search_path = public as $$
declare v_on date := coalesce(p_on, local_today()); v_last date;
begin
  if exists (select 1 from watch_logs where id = p_id) then return; end if;
  select finished_at into v_last from items where id = p_item and kind = 'movie' for update;
  if not found then raise exception 'movie not found'; end if;

  insert into watch_logs (id, item_id, user_id, watched_on, rating, note, backfilled, date_precision)
  values (p_id, p_item, auth.uid(), v_on, p_rating, p_note, p_backfill, when_precision(p_backfill, p_precision));

  update items set status = 'watched',
    finished_at = greatest(coalesce(finished_at, v_on), v_on),
    finished_precision = case when v_last is null or v_on >= v_last then when_precision(p_backfill, p_precision)
                              else finished_precision end,
    rating = case when v_last is null or v_on >= v_last then coalesce(p_rating, rating) else rating end
  where id = p_item;
end $$;


create or replace function public.mark_episodes(p_item uuid, p_season int, p_episodes int[], p_watched boolean,
                                                p_backfill boolean default false, p_on date default null,
                                                p_precision text default null, p_at timestamptz default null,
                                                p_source text default 'tick')
returns void language plpgsql security invoker set search_path = public as $$
declare
  v_prec text := when_precision(p_backfill, p_precision);
  v_at timestamptz := case when coalesce(p_backfill, false) then when_at(p_backfill, v_prec, p_on) else tap_time(p_at) end;
  v_source text := case when p_source in ('tick', 'widget', 'season', 'show') then p_source else 'tick' end;
begin
  if not exists (select 1 from items where id = p_item and kind = 'show') then raise exception 'show not found'; end if;
  if p_watched then
    insert into episode_watches (item_id, user_id, season, episode, watched_at, backfilled, date_precision, source)
    select p_item, auth.uid(), p_season, e, v_at, p_backfill, v_prec, v_source
    from unnest(p_episodes) as e
    on conflict do nothing;
    update items set status = 'watching', started_at = coalesce(started_at, local_today())
      where id = p_item and status = 'watchlist';
  else
    delete from episode_watches where item_id = p_item and season = p_season and episode = any (p_episodes);
  end if;
  update items set updated_at = now() where id = p_item;     -- "Recently updated" follows ticks
end $$;


create or replace function public.mark_show_watched(p_item uuid, p_backfill boolean default false,
                                                    p_on date default null, p_precision text default null,
                                                    p_force_watched boolean default false)
returns void language plpgsql security invoker set search_path = public as $$
declare
  v_tmdb int; v_status text; v_inc boolean; v_watched boolean;
  v_prec text := when_precision(p_backfill, p_precision);
  v_on date := case when coalesce(p_backfill, false) and v_prec is not null and p_on is not null then p_on
                    else local_today() end;
begin
  select tmdb_id, tmdb_status into v_tmdb, v_status from shows where item_id = p_item;
  if not found then raise exception 'show not found'; end if;
  v_inc := coalesce((select include_specials from profiles where id = auth.uid()), false);
  v_watched := coalesce(p_force_watched, false) or coalesce(v_status in ('Ended', 'Canceled'), false);

  insert into episode_watches (item_id, user_id, season, episode, watched_at, backfilled, date_precision, source)
  select p_item, auth.uid(), e.season, e.episode, when_at(p_backfill, v_prec, p_on), p_backfill, v_prec, 'show'
  from tmdb_episodes e
  where e.tmdb_show_id = v_tmdb and e.air_date <= local_today() and (e.season > 0 or v_inc)
  on conflict do nothing;

  update items set
    status = case when v_watched then 'watched'::item_status else 'watching'::item_status end,
    started_at = least(coalesce(started_at, v_on), v_on),
    finished_at = case when p_force_watched then v_on
                       when v_watched then coalesce(finished_at, v_on) else finished_at end,
    finished_precision = case when p_force_watched or (v_watched and finished_at is null) then v_prec
                              else finished_precision end
  where id = p_item;
end $$;


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
  update items set updated_at = now() where id = p_item;     -- "Recently updated" follows page logs
end $$;


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
    finished_precision = case when p_status = 'watched' then 'day' else finished_precision end,
    started_at = case when p_status = 'watching' then coalesce(started_at, v_on) else started_at end
  where id = p_item;
end $$;


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
  v_backfill boolean := coalesce((p->>'backfill')::boolean, false);
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
                     started_at, finished_at, finished_precision)
  values (v_id, v_uid, v_kind, v_status, p->>'title', nullif(p->>'title_native', ''), p->>'poster_path',
          p->>'backdrop_path', case when v_status = 'watched' then (p->>'rating')::numeric end,
          case when v_status = 'watching' then local_today() end,
          case when v_status = 'watched' then v_watched_on end,
          case when v_status = 'watched' then when_precision(v_backfill, p->>'precision') else 'day' end);

  if v_kind = 'movie' then
    insert into movies (item_id, user_id, tmdb_id, release_year, runtime_min, genres, overview,
                        tmdb_collection_id, tmdb_collection_name)
    values (v_id, v_uid, v_tmdb, (p->>'release_year')::int, (p->>'runtime_min')::int,
            coalesce(array(select jsonb_array_elements_text(p->'genres')), '{}'), p->>'overview',
            (p->>'tmdb_collection_id')::int, p->>'tmdb_collection_name');
    if v_status = 'watched' then
      insert into watch_logs (item_id, user_id, watched_on, rating, backfilled, date_precision)
      values (v_id, v_uid, v_watched_on, (p->>'rating')::numeric, v_backfill,
              when_precision(v_backfill, p->>'precision'));
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


create or replace function public.home_stats() returns jsonb
language sql stable security invoker set search_path = public as $$
  with b as (
    select (date_trunc('month', now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo') as month_start,
           (date_trunc('week', now() at time zone 'Asia/Colombo') at time zone 'Asia/Colombo') as week_start,
           make_date(extract(year from local_today())::int, 1, 1) as year_start
  )
  select jsonb_build_object(
    'pages_this_month', pages_read_between(b.month_start, now() + interval '1 second', 'month'),
    'books_this_month', (select count(*) from reading_sessions s
                          where s.user_id = auth.uid() and s.outcome = 'read'
                            and s.finished_at >= (b.month_start at time zone 'Asia/Colombo')::date
                            and counts_in(s.date_precision, 'month')),
    'books_finished_this_year', (select count(*) from reading_sessions s
                                  where s.user_id = auth.uid() and s.outcome = 'read' and s.finished_at >= b.year_start
                                    and counts_in(s.date_precision, 'year')),
    'episodes_this_week', (select count(*) from episode_watches w
                            where w.user_id = auth.uid() and w.watched_at >= b.week_start
                              and counts_in(w.date_precision, 'week'))
  ) from b;
$$;

