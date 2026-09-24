-- RPC behaviour (docs/build-plan.md §14 Database): idempotent replays, backwards page logs,
-- renewals, next episode with specials and unaired episodes, status side effects.
begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

insert into auth.users (id, email) values ('cccccccc-0000-4000-8000-000000000003', 'c@test.local');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-000000000003","role":"authenticated"}', true);

-- create_book ---------------------------------------------------------------------------------
select lives_ok($$ select create_book('{"id":"c0000000-0000-4000-8000-0000000000b1","status":"reading","title":"IT",
  "author":"Stephen King","total_pages":1138,"current_page":400,"up_next_position":"a0",
  "loan":{"id":"c0000000-0000-4000-8000-0000000000f1","party":"Colombo Public Library","borrowed_on":"2026-09-01","due_on":"2026-09-26"}}'::jsonb) $$,
  'create_book with loan and queue position');
select is(create_book('{"id":"c0000000-0000-4000-8000-0000000000b1","status":"reading","title":"IT again"}'::jsonb),
  'c0000000-0000-4000-8000-0000000000b1'::uuid, 'create_book replay returns the same id');
select is((select count(*)::int from items), 1, 'replay does not duplicate the item');
select is((select title from items), 'IT', 'replay does not overwrite');
select is((select count(*)::int from reading_sessions where outcome = 'reading'), 1, 'one open session');
select is((select page from page_logs), 400, 'baseline page log at the current page');
select is((select due_stamps from loans), array['2026-09-26'::date], 'first due stamp recorded');
select is((select count(*)::int from up_next), 1, 'queued');

-- log_page ------------------------------------------------------------------------------------
select log_page('c0000000-0000-4000-8000-0000000000b1', 450, 'c0000000-0000-4000-8000-00000000a001');
select log_page('c0000000-0000-4000-8000-0000000000b1', 450, 'c0000000-0000-4000-8000-00000000a001');
select is((select count(*)::int from page_logs where page = 450), 1, 'log_page replay is a no-op');
select log_page('c0000000-0000-4000-8000-0000000000b1', 430, 'c0000000-0000-4000-8000-00000000a002');
select is((select count(*)::int from page_logs where page > 430), 0, 'going back replaces today''s higher logs');
select is((select current_page from books), 430, 'current page follows the latest log');
select throws_ok($$ select log_page('c0000000-0000-4000-8000-0000000000b1', 2000, gen_random_uuid()) $$, 'P0001',
  'page out of range', 'page beyond the end is rejected');

-- renew_loan / return_loan ---------------------------------------------------------------------
select throws_ok($$ select renew_loan('c0000000-0000-4000-8000-0000000000f1', '2026-09-20') $$, 'P0001',
  'new due date must be after the current one', 'renewing to an earlier date is rejected');
select renew_loan('c0000000-0000-4000-8000-0000000000f1', '2026-10-26');
select renew_loan('c0000000-0000-4000-8000-0000000000f1', '2026-10-26');
select is((select renewal_count from loans), 1, 'renewal replay counts once');
select is((select due_stamps from loans), array['2026-09-26'::date, '2026-10-26'], 'renewal appends a stamp');
select is((select due_on from loans), '2026-10-26'::date, 'due date moved');

-- finish_book + side effects -------------------------------------------------------------------
select finish_book('c0000000-0000-4000-8000-0000000000b1', '2026-10-01', 4.5, 'Loved Derry.', true);
select finish_book('c0000000-0000-4000-8000-0000000000b1', '2026-10-01', 4.5, 'Loved Derry.', true);
select is((select status::text from items), 'read', 'finished');
select is((select current_page from books), 1138, 'finishing jumps to the last page');
select is((select count(*)::int from reading_sessions where outcome = 'read'), 1, 'finish replay closes one session');
select is((select rating from items), 4.5, 'rating saved');
select is((select returned_on from loans), '2026-10-01'::date, 'loan returned with the book');
select is((select count(*)::int from up_next), 0, 'finished books leave Up next');
select throws_ok($$ select renew_loan('c0000000-0000-4000-8000-0000000000f1', '2026-11-26') $$, 'P0001',
  'loan already returned', 'returned loans cannot be renewed');

