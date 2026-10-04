-- Watch-time habits: the tap time is kept (within reason), marks say where they came from, and
-- watch_sessions() returns single ticks only, one per show per hour.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values ('eeeeeeee-0000-4000-8000-0000000000e1', 'habits@test.local');
insert into tmdb_episodes (tmdb_show_id, season, episode, name, air_date) values
  (701, 1, 1, 'One', '2020-01-01'), (701, 1, 2, 'Two', '2020-01-08'), (701, 1, 3, 'Three', '2020-01-15'),
  (701, 1, 4, 'Four', '2020-01-22'), (701, 2, 1, 'Five', '2020-06-01'), (701, 2, 2, 'Six', '2020-06-08');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-4000-8000-0000000000e1","role":"authenticated"}', true);
insert into items (id, kind, status, title) values ('e1000000-0000-4000-8000-000000000001', 'show', 'watching', 'Habit show');
insert into shows (item_id, tmdb_id) values ('e1000000-0000-4000-8000-000000000001', 701);

-- A tick made two hours ago (replayed now) keeps its own time; future or very old times fall back to now.
select mark_episodes('e1000000-0000-4000-8000-000000000001', 1, '{1}', true, false, null, null, now() - interval '2 hours');
select is((select watched_at from episode_watches where episode = 1 and season = 1), now() - interval '2 hours',
  'an offline tick keeps the moment it was made');
select mark_episodes('e1000000-0000-4000-8000-000000000001', 1, '{2}', true, false, null, null, now() + interval '1 day');
select is((select watched_at from episode_watches where episode = 2 and season = 1), now(), 'a time in the future is ignored');
select mark_episodes('e1000000-0000-4000-8000-000000000001', 1, '{3}', true, false, null, null, now() - interval '30 days');
select is((select watched_at from episode_watches where episode = 3 and season = 1), now(), 'a time weeks old is ignored');
select mark_episodes('e1000000-0000-4000-8000-000000000001', 1, '{4}', true, false, null, null,
  now() - interval '2 hours' + interval '1 minute', 'widget');
select is((select source from episode_watches where episode = 4 and season = 1), 'widget', 'the widget tick says so');

-- Mark all and Already watched aren't habit ticks.
select mark_season('e1000000-0000-4000-8000-000000000001', 2);
select is((select count(*)::int from episode_watches where season = 2 and source = 'season'), 2, 'Mark all is marked as a season');
delete from episode_watches where season = 2;
select mark_show_watched('e1000000-0000-4000-8000-000000000001', false);
select is((select count(*)::int from episode_watches where season = 2 and source = 'show'), 2, 'Already watched is marked as the show');

-- Sessions: episodes 1 and 4 in the same hour count once; 2 and 3 (now) another; season/show rows not at all.
select is((select count(*)::int from watch_sessions()), 2, 'one session per show per hour, single ticks only');
select is((select min(at) from watch_sessions()), now() - interval '2 hours', 'a session starts at its earliest tick');
update items set status = 'watched' where id = 'e1000000-0000-4000-8000-000000000001';
select is((select count(*)::int from watch_sessions()), 0, 'only shows being watched');

select is((select watch_nudges from profiles where id = 'eeeeeeee-0000-4000-8000-0000000000e1'), false,
  'nudges are off until the user says yes');

select * from finish();
rollback;
