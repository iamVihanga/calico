-- Local development seed: one test user with the prototype's sample data (design/unpacked/app.js).
-- Dates are offsets from the prototype's "today" (2026-09-23) applied to local_today(), so loan states
-- (due in 3 days, overdue by 2) look the same whenever the seed runs.
--
-- Sign in locally (dev builds only): dilan@calico.test / calico-dev

do $$
declare
  uid constant uuid := '00000000-0000-4000-8000-00000000d11a';
  t constant date := local_today();
  proto constant date := date '2026-09-23';
begin
  -- Test user (profile is created by the on_auth_user_created trigger) -------------------------
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', 'dilan@calico.test',
          extensions.crypt('calico-dev', extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', '{"full_name":"Dilan Kumara"}', '', '', '', '');
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at)
  values (uid::text, uid, jsonb_build_object('sub', uid::text, 'email', 'dilan@calico.test'), 'email', now());

  update profiles set reading_goal = 24, default_library = 'Colombo Public Library', default_loan_days = 30
    where id = uid;

  -- Seeded rows are written as the user so defaults (auth.uid()) and RLS behave as in the app.
  perform set_config('request.jwt.claims', jsonb_build_object('sub', uid, 'role', 'authenticated')::text, false);
end $$;

-- Deterministic ids: seed_id('madol') etc.
create or replace function pg_temp.seed_id(slug text) returns uuid language sql immutable as
  $$ select md5('calico-seed:' || slug)::uuid $$;
-- Prototype date → same distance from today.
create or replace function pg_temp.d(iso text) returns date language sql stable as
  $$ select local_today() + (iso::date - date '2026-09-23') $$;
-- Evening timestamp in Colombo for a date.
create or replace function pg_temp.at(day date) returns timestamptz language sql immutable as
  $$ select (day + time '21:00') at time zone 'Asia/Colombo' $$;

-- Items ---------------------------------------------------------------------------------------
insert into items (id, user_id, kind, status, title, title_native, rating, started_at, finished_at) values
  (pg_temp.seed_id('madol'),       auth.uid(), 'book', 'reading',   'Madol Doova', 'මඩොල් දූව', null, pg_temp.d('2026-09-09'), null),
  (pg_temp.seed_id('gamperaliya'), auth.uid(), 'book', 'read',      'Gamperaliya', 'ගම්පෙරළිය', 5, date '2024-02-20', date '2024-03-18'),
  (pg_temp.seed_id('it'),          auth.uid(), 'book', 'reading',   'IT', null, null, pg_temp.d('2026-09-02'), null),
  (pg_temp.seed_id('fireblood'),   auth.uid(), 'book', 'to_read',   'Fire & Blood', null, null, null, null),
  (pg_temp.seed_id('maali'),       auth.uid(), 'book', 'wishlist',  'The Seven Moons of Maali Almeida', null, null, null, null),
  (pg_temp.seed_id('shining'),     auth.uid(), 'book', 'abandoned', 'The Shining', null, null, pg_temp.d('2026-07-01'), null),
  (pg_temp.seed_id('hathpana'),    auth.uid(), 'book', 'to_read',   'Hath Pana', 'හත් පණ', null, null, null),
  (pg_temp.seed_id('chinaman'),    auth.uid(), 'book', 'to_read',   'Chinaman', null, null, null, null),
  (pg_temp.seed_id('it2017'),      auth.uid(), 'movie', 'watched',  'IT', null, 4, null, pg_temp.d('2026-09-12')),
  (pg_temp.seed_id('it2'),         auth.uid(), 'movie', 'watchlist','IT Chapter Two', null, null, null, null),
  (pg_temp.seed_id('oppenheimer'), auth.uid(), 'movie', 'watchlist','Oppenheimer', null, null, null, null),
  (pg_temp.seed_id('dune2'),       auth.uid(), 'movie', 'watchlist','Dune: Part Two', null, null, null, null),
  (pg_temp.seed_id('got'),         auth.uid(), 'show', 'watched',   'Game of Thrones', null, null, date '2019-01-10', date '2019-05-20'),
  (pg_temp.seed_id('hotd'),        auth.uid(), 'show', 'watching',  'House of the Dragon', null, null, date '2022-08-22', null),
  (pg_temp.seed_id('derry'),       auth.uid(), 'show', 'watching',  'IT: Welcome to Derry', null, null, pg_temp.d('2026-08-01'), null),
  (pg_temp.seed_id('severance'),   auth.uid(), 'show', 'watchlist', 'Severance', null, null, null, null),
  (pg_temp.seed_id('bear'),        auth.uid(), 'show', 'watchlist', 'The Bear', null, null, null, null);

