-- On hold: set and cleared by hand, cleared by watching again; only on your own shows.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email) values
  ('c9000000-0000-4000-8000-0000000000c9', 'hold@test.local'),
  ('c9000000-0000-4000-8000-0000000000ca', 'other@test.local');
insert into tmdb_episodes (tmdb_show_id, season, episode, name, air_date) values (901, 1, 1, 'Pilot', '2020-01-01');
insert into items (id, user_id, kind, status, title) values
  ('c9100000-0000-4000-8000-000000000001', 'c9000000-0000-4000-8000-0000000000c9', 'show', 'watching', 'Mine'),
  ('c9100000-0000-4000-8000-000000000002', 'c9000000-0000-4000-8000-0000000000ca', 'show', 'watching', 'Theirs');
insert into shows (item_id, user_id, tmdb_id) values
  ('c9100000-0000-4000-8000-000000000001', 'c9000000-0000-4000-8000-0000000000c9', 901),
  ('c9100000-0000-4000-8000-000000000002', 'c9000000-0000-4000-8000-0000000000ca', 901);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c9000000-0000-4000-8000-0000000000c9","role":"authenticated"}', true);

select set_show_on_hold('c9100000-0000-4000-8000-000000000001', true);
select is((select on_hold from shows where item_id = 'c9100000-0000-4000-8000-000000000001'), true, 'put on hold');
select mark_episodes('c9100000-0000-4000-8000-000000000001', 1, '{1}', true);
select is((select on_hold from shows where item_id = 'c9100000-0000-4000-8000-000000000001'), false,
  'ticking an episode brings it back');
select set_show_on_hold('c9100000-0000-4000-8000-000000000001', true);
select mark_episodes('c9100000-0000-4000-8000-000000000001', 1, '{1}', false);
select is((select on_hold from shows where item_id = 'c9100000-0000-4000-8000-000000000001'), true,
  'un-ticking keeps it on hold');
select set_show_on_hold('c9100000-0000-4000-8000-000000000001', false);
select is((select on_hold from shows where item_id = 'c9100000-0000-4000-8000-000000000001'), false, 'back by hand');
select throws_ok($$select set_show_on_hold('c9100000-0000-4000-8000-000000000002', true)$$, null, null,
  'someone else''s show is not found');

select * from finish();
rollback;
