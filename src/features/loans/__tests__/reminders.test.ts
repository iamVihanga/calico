import type { Book } from '@/features/books/types';
import { queryClient } from '@/lib/queryClient';
import { qk } from '@/lib/queryKeys';
import { cleanupAppState } from '@/test/cleanup';

import { syncLoanReminders } from '../reminders';

type Req = { identifier: string; content: { title: string; data: Record<string, unknown> }; trigger: unknown };
const mockScheduled = new Map<string, Req>();
const mockPermission = { granted: true };

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 6 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => mockPermission),
  getAllScheduledNotificationsAsync: jest.fn(async () => [...mockScheduled.values()]),
  scheduleNotificationAsync: jest.fn(async (r: Req) => {
    mockScheduled.set(r.identifier, r);
    return r.identifier;
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => void mockScheduled.delete(id)),
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const N = require('expo-notifications') as {
  scheduleNotificationAsync: jest.Mock;
  cancelScheduledNotificationAsync: jest.Mock;
};

const BOOKS = qk.items('book', 'all');
const madol = {
  id: 'madol',
  title: 'Madol Doova',
  titleNative: 'මඩොල් දූව',
  status: 'reading',
  loan: {
    id: 'L1',
    direction: 'borrowed',
    party: 'Colombo Public Library',
    borrowedOn: '2026-09-09',
    dueOn: '2026-09-26',
    dueStamps: ['2026-09-26'],
    renewalCount: 0,
  },
} as Book;
const now = new Date('2026-09-20T00:00:00Z');

const seed = (books: Book[], lead = 'si') => {
  queryClient.setQueryData(BOOKS, books);
  queryClient.setQueryData(qk.profile, {
    lead_script: lead,
    reminder_time: '09:00:00',
    remind_3d: true,
    remind_1d: true,
  });
};

describe('syncLoanReminders', () => {
  beforeEach(() => {
    mockScheduled.clear();
    mockScheduled.set('dev-test', { identifier: 'dev-test', content: { title: 'x', data: {} }, trigger: null });
    mockPermission.granted = true;
    jest.clearAllMocks();
  });
  afterAll(cleanupAppState);

  it('schedules both reminders with the lead-script title, actions and a deep-link payload', async () => {
    seed([madol]);
    expect(await syncLoanReminders(now)).toBe(2);
    const three = mockScheduled.get('loan:L1:3d')!;
    expect(three.content).toEqual(
      expect.objectContaining({
        title: 'මඩොල් දූව is due in 3 days',
        body: 'Due at Colombo Public Library on Sat 26 Sep.',
        categoryIdentifier: 'loan3d',
        data: expect.objectContaining({ itemId: 'madol', loanId: 'L1' }),
      }),
    );
    expect(three.trigger).toEqual({ type: 'date', date: new Date('2026-09-23T03:30:00Z'), channelId: 'loans' });
    expect(mockScheduled.get('loan:L1:1d')!.content).toEqual(expect.objectContaining({ categoryIdentifier: 'loan1d' }));
  });

  it('does nothing when the phone already matches', async () => {
    seed([madol]);
    await syncLoanReminders(now);
    jest.clearAllMocks();
    await syncLoanReminders(now);
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(N.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it('moves the reminders when the loan is renewed', async () => {
    seed([madol]);
    await syncLoanReminders(now);
    seed([{ ...madol, loan: { ...madol.loan!, dueOn: '2026-10-10', renewalCount: 1 } }]);
    await syncLoanReminders(now);
    expect(mockScheduled.get('loan:L1:1d')!.trigger).toEqual(
      expect.objectContaining({ date: new Date('2026-10-09T03:30:00Z') }),
    );
    expect((mockScheduled.get('loan:L1:1d')!.content as { body?: string }).body).toBe('Renewed once so far.');
  });

  it('cancels the reminders when the book is returned, leaving other notifications alone', async () => {
    seed([madol]);
    await syncLoanReminders(now);
    seed([{ ...madol, loan: null }]);
    await syncLoanReminders(now);
    expect([...mockScheduled.keys()]).toEqual(['dev-test']);
  });

  it('schedules nothing without notification permission', async () => {
    mockPermission.granted = false;
    seed([madol]);
    expect(await syncLoanReminders(now)).toBe(0);
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