-- Books ---------------------------------------------------------------------------------------
insert into books (item_id, author, author_native, language, total_pages, current_page, ownership,
                   wishlist_priority, abandon_reason) values
  (pg_temp.seed_id('madol'),       'Martin Wickramasinghe', 'මාර්ටින් වික්‍රමසිංහ', 'Sinhala', 214, 150, 'library', null, null),
  (pg_temp.seed_id('gamperaliya'), 'Martin Wickramasinghe', 'මාර්ටින් වික්‍රමසිංහ', 'Sinhala', 312, 312, 'owned', null, null),
  (pg_temp.seed_id('it'),          'Stephen King', null, 'English', 1138, 412, 'owned', null, null),
  (pg_temp.seed_id('fireblood'),   'George R. R. Martin', null, 'English', 736, 0, 'owned', null, null),
  (pg_temp.seed_id('maali'),       'Shehan Karunatilaka', null, 'English', 400, 0, 'none', 'soon', null),
  (pg_temp.seed_id('shining'),     'Stephen King', null, 'English', 447, 120, 'none', null, 'Library wanted it back'),
  (pg_temp.seed_id('hathpana'),    'Kumaratunga Munidasa', 'කුමාරතුංග මුනිදාස', 'Sinhala', 176, 0, 'library', null, null),
  (pg_temp.seed_id('chinaman'),    'Shehan Karunatilaka', null, 'English', 416, 0, 'owned', null, null);

insert into reading_sessions (item_id, started_at, finished_at, outcome, rating) values
  (pg_temp.seed_id('madol'),       pg_temp.d('2026-09-09'), null, 'reading', null),
  (pg_temp.seed_id('it'),          pg_temp.d('2026-09-02'), null, 'reading', null),
  (pg_temp.seed_id('gamperaliya'), date '2024-02-20', date '2024-03-18', 'read', 5),
  (pg_temp.seed_id('shining'),     pg_temp.d('2026-07-01'), pg_temp.d('2026-08-20'), 'abandoned', null);

-- Page logs: a baseline on the start day, then one log a day for the last 12 days
-- (IT ≈ 35 pages a day, Madol Doova ≈ 12, as in the prototype).
insert into page_logs (item_id, page, logged_at)
select pg_temp.seed_id('it'), 0, pg_temp.at(pg_temp.d('2026-09-02'))
union all
select pg_temp.seed_id('it'), 412 - 35 * n, pg_temp.at(local_today() - n) from generate_series(0, 11) n
union all
select pg_temp.seed_id('madol'), 0, pg_temp.at(pg_temp.d('2026-09-09'))
union all
select pg_temp.seed_id('madol'), 150 - 12 * n, pg_temp.at(local_today() - n) from generate_series(0, 11) n;

-- Loans: Madol Doova due in 3 days; Hath Pana renewed once and overdue by 2 days.
insert into loans (item_id, direction, party, borrowed_on, due_on, due_stamps, renewal_count) values
  (pg_temp.seed_id('madol'), 'borrowed', 'Colombo Public Library', pg_temp.d('2026-09-09'), pg_temp.d('2026-09-26'),
   array[pg_temp.d('2026-09-26')], 0),
  (pg_temp.seed_id('hathpana'), 'borrowed', 'Colombo Public Library', pg_temp.d('2026-08-24'), pg_temp.d('2026-09-21'),
   array[pg_temp.d('2026-09-07'), pg_temp.d('2026-09-21')], 1);

-- Movies --------------------------------------------------------------------------------------
insert into movies (item_id, tmdb_id, release_year, runtime_min, genres, tmdb_collection_id, tmdb_collection_name) values
  (pg_temp.seed_id('it2017'),      346364, 2017, 135, '{Horror}', 477208, 'IT Collection'),
  (pg_temp.seed_id('it2'),         474350, 2019, 169, '{Horror}', 477208, 'IT Collection'),
  (pg_temp.seed_id('oppenheimer'), 872585, 2023, 180, '{Drama,History}', null, null),
  (pg_temp.seed_id('dune2'),       693134, 2024, 166, '{"Science Fiction",Adventure}', 726871, 'Dune Collection');

insert into watch_logs (item_id, watched_on, rating, note) values
  (pg_temp.seed_id('it2017'), pg_temp.d('2026-09-12'), 4, 'Still scary.'),
  (pg_temp.seed_id('it2017'), date '2023-10-31', 4, 'Halloween rewatch.'),
  (pg_temp.seed_id('it2017'), date '2017-09-22', 5, 'Saw it at Savoy.');

