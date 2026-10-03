-- Collection art: a cover of one's own items (cleared when the item goes), or a photo path in one's folder.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email) values
  ('cccccccc-0000-4000-8000-0000000000a1', 'art@test.local'),
  ('cccccccc-0000-4000-8000-0000000000a2', 'other@test.local');
insert into items (id, user_id, kind, status, title) values
  ('c1000000-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-0000000000a1', 'movie', 'watched', 'Mine'),
  ('c1000000-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-0000000000a2', 'movie', 'watched', 'Theirs');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into collections (id, name, position) values ('c2000000-0000-4000-8000-000000000001', 'Favourites', 'a0');

update collections set cover_item_id = 'c1000000-0000-4000-8000-000000000001' where id = 'c2000000-0000-4000-8000-000000000001';
select is((select cover_item_id from collections), 'c1000000-0000-4000-8000-000000000001'::uuid, 'one of its covers can be the art');

select throws_ok(
  $$update collections set cover_item_id = 'c1000000-0000-4000-8000-000000000002'$$,
  '23503', null, 'another user''s item cannot be the art');

select throws_ok(
  $$update collections set cover_path = 'elsewhere/photo.jpg'$$,
  '23514', null, 'a photo path must be in a collections folder');
update collections set cover_path = 'cccccccc-0000-4000-8000-0000000000a1/collections/c2000000-0000-4000-8000-000000000001-1.jpg';
select isnt((select cover_path from collections), null, 'a photo in the user''s folder is fine');

delete from items where id = 'c1000000-0000-4000-8000-000000000001';
select is((select cover_item_id from collections), null, 'deleting the item brings the grid back');

select * from finish();
rollback;
