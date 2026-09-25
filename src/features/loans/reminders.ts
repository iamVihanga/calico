import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

import { fetchBooks } from '@/features/books/api';
import { leadTitle } from '@/features/books/logic';
import type { Book } from '@/features/books/types';
import { fetchProfile, type Profile } from '@/features/profile/api';
import { LOAN_CHANNEL, remindersAllowed, setupNotifications } from '@/lib/notifications';
import { queryClient } from '@/lib/queryClient';
import { qk } from '@/lib/queryKeys';

import { diffReminders, planReminders, REMINDER_CATEGORY, reminderLoans, type ReminderSettings } from './logic';

const HOUR = 60 * 60 * 1000;
const DEBOUNCE_MS = 400;

export function reminderSettings(p: Pick<Profile, 'reminder_time' | 'remind_3d' | 'remind_1d'> | undefined) {
  return {
    time: p?.reminder_time ?? '09:00',
    remind3d: p?.remind_3d ?? true,
    remind1d: p?.remind_1d ?? true,
  } satisfies ReminderSettings;
}

let lastSync = 0;
let running: Promise<number> = Promise.resolve(0);

/**
 * Make the phone's scheduled `loan:*` reminders match the open borrowed loans (plan §9.5). Reads the
 * query cache, so an offline renew or return updates reminders straight away. Runs one at a time.
 * Returns how many reminders should now be scheduled.
 */
export function syncLoanReminders(now: Date = new Date()): Promise<number> {
  running = running.catch(() => 0).then(() => runSync(now));
  return running;
}

async function runSync(now: Date): Promise<number> {
  if (!(await remindersAllowed())) return 0;
  await setupNotifications();
  const [books, profile] = await Promise.all([
    queryClient.ensureQueryData<Book[]>({ queryKey: qk.items('book', 'all'), queryFn: fetchBooks }),
    queryClient.ensureQueryData<Profile>({ queryKey: qk.profile, queryFn: fetchProfile }),
  ]);
  const lead = profile.lead_script === 'si' ? 'si' : 'en';
  const desired = planReminders(
    reminderLoans(books, (b) => leadTitle(b, lead).main),
    reminderSettings(profile),
    now,
  );
  const scheduled = (await Notifications.getAllScheduledNotificationsAsync()).map((n) => ({
    identifier: n.identifier,
    sig: n.content.data?.sig,
  }));
  const { cancel, schedule } = diffReminders(scheduled, desired);
  await Promise.all(cancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  for (const r of schedule) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.identifier,
      content: {
        title: r.title,
        body: r.body,
        data: { itemId: r.itemId, loanId: r.loanId, sig: r.sig },
        categoryIdentifier: REMINDER_CATEGORY[r.kind],
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.fireAt, channelId: LOAN_CHANNEL },
    });
  }
  lastSync = Date.now();
  return desired.length;
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Debounced sync after loan changes and reminder-setting changes. Never throws. */
export function requestReminderSync() {
  clearTimeout(timer);
  timer = setTimeout(() => void syncLoanReminders().catch(() => undefined), DEBOUNCE_MS);
}

/**
 * Sync now (sign-in, first launch after a reinstall) and again whenever the app returns to the
 * foreground, at most hourly. Returns the unsubscribe.
 */
export function startReminderSync(): () => void {
  void syncLoanReminders().catch(() => undefined);
  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active' && Date.now() - lastSync > HOUR) void syncLoanReminders().catch(() => undefined);
  });
  return () => {
    clearTimeout(timer);
    sub.remove();
  };
}
