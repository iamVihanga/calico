import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { failed, patchBook, restore, settle, type Snapshot, snapshot, useSetBookStatus } from '@/features/books/hooks';
import { leadTitle } from '@/features/books/logic';
import type { Book, LeadScript, Loan } from '@/features/books/types';
import { copy } from '@/i18n/en';
import { colomboToday, fmtShort } from '@/lib/dates';
import { mk } from '@/lib/mutations';
import { useToastStore } from '@/lib/stores/toast';

import * as api from './api';
import { requestReminderSync } from './reminders';

/** Optimistic loan mutations (plan §11.4). Every change also resyncs the reminders. */
function useLoanMutation<V extends { itemId: string }>(
  mutationKey: readonly string[],
  apply: (v: V, b: Book) => Partial<Book>,
) {
  const qc = useQueryClient();
  return useMutation<void, Error, V, Snapshot>({
    mutationKey,
    onMutate: async (v) => {
      const s = await snapshot(qc, v.itemId);
      patchBook(qc, v.itemId, (b) => apply(v, b));
      requestReminderSync();
      return s;
    },
    onError: (_e, v, ctx) => {
      restore(qc, v.itemId, ctx);
      failed();
      requestReminderSync();
    },
    onSettled: (_d, _e, v) => {
      settle(qc, v.itemId);
      requestReminderSync();
    },
  });
}

export const useAddLoan = () =>
  useLoanMutation<api.AddLoanVars>(mk.loanAdd, (v, b) => ({
    loan: {
      id: v.id,
      direction: v.kind === 'lent' ? 'lent' : 'borrowed',
      party: v.party,
      borrowedOn: v.borrowedOn,
      dueOn: v.dueOn,
      dueStamps: v.dueOn ? [v.dueOn] : [],
      renewalCount: 0,
    },
    ownership: v.kind === 'lent' ? b.ownership : v.kind,
  }));

export const useRenewLoan = () =>
  useLoanMutation<api.RenewVars>(mk.loanRenew, (v, b) =>
    b.loan
      ? {
          loan: {
            ...b.loan,
            dueOn: v.newDue,
            dueStamps: [...b.loan.dueStamps, v.newDue],
            renewalCount: b.loan.renewalCount + 1,
          },
        }
      : {},
  );

export const useReturnLoan = () =>
  useLoanMutation<api.ReturnVars>(mk.loanReturn, (_v, b) => ({
    loan: null,
    // Same rule as return_loan: an unfinished borrowed book leaves the shelf.
    ownership: b.loan?.direction === 'borrowed' && b.status !== 'read' ? 'none' : b.ownership,
  }));

export const useReopenLoan = () =>
  useLoanMutation<api.ReopenVars & { loan: Loan }>(mk.loanReopen, (v, b) => ({
    loan: v.loan,
    ownership: v.loan.direction === 'borrowed' ? (v.ownership ?? 'library') : b.ownership,
  }));

/** Renew with the stamp "thunk" and "Renewed until 21 Oct" (brief §12: the message repeats the verb). */
export function useRenew() {
  const renew = useRenewLoan();
  return (book: Book, newDue: string) => {
    if (!book.loan) return;
    renew.mutate({ loanId: book.loan.id, itemId: book.id, newDue });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    useToastStore.getState().show({
      message: copy.loan.renewedUntil(fmtShort(newDue)),
      action: { label: copy.common.dismiss, onPress: () => undefined },
    });
  };
}

/**
 * Returned: close the loan, toast with Undo, and for an unfinished borrowed book follow up with
 * "Move to To read so you remember it?" (plan §11.4).
 */
export function useReturn() {
  const ret = useReturnLoan();
  const reopen = useReopenLoan();
  const setStatus = useSetBookStatus();
  return (book: Book, lead: LeadScript) => {
    const loan = book.loan;
    if (!loan) return;
    const before = book.ownership === 'library' || book.ownership === 'friend' ? book.ownership : null;
    ret.mutate({ loanId: loan.id, itemId: book.id, on: colomboToday() });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toasts = useToastStore.getState();
    toasts.show({
      message: loan.direction === 'lent' ? copy.loan.gotBack(loan.party) : copy.loan.returnedTo(loan.party),
      action: {
        label: copy.common.undo,
        onPress: () => {
          useToastStore.getState().clearQueue();
          reopen.mutate({ loanId: loan.id, itemId: book.id, ownership: before, loan });
        },
      },
    });
    if (loan.direction === 'borrowed' && book.status === 'reading') {
      toasts.enqueue({
        message: copy.loan.moveToRead,
        action: {
          label: copy.loan.moveToReadAction,
          onPress: () => {
            setStatus.mutate({ itemId: book.id, status: 'to_read' });
            useToastStore.getState().show({
              message: copy.books.statusChanged(leadTitle(book, lead).main, copy.books.status.to_read),
            });
          },
        },
      });
    }
  };
}
