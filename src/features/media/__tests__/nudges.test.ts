import * as Notifications from 'expo-notifications';

import { queryClient } from '@/lib/queryClient';
import { qk } from '@/lib/queryKeys';
import { cleanupAppState } from '@/test/cleanup';

import { syncWatchNudges } from '../nudges';
import type { Show, ShowProgress } from '../types';

const N = Notifications as unknown as {
  getPermissionsAsync: jest.Mock;
  getAllScheduledNotificationsAsync: jest.Mock;
  scheduleNotificationAsync: jest.Mock;
  cancelScheduledNotificationAsync: jest.Mock;
};

const at = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00+05:30`).toISOString();
const monday = (hhmm: string) => new Date(at('2026-10-05', hhmm));
const show = { id: 'sn', title: 'Supernatural', status: 'watching' } as Show;
const progress = [
  { itemId: 'sn', next: { season: 5, episode: 3, name: 'Good God', stillPath: null } },
] as ShowProgress[];
// Six evenings in a row at 8 pm, before Monday 5 Oct.
const sessions = ['2026-10-04', '2026-10-03', '2026-10-02', '2026-10-01', '2026-09-30', '2026-09-29'].map((d) => ({
  itemId: 'sn',
  at: at(d, '20:00'),
}));

function seed(watchNudges: boolean) {
  queryClient.setQueryData(qk.profile, { id: 'u', watch_nudges: watchNudges });
  queryClient.setQueryData(qk.items('show', 'all'), [show]);
  queryClient.setQueryData(qk.showProgress(), progress);
  queryClient.setQueryData(qk.watchSessions, sessions);
}

/** Nudges are planned on the phone and kept in step with what's scheduled (like loan reminders). */
describe('watch-time nudges', () => {
  afterAll(cleanupAppState);
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    N.getPermissionsAsync.mockResolvedValue({ granted: true });
    N.getAllScheduledNotificationsAsync.mockResolvedValue([]);
  });

  it('schedules today and tomorrow at 7:50 pm for an 8 pm habit, opening the next episode', async () => {
    seed(true);
    expect(await syncWatchNudges(monday('12:00'))).toBe(2);
    const calls = N.scheduleNotificationAsync.mock.calls.map((c) => c[0]);
    expect(calls.map((c) => c.identifier)).toEqual(['habit:2026-10-05', 'habit:2026-10-06']);
    expect(calls[0].trigger.date).toEqual(new Date('2026-10-05T19:50:00+05:30'));
    expect(calls[0].trigger.channelId).toBe('watch-nudges');
    expect(calls[0].content).toEqual(
      expect.objectContaining({
        title: 'Supernatural time?',
        body: 'S5 E3 · Good God is next.',
        data: expect.objectContaining({ kind: 'habit', url: '/show/sn?episode=5-3' }),
      }),
    );
  });

  it('leaves matching nudges alone and cancels them when nudges go off (loan reminders untouched)', async () => {
    seed(true);
    await syncWatchNudges(monday('12:00'));
    const scheduled = N.scheduleNotificationAsync.mock.calls.map((c) => ({
      identifier: c[0].identifier,
      content: c[0].content,
    }));
    N.getAllScheduledNotificationsAsync.mockResolvedValue([
      ...scheduled,
      { identifier: 'loan:l1:3d', content: { data: {} } },
    ]);
    N.scheduleNotificationAsync.mockClear();
    await syncWatchNudges(monday('12:00'));
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(N.cancelScheduledNotificationAsync).not.toHaveBeenCalled();

    seed(false);
    expect(await syncWatchNudges(monday('12:00'))).toBe(0);
    expect(N.cancelScheduledNotificationAsync.mock.calls.map((c) => c[0])).toEqual([
      'habit:2026-10-05',
      'habit:2026-10-06',
    ]);
  });

  it('nothing without notification permission', async () => {
    seed(true);
    N.getPermissionsAsync.mockResolvedValue({ granted: false });
    expect(await syncWatchNudges(monday('12:00'))).toBe(0);
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
