import { addLocalDays, colomboToday, type LocalDate, toColombo } from '@/lib/dates';

/**
 * Watch-time habits from single episode ticks (`watch_sessions`: one per show per hour). Everything
 * runs on the phone; nothing here leaves it.
 */
export type Session = { itemId: string; at: string };

const DAY_MS = 24 * 60 * 60 * 1000;
/** How wide "around this time" is (hours, Gaussian σ on the 24-hour circle). */
const SIGMA = 1.25;
/** Older ticks count less: a tick 3 weeks old counts half. */
const HALF_LIFE_DAYS = 21;
/** A weekday tick counts this much on a weekend (and the other way round). */
const OTHER_DAY_TYPE = 0.4;
/** Below this, nothing is "usual" for now and Continue watching keeps its most-recent order. */
const MIN_SCORE = 0.5;
/** A habit: at least this many sessions in 3 weeks, this concentrated around one time. */
const HABIT_SESSIONS = 4;
const HABIT_DAYS = 21;
const HABIT_STRENGTH = 0.6;
/** Within this many hours of the usual time counts as "now is your time". */
const WINDOW_HOURS = 1.5;

/** Hour of day in Colombo, with minutes as a fraction (20.5 = 8:30 pm). */
export function hourOf(at: string | Date): number {
  const d = toColombo(at);
  return d.getHours() + d.getMinutes() / 60;
}

const isWeekend = (at: string | Date) => {
  const day = toColombo(at).getDay();
  return day === 0 || day === 6;
};

/** Distance between two hours on the 24-hour circle (23:00 and 01:00 are 2 hours apart). */
export function hourGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 24;
  return Math.min(d, 24 - d);
}

function weight(s: Session, now: Date): number {
  const ageDays = Math.max(0, (now.getTime() - Date.parse(s.at)) / DAY_MS);
  return 0.5 ** (ageDays / HALF_LIFE_DAYS) * (isWeekend(s.at) === isWeekend(now) ? 1 : OTHER_DAY_TYPE);
}

/** How much this show is "what you watch around now": recent ticks near this hour, same kind of day. */
export function scoreAt(sessions: Session[], now: Date): number {
  const h = hourOf(now);
  return sessions.reduce((sum, s) => {
    const d = hourGap(hourOf(s.at), h);
    return sum + weight(s, now) * Math.exp(-(d * d) / (2 * SIGMA * SIGMA));
  }, 0);
}

export type Habit = { hour: number; strength: number; sessions: number };

/**
 * The usual time for a show, if there is one: the recency-weighted circular mean of its tick hours over
 * the last 3 weeks, with how tightly they gather (1 = always the same time).
 */
export function habitOf(sessions: Session[], now: Date): Habit | null {
  const since = now.getTime() - HABIT_DAYS * DAY_MS;
  const recent = sessions.filter((s) => Date.parse(s.at) >= since);
  if (recent.length < HABIT_SESSIONS) return null;
  let c = 0;
  let sn = 0;
  let total = 0;
  for (const s of recent) {
    const w = weight(s, now);
    const a = (hourOf(s.at) / 24) * 2 * Math.PI;
    c += w * Math.cos(a);
    sn += w * Math.sin(a);
    total += w;
  }
  const strength = Math.hypot(c, sn) / total;
  if (strength < HABIT_STRENGTH) return null;
  const hour = ((((Math.atan2(sn, c) / (2 * Math.PI)) * 24) % 24) + 24) % 24;
  return { hour, strength, sessions: recent.length };
}

export const inHabitWindow = (h: Habit, now: Date) => hourGap(h.hour, hourOf(now)) <= WINDOW_HOURS;

export function sessionsByShow(sessions: Session[]): Map<string, Session[]> {
  const m = new Map<string, Session[]>();
  for (const s of sessions) (m.get(s.itemId) ?? m.set(s.itemId, []).get(s.itemId)!).push(s);
  return m;
}

/**
 * Continue watching for this time of day: shows you usually watch around now first. When nothing stands
 * out (too few ticks, or an unusual hour) the list keeps its order (most recently touched first).
 */
export function orderWatching<T extends { id: string }>(items: T[], sessions: Session[], now: Date): T[] {
  const by = sessionsByShow(sessions);
  const scores = new Map(items.map((i) => [i.id, scoreAt(by.get(i.id) ?? [], now)]));
  if (Math.max(0, ...scores.values()) < MIN_SCORE) return items;
  return items
    .map((item, i) => ({ item, i, score: scores.get(item.id) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.item);
}

// Nudges ------------------------------------------------------------------------------------------------

export type NudgeCandidate = {
  itemId: string;
  title: string;
  next: { season: number; episode: number; name: string | null };
  habit: Habit;
  /** Colombo dates on which this show already got a tick (no nudge those days). */
  watchedOn: Set<LocalDate>;
};

export type Nudge = {
  id: string;
  itemId: string;
  title: string;
  next: NudgeCandidate['next'];
  date: LocalDate;
  /** Minutes after midnight, Colombo. */
  minute: number;
};

/** No nudges between 23:00 and 06:00. */
const QUIET_FROM = 23 * 60;
const QUIET_UNTIL = 6 * 60;
const LEAD_MINUTES = 10;

export const nudgeId = (date: LocalDate) => `habit:${date}`;
export const HABIT_PREFIX = 'habit:';

/**
 * At most one nudge a day: the strongest habit with something to watch, 10 minutes before its usual
 * time, today (if that's still ahead and it hasn't been watched today) and tomorrow. Re-planned every
 * time the app runs, so nudges stop by themselves when the app isn't used.
 */
export function planNudges(candidates: NudgeCandidate[], now: Date): Nudge[] {
  const best = [...candidates].sort(
    (a, b) => b.habit.strength * b.habit.sessions - a.habit.strength * a.habit.sessions,
  )[0];
  if (!best) return [];
  const minute = Math.round((best.habit.hour * 60 - LEAD_MINUTES) / 5) * 5;
  const m = ((minute % 1440) + 1440) % 1440;
  if (m >= QUIET_FROM || m < QUIET_UNTIL) return [];
  const today = colomboToday(now);
  const nowMinute = Math.floor(hourOf(now) * 60);
  return [today, addLocalDays(today, 1)]
    .filter((date) => !(date === today && (m <= nowMinute || best.watchedOn.has(today))))
    .map((date) => ({ id: nudgeId(date), itemId: best.itemId, title: best.title, next: best.next, date, minute: m }));
}