-- re-read -------------------------------------------------------------------------------------
select set_book_status('c0000000-0000-4000-8000-0000000000b1', 'reading', '2026-11-01');
select is((select current_page from books), 0, 're-read starts from page 0');
select is((select count(*)::int from reading_sessions), 2, 're-read opens a second session');

-- stop_book -----------------------------------------------------------------------------------
select stop_book('c0000000-0000-4000-8000-0000000000b1', 'Not now', true);
select is((select status::text from items), 'to_read', 'Maybe later moves the book to To read');
select is((select outcome from reading_sessions where started_at = '2026-11-01'), 'paused', 'session paused');

-- add_tmdb_item / log_viewing -----------------------------------------------------------------
select is(add_tmdb_item('{"id":"c0000000-0000-4000-8000-0000000000e1","kind":"movie","status":"watched","title":"IT",
  "tmdb_id":346364,"runtime_min":135,"watched_on":"2017-09-22","rating":5}'::jsonb), 'c0000000-0000-4000-8000-0000000000e1'::uuid,
  'movie added');
select is(add_tmdb_item('{"id":"c0000000-0000-4000-8000-0000000000e9","kind":"movie","status":"watchlist","title":"IT",
  "tmdb_id":346364}'::jsonb), 'c0000000-0000-4000-8000-0000000000e1'::uuid, 'same TMDB id returns the existing item');
select log_viewing('c0000000-0000-4000-8000-00000000c001', 'c0000000-0000-4000-8000-0000000000e1', '2026-09-12', 4, 'Still scary.');
select log_viewing('c0000000-0000-4000-8000-00000000c001', 'c0000000-0000-4000-8000-0000000000e1', '2026-09-12', 4, 'Still scary.');
select is((select count(*)::int from watch_logs), 2, 'viewing replay logs once');
select is((select rating from items where id = 'c0000000-0000-4000-8000-0000000000e1'), 4.0, 'latest viewing sets the rating');

-- shows: mark_episodes, show_progress ----------------------------------------------------------
select add_tmdb_item('{"id":"c0000000-0000-4000-8000-0000000000d1","kind":"show","status":"watchlist",
  "title":"House of the Dragon","tmdb_id":990001,"tmdb_status":"Returning Series"}'::jsonb);
reset role;
insert into tmdb_episodes (tmdb_show_id, season, episode, name, air_date) values
  (990001, 0, 1, 'Special', '2022-08-01'),
  (990001, 1, 1, 'The Heirs of the Dragon', '2022-08-21'),
  (990001, 1, 2, 'The Rogue Prince', '2022-08-28'),
  (990001, 2, 1, 'A Son for a Son', '2024-06-16'),
  (990001, 2, 2, 'Rhaenyra the Cruel', local_today() + 30),
  (990001, 3, 1, 'TBA', null);
set local role authenticated;

select is((select next_season * 100 + next_episode from show_progress('c0000000-0000-4000-8000-0000000000d1')), 101,
  'next episode skips specials by default');
update profiles set include_specials = true;
select is((select next_season * 100 + next_episode from show_progress('c0000000-0000-4000-8000-0000000000d1')), 1,
  'specials count when included');
update profiles set include_specials = false;

select mark_season('c0000000-0000-4000-8000-0000000000d1', 1);
select is((select status::text from items where id = 'c0000000-0000-4000-8000-0000000000d1'), 'watching',
  'marking episodes starts a Watchlist show');
select is((select count(*)::int from episode_watches), 2, 'mark_season marks aired episodes only');
select mark_episodes('c0000000-0000-4000-8000-0000000000d1', 2, array[1], true);
select ok((select caught_up and aired = 3 and watched = 3 and total = 5
           from show_progress('c0000000-0000-4000-8000-0000000000d1')),
  'caught up when every aired episode is watched (unaired ones excluded)');

select * from finish();
rollback;
