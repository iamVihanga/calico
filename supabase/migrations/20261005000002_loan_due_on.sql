-- Correct a loan's due date from the book's date card (a typo, or the date the library really set).
-- Not a renewal: the current due stamp is replaced and the renewal count stays. Never before the
-- borrowed day; a library loan keeps a due date, friend and lent loans may clear theirs.
create or replace function public.set_loan_due_on(p_loan uuid, p_on date)
returns void language plpgsql security invoker set search_path = public as $$
declare
  v_borrowed date; v_returned date; v_dir loan_direction; v_stamps date[]; v_own text; v_n int;
begin
  select l.borrowed_on, l.returned_on, l.direction, l.due_stamps, b.ownership::text
    into v_borrowed, v_returned, v_dir, v_stamps, v_own
    from loans l join books b on b.item_id = l.item_id where l.id = p_loan for update of l;
  if not found then raise exception 'loan not found'; end if;
  if v_returned is not null then raise exception 'loan already returned'; end if;
  if p_on is not null and p_on < v_borrowed then
    raise exception 'due date is before the borrowed date' using errcode = '22023';
  end if;
  if p_on is null and v_dir = 'borrowed' and v_own = 'library' then
    raise exception 'a library loan needs a due date' using errcode = '22023';
  end if;
  v_n := coalesce(array_length(v_stamps, 1), 0);
  update loans set
    due_on = p_on,
    due_stamps = case when v_n = 0 then (case when p_on is null then '{}'::date[] else array[p_on] end)
                      when p_on is null then v_stamps[1:v_n - 1]
                      else v_stamps[1:v_n - 1] || p_on end
  where id = p_loan;
end $$;
