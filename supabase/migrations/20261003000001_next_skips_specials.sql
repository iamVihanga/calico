-- Next up never points at a special: season 0 sorted before season 1, so with specials included
-- "next" jumped to S0 E1. Specials still count in aired/watched/total.
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
    from eps where not is_watched and air_date <= local_today() and season > 0
    order by eps.item_id, season, episode
  )
  select s.item_id, coalesce(a.aired, 0)::int, coalesce(a.watched, 0)::int, coalesce(a.total, 0)::int,
         n.season, n.episode, n.name, n.still_path, (n.item_id is null), s.next_air_date, s.tmdb_status
  from s left join agg a on a.item_id = s.item_id left join nxt n on n.item_id = s.item_id;
$$;
