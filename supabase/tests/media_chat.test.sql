-- AI chat per movie/show (media_chat_messages) and per-kind AI usage.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('cccccccc-0000-4000-8000-000000000001', 'chat-a@test.local'),
  ('cccccccc-0000-4000-8000-000000000002', 'chat-b@test.local');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-000000000001","role":"authenticated"}', true);

insert into items (id, kind, status, title) values ('c0000000-0000-4000-8000-0000000000a1', 'movie', 'watched', 'IT');
insert into media_chat_messages (item_id, role, content, language) values
  ('c0000000-0000-4000-8000-0000000000a1', 'user', 'Give me an overview', 'en'),
  ('c0000000-0000-4000-8000-0000000000a1', 'assistant', 'Seven kids, one clown, a town called Derry.', 'en');
select is((select count(*)::int from media_chat_messages), 2, 'owner reads their conversation');
select is(jsonb_array_length(export_my_data()->'chat_messages'), 2, 'export includes the conversation');
select throws_ok($$ insert into media_chat_messages (item_id, role, content, language)
  values ('c0000000-0000-4000-8000-0000000000a1', 'user', 'hi', 'ta') $$, '23514', null, 'only English or Sinhala');

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*)::int from media_chat_messages), 0, 'another user sees nothing');
select throws_ok($$ insert into media_chat_messages (item_id, user_id, role, content, language)
  values ('c0000000-0000-4000-8000-0000000000a1', 'cccccccc-0000-4000-8000-000000000001', 'user', 'hi', 'en') $$,
  '42501', null, 'cannot write into someone else''s conversation');

select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-4000-8000-000000000001","role":"authenticated"}', true);
delete from items where id = 'c0000000-0000-4000-8000-0000000000a1';
select is((select count(*)::int from media_chat_messages), 0, 'deleting the title deletes its conversation');

reset role;
insert into ai_usage (user_id, ok) values ('cccccccc-0000-4000-8000-000000000001', true);
select is((select kind from ai_usage where user_id = 'cccccccc-0000-4000-8000-000000000001'), 'cover', 'usage defaults to cover');
select throws_ok($$ insert into ai_usage (user_id, ok, kind) values ('cccccccc-0000-4000-8000-000000000001', true, 'x') $$,
  '23514', null, 'usage kind is cover or chat');

select * from finish();
rollback;
