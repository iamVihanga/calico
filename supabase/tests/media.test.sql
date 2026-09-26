-- Movies and shows (build plan §11.5, §11.11): next episode out of order, collections from a franchise.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values ('eeeeeeee-0000-4000-8000-000000000005', 'e@test.local');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-4000-8000-000000000005","role":"authenticated"}', true);

select add_tmdb_item('{"id":"e0000000-0000-4000-8000-0000000000d1","kind":"show","status":"watching",
  "title":"Severance","tmdb_id":990002,"tmdb_status":"Returning Series"}'::jsonb);
reset role;
insert into tmdb_episodes (tmdb_show_id, season, episode, name, air_date) values
  (990002, 1, 1, 'Good News About Hell', '2022-02-18'),
  (990002, 1, 2, 'Half Loop', '2022-02-18'),
  (990002, 1, 3, 'In Perpetuity', '2022-02-25'),
  (990002, 2, 1, 'Hello, Ms. Cobel', '2025-01-17');
set local role authenticated;

-- Out of order: S1E1 and S1E3 watched → next is S1E2, not S2E1.
select mark_episodes('e0000000-0000-4000-8000-0000000000d1', 1, array[1, 3], true);
select is((select next_season * 100 + next_episode from show_progress('e0000000-0000-4000-8000-0000000000d1')), 102,
  'the earliest unwatched aired episode is next, even when later ones are watched');
select is((select next_name from show_progress('e0000000-0000-4000-8000-0000000000d1')), 'Half Loop', 'next episode name');
select mark_episodes('e0000000-0000-4000-8000-0000000000d1', 1, array[3], false);
select is((select watched from show_progress('e0000000-0000-4000-8000-0000000000d1')), 1, 'unmarking removes the watch');
select mark_episodes('e0000000-0000-4000-8000-0000000000d1', 1, array[2, 3], true);
select mark_episodes('e0000000-0000-4000-8000-0000000000d1', 1, array[2, 3], true);
select is((select watched from show_progress('e0000000-0000-4000-8000-0000000000d1')), 3, 'marking is idempotent');

-- create_collection ---------------------------------------------------------------------------
select add_tmdb_item('{"id":"e0000000-0000-4000-8000-0000000000e1","kind":"movie","status":"watched","title":"IT","tmdb_id":346364,
  "tmdb_collection_id":477962,"tmdb_collection_name":"IT Collection"}'::jsonb);
select add_tmdb_item('{"id":"e0000000-0000-4000-8000-0000000000e2","kind":"movie","status":"watchlist","title":"IT Chapter Two","tmdb_id":474350,
  "tmdb_collection_id":477962,"tmdb_collection_name":"IT Collection"}'::jsonb);
select create_collection('e0000000-0000-4000-8000-0000000000c1', 'IT Collection', 'a0',
  array['e0000000-0000-4000-8000-0000000000e1', 'e0000000-0000-4000-8000-0000000000e2']::uuid[], array['a0', 'a1']);
select create_collection('e0000000-0000-4000-8000-0000000000c1', 'IT Collection', 'a0',
  array['e0000000-0000-4000-8000-0000000000e1', 'e0000000-0000-4000-8000-0000000000e2']::uuid[], array['a0', 'a1']);
select is((select count(*)::int from collections), 1, 'create_collection replay creates one collection');
select is((select count(*)::int from collection_items), 2, 'with both films');
select is((select string_agg(i.title, ', ' order by ci.position) from collection_items ci join items i on i.id = ci.item_id),
  'IT, IT Chapter Two', 'in the given order');
select throws_ok($$ select create_collection(gen_random_uuid(), 'Bad', 'a1', array[gen_random_uuid()], '{}') $$, 'P0001',
  'items and positions must have the same length', 'positions must match items');

select * from finish();
rollback;
