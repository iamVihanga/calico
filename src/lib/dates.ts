import { tz, TZDate } from '@date-fns/tz';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

/** Everything calendar-related happens in Colombo time (plan §3). */
export const TIME_ZONE = 'Asia/Colombo';
const inColombo = { in: tz(TIME_ZONE) };

/** A `yyyy-MM-dd` calendar date in Colombo. */
export type LocalDate = string;

export function toColombo(d: Date | number | string): TZDate {
  return new TZDate(+(typeof d === 'string' ? parseISO(d) : d), TIME_ZONE);
}

/** Today's Colombo date as `yyyy-MM-dd` (what `date` columns store). */
export function colomboToday(now: Date = new Date()): LocalDate {
  return format(now, 'yyyy-MM-dd', inColombo);
}

export function localDateOf(d: Date | number): LocalDate {
  return format(d, 'yyyy-MM-dd', inColombo);
}

export function addLocalDays(date: LocalDate, days: number): LocalDate {
  return format(addDays(parseLocal(date), days), 'yyyy-MM-dd');
}

/** Parse a `yyyy-MM-dd` as a plain calendar date (noon avoids DST edge cases). */
export function parseLocal(date: LocalDate): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

/** Whole days from `a` to `b` (both calendar dates). */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  return differenceInCalendarDays(parseLocal(b), parseLocal(a));
}

/** "Wed 14 Oct" */
export const fmtDay = (date: LocalDate) => format(parseLocal(date), 'EEE d MMM');
/** "14 Oct" */
export const fmtShort = (date: LocalDate) => format(parseLocal(date), 'd MMM');
/** "2 Sep 2026" */
export const fmtLong = (date: LocalDate) => format(parseLocal(date), 'd MMM yyyy');
