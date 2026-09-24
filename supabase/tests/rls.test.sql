-- RLS isolation: user B can't see, change or attach to anything of user A's (docs/build-plan.md §7.6).
begin;
create extension if not exists pgtap with schema extensions;
select plan(47);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@test.local');

-- User A creates one row in every user table --------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

select create_book(jsonb_build_object(
  'id', 'a0000000-0000-4000-8000-00000000000b', 'status', 'reading', 'title', 'A book', 'total_pages', 300,
  'current_page', 10, 'loan', jsonb_build_object('id', 'a0000000-0000-4000-8000-00000000001a', 'party', 'Library',
  'borrowed_on', '2026-09-01', 'due_on', '2026-09-30'), 'up_next_position', 'a0'));
select add_tmdb_item(jsonb_build_object('id', 'a0000000-0000-4000-8000-00000000000c', 'kind', 'movie',
  'status', 'watched', 'title', 'A movie', 'tmdb_id', 1, 'rating', 4));
select add_tmdb_item(jsonb_build_object('id', 'a0000000-0000-4000-8000-00000000000d', 'kind', 'show',
  'status', 'watchlist', 'title', 'A show', 'tmdb_id', 2));
select mark_episodes('a0000000-0000-4000-8000-00000000000d', 1, array[1], true);
insert into collections (id, name, position) values ('a0000000-0000-4000-8000-0000000000c1', 'A list', 'a0');
select add_to_collection('a0000000-0000-4000-8000-0000000000c1', array['a0000000-0000-4000-8000-00000000000b'::uuid], array['a0']);
insert into storage.objects (bucket_id, name) values ('covers', 'aaaaaaaa-0000-4000-8000-000000000001/a0000000-0000-4000-8000-00000000000b/front.jpg');

select is((select count(*)::int from items), 3, 'A sees own items');
select is((select count(*)::int from page_logs), 1, 'A sees own page log');
select is((select count(*)::int from storage.objects), 1, 'A sees own cover');

-- User B -------------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);

select is((select count(*)::int from profiles), 1, 'B sees only own profile');
select is((select count(*)::int from items), 0, 'B cannot select items');
select is((select count(*)::int from books), 0, 'B cannot select books');
select is((select count(*)::int from reading_sessions), 0, 'B cannot select reading_sessions');
select is((select count(*)::int from page_logs), 0, 'B cannot select page_logs');
select is((select count(*)::int from loans), 0, 'B cannot select loans');
select is((select count(*)::int from movies), 0, 'B cannot select movies');
select is((select count(*)::int from watch_logs), 0, 'B cannot select watch_logs');
select is((select count(*)::int from shows), 0, 'B cannot select shows');
select is((select count(*)::int from episode_watches), 0, 'B cannot select episode_watches');
select is((select count(*)::int from collections), 0, 'B cannot select collections');
select is((select count(*)::int from collection_items), 0, 'B cannot select collection_items');
select is((select count(*)::int from up_next), 0, 'B cannot select up_next');
select is((select count(*)::int from storage.objects), 0, 'B cannot select A''s covers');
select is((select count(*)::int from ai_usage), 0, 'B cannot select ai_usage');

-- Updates and deletes silently match nothing under RLS.
select is_empty($$ update items set title = 'x' returning id $$, 'B cannot update items');
select is_empty($$ update books set author = 'x' returning item_id $$, 'B cannot update books');
select is_empty($$ update loans set party = 'x' returning id $$, 'B cannot update loans');
select is_empty($$ update collections set name = 'x' returning id $$, 'B cannot update collections');
select is_empty($$ update up_next set position = 'z' returning item_id $$, 'B cannot update up_next');
select is_empty($$ update profiles set display_name = 'x' where id = 'aaaaaaaa-0000-4000-8000-000000000001' returning id $$,
  'B cannot update A''s profile');
