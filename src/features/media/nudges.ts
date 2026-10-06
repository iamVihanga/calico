import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

import { fetchProfile, type Profile } from '@/features/profile/api';
import { copy } from '@/i18n/en';
import { localDateOf } from '@/lib/dates';
import { NUDGE_CHANNEL, remindersAllowed, setupNotifications } from '@/lib/notifications';
import { queryClient } from '@/lib/queryClient';
import { qk } from '@/lib/queryKeys';

import { fetchShowProgress, fetchShows, fetchWatchSessions, type WatchSession } from './api';
import { HABIT_PREFIX, habitOf, type Nudge, type NudgeCandidate, planNudges, sessionsByShow } from './habits';
import { epCode } from './logic';
import type { Show, ShowProgress } from './types';

const HOUR = 60 * 60 * 1000;
const DEBOUNCE_MS = 800;

const sig = (n: Nudge) => `${n.itemId}|${n.next.season}|${n.next.episode}|${n.minute}`;
/** The nudge's moment: its Colombo date and minute (Sri Lanka has no daylight saving). */
const fireAt = (n: Nudge) => {
  const hh = String(Math.floor(n.minute / 60)).padStart(2, '0');
  const mm = String(n.minute % 60).padStart(2, '0');
  return new Date(`${n.date}T${hh}:${mm}:00+05:30`);
};

/** Shows being watched, with a next episode and a habit: what a nudge could be about. */
export function nudgeCandidates(
  shows: Show[],
  progress: ShowProgress[],
  sessions: WatchSession[],
  now: Date,
): NudgeCandidate[] {
  const byShow = sessionsByShow(sessions);
  const next = new Map(progress.map((p) => [p.itemId, p.next]));
  return shows.flatMap((s) => {
    const n = next.get(s.id);
    const ticks = byShow.get(s.id) ?? [];
    const habit = s.status === 'watching' && !s.onHold && n ? habitOf(ticks, now) : null;
    if (!n || !habit) return [];
    return [
      {
        itemId: s.id,
        title: s.title,
        next: { season: n.season, episode: n.episode, name: n.name },
        habit,
        watchedOn: new Set(ticks.map((t) => localDateOf(new Date(t.at)))),
      },
    ];
  });
}

let lastSync = 0;
let running: Promise<number> = Promise.resolve(0);

/**
 * Make the phone's scheduled `habit:*` nudges match what `planNudges` wants now (none when nudges are off,
 * notifications aren't allowed, or there's no habit). Runs one at a time; returns how many are scheduled.
 */
export function syncWatchNudges(now: Date = new Date()): Promise<number> {
  running = running.catch(() => 0).then(() => runSync(now));
  return running;
}

async function runSync(now: Date): Promise<number> {
  const scheduled = (await Notifications.getAllScheduledNotificationsAsync()).filter((n) =>
    n.identifier.startsWith(HABIT_PREFIX),
  );
  const profile = await queryClient.ensureQueryData<Profile>({ queryKey: qk.profile, queryFn: fetchProfile });
  let desired: Nudge[] = [];
  if (profile.watch_nudges && (await remindersAllowed())) {
    await setupNotifications();
    const [shows, progress, sessions] = await Promise.all([
      queryClient.ensureQueryData<Show[]>({ queryKey: qk.items('show', 'all'), queryFn: fetchShows }),
      queryClient.ensureQueryData<ShowProgress[]>({ queryKey: qk.showProgress(), queryFn: fetchShowProgress }),
      queryClient.ensureQueryData<WatchSession[]>({ queryKey: qk.watchSessions, queryFn: fetchWatchSessions }),
    ]);
    desired = planNudges(nudgeCandidates(shows, progress, sessions, now), now);
  }
  const want = new Map(desired.map((n) => [n.id, n]));
  const keep = new Set<string>();
  for (const n of scheduled) {
    const d = want.get(n.identifier);
    if (d && n.content.data?.sig === sig(d)) keep.add(n.identifier);
    else await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
  for (const n of desired) {
    if (keep.has(n.id)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: {
        title: copy.nudges.title(n.title),
        body: copy.nudges.body(epCode(n.next.season, n.next.episode), n.next.name),
        data: { kind: 'habit', url: `/show/${n.itemId}?episode=${n.next.season}-${n.next.episode}`, sig: sig(n) },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt(n), channelId: NUDGE_CHANNEL },
    });
  }
  lastSync = Date.now();
  return desired.length;
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Debounced re-plan (after ticks, a settings change). Never throws. */
export function requestNudgeSync() {
  clearTimeout(timer);
  timer = setTimeout(() => void syncWatchNudges().catch(() => undefined), DEBOUNCE_MS);
}

/**
 * Plan now, again when the app returns to the foreground (at most hourly), and whenever ticks, shows or
 * the profile change. Returns the unsubscribe.
 */
export function startNudgeSync(): () => void {
  void syncWatchNudges().catch(() => undefined);
  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active' && Date.now() - lastSync > HOUR) void syncWatchNudges().catch(() => undefined);
  });
  const watched = new Set(['watchSessions', 'showProgress', 'profile']);
  const unsubscribe = queryClient.getQueryCache().subscribe((e) => {
    if (e.type === 'updated' && e.action.type === 'success' && watched.has(String(e.query.queryKey[0])))
      requestNudgeSync();
  });
  return () => {
    clearTimeout(timer);
    sub.remove();
    unsubscribe();
  };
}
