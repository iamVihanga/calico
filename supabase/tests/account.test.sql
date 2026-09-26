-- Account deletion (build plan §8.5): deleting the auth user removes every row the user owns.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select ok((select count(*) from items where user_id = (select id from auth.users where email = 'dilan@calico.test')) > 0,
  'the seed user has items');
select ok((select count(*) from loans where user_id = (select id from auth.users where email = 'dilan@calico.test')) > 0,
  'and loans');

delete from auth.users where email = 'dilan@calico.test';

select is((select
    (select count(*) from profiles) + (select count(*) from items) + (select count(*) from books)
  + (select count(*) from reading_sessions) + (select count(*) from page_logs) + (select count(*) from loans)
  + (select count(*) from movies) + (select count(*) from watch_logs) + (select count(*) from shows)
  + (select count(*) from episode_watches) + (select count(*) from collections) + (select count(*) from collection_items)
  + (select count(*) from up_next))::int, 0, 'every user row is gone');
select ok((select count(*) from tmdb_episodes) > 0, 'the shared episode cache stays');

select * from finish();
rollback;
