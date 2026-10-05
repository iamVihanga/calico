-- The Wishlist order (up_next) only holds wishlist / watchlist items.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email) values ('b8000000-0000-4000-8000-0000000000b8', 'wish@test.local');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b8000000-0000-4000-8000-0000000000b8","role":"authenticated"}', true);

insert into items (id, kind, status, title) values
  ('b8100000-0000-4000-8000-000000000001', 'book', 'wishlist', 'Wanted book'),
  ('b8100000-0000-4000-8000-000000000002', 'movie', 'watchlist', 'Wanted film');
insert into books (item_id) values ('b8100000-0000-4000-8000-000000000001');
insert into movies (item_id, tmdb_id) values ('b8100000-0000-4000-8000-000000000002', 9401);
insert into up_next (item_id, position) values
  ('b8100000-0000-4000-8000-000000000001', 'a0'), ('b8100000-0000-4000-8000-000000000002', 'a1');

update items set status = 'to_read' where id = 'b8100000-0000-4000-8000-000000000001';
select is((select count(*)::int from up_next where item_id = 'b8100000-0000-4000-8000-000000000001'), 0,
  'a book that leaves the wishlist leaves the order');
update items set title = 'Renamed' where id = 'b8100000-0000-4000-8000-000000000002';
select is((select count(*)::int from up_next where item_id = 'b8100000-0000-4000-8000-000000000002'), 1,
  'other edits keep its place');
update items set status = 'watchlist' where id = 'b8100000-0000-4000-8000-000000000002';
select is((select count(*)::int from up_next), 1, 'staying on the watchlist keeps it');
update items set status = 'watched', finished_at = local_today() where id = 'b8100000-0000-4000-8000-000000000002';
select is((select count(*)::int from up_next), 0, 'watched: gone from the order');

select * from finish();
rollback;
