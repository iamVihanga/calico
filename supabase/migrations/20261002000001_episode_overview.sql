-- Episode overviews for the episode sheet on show detail. NULL means "cached before this column
-- existed" (the tmdb function refetches that season once); '' means TMDB has no overview.
alter table public.tmdb_episodes add column overview text;
