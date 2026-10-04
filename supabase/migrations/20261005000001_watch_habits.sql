-- Watch-time habits: episode ticks keep the moment they happened (the client's tap time, so an offline
-- tick replayed later isn't dated at the replay) and where they came from. Only single ticks
-- ('tick' from the app, 'widget' from the home screen) say when someone watches; 'season' (Mark all) and
-- 'show' (Already watched / Watched by hand) don't. watch_sessions() hands the app those ticks, one per show
-- per hour, to learn usual watching times on the phone.

alter table public.episode_watches
  add column source text not null default 'tick' check (source in ('tick', 'widget', 'season', 'show'));
-- Earlier "mark all" writes put many rows on one timestamp: those weren't single ticks.
update public.episode_watches w set source = 'season'
  from (select item_id, watched_at from public.episode_watches group by item_id, watched_at having count(*) > 1) bulk
  where w.item_id = bulk.item_id and w.watched_at = bulk.watched_at;
create index episode_watches_user_time_idx on public.episode_watches (user_id, watched_at);

-- Optional personal nudges at the usual watching time (local notifications on the phone).
alter table public.profiles add column watch_nudges boolean not null default false;

-- The tap time, trusted within the last 7 days and not ahead of the server (a wrong phone clock falls back to now).
create or replace function public.tap_time(p_at timestamptz) returns timestamptz
language sql stable set search_path = public as $$
  select case when p_at is not null and p_at <= now() + interval '5 minutes' and p_at >= now() - interval '7 days'
              then least(p_at, now()) else now() end;
$$;

drop function public.mark_episodes(uuid, int, int[], boolean, boolean, date, text);
drop function public.mark_season(uuid, int, boolean, date, text);

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
end $$;

create or replace function public.mark_season(p_item uuid, p_season int, p_backfill boolean default false,
                                              p_on date default null, p_precision text default null)
returns void language plpgsql security invoker set search_path = public as $$
declare v_tmdb int;
begin
  select tmdb_id into v_tmdb from shows where item_id = p_item;
  if not found then raise exception 'show not found'; end if;
  perform mark_episodes(p_item, p_season,
    array(select episode from tmdb_episodes
          where tmdb_show_id = v_tmdb and season = p_season and air_date <= local_today()
          order by episode),
    true, p_backfill, p_on, p_precision, null, 'season');
end $$;

-- Already watched / Watched by hand: marked as 'show', not habit ticks.
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
                       when v_watched then coalesce(finished_at, v_on) else finished_at end
  where id = p_item;
end $$;


-- Single ticks of the last p_days for shows being watched, one per show per Colombo hour (the earliest),
-- live rows only (not "a while ago"). The phone turns these into usual watching times.
create or replace function public.watch_sessions(p_days int default 56)
returns table (item_id uuid, at timestamptz)
language sql stable security invoker set search_path = public as $$
  select w.item_id, min(w.watched_at) as at
  from episode_watches w join items i on i.id = w.item_id
  where w.user_id = auth.uid() and i.status = 'watching'
    and w.source in ('tick', 'widget') and w.date_precision = 'day' and not w.backfilled
    and w.watched_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 56), 1), 365))
  group by w.item_id, date_trunc('hour', w.watched_at at time zone 'Asia/Colombo')
  order by at;
$$;
