-- finished_precision follows how a finish was given; ticks and page logs bump updated_at; books_this_month.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values ('a7000000-0000-4000-8000-0000000000a7', 'precision@test.local');
insert into tmdb_episodes (tmdb_show_id, season, episode, name, air_date) values (801, 1, 1, 'Pilot', '2020-01-01');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a7000000-0000-4000-8000-0000000000a7","role":"authenticated"}', true);

select create_book('{"id":"a7100000-0000-4000-8000-000000000001","status":"reading","title":"Old","total_pages":100}'::jsonb);
select create_book('{"id":"a7100000-0000-4000-8000-000000000002","status":"reading","title":"Now","total_pages":100}'::jsonb);
select finish_book('a7100000-0000-4000-8000-000000000001', '2024-01-01', null, null, false, true, 'year');
select finish_book('a7100000-0000-4000-8000-000000000002', null, null, null, false);
select is((select finished_precision from items where id = 'a7100000-0000-4000-8000-000000000001'), 'year', 'a book read "2024"');
select is((select finished_precision from items where id = 'a7100000-0000-4000-8000-000000000002'), 'day', 'a book read just now');
select is((home_stats()->>'books_this_month')::int, 1, 'books this month: only the one with a date this month');

insert into items (id, kind, status, title) values ('a7200000-0000-4000-8000-000000000001', 'movie', 'watchlist', 'Film');
insert into movies (item_id, tmdb_id) values ('a7200000-0000-4000-8000-000000000001', 9301);
select log_viewing('a7300000-0000-4000-8000-000000000001', 'a7200000-0000-4000-8000-000000000001', null, null, null, true, null);
select is((select finished_precision from items where id = 'a7200000-0000-4000-8000-000000000001'), null,
  'a film watched a while ago with no date');
select add_tmdb_item('{"id":"a7200000-0000-4000-8000-000000000002","kind":"movie","status":"watched","title":"Added",
  "tmdb_id":9302,"watched_on":"2023-05-01","backfill":true,"precision":"month"}'::jsonb);
select is((select finished_precision from items where id = 'a7200000-0000-4000-8000-000000000002'), 'month',
  'a film added as watched in May 2023');

insert into items (id, kind, status, title) values ('a7400000-0000-4000-8000-000000000001', 'show', 'watching', 'Show');
insert into shows (item_id, tmdb_id, tmdb_status) values ('a7400000-0000-4000-8000-000000000001', 801, 'Returning Series');
select mark_show_watched('a7400000-0000-4000-8000-000000000001', true, '2022-01-01', 'year', true);
select is((select finished_precision from items where id = 'a7400000-0000-4000-8000-000000000001'), 'year', 'a show watched "2022"');
select set_item_status('a7400000-0000-4000-8000-000000000001', 'watching');
select set_item_status('a7400000-0000-4000-8000-000000000001', 'watched');
select is((select finished_precision from items where id = 'a7400000-0000-4000-8000-000000000001'), 'day', 'Watched by status: today');

-- An old updated_at (the trigger would reset it within this transaction, so turn it off for the setup).
reset role;
alter table items disable trigger items_updated;
update items set updated_at = '2020-01-01' where id in ('a7400000-0000-4000-8000-000000000001', 'a7100000-0000-4000-8000-000000000002');
alter table items enable trigger items_updated;
set local role authenticated;
select mark_episodes('a7400000-0000-4000-8000-000000000001', 1, '{1}', false);
select ok((select updated_at from items where id = 'a7400000-0000-4000-8000-000000000001') > '2021-01-01',
  'an episode tick moves the show up in Recently updated');
select set_book_status('a7100000-0000-4000-8000-000000000002', 'reading');
reset role;
alter table items disable trigger items_updated;
update items set updated_at = '2020-01-01' where id = 'a7100000-0000-4000-8000-000000000002';
alter table items enable trigger items_updated;
set local role authenticated;
select log_page('a7100000-0000-4000-8000-000000000002', 10, 'a7500000-0000-4000-8000-000000000001');
select ok((select updated_at from items where id = 'a7100000-0000-4000-8000-000000000002') > '2021-01-01',
  'a page log moves the book up too');

select is((select home_stat from profiles where id = 'a7000000-0000-4000-8000-0000000000a7'), 'books', 'Home shows books by default');
select throws_ok($$update profiles set home_stat = 'minutes'$$, '23514', null, 'only books or pages');

select * from finish();
rollback;
