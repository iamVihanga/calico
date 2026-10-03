-- "A while ago" with a date: each precision counts only in periods it can be placed in.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values ('dddddddd-0000-4000-8000-0000000000d1', 'when@test.local');
insert into tmdb_episodes (tmdb_show_id, season, episode, name, air_date) values
  (601, 1, 1, 'Pilot', '2020-01-02'),
  (601, 1, 2, 'Two', '2020-01-09'),
  (601, 2, 1, 'Later', '2099-01-01'),
  (602, 1, 1, 'Pilot', '2020-01-02');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-4000-8000-0000000000d1","role":"authenticated"}', true);

-- Books: one read "2024" (year only), one read this month (month only).
select create_book('{"id":"d1000000-0000-4000-8000-000000000001","status":"to_read","title":"Old","total_pages":300}'::jsonb);
select create_book('{"id":"d1000000-0000-4000-8000-000000000002","status":"to_read","title":"Month","total_pages":120}'::jsonb);
select finish_book('d1000000-0000-4000-8000-000000000001', '2024-01-01', null, null, false, true, 'year');
select finish_book('d1000000-0000-4000-8000-000000000002', date_trunc('month', local_today())::date, null, null, false,
                   true, 'month');
select is((year_stats(2024)->>'books_finished')::int, 1, 'a book read in 2024 counts in 2024');
select is((year_stats(2024)->>'pages_read')::int, 300, 'with all its pages, in 2024');
select is((home_stats()->>'books_finished_this_year')::int, 1, 'only the month one counts this year');
select is((home_stats()->>'pages_this_month')::int, 120, 'a month-dated read counts in that month''s pages');
select is((select started_at from reading_sessions where item_id = 'd1000000-0000-4000-8000-000000000001'),
  '2024-01-01'::date, 'the session starts no later than it finished');
select is(year_stats(extract(year from local_today())::int)->'fastest_read', 'null'::jsonb,
  'a read without real days is never the fastest');

-- Movies: watched in 2023 (year), and some time unknown.
insert into items (id, kind, status, title) values ('d2000000-0000-4000-8000-000000000001', 'movie', 'watchlist', 'Film');
insert into movies (item_id, tmdb_id) values ('d2000000-0000-4000-8000-000000000001', 9101);
select log_viewing('d3000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', '2023-01-01', null,
                   null, true, 'year');
select log_viewing('d3000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000001', null, null, null,
                   true, null);
select is((year_stats(2023)->>'viewings')::int, 1, 'a film watched "2023" counts in 2023');
select is((year_stats(extract(year from local_today())::int)->>'viewings')::int, 0, 'an undated one counts nowhere');

-- A running show switched to Watched by hand, watched on a known day.
insert into items (id, kind, status, title) values ('d4000000-0000-4000-8000-000000000001', 'show', 'watching', 'Show');
insert into shows (item_id, tmdb_id, tmdb_status) values ('d4000000-0000-4000-8000-000000000001', 601, 'Returning Series');
select mark_show_watched('d4000000-0000-4000-8000-000000000001', true, '2025-06-15', 'day', true);
select is((select status::text from items where id = 'd4000000-0000-4000-8000-000000000001'), 'watched',
  'Watched by hand stays Watched even while the show airs');
select is((select finished_at from items where id = 'd4000000-0000-4000-8000-000000000001'), '2025-06-15'::date,
  'finished on the day chosen');
select is((year_stats(2025)->>'episodes_watched')::int, 2, 'its aired episodes count in 2025');

-- Episodes dated this month (month precision) are not "this week".
insert into items (id, kind, status, title) values ('d4000000-0000-4000-8000-000000000002', 'show', 'watchlist', 'Other');
insert into shows (item_id, tmdb_id, tmdb_status) values ('d4000000-0000-4000-8000-000000000002', 602, 'Ended');
select mark_season('d4000000-0000-4000-8000-000000000002', 1, true, date_trunc('month', local_today())::date, 'month');
select is((home_stats()->>'episodes_this_week')::int, 0, 'month-dated episodes are not this week');

select * from finish();
rollback;
