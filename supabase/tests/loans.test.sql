-- Loans (build plan §11.4, §14): add, lend, return, undo a return.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email) values ('dddddddd-0000-4000-8000-000000000004', 'd@test.local');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-4000-8000-000000000004","role":"authenticated"}', true);

select create_book('{"id":"d0000000-0000-4000-8000-0000000000b1","status":"reading","title":"Madol Doova","ownership":"owned"}'::jsonb);
select create_book('{"id":"d0000000-0000-4000-8000-0000000000b2","status":"read","title":"Gamperaliya","ownership":"owned"}'::jsonb);

-- add_loan ------------------------------------------------------------------------------------
select add_loan('{"id":"d0000000-0000-4000-8000-0000000000f1","item_id":"d0000000-0000-4000-8000-0000000000b1",
  "party":"Colombo Public Library","borrowed_on":"2026-09-09","due_on":"2026-09-26"}'::jsonb);
select add_loan('{"id":"d0000000-0000-4000-8000-0000000000f1","item_id":"d0000000-0000-4000-8000-0000000000b1",
  "party":"Colombo Public Library","borrowed_on":"2026-09-09","due_on":"2026-09-26"}'::jsonb);
select is((select count(*)::int from loans), 1, 'add_loan replay inserts once');
select is((select ownership from books where item_id = 'd0000000-0000-4000-8000-0000000000b1'), 'library',
  'a borrowed loan makes the book a library book');
select is((select due_stamps from loans), array['2026-09-26'::date], 'first due stamp');
select throws_ok($$ select add_loan('{"id":"d0000000-0000-4000-8000-0000000000f9","item_id":"d0000000-0000-4000-8000-0000000000b1",
  "party":"Someone"}'::jsonb) $$, '23505', null, 'one open loan per book');

select add_loan('{"id":"d0000000-0000-4000-8000-0000000000f2","item_id":"d0000000-0000-4000-8000-0000000000b2",
  "direction":"lent","party":"Nimal"}'::jsonb);
select is((select ownership from books where item_id = 'd0000000-0000-4000-8000-0000000000b2'), 'owned',
  'lending keeps the book yours');
select is((select due_on from loans where id = 'd0000000-0000-4000-8000-0000000000f2'), null, 'lent loans may have no due date');

-- return_loan + reopen_loan -------------------------------------------------------------------
select return_loan('d0000000-0000-4000-8000-0000000000f1', '2026-09-24');
select is((select returned_on from loans where id = 'd0000000-0000-4000-8000-0000000000f1'), '2026-09-24'::date, 'returned');
select is((select ownership from books where item_id = 'd0000000-0000-4000-8000-0000000000b1'), 'none',
  'an unfinished borrowed book leaves the shelf');

select reopen_loan('d0000000-0000-4000-8000-0000000000f1', 'library');
select reopen_loan('d0000000-0000-4000-8000-0000000000f1', 'library');
select is((select returned_on from loans where id = 'd0000000-0000-4000-8000-0000000000f1'), null, 'undo reopens the loan');
select is((select ownership from books where item_id = 'd0000000-0000-4000-8000-0000000000b1'), 'library',
  'undo restores the ownership');
select is((select renewal_count from loans where id = 'd0000000-0000-4000-8000-0000000000f1'), 0, 'undo keeps the loan as it was');

select return_loan('d0000000-0000-4000-8000-0000000000f2', '2026-09-24');
select is((select ownership from books where item_id = 'd0000000-0000-4000-8000-0000000000b2'), 'owned',
  'a lent book coming back stays yours');

-- a new loan after the return blocks reopening the old one
select add_loan('{"id":"d0000000-0000-4000-8000-0000000000f3","item_id":"d0000000-0000-4000-8000-0000000000b2",
  "direction":"lent","party":"Kasun"}'::jsonb);
select throws_ok($$ select reopen_loan('d0000000-0000-4000-8000-0000000000f2', null) $$, 'P0001',
  'book already has an open loan', 'cannot reopen while another loan is open');
select throws_ok($$ select reopen_loan('d0000000-0000-4000-8000-0000000000ff', null) $$, 'P0001',
  'loan not found', 'unknown loan');

select * from finish();
rollback;
