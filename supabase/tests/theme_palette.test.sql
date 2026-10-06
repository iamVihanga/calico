-- Theme colour family: Forest by default, Tortoiseshell allowed, anything else refused.
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (id, email) values ('e1000000-0000-4000-8000-0000000000e1', 'palette@test.local');
select is((select palette from profiles where id = 'e1000000-0000-4000-8000-0000000000e1'), 'forest',
  'new profiles are Forest');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-0000000000e1","role":"authenticated"}', true);
update profiles set palette = 'tortoiseshell' where id = 'e1000000-0000-4000-8000-0000000000e1';
select is((select palette from profiles where id = 'e1000000-0000-4000-8000-0000000000e1'), 'tortoiseshell',
  'you can switch to Tortoiseshell');
select throws_ok($$update profiles set palette = 'neon' where id = 'e1000000-0000-4000-8000-0000000000e1'$$,
  '23514', null, 'unknown themes are refused');

select * from finish();
rollback;
