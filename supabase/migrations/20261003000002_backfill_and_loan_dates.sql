-- "A while ago": things finished before they were added to Calico. They stay in the library,
-- history and totals, but never count in week / month / year stats (home_stats, year_stats,
-- pages_read_between). Plus: mark a whole show watched, and fix a loan's borrowed date.

alter table public.reading_sessions add column backfilled boolean not null default false;
alter table public.page_logs add column backfilled boolean not null default false;
alter table public.watch_logs add column backfilled boolean not null default false;
alter table public.episode_watches add column backfilled boolean not null default false;

-- New optional p_backfill parameter: drop the old signatures so RPC calls stay unambiguous.
drop function public.finish_book(uuid, date, numeric, text, boolean);
drop function public.log_viewing(uuid, uuid, date, numeric, text);
drop function public.mark_season(uuid, int);
drop function public.mark_episodes(uuid, int, int[], boolean);

create or replace function public.finish_book(p_item uuid, p_on date, p_rating numeric, p_note text, p_return_loan boolean,
                                              p_backfill boolean default false)
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
    insert into page_logs (item_id, user_id, page, backfilled) values (p_item, v_uid, v_total, p_backfill);
  end if;

  update reading_sessions set outcome = 'read', finished_at = v_on, rating = p_rating, note = p_note,
    backfilled = p_backfill
    where item_id = p_item and outcome = 'reading';
  if not found then                                                           -- finished without a session
    insert into reading_sessions (item_id, user_id, started_at, finished_at, outcome, rating, note, backfilled)
    values (p_item, v_uid, least(coalesce(v_started, v_on), v_on), v_on, 'read', p_rating, p_note, p_backfill);
  end if;

  if p_return_loan then
    update loans set returned_on = v_on where item_id = p_item and returned_on is null;
  end if;
end $$;

create or replace function public.log_viewing(p_id uuid, p_item uuid, p_on date, p_rating numeric, p_note text,
                                              p_backfill boolean default false)
returns void language plpgsql security invoker set search_path = public as $$
declare v_on date := coalesce(p_on, local_today()); v_last date;
begin
  if exists (select 1 from watch_logs where id = p_id) then return; end if;
  select finished_at into v_last from items where id = p_item and kind = 'movie' for update;
  if not found then raise exception 'movie not found'; end if;

  insert into watch_logs (id, item_id, user_id, watched_on, rating, note, backfilled)
  values (p_id, p_item, auth.uid(), v_on, p_rating, p_note, p_backfill);

  update items set status = 'watched',
    finished_at = greatest(coalesce(finished_at, v_on), v_on),
    rating = case when v_last is null or v_on >= v_last then coalesce(p_rating, rating) else rating end
  where id = p_item;
end $$;

create or replace function public.mark_episodes(p_item uuid, p_season int, p_episodes int[], p_watched boolean,
                                                p_backfill boolean default false)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not exists (select 1 from items where id = p_item and kind = 'show') then raise exception 'show not found'; end if;
  if p_watched then
    insert into episode_watches (item_id, user_id, season, episode, backfilled)
    select p_item, auth.uid(), p_season, e, p_backfill from unnest(p_episodes) as e
    on conflict do nothing;
    update items set status = 'watching', started_at = coalesce(started_at, local_today())
      where id = p_item and status = 'watchlist';
  else
    delete from episode_watches where item_id = p_item and season = p_season and episode = any (p_episodes);
  end if;
end $$;

create or replace function public.mark_season(p_item uuid, p_season int, p_backfill boolean default false)
returns void language plpgsql security invoker set search_path = public as $$
declare v_tmdb int;
begin
  select tmdb_id into v_tmdb from shows where item_id = p_item;
  if not found then raise exception 'show not found'; end if;
  perform mark_episodes(p_item, p_season,
    array(select episode from tmdb_episodes
          where tmdb_show_id = v_tmdb and season = p_season and air_date <= local_today()
          order by episode),
    true, p_backfill);
end $$;

-- "Already watched" on a show: every aired episode (specials too if the profile includes them).
-- Ended or cancelled shows become Watched; shows still airing stay Watching, caught up.
create or replace function public.mark_show_watched(p_item uuid, p_backfill boolean default false)
returns void language plpgsql security invoker set search_path = public as $$
declare v_tmdb int; v_status text; v_inc boolean; v_ended boolean;
begin
  select tmdb_id, tmdb_status into v_tmdb, v_status from shows where item_id = p_item;
  if not found then raise exception 'show not found'; end if;
  v_inc := coalesce((select include_specials from profiles where id = auth.uid()), false);
  v_ended := coalesce(v_status in ('Ended', 'Canceled'), false);

  insert into episode_watches (item_id, user_id, season, episode, backfilled)
  select p_item, auth.uid(), e.season, e.episode, p_backfill
  from tmdb_episodes e
  where e.tmdb_show_id = v_tmdb and e.air_date <= local_today() and (e.season > 0 or v_inc)
  on conflict do nothing;

  update items set
    status = case when v_ended then 'watched'::item_status else 'watching'::item_status end,
    started_at = coalesce(started_at, local_today()),
    finished_at = case when v_ended then coalesce(finished_at, local_today()) else finished_at end
  where id = p_item;
end $$;

-- Fix the borrowed date of a loan added late (not in the future, not after the due date).
create or replace function public.set_loan_borrowed_on(p_loan uuid, p_on date)
returns void language plpgsql security invoker set search_path = public as $$
declare v_due date;
begin
  select due_on into v_due from loans where id = p_loan for update;
  if not found then raise exception 'loan not found'; end if;
  if p_on > local_today() then raise exception 'borrowed date is in the future' using errcode = '22023'; end if;
  if v_due is not null and p_on > v_due then
    raise exception 'borrowed date is after the due date' using errcode = '22023';
  end if;
  update loans set borrowed_on = p_on where id = p_loan;
end $$;

create or replace function public.pages_read_between(p_from timestamptz, p_to timestamptz) returns int
language sql stable security invoker set search_path = public as $$
  select coalesce(sum(greatest(d, 0)), 0)::int from (
    select page - lag(page) over (partition by item_id order by logged_at, id) as d
    from page_logs
    where user_id = auth.uid() and logged_at >= p_from and logged_at < p_to and not backfilled
  ) x;
$$;

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
                                  where s.user_id = auth.uid() and s.outcome = 'read' and s.finished_at >= b.year_start
                                    and not s.backfilled),
    'episodes_this_week', (select count(*) from episode_watches w
                            where w.user_id = auth.uid() and w.watched_at >= b.week_start and not w.backfilled)
  ) from b;
$$;

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
      and not s.backfilled
  ),
  views as (
    select l.item_id, m.runtime_min from watch_logs l join movies m on m.item_id = l.item_id, w
    where l.user_id = auth.uid() and l.watched_on >= w.d_from and l.watched_on < w.d_to and not l.backfilled
  ),
  eps as (
    select e.item_id, coalesce(t.runtime_min, 45) as runtime_min
    from episode_watches e
    join shows sh on sh.item_id = e.item_id
    left join tmdb_episodes t on t.tmdb_show_id = sh.tmdb_id and t.season = e.season and t.episode = e.episode, w
    where e.user_id = auth.uid() and e.watched_at >= w.t_from and e.watched_at < w.t_to and not e.backfilled
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

-- A movie added as already watched a while ago: its first viewing is backfilled (p->>'backfill').
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
      insert into watch_logs (item_id, user_id, watched_on, rating, backfilled)
      values (v_id, v_uid, v_watched_on, (p->>'rating')::numeric, coalesce((p->>'backfill')::boolean, false));
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