-- Shows ---------------------------------------------------------------------------------------
insert into shows (item_id, tmdb_id, first_air_year, network, tmdb_status, number_of_seasons,
                   next_air_date, next_season, next_episode, last_synced_at) values
  (pg_temp.seed_id('got'),       1399,   2011, 'HBO',      'Ended',            8, null, null, null, now()),
  (pg_temp.seed_id('hotd'),      94997,  2022, 'HBO',      'Returning Series', 3, local_today() + 270, 3, 1, now()),
  (pg_temp.seed_id('derry'),     200875, 2026, 'HBO',      'Returning Series', 1, null, null, null, now()),
  (pg_temp.seed_id('severance'), 95396,  2022, 'Apple TV', 'Returning Series', 1, null, null, null, now()),
  (pg_temp.seed_id('bear'),      136315, 2022, 'FX',       'Returning Series', 1, null, null, null, now());

-- Episode cache: season sizes from the prototype. Aired episodes are weekly in the past;
-- House of the Dragon season 3 hasn't aired.
insert into tmdb_episodes (tmdb_show_id, season, episode, name, air_date, vote_average, runtime_min)
select s.tmdb, s.season, e,
       coalesce(names.name, 'Episode ' || e),
       case when s.aired then s.first_air + (e - 1) * 7 end,
       case when s.aired then round((7.2 + ((s.season * 7 + e * 3) % 21) / 10.0)::numeric, 1) end,
       s.runtime
from (values
  (1399, 1, 10, true,  date '2011-04-17', 57), (1399, 2, 10, true, date '2012-04-01', 55),
  (1399, 3, 10, true,  date '2013-03-31', 56), (1399, 4, 10, true, date '2014-04-06', 56),
  (1399, 5, 10, true,  date '2015-04-12', 57), (1399, 6, 10, true, date '2016-04-24', 58),
  (1399, 7, 7,  true,  date '2017-07-16', 62), (1399, 8, 6,  true, date '2019-04-14', 72),
  (94997, 1, 10, true, date '2022-08-21', 64), (94997, 2, 8, true, date '2024-06-16', 62),
  (94997, 3, 8, false, null, 60),
  (200875, 1, 8, true, local_today() - 90, 58),
  (95396, 1, 9, true, date '2022-02-18', 50),
  (136315, 1, 8, true, date '2022-06-23', 30)
) as s(tmdb, season, eps, aired, first_air, runtime)
cross join generate_series(1, s.eps) e
left join (values
  (94997, 1, 1, 'The Heirs of the Dragon'), (94997, 2, 1, 'A Son for a Son'),
  (94997, 2, 5, 'Regent'), (94997, 2, 6, 'Smallfolk')
) as names(tmdb, season, episode, name) on names.tmdb = s.tmdb and names.season = s.season and names.episode = e;

-- Watched: all of Game of Thrones, HotD season 1 + 2×1–4, all of Welcome to Derry season 1.
insert into episode_watches (item_id, season, episode, watched_at)
select pg_temp.seed_id('got'), t.season, t.episode, timestamptz '2019-05-20 21:00+05:30'
  from tmdb_episodes t where t.tmdb_show_id = 1399
union all
select pg_temp.seed_id('hotd'), t.season, t.episode, pg_temp.at(local_today() - 30 + t.episode)
  from tmdb_episodes t where t.tmdb_show_id = 94997 and (t.season = 1 or (t.season = 2 and t.episode <= 4))
union all
select pg_temp.seed_id('derry'), t.season, t.episode, pg_temp.at(local_today() - 20 + t.episode)
  from tmdb_episodes t where t.tmdb_show_id = 200875;

-- Collections ---------------------------------------------------------------------------------
insert into collections (id, name, description, position) values
  (pg_temp.seed_id('c:sk'),      'Stephen King',     'Everything from the King of horror', 'a0'),
  (pg_temp.seed_id('c:grrm'),    'GRRM',             null,                                 'a1'),
  (pg_temp.seed_id('c:sinhala'), 'Sinhala classics', null,                                 'a2');

insert into collection_items (collection_id, item_id, position)
select pg_temp.seed_id('c:' || c), pg_temp.seed_id(slug), 'a' || (ord - 1)
from (values
  ('sk', array['it', 'shining', 'it2017', 'it2', 'derry']),
  ('grrm', array['fireblood', 'got', 'hotd']),
  ('sinhala', array['madol', 'gamperaliya', 'hathpana'])
) as x(c, slugs)
cross join unnest(x.slugs) with ordinality as u(slug, ord);

-- Up next: the prototype's 12-item queue, in order (fractional keys a0…a9, b00, b01).
insert into up_next (item_id, position)
select pg_temp.seed_id(slug), case when ord <= 10 then 'a' || (ord - 1) else 'b0' || (ord - 11) end
from unnest(array['fireblood', 'it2', 'derry', 'hathpana', 'maali', 'shining', 'chinaman',
                  'oppenheimer', 'severance', 'dune2', 'bear', 'gamperaliya']) with ordinality as u(slug, ord);

select set_config('request.jwt.claims', '', false);
