import { TZDate } from '@date-fns/tz';

import type { Book, Loan } from '@/features/books/types';
import { copy } from '@/i18n/en';
import { addLocalDays, daysBetween, fmtDay, type LocalDate, TIME_ZONE } from '@/lib/dates';

/** Home shows borrowed loans due within this many days, plus every overdue one (brief §7.2). */
export const DUE_SOON_DAYS = 7;
/** Renew sheet quick choices, counted from the current due date (prototype `renewOptions`). */
export const RENEW_CHOICES = [7, 14, 21, 30] as const;
export const DEFAULT_RENEW = 14;
/** Loan form due-date chips, counted from the borrowed date. */
export const LOAN_DUE_CHOICES = [7, 14, 21, 30] as const;

export type DueTone = 'overdue' | 'soon' | 'later';

/** Overdue, due within 3 days, or later: drives the slip's accent, stamp and hand-written note. */
export function dueTone(daysLeft: number): DueTone {
  if (daysLeft < 0) return 'overdue';
  return daysLeft <= 3 ? 'soon' : 'later';
}

export function daysLeft(loan: Pick<Loan, 'dueOn'>, today: LocalDate): number | null {
  return loan.dueOn ? daysBetween(today, loan.dueOn) : null;
}

export type DueBook = Book & { loan: Loan & { dueOn: LocalDate } };

/** Home "Due soon": borrowed books due within a week or overdue; overdue first, then soonest due. */
export function dueSoon(books: Book[], today: LocalDate): DueBook[] {
  return books
    .filter(
      (b): b is DueBook =>
        b.loan?.direction === 'borrowed' && !!b.loan.dueOn && daysBetween(today, b.loan.dueOn) <= DUE_SOON_DAYS,
    )
    .sort((a, b) => a.loan.dueOn.localeCompare(b.loan.dueOn));
}

/** "+14 days" choices from the current due date (or today for a loan without one). */
export function renewOptions(dueOn: LocalDate | null, today: LocalDate): { days: number; date: LocalDate }[] {
  const base = dueOn ?? today;
  return RENEW_CHOICES.map((days) => ({ days, date: addLocalDays(base, days) }));
}

// Reminders (plan §9.5) -----------------------------------------------------------------------------

export type ReminderKind = '3d' | '1d';
export const REMINDER_OFFSET: Record<ReminderKind, number> = { '3d': 3, '1d': 1 };
export const REMINDER_PREFIX = 'loan:';
export const reminderId = (loanId: string, kind: ReminderKind) => `${REMINDER_PREFIX}${loanId}:${kind}`;
/** Notification categories (action buttons) per reminder kind. */
export const REMINDER_CATEGORY: Record<ReminderKind, string> = { '3d': 'loan3d', '1d': 'loan1d' };

export type ReminderSettings = {
  /** `HH:MM` or `HH:MM:SS` in Colombo time (profiles.reminder_time). */
  time: string;
  remind3d: boolean;
  remind1d: boolean;
};

export type ReminderLoan = {
  loanId: string;
  itemId: string;
  /** Title in the reader's lead script. */
  title: string;
  party: string;
  dueOn: LocalDate;
  renewalCount: number;
};

export type PlannedReminder = {
  identifier: string;
  kind: ReminderKind;
  fireAt: Date;
  title: string;
  body: string;
  itemId: string;
  loanId: string;
  /** Changes whenever anything shown or the fire time changes, so a stale reminder is replaced. */
  sig: string;
};

/** Open borrowed loans with a due date, in the shape the planner needs. */
export function reminderLoans(books: Book[], title: (b: Book) => string): ReminderLoan[] {
  return books.flatMap((b) =>
    b.loan?.direction === 'borrowed' && b.loan.dueOn
      ? [
          {
            loanId: b.loan.id,
            itemId: b.id,
            title: title(b),
            party: b.loan.party,
            dueOn: b.loan.dueOn,
            renewalCount: b.loan.renewalCount,
          },
        ]
      : [],
  );
}

/** The instant `time` happens in Colombo on `date`. */
export function colomboAt(date: LocalDate, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(+new TZDate(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 9, mm ?? 0, 0, TIME_ZONE));
}

/** Every reminder that should exist right now: 3 and 1 days before each due date, never in the past. */
export function planReminders(loans: ReminderLoan[], s: ReminderSettings, now: Date): PlannedReminder[] {
  const kinds = (['3d', '1d'] as const).filter((k) => (k === '3d' ? s.remind3d : s.remind1d));
  return loans.flatMap((l) =>
    kinds.flatMap((kind) => {
      const fireAt = colomboAt(addLocalDays(l.dueOn, -REMINDER_OFFSET[kind]), s.time);
      if (fireAt <= now) return [];
      const title = kind === '3d' ? copy.reminders.title3d(l.title) : copy.reminders.title1d(l.title);
      const body =
        kind === '3d' ? copy.reminders.body3d(l.party, fmtDay(l.dueOn)) : copy.reminders.body1d(l.renewalCount);
      return [
        {
          identifier: reminderId(l.loanId, kind),
          kind,
          fireAt,
          title,
          body,
          itemId: l.itemId,
          loanId: l.loanId,
          sig: `${fireAt.toISOString()}|${title}|${body}`,
        },
      ];
    }),
  );
}

/**
 * What to cancel and what to schedule so the device matches `desired`. Only `loan:*` notifications
 * are ours to touch; a reminder whose signature changed (renewed, retitled, new time) is replaced.
 */
export function diffReminders(
  scheduled: { identifier: string; sig?: unknown }[],
  desired: PlannedReminder[],
): { cancel: string[]; schedule: PlannedReminder[] } {
  const want = new Map(desired.map((r) => [r.identifier, r]));
  const have = new Map(
    scheduled.filter((n) => n.identifier.startsWith(REMINDER_PREFIX)).map((n) => [n.identifier, n.sig]),
  );
  const cancel = [...have].filter(([id, sig]) => want.get(id)?.sig !== sig).map(([id]) => id);
  const schedule = desired.filter((r) => have.get(r.identifier) !== r.sig);
  return { cancel, schedule };
}
