-- "A while ago" (backfilled) activity stays out of period stats; mark_show_watched; loan borrowed dates.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email) values ('bbbbbbbb-0000-4000-8000-0000000000f1', 'backfill@test.local');
-- Shared episode cache (written by the service role in production).
insert into tmdb_episodes (tmdb_show_id, season, episode, name, air_date) values
  (501, 0, 1, 'Special', '2020-01-01'),
  (501, 1, 1, 'Pilot', '2020-01-02'),
  (501, 1, 2, 'Two', '2020-01-09'),
  (501, 2, 1, 'Later', '2020-06-01'),
  (502, 1, 1, 'Pilot', '2024-01-01'),
  (502, 1, 2, 'Soon', '2099-01-01');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-0000000000f1","role":"authenticated"}', true);

-- Books: one read long ago, one just now.
select create_book('{"id":"b1000000-0000-4000-8000-000000000001","status":"reading","title":"Old","total_pages":300}'::jsonb);
select create_book('{"id":"b1000000-0000-4000-8000-000000000002","status":"reading","title":"New","total_pages":200}'::jsonb);
-- One transaction has one now(): move the starting page logs a second back so they sort first.
reset role;
update page_logs set logged_at = logged_at - interval '1 second';
set local role authenticated;
select finish_book('b1000000-0000-4000-8000-000000000001', null, null, null, false, true);
select finish_book('b1000000-0000-4000-8000-000000000002', null, null, null, false);
select is((home_stats()->>'books_finished_this_year')::int, 1, 'a book finished a while ago is not counted this year');
select is((home_stats()->>'pages_this_month')::int, 200, 'its pages are not counted this month');
select is((select count(*)::int from reading_sessions where outcome = 'read'), 2, 'both are still in the reading history');
select is((year_stats(extract(year from local_today())::int)->>'books_finished')::int, 1, 'Your year counts only the live one');

-- Movies.
insert into items (id, kind, status, title) values
  ('b2000000-0000-4000-8000-000000000001', 'movie', 'watchlist', 'Old film'),
  ('b2000000-0000-4000-8000-000000000002', 'movie', 'watchlist', 'New film');
insert into movies (item_id, tmdb_id) values ('b2000000-0000-4000-8000-000000000001', 9001), ('b2000000-0000-4000-8000-000000000002', 9002);
select log_viewing('b3000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', null, null, null, true);
select log_viewing('b3000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000002', null, null, null);
select is((year_stats(extract(year from local_today())::int)->>'viewings')::int, 1, 'a film watched a while ago is not a viewing this year');
select add_tmdb_item('{"id":"b2000000-0000-4000-8000-000000000003","kind":"movie","status":"watched","title":"Added old",
  "tmdb_id":9003,"backfill":true}'::jsonb);
select is((year_stats(extract(year from local_today())::int)->>'viewings')::int, 1, 'a film added as watched a while ago is not counted either');

-- Shows: already watched, a while ago.
insert into items (id, kind, status, title) values
  ('b4000000-0000-4000-8000-000000000001', 'show', 'watchlist', 'Ended show'),
  ('b4000000-0000-4000-8000-000000000002', 'show', 'watchlist', 'Running show');
insert into shows (item_id, tmdb_id, tmdb_status) values
  ('b4000000-0000-4000-8000-000000000001', 501, 'Ended'),
  ('b4000000-0000-4000-8000-000000000002', 502, 'Returning Series');
select mark_show_watched('b4000000-0000-4000-8000-000000000001', true);
select mark_show_watched('b4000000-0000-4000-8000-000000000001', true);
select is((select count(*)::int from episode_watches where item_id = 'b4000000-0000-4000-8000-000000000001'), 3,
  'every aired regular episode is marked once (specials excluded by default)');
select is((select status::text from items where id = 'b4000000-0000-4000-8000-000000000001'), 'watched', 'an ended show becomes Watched');
select is((home_stats()->>'episodes_this_week')::int, 0, 'episodes watched a while ago are not this week');
select mark_show_watched('b4000000-0000-4000-8000-000000000002');
select is((select status::text from items where id = 'b4000000-0000-4000-8000-000000000002'), 'watching',
  'a show still airing stays Watching (caught up)');
select is((select count(*)::int from episode_watches where item_id = 'b4000000-0000-4000-8000-000000000002'), 1,
  'unaired episodes are not marked');
select is((home_stats()->>'episodes_this_week')::int, 1, 'marked just now counts');

-- Loans: fix the borrowed date.
select add_loan('{"id":"b5000000-0000-4000-8000-000000000001","item_id":"b1000000-0000-4000-8000-000000000002",
  "party":"Colombo Public Library","due_on":"2099-01-01"}'::jsonb);
select set_loan_borrowed_on('b5000000-0000-4000-8000-000000000001', local_today() - 5);
select is((select borrowed_on from loans where id = 'b5000000-0000-4000-8000-000000000001'), local_today() - 5, 'borrowed date moved back');
select throws_ok($$ select set_loan_borrowed_on('b5000000-0000-4000-8000-000000000001', local_today() + 1) $$,
  '22023', 'borrowed date is in the future', 'not in the future');
select throws_ok($$ select set_loan_borrowed_on('b5000000-0000-4000-8000-000000000001', '2099-02-01') $$,
  '22023', null, 'not after the due date');

select * from finish();
rollback;
