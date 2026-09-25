-- Phase 4: undo for "Returned" (build plan §11.4). Reopening is a server write like any other, so
-- it queues offline and replays safely.

-- Reopen a returned loan (Undo after Returned). Borrowed loans put the book back on the shelf with
-- the ownership it had before the return ('library' or 'friend'). Replaying is a no-op.
create or replace function public.reopen_loan(p_loan uuid, p_ownership text default null)
returns void language plpgsql security invoker set search_path = public as $$
declare v_item uuid; v_dir loan_direction; v_returned date;
begin
  select item_id, direction, returned_on into v_item, v_dir, v_returned from loans where id = p_loan for update;
  if not found then raise exception 'loan not found'; end if;
  if v_returned is null then return; end if;                                   -- idempotent replay
  if exists (select 1 from loans where item_id = v_item and returned_on is null) then
    raise exception 'book already has an open loan';
  end if;

  update loans set returned_on = null where id = p_loan;
  if v_dir = 'borrowed' then
    update books set ownership = case when p_ownership in ('library', 'friend') then p_ownership else 'library' end
      where item_id = v_item;
  end if;
end $$;

revoke execute on function public.reopen_loan(uuid, text) from public, anon;
grant execute on function public.reopen_loan(uuid, text) to authenticated, service_role;
