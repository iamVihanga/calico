import type { Book } from '@/features/books/types';
import { copy } from '@/i18n/en';

import {
  colomboAt,
  diffReminders,
  dueSoon,
  dueTone,
  planReminders,
  reminderId,
  reminderLoans,
  renewOptions,
  type ReminderLoan,
} from '../logic';

const book = (id: string, loan: Partial<NonNullable<Book['loan']>> | null): Book =>
  ({
    id,
    title: id,
    titleNative: null,
    status: 'reading',
    loan: loan && {
      id: `loan-${id}`,
      direction: 'borrowed',
      party: 'Colombo Public Library',
      borrowedOn: '2026-09-01',
      dueOn: null,
      dueStamps: [],
      renewalCount: 0,
      ...loan,
    },
  }) as Book;

const settings = { time: '09:00:00', remind3d: true, remind1d: true };
const madol: ReminderLoan = {
  loanId: 'L1',
  itemId: 'madol',
  title: 'මඩොල් දූව',
  party: 'Colombo Public Library',
  dueOn: '2026-09-26',
  renewalCount: 0,
};

describe('dueTone and dueLine copy', () => {
  it('splits overdue, soon and later', () => {
    expect(dueTone(-2)).toBe('overdue');
    expect(dueTone(0)).toBe('soon');
    expect(dueTone(3)).toBe('soon');
    expect(dueTone(4)).toBe('later');
  });
  it('phrases due dates like the brief', () => {
    expect(copy.loan.dueLine(3)).toBe('Due in 3 days');
    expect(copy.loan.dueLine(1)).toBe('Due tomorrow');
    expect(copy.loan.dueLine(0)).toBe('Due today');
    expect(copy.loan.dueLine(-1)).toBe('Overdue by 1 day');
    expect(copy.loan.dueLine(-2)).toBe('Overdue by 2 days');
  });
});

describe('dueSoon', () => {
  it('keeps borrowed loans due within a week or overdue, overdue first', () => {
    const list = dueSoon(
      [
        book('later', { dueOn: '2026-10-20' }),
        book('madol', { dueOn: '2026-09-26' }),
        book('hath', { dueOn: '2026-09-21' }),
        book('lent', { dueOn: '2026-09-25', direction: 'lent' }),
        book('nodate', { dueOn: null }),
        book('owned', null),
      ],
      '2026-09-23',
    );
    expect(list.map((b) => b.id)).toEqual(['hath', 'madol']);
  });
});

describe('renewOptions', () => {
  it('counts from the current due date', () => {
    expect(renewOptions('2026-09-26', '2026-09-23')).toEqual([
      { days: 7, date: '2026-10-03' },
      { days: 14, date: '2026-10-10' },
      { days: 21, date: '2026-10-17' },
      { days: 30, date: '2026-10-26' },
    ]);
  });
  it('counts from today when the loan has no due date', () => {
    expect(renewOptions(null, '2026-09-23')[0]).toEqual({ days: 7, date: '2026-09-30' });
  });
});

describe('planReminders', () => {
  it('fires 3 days and 1 day before, at the reminder time in Colombo', () => {
    const plan = planReminders([madol], settings, new Date('2026-09-20T00:00:00Z'));
    expect(plan.map((r) => [r.identifier, r.fireAt.toISOString()])).toEqual([
      ['loan:L1:3d', '2026-09-23T03:30:00.000Z'], // 09:00 +05:30
      ['loan:L1:1d', '2026-09-25T03:30:00.000Z'],
    ]);
    expect(plan[0]!.title).toBe('මඩොල් දූව is due in 3 days');
    expect(plan[0]!.body).toBe('Due at Colombo Public Library on Sat 26 Sep.');
    expect(plan[1]!.title).toBe('මඩොල් දූව is due tomorrow');
    expect(plan[1]!.body).toBe('Not renewed yet.');
  });

  it('skips times that have passed and kinds that are turned off', () => {
    const afterFirst = planReminders([madol], settings, new Date('2026-09-23T04:00:00Z'));
    expect(afterFirst.map((r) => r.kind)).toEqual(['1d']);
    expect(planReminders([madol], { ...settings, remind1d: false }, new Date('2026-09-20T00:00:00Z'))).toHaveLength(1);
  });

  it('mentions renewals on the 1-day reminder', () => {
    const [, oneDay] = planReminders([{ ...madol, renewalCount: 1 }], settings, new Date('2026-09-20T00:00:00Z'));
    expect(oneDay!.body).toBe('Renewed once so far.');
  });

  it('handles a due date at the start of a month', () => {
    expect(colomboAt('2026-09-29', '18:45').toISOString()).toBe('2026-09-29T13:15:00.000Z');
    const plan = planReminders([{ ...madol, dueOn: '2026-10-02' }], settings, new Date('2026-09-20T00:00:00Z'));
    expect(plan[0]!.fireAt.toISOString()).toBe('2026-09-29T03:30:00.000Z');
  });

  it('only plans borrowed loans with a due date', () => {
    const loans = reminderLoans(
      [
        book('madol', { dueOn: '2026-09-26' }),
        book('lent', { direction: 'lent', dueOn: '2026-09-26' }),
        book('friend', { dueOn: null }),
      ],
      (b) => b.title,
    );
    expect(loans.map((l) => l.itemId)).toEqual(['madol']);
  });
});

describe('diffReminders', () => {
  const now = new Date('2026-09-20T00:00:00Z');
  const desired = planReminders([madol], settings, now);

  it('schedules what is missing', () => {
    expect(diffReminders([], desired)).toEqual({ cancel: [], schedule: desired });
  });

  it('leaves matching reminders alone', () => {
    const scheduled = desired.map((r) => ({ identifier: r.identifier, sig: r.sig }));
    expect(diffReminders(scheduled, desired)).toEqual({ cancel: [], schedule: [] });
  });

  it('replaces reminders whose date or text changed (renewed)', () => {
    const scheduled = desired.map((r) => ({ identifier: r.identifier, sig: r.sig }));
    const renewed = planReminders([{ ...madol, dueOn: '2026-10-10', renewalCount: 1 }], settings, now);
    const d = diffReminders(scheduled, renewed);
    expect(d.cancel).toEqual([reminderId('L1', '3d'), reminderId('L1', '1d')]);
    expect(d.schedule).toEqual(renewed);
  });

  it('cancels reminders for returned loans but never touches other notifications', () => {
    const scheduled = [
      { identifier: 'loan:gone:3d', sig: 'x' },
      { identifier: 'dev-test', sig: 'y' },
    ];
    expect(diffReminders(scheduled, [])).toEqual({ cancel: ['loan:gone:3d'], schedule: [] });
  });
});
