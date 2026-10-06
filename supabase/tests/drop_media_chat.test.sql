-- Ask Pinki is gone: no conversations table, nothing about chats in Export.
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select hasnt_table('public', 'media_chat_messages', 'the chat table is dropped');

insert into auth.users (id, email) values ('d1000000-0000-4000-8000-0000000000d1', 'export@test.local');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
select ok(not (export_my_data() ? 'chat_messages'), 'Export has no chat_messages');
select ok(export_my_data() ? 'items', 'Export still has the library');

select * from finish();
rollback;
