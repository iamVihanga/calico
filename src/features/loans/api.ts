import type { LocalDate } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

export type LoanKind = 'library' | 'friend' | 'lent';

export type AddLoanVars = {
  id: string;
  itemId: string;
  kind: LoanKind;
  party: string;
  borrowedOn: LocalDate;
  dueOn: LocalDate | null;
};
export async function addLoan(v: AddLoanVars): Promise<void> {
  const { error } = await supabase.rpc('add_loan', {
    p: {
      id: v.id,
      item_id: v.itemId,
      direction: v.kind === 'lent' ? 'lent' : 'borrowed',
      party_kind: v.kind === 'lent' ? null : v.kind,
      party: v.party,
      borrowed_on: v.borrowedOn,
      due_on: v.dueOn,
    },
  });
  if (error) throw error;
}

export type RenewVars = { loanId: string; itemId: string; newDue: LocalDate };
export async function renewLoan(v: RenewVars): Promise<void> {
  const { error } = await supabase.rpc('renew_loan', { p_loan: v.loanId, p_new_due: v.newDue });
  if (error) throw error;
}

export type ReturnVars = { loanId: string; itemId: string; on: LocalDate };
export async function returnLoan(v: ReturnVars): Promise<void> {
  const { error } = await supabase.rpc('return_loan', { p_loan: v.loanId, p_on: v.on });
  if (error) throw error;
}

/** Undo a return. `ownership` is what the book had before ('library' | 'friend' for borrowed loans). */
export type ReopenVars = { loanId: string; itemId: string; ownership: 'library' | 'friend' | null };
export async function reopenLoan(v: ReopenVars): Promise<void> {
  const { error } = await supabase.rpc('reopen_loan', {
    p_loan: v.loanId,
    ...(v.ownership ? { p_ownership: v.ownership } : {}),
  });
  if (error) throw error;
}
