-- Editing a loan's due date: a correction (stamp replaced, renewals unchanged), within the rules.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values ('ffffffff-0000-4000-8000-0000000000f1', 'due@test.local');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ffffffff-0000-4000-8000-0000000000f1","role":"authenticated"}', true);

select create_book('{"id":"f1000000-0000-4000-8000-000000000001","status":"reading","title":"Library book","ownership":"library",
  "loan":{"id":"f2000000-0000-4000-8000-000000000001","direction":"borrowed","party":"Colombo Public Library",
          "borrowed_on":"2026-09-20","due_on":"2026-10-04"}}'::jsonb);
select create_book('{"id":"f1000000-0000-4000-8000-000000000002","status":"reading","title":"Friend book","ownership":"friend",
  "loan":{"id":"f2000000-0000-4000-8000-000000000002","direction":"borrowed","party":"Nimali",
          "borrowed_on":"2026-09-20","due_on":"2026-10-10"}}'::jsonb);

select set_loan_due_on('f2000000-0000-4000-8000-000000000001', '2026-10-06');
select is((select due_on from loans where id = 'f2000000-0000-4000-8000-000000000001'), '2026-10-06'::date, 'the due date moves');
select is((select due_stamps from loans where id = 'f2000000-0000-4000-8000-000000000001'), array['2026-10-06'::date],
  'the current stamp is replaced, not added to');
select is((select renewal_count from loans where id = 'f2000000-0000-4000-8000-000000000001'), 0, 'it is not a renewal');
select throws_ok($$select set_loan_due_on('f2000000-0000-4000-8000-000000000001', '2026-09-19')$$, '22023', null,
  'never before the borrowed day');
select throws_ok($$select set_loan_due_on('f2000000-0000-4000-8000-000000000001', null)$$, '22023', null,
  'a library loan keeps a due date');

select set_loan_due_on('f2000000-0000-4000-8000-000000000002', null);
select is((select due_stamps from loans where id = 'f2000000-0000-4000-8000-000000000002'), '{}'::date[],
  'a friend loan can drop its due date');

select return_loan('f2000000-0000-4000-8000-000000000002', '2026-10-01');
select throws_ok($$select set_loan_due_on('f2000000-0000-4000-8000-000000000002', '2026-10-12')$$, null, null,
  'a returned loan can''t be changed');

select * from finish();
rollback;
