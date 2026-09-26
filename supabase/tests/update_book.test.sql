-- update_book (Edit details, Change cover photo).
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('eeeeeeee-0000-4000-8000-000000000005', 'e@test.local'),
  ('eeeeeeee-0000-4000-8000-000000000006', 'f@test.local');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-4000-8000-000000000005","role":"authenticated"}', true);

select create_book('{"id":"e0000000-0000-4000-8000-0000000000b1","status":"reading","title":"Madol Doova",
  "author":"Martin W.","total_pages":200,"current_page":80,"cover_url":"https://covers.example/1.jpg"}'::jsonb);

select update_book('e0000000-0000-4000-8000-0000000000b1',
  '{"title":"Madol Doova","title_native":"මඩොල් දූව","author":"Martin Wickramasinghe","total_pages":214,"format":"ebook"}');
select update_book('e0000000-0000-4000-8000-0000000000b1',
  '{"title":"Madol Doova","title_native":"මඩොල් දූව","author":"Martin Wickramasinghe","total_pages":214,"format":"ebook"}');
select is((select title_native from items where id = 'e0000000-0000-4000-8000-0000000000b1'), 'මඩොල් දූව', 'native title set');
select is((select author from books where item_id = 'e0000000-0000-4000-8000-0000000000b1'), 'Martin Wickramasinghe', 'author set');
select is((select total_pages || ' ' || format from books where item_id = 'e0000000-0000-4000-8000-0000000000b1'),
  '214 ebook', 'pages and format set (replay is harmless)');
select is((select language from books where item_id = 'e0000000-0000-4000-8000-0000000000b1'), 'English', 'missing keys stay');

select update_book('e0000000-0000-4000-8000-0000000000b1', '{"title_native":"","title":""}');
select is((select title || '|' || coalesce(title_native, '∅') from items where id = 'e0000000-0000-4000-8000-0000000000b1'),
  'Madol Doova|∅', 'an empty title keeps the old one; an empty native title clears it');

select throws_ok($$ select update_book('e0000000-0000-4000-8000-0000000000b1', '{"total_pages":50}') $$,
  '23514', 'total pages below current page', 'pages cannot drop below the current page');

select update_book('e0000000-0000-4000-8000-0000000000b1',
  '{"cover_path":"eeeeeeee-0000-4000-8000-000000000005/e0000000-0000-4000-8000-0000000000b1/front-1.jpg"}');
select is((select cover_path is not null and cover_url is null from items where id = 'e0000000-0000-4000-8000-0000000000b1'),
  true, 'a new cover photo replaces the looked-up cover');

-- Someone else's book is invisible under RLS.
select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-4000-8000-000000000006","role":"authenticated"}', true);
select throws_ok($$ select update_book('e0000000-0000-4000-8000-0000000000b1', '{"title":"Mine now"}') $$,
  'P0001', 'book not found', 'cannot edit another user''s book');
select set_config('request.jwt.claims', '{"sub":"eeeeeeee-0000-4000-8000-000000000005","role":"authenticated"}', true);
select is((select title from items where id = 'e0000000-0000-4000-8000-0000000000b1'), 'Madol Doova', 'unchanged');

select * from finish();
rollback;