select is_empty($$ delete from items returning id $$, 'B cannot delete items');
select is_empty($$ delete from page_logs returning id $$, 'B cannot delete page_logs');
select is_empty($$ delete from watch_logs returning id $$, 'B cannot delete watch_logs');
select is_empty($$ delete from episode_watches returning item_id $$, 'B cannot delete episode_watches');
select is_empty($$ delete from collection_items returning item_id $$, 'B cannot delete collection_items');
select is_empty($$ delete from storage.objects returning id $$, 'B cannot delete A''s covers');

-- Attaching rows to A's items fails on the composite foreign key (item_id, user_id).
-- (Uses A's movie/show, which have no existing rows there, so no unique key fires first.)
select throws_ok($$ insert into books (item_id) values ('a0000000-0000-4000-8000-00000000000c') $$, '23503', null,
  'B cannot insert a books row for A''s item');
select throws_ok($$ insert into page_logs (item_id, page) values ('a0000000-0000-4000-8000-00000000000b', 5) $$, '23503', null,
  'B cannot log pages on A''s item');
select throws_ok($$ insert into loans (item_id, party) values ('a0000000-0000-4000-8000-00000000000c', 'x') $$, '23503', null,
  'B cannot add a loan to A''s item');
select throws_ok($$ insert into up_next (item_id, position) values ('a0000000-0000-4000-8000-00000000000d', 'a0') $$, '23503', null,
  'B cannot queue A''s item');
select throws_ok($$ insert into collection_items (collection_id, item_id, position)
                    values ('a0000000-0000-4000-8000-0000000000c1', 'a0000000-0000-4000-8000-00000000000c', 'a0') $$, '23503', null,
  'B cannot add to A''s collection');
select throws_ok($$ insert into items (user_id, kind, status, title)
                    values ('aaaaaaaa-0000-4000-8000-000000000001', 'book', 'to_read', 'x') $$, '42501', null,
  'B cannot insert an item owned by A');

-- RPCs run as the caller, so they can't reach A's rows either.
select throws_ok($$ select log_page('a0000000-0000-4000-8000-00000000000b', 20, gen_random_uuid()) $$, 'P0001', 'book not found',
  'B cannot log_page on A''s book');
select throws_ok($$ select renew_loan('a0000000-0000-4000-8000-00000000001a', '2026-10-30') $$, 'P0001', 'loan not found',
  'B cannot renew A''s loan');
select throws_ok($$ select mark_episodes('a0000000-0000-4000-8000-00000000000d', 1, array[2], true) $$, 'P0001', 'show not found',
  'B cannot mark A''s episodes');
select is((select export_my_data()->'items'), '[]'::jsonb, 'B''s export has none of A''s items');

-- Storage: other users' folders are rejected.
select throws_ok($$ insert into storage.objects (bucket_id, name)
                    values ('covers', 'aaaaaaaa-0000-4000-8000-000000000001/x/front.jpg') $$, '42501', null,
  'B cannot upload into A''s cover folder');
select lives_ok($$ insert into storage.objects (bucket_id, name)
                   values ('covers', 'bbbbbbbb-0000-4000-8000-000000000002/x/front.jpg') $$,
  'B can upload into own cover folder');

-- Shared caches and service-only tables.
select lives_ok($$ select * from tmdb_episodes $$, 'signed-in users can read the episode cache');
select throws_ok($$ insert into tmdb_episodes (tmdb_show_id, season, episode) values (1, 1, 1) $$, '42501', null,
  'signed-in users cannot write the episode cache');
select throws_ok($$ insert into ai_usage (user_id, ok) values ('bbbbbbbb-0000-4000-8000-000000000002', true) $$, '42501', null,
  'signed-in users cannot write ai_usage');

-- anon gets nothing.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select is((select count(*)::int from items), 0, 'anon cannot select items');
select throws_ok($$ select create_book('{}'::jsonb) $$, '42501', null, 'anon cannot call RPCs');

reset role;
select * from finish();
rollback;
