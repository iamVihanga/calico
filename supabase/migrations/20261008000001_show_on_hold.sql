-- "On hold": a show you're watching but have paused stays out of Home's Continue watching, the Next episode
-- widget and watch-time nudges (still Watching in the Library). Ticking an episode brings it back.

alter table public.shows add column on_hold boolean not null default false;

create or replace function public.set_show_on_hold(p_item uuid, p_on boolean)
returns void language plpgsql security invoker set search_path = public as $$
begin
  update shows set on_hold = coalesce(p_on, false) where item_id = p_item;
  if not found then raise exception 'show not found'; end if;
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
    update shows set on_hold = false where item_id = p_item and on_hold;   -- watching again: back on Home
  else
    delete from episode_watches where item_id = p_item and season = p_season and episode = any (p_episodes);
  end if;
  update items set updated_at = now() where id = p_item;     -- "Recently updated" follows ticks
end $$;
